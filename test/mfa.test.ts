import test from "node:test";
import assert from "node:assert/strict";
import { handleMfa, type MfaAuth } from "../src/lib/mfa-handler";

function fixture() {
  const calls: string[] = [];
  const factors = [{id:"synthetic-factor",factor_type:"totp",status:"verified"}];
  const auth: MfaAuth = {
    getUser: async () => {calls.push("user");return {data:{user:{id:"synthetic-user"}},error:null};},
    mfa:{
      listFactors:async () => ({data:{all:factors},error:null}),
      getAuthenticatorAssuranceLevel:async () => ({data:{currentLevel:"aal1"},error:null}),
      enroll:async () => {calls.push("enroll");return {data:{id:"synthetic-new",totp:{qr_code:"data:image/svg+xml;utf-8,SYNTHETIC",secret:"SYNTHETIC-SETUP-KEY"}},error:null};},
      challengeAndVerify:async () => {calls.push("verify");return {data:{access_token:"SYNTHETIC-ACCESS-TOKEN",refresh_token:"SYNTHETIC-REFRESH-TOKEN"},error:null};},
      unenroll:async () => {calls.push("unenroll");return {data:{},error:null};},
    },
  };
  return {auth,calls,factors};
}
const request = (body: unknown, origin="http://localhost:3000") => new Request("http://localhost:3000/api/auth/mfa",{
  method:"POST",headers:{Host:"localhost:3000",Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(body),
});

test("MFA rejects cross-origin, oversized and invalid input before contacting Auth",async () => {
  for (const req of [request({action:"status"},"https://outside.invalid"),request({action:"status",padding:"x".repeat(2100)}),request({action:"verify",assuranceLevel:"aal2"}),request({action:"unknown"})]) {
    let contacted = false;
    const response = await handleMfa(req,async () => {contacted=true;return fixture().auth;});
    assert.ok([403,413,422].includes(response.status));
    assert.equal(contacted,false);
    assert.equal(response.headers.get("cache-control"),"private, no-store");
  }
});

test("MFA requires validated identity and bounds upstream errors without leaking details",async () => {
  const {auth,calls} = fixture();
  auth.getUser = async () => ({data:{user:null},error:{status:401}});
  assert.equal((await handleMfa(request({action:"status"}),async () => auth)).status,401);
  assert.deepEqual(calls,[]);
  const response = await handleMfa(request({action:"status"}),async () => {throw new Error("SYNTHETIC-SECRET");});
  assert.equal(response.status,503);
  assert.ok(!(await response.text()).includes("SYNTHETIC-SECRET"));
});

test("MFA status reveals no session or setup key and cannot replace a verified factor",async () => {
  const {auth,calls,factors} = fixture();
  const response = await handleMfa(request({action:"status"}),async () => auth);
  assert.deepEqual(await response.json(),{verified:false,factors:[{id:"synthetic-factor"}],pending:[],canEnroll:false});
  assert.equal((await handleMfa(request({action:"enroll"}),async () => auth)).status,409);
  assert.equal((await handleMfa(request({action:"cancel-enrollment",factorId:"synthetic-factor"}),async () => auth)).status,403);
  assert.equal(calls.includes("enroll"),false);
  assert.equal(calls.includes("unenroll"),false);
  factors[0].factor_type="phone";
  assert.equal((await handleMfa(request({action:"enroll"}),async () => auth)).status,409);
});

test("MFA only challenges an owned TOTP factor and returns no tokens after success",async () => {
  const {auth,calls} = fixture();
  for (const body of [{action:"verify",factorId:"other-factor",code:"123456"},{action:"verify",factorId:"synthetic-factor",code:"12x456"}]) {
    assert.ok([404,422].includes((await handleMfa(request(body),async () => auth)).status));
  }
  assert.equal(calls.includes("verify"),false);
  const verified = await handleMfa(request({action:"verify",factorId:"synthetic-factor",code:"123456",next:"/admin/bookings/synthetic"}),async () => auth);
  assert.equal(verified.status,200);
  assert.deepEqual(await verified.json(),{next:"/admin/bookings/synthetic"});
  assert.equal(calls.filter(c => c === "verify").length,1);
  const redirect = await handleMfa(request({action:"verify",factorId:"synthetic-factor",code:"123456",next:"//outside.invalid"}),async () => auth);
  assert.deepEqual(await redirect.json(),{next:"/parent"});
  auth.mfa.challengeAndVerify = async () => ({data:null,error:{status:429}});
  assert.equal((await handleMfa(request({action:"verify",factorId:"synthetic-factor",code:"123456"}),async () => auth)).status,429);
  auth.mfa.challengeAndVerify = async () => ({data:null,error:{status:422}});
  assert.equal((await handleMfa(request({action:"verify",factorId:"synthetic-factor",code:"123456"}),async () => auth)).status,422);
});

test("MFA enrollment requires an explicit action; only unfinished owned setup can be cancelled",async () => {
  const {auth,calls,factors} = fixture();
  factors.length=0;
  const enrolled = await handleMfa(request({action:"enroll"}),async () => auth);
  assert.equal(enrolled.status,200);
  assert.deepEqual(await enrolled.json(),{factorId:"synthetic-new",qrCode:"data:image/svg+xml;utf-8,SYNTHETIC",secret:"SYNTHETIC-SETUP-KEY"});
  factors.push({id:"synthetic-new",factor_type:"totp",status:"unverified"});
  assert.equal((await handleMfa(request({action:"enroll"}),async () => auth)).status,409);
  const response = await handleMfa(request({action:"cancel-enrollment",factorId:"synthetic-new"}),async () => auth);
  assert.equal(response.status,200);
  assert.equal(calls.filter(c => c === "enroll").length,1);
  assert.equal(calls.filter(c => c === "unenroll").length,1);
});

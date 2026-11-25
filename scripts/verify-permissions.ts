// Local-only integration: real Next cookie routes + backend + isolated PGlite.
// Supabase is a labelled synthetic HTTP double. No hosted accounts or data are used.
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createTestDatabase } from "../../360kids-backend/test/helpers.js";
import { Platform, type Actor } from "../../360kids-backend/src/platform.js";
import { createApp } from "../../360kids-backend/src/app.js";

async function main() {
const listen = async (server:Server) => {
  server.listen(0,"127.0.0.1"); await once(server,"listening");
  return `http://127.0.0.1:${(server.address() as {port:number}).port}`;
};
const close = async (server:Server) => {
  server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
};
const {pg,db} = await createTestDatabase();
const platform = new Platform(db,true);
const actors:Record<string,Actor> = {};
const factors = new Map<string,{id:string;factor_type:string;status:string}[]>();
const tokens = new Map<string,{name:string;aal:"aal1"|"aal2"}>();
const challenges = new Map<string,{name:string;factorId:string}>();
for (const name of ["family","provider","admin","finance","content","support"]) {
  const actor:Actor = {id:randomUUID(),role:name === "admin" ? "admin" : "parent"};
  actors[name]=actor; factors.set(name,[]);
  await platform.me(actor.id,`${name}@example.invalid`);
  await platform.read("UPDATE app.profiles SET role=$2 WHERE id=$1",[actor.id,actor.role]);
}
for (const name of ["finance","content","support"]) await platform.read(
  "INSERT INTO app.platform_role_grants(user_id,role,granted_by,reason) VALUES($1,$2,$3,'Synthetic local web verification')",
  [actors[name].id,name,actors.admin.id],
);
const provider = await platform.apply(actors.provider,{name:"Synthetic local provider",description:"Synthetic HTTP test only"});
await platform.approve(actors.admin,provider.id,"approved");
const activity = await platform.createActivity(actors.content,{providerId:provider.id,title:"Synthetic art class",description:"Synthetic local test",category:"Arts",area:"Dubai",minAge:1,maxAge:17,priceFils:10000,policy:"Synthetic policy",published:true,startsAt:"2030-05-01T12:00:00Z",cutoffAt:"2030-04-30T12:00:00Z",capacity:3});
const child = await platform.addChild(actors.family,{firstName:"Synthetic",birthDate:"2018-01-01"});
const booking = await platform.request(actors.family,randomUUID(),{sessionId:activity.sessionId,activityVersion:1,childIds:[child.id],policyAccepted:true});
await platform.act(actors.provider,randomUUID(),booking.id,{action:"accept",version:1});
await platform.act(actors.family,randomUUID(),booking.id,{action:"proof",version:2,reference:"SYNTHETIC-NO-MONEY"});

const user = (name:string) => ({id:actors[name].id,email:`${name}@example.invalid`,aud:"authenticated",role:"authenticated",app_metadata:{provider:"email",providers:["email"]},user_metadata:{synthetic:true},created_at:new Date().toISOString(),factors:factors.get(name)});
function session(name:string,aal:"aal1"|"aal2") {
  const encode = (value:object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const jwt = `${encode({alg:"HS256",typ:"JWT"})}.${encode({sub:actors[name].id,aal,exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000),aud:"authenticated",role:"authenticated",session_id:randomUUID()})}.synthetic`;
  tokens.set(jwt,{name,aal});
  return {access_token:jwt,refresh_token:randomUUID(),token_type:"bearer",expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:user(name)};
}
const auth = createServer(async (req,res) => {
  const respond = (data:unknown,status=200) => {res.writeHead(status,{"Content-Type":"application/json"});res.end(JSON.stringify(data));};
  try {
    let raw=""; for await (const part of req) raw+=part;
    const body = raw ? JSON.parse(raw) : {};
    const url = new URL(req.url!,"http://local.invalid");
    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") {
      const name = String(body.email).split("@")[0];
      if (!actors[name] || body.password !== "Synthetic-only-password-123!") return respond({message:"Invalid credentials"},401);
      return respond(session(name,"aal1"));
    }
    const identity = tokens.get((req.headers.authorization ?? "").replace(/^Bearer /,""));
    if (!identity) return respond({message:"Invalid token"},401);
    const {name} = identity;
    if (url.pathname === "/auth/v1/user") return respond(user(name));
    if (url.pathname === "/auth/v1/factors" && req.method === "POST") {
      const id = randomUUID(); factors.get(name)!.push({id,factor_type:"totp",status:"unverified"});
      return respond({id,type:"totp",totp:{qr_code:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="5" y="50">TEST ONLY</text></svg>',secret:"SYNTHETICSETUPKEY",uri:"otpauth://totp/synthetic?secret=SYNTHETICSETUPKEY"}});
    }
    const match = url.pathname.match(/^\/auth\/v1\/factors\/([^/]+)(?:\/(challenge|verify))?$/);
    const factor = factors.get(name)!.find(f => f.id === match?.[1]);
    if (!factor) return respond({message:"Factor not found"},404);
    if (match?.[2] === "challenge") {
      const id = randomUUID(); challenges.set(id,{name,factorId:factor.id});return respond({id,type:"totp",expires_at:Math.floor(Date.now()/1000)+60});
    }
    if (match?.[2] === "verify") {
      const challenge = challenges.get(body.challenge_id);
      if (body.code !== "123456" || challenge?.name !== name || challenge.factorId !== factor.id) return respond({message:"Invalid code"},422);
      challenges.delete(body.challenge_id);factor.status="verified";return respond(session(name,"aal2"));
    }
    if (req.method === "DELETE" && factor.status === "unverified") {
      factors.set(name,factors.get(name)!.filter(f => f.id !== factor.id));return respond({id:factor.id});
    }
    respond({message:"Unsupported synthetic route"},404);
  } catch {respond({message:"Synthetic Auth failure"},500);}
});
const authOrigin = await listen(auth);
process.env.SUPABASE_URL = authOrigin;
process.env.SUPABASE_PUBLISHABLE_KEY = "synthetic-publishable-key";
const api = createServer(createApp("http://localhost",platform));
const apiOrigin = await listen(api);
// Ask the OS for an available port; the temporary reservation is closed before Next starts.
const reservation = createServer(); const origin = await listen(reservation); await close(reservation);
const next = spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--hostname","127.0.0.1","--port",new URL(origin).port],{
  cwd:process.cwd(),windowsHide:true,
  env:{...process.env,NODE_ENV:"development",LOCAL_PERMISSIONS_TEST:"true",API_URL:apiOrigin,NEXT_PUBLIC_SUPABASE_URL:authOrigin,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"synthetic-publishable-key"},
  stdio:["ignore","pipe","pipe"],
});
// Drain output without logging cookies, tokens, setup keys or form data.
next.stdout.resume();next.stderr.resume();
class BrowserSession {
  cookies = new Map<string,string>();
  async call(path:string,method="GET",body?:object) {
    const response = await fetch(origin+path,{method,redirect:"manual",signal:AbortSignal.timeout(60000),headers:{Host:new URL(origin).host,Origin:origin,Cookie:[...this.cookies].map(([k,v]) => `${k}=${v}`).join(";"),...(body ? {"Content-Type":"application/json","Idempotency-Key":randomUUID()} : {})},body:body ? JSON.stringify(body) : undefined});
    for (const cookie of response.headers.getSetCookie()) {
      const pair=cookie.split(";",1)[0],i=pair.indexOf("=");
      if (pair.startsWith("sb-")) assert.match(cookie,/httponly/i,"Auth cookie must be HttpOnly");
      this.cookies.set(pair.slice(0,i),pair.slice(i+1));
    }
    return response;
  }
  async login(name:string) {
    assert.equal((await this.call("/api/auth","POST",{action:"signin",email:`${name}@example.invalid`,password:"Synthetic-only-password-123!"})).status,200);
  }
}
try {
  for (let i=0;i<90;i++) {
    if (next.exitCode !== null) throw new Error("Local Next server exited before readiness.");
    try {await fetch(origin+"/login",{signal:AbortSignal.timeout(1000)});break;} catch {await new Promise(resolve => setTimeout(resolve,500));}
  }
  const sessions:Record<string,BrowserSession>={};
  for (const name of ["admin","finance","content","support","provider"]) {sessions[name]=new BrowserSession();await sessions[name].login(name);}
  for (const [name,path] of [["finance","/admin/bookings"],["content","/admin/programs"],["support","/admin/support"],["finance","/account/security"],["provider","/partner/team"]]) {
    const response = await sessions[name].call(path);assert.equal(response.status,200,`${name}: ${path}`);
    assert.ok(!(await response.text()).includes('"digest":"'),"No server-rendering error");
  }
  const denied = await sessions.admin.call("/admin/bookings");
  assert.ok([303,307].includes(denied.status));assert.equal(denied.headers.get("location"),"/access-denied");
  const verifyBody = {action:"verify",version:3};
  assert.equal((await sessions.finance.call(`/api/backend/bookings/${booking.id}/actions`,"POST",verifyBody)).status,403);
  const page = await sessions.finance.call(`/admin/bookings/${booking.id}`);
  const html=await page.text();assert.ok(html.includes("Verify identity"));assert.ok(!html.includes('>Accept request<'));
  const enrolledResponse = await sessions.finance.call("/api/auth/mfa","POST",{action:"enroll"});
  assert.equal(enrolledResponse.status,200);assert.match(enrolledResponse.headers.get("cache-control") ?? "",/no-store/);
  const enrollment=await enrolledResponse.json();
  assert.equal((await sessions.finance.call("/api/auth/mfa","POST",{action:"verify",factorId:enrollment.factorId,code:"000000"})).status,422);
  const verified = await sessions.finance.call("/api/auth/mfa","POST",{action:"verify",factorId:enrollment.factorId,code:"123456",next:`/admin/bookings/${booking.id}`});
  assert.equal(verified.status,200);assert.deepEqual(await verified.json(),{next:`/admin/bookings/${booking.id}`});
  const me=await (await sessions.finance.call("/api/backend/me")).json();assert.equal(me.assuranceLevel,"aal2");
  assert.equal((await sessions.finance.call(`/api/backend/bookings/${booking.id}/actions`,"POST",verifyBody)).status,200);
  assert.equal((await platform.booking(actors.family,booking.id)).state,"CONFIRMED");
  assert.equal((await sessions.admin.call(`/api/backend/bookings/${booking.id}/actions`,"POST",verifyBody)).status,404);
  console.log("PASS local Next HTTP: capability pages, admin denial, step-up prompt, invalid code, HttpOnly session refresh, finance verification and safe return path. Synthetic Auth/PGlite only.");
} finally {
  if (next.exitCode === null) { next.kill();await once(next,"exit"); }
  await close(api);await close(auth);await pg.close();
}
}

void main().catch(error => {
  // Assertion messages describe synthetic paths/status only, never response bodies.
  console.error(error instanceof Error ? error.message : "Local permissions verification failed.");
  process.exitCode=1;
});

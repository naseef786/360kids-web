// Development-only checks using the existing fictional E2E accounts. No email or money is sent.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const origin = process.env.WEB_TEST_ORIGIN ?? "http://127.0.0.1:3000";
assert.ok(["127.0.0.1","localhost","[::1]"].includes(new URL(origin).hostname),"Use a loopback development server");
const fixture = JSON.parse(await readFile(new URL("../../360kids-backend/.e2e-accounts.json",import.meta.url),"utf8"));
class Session {
  cookies = new Map();
  async call(path,method="GET",body,expected=200) {
    const response=await fetch(origin+path,{
      method,redirect:"manual",signal:AbortSignal.timeout(90000),
      headers:{Origin:origin,Cookie:[...this.cookies].map(([k,v])=>`${k}=${v}`).join(";"),...(body ? {"Content-Type":"application/json"}:{})},
      body:body ? JSON.stringify(body):undefined,
    });
    for(const cookie of response.headers.getSetCookie()) {
      const pair=cookie.split(";",1)[0], split=pair.indexOf("=");
      this.cookies.set(pair.slice(0,split),pair.slice(split+1));
    }
    assert.equal(response.status,expected,`${method} ${path.split("?")[0]} status`);
    return response;
  }
  async api(path,method,body,expected) { return (await this.call("/api/backend"+path,method,body,expected)).json(); }
}
try {
  const sessions={};
  for(const role of ["parent","partner","admin"]) {
    const session=new Session(), account=fixture.accounts[role];
    assert.match(account.email,/^dev-(parent|partner|admin)-.+@example\.invalid$/i,"Only fictional fixture accounts are permitted");
    await session.call("/api/auth","POST",{action:"signin",email:account.email,password:account.password});
    sessions[role]=session;
  }
  const {parent,partner,admin}=sessions;
  const ticket=await parent.api("/support","POST",{topic:"Account",message:"Synthetic frontend API integration check."},201);
  await partner.api(`/support/${ticket.id}`,"PUT",{status:"resolved",reply:"Unauthorized synthetic reply"},403);
  await admin.api(`/support/${ticket.id}`,"PUT",{status:"resolved",reply:"Synthetic support response verified."});
  const tickets=await parent.api("/support?status=resolved&page=1&pageSize=1");
  assert.equal(tickets.items[0].id,ticket.id);
  assert.equal(tickets.items[0].reply,"Synthetic support response verified.");
  console.log("PASS support creation, authorized reply, scoped SQL pagination and status filter");
  const notices=await parent.api("/notifications?page=1&pageSize=1");
  assert.equal(notices.items.length,1);
  assert.equal(notices.items[0].subject_id,ticket.id);
  assert.equal(notices.pageSize,1);
  await parent.api("/notifications/read","POST",{ids:[notices.items[0].id]});
  assert.ok((await parent.api("/notifications?page=1&pageSize=1")).items[0].read_at);
  await parent.api("/notifications?pageSize=101","GET",undefined,422);
  console.log("PASS notification list, read state and page-size validation through cookie proxy");
  let pages=0;
  for(const [session,paths] of [
    [parent,["/parent/notifications?pageSize=1","/parent/support?status=resolved&utm_source=test","/parent/activities?category=Arts&pageSize=1&utm_source=test","/parent/profile?unrelated=test","/parent/bookings?state=invalid"]],
    [partner,["/partner/notifications","/partner/support","/partner/team"]],
    [admin,["/admin/notifications","/admin/support","/admin/content?slug=faq","/admin/operations?resource=subscriptions&utm_source=test"]],
  ]) for(const path of paths) {
    const html=await (await session.call(path)).text();
    assert.ok(!html.includes('"digest":"'),"No server component error on "+path);
    assert.ok(html.includes("main"));
    pages++;
  }
  const anon=new Session();
  for(const path of ["/about","/contact","/faq","/terms","/privacy"]) {
    const html=await (await anon.call(path)).text();
    assert.ok(!html.includes('"digest":"')); pages++;
  }
  await parent.call("/activities/------------------------------------","GET",undefined,404);
  const result=JSON.parse(await readFile(new URL("../../360kids-backend/.e2e-result.json",import.meta.url),"utf8"));
  assert.equal((await parent.api(`/activities/${result.activityId}`)).is_saved,true);
  assert.equal((await anon.api(`/activities/${result.activityId}`)).is_saved,false);
  console.log(`PASS ${pages} additional page renders, malformed-ID 404 and per-account saved catalogue state`);
  for(const session of Object.values(sessions)) await session.call("/api/auth","POST",{action:"signout"});
} catch(error) {
  console.error(error instanceof assert.AssertionError ? error.message : "Frontend verification failed; credentials were not printed.");
  process.exitCode=1;
}

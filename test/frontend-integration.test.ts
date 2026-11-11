import test from "node:test";
import assert from "node:assert/strict";
import { request, RequestError } from "../src/lib/client-api";
import { fetchJson } from "../src/lib/http";
import { jsonBody } from "../src/lib/request-body";
import { pageQuery } from "../src/lib/page-query";
import { notificationHref } from "../src/lib/notification-view";
import { sameOrigin } from "../src/lib/same-origin";
import { safeNext } from "../src/lib/navigation";
import {
  localeFromAcceptLanguage,
  parseLocale,
} from "../src/lib/i18n";
import { bookingStatusCopy } from "../src/lib/parent-copy";
import { authCopy, localizedAuthMessage } from "../src/lib/auth-copy";
import { notificationEventLabel, serviceCopy } from "../src/lib/service-copy";
import { dateTime, money, stateLabel } from "../src/lib/types";

test("locale preferences accept only English or Arabic and respect browser priority", () => {
  assert.equal(parseLocale("ar"), "ar");
  assert.equal(parseLocale("en"), "en");
  assert.equal(parseLocale("ar-AE"), null);
  assert.equal(parseLocale("../../ar"), null);
  assert.equal(localeFromAcceptLanguage("ar-AE,ar;q=0.9,en;q=0.8"), "ar");
  assert.equal(localeFromAcceptLanguage("en-US,en;q=0.9,ar;q=0.2"), "en");
  assert.equal(localeFromAcceptLanguage("fr-FR,ar;q=0.7"), "ar");
  assert.equal(localeFromAcceptLanguage("fr-FR"), "en");
});

test("parent booking amounts, Dubai dates and place guidance follow the selected locale", () => {
  assert.notEqual(money(12345, "ar"), money(12345, "en"));
  assert.notEqual(
    dateTime("2030-05-01T12:00:00Z", "ar"),
    dateTime("2030-05-01T12:00:00Z", "en"),
  );
  assert.equal(stateLabel("CONFIRMED", "ar"), "مؤكد");
  assert.deepEqual(bookingStatusCopy("en", "REQUESTED"), {
    place: "No place is reserved yet",
    action: "Wait for the provider to check availability",
  });
  assert.deepEqual(bookingStatusCopy("ar", "CONFIRMED"), {
    place: "المكان مؤكد",
    action: "لا يلزم إجراء",
  });
});

test("authentication and recovery keep Arabic copy through known API outcomes", () => {
  assert.equal(authCopy.ar.titles.signin, "مرحباً بعودتك");
  assert.equal(authCopy.ar.submit.recover, "إرسال رابط إعادة التعيين");
  assert.equal(
    localizedAuthMessage(
      "ar",
      "If an account exists, a password reset link will arrive by email.",
    ),
    "إذا كان الحساب موجوداً، فسيصلك رابط إعادة تعيين كلمة المرور عبر البريد الإلكتروني.",
  );
  assert.equal(localizedAuthMessage("en", "Unknown action."), "Unknown action.");
  assert.equal(
    localizedAuthMessage("ar", "Synthetic upstream detail"),
    "Synthetic upstream detail",
  );
});

test("notification and support views provide Arabic operational guidance", () => {
  assert.equal(notificationEventLabel("ar", "verify"), "تم تأكيد الحجز");
  assert.equal(
    notificationEventLabel("ar", "synthetic.unknown"),
    "تم تحديث حسابك",
  );
  assert.equal(serviceCopy.ar.support.statuses.in_progress, "قيد المعالجة");
  assert.equal(serviceCopy.ar.support.topics.Booking, "الحجز");
  assert.equal(serviceCopy.ar.pager.next, "التالي");
});

test("active sign-in redirects reject control-character and cross-origin destinations",() => {
  for(const input of ["//evil.invalid","/\t/evil.invalid","/\\evil.invalid","/\u0000/evil.invalid","https://evil.invalid"])
    assert.equal(safeNext(input),"/parent");
  assert.equal(safeNext("/parent/bookings?page=2"),"/parent/bookings?page=2");
});

test("origin protection follows the browser Host while rejecting cross-site and missing origins",() => {
  const req = (origin?:string) => new Request("http://localhost:3000/api/auth",{headers:{Host:"127.0.0.1:3000",...(origin ? {Origin:origin}:{})}});
  assert.equal(sameOrigin(req("http://127.0.0.1:3000")),true);
  for(const origin of [undefined,"null","http://evil.invalid","http://127.0.0.1:3001","https://127.0.0.1:3000"])
    assert.equal(sameOrigin(req(origin)),false);
});

test("cookie client preserves method, body and retry key through the same-origin proxy",async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url,init) => {
      assert.equal(url,"/api/backend/bookings");
      assert.equal(init?.method,"POST");
      assert.equal(new Headers(init?.headers).get("Idempotency-Key"),"synthetic-key");
      assert.equal(new Headers(init?.headers).has("Authorization"),false);
      assert.deepEqual(JSON.parse(init?.body as string),{activityVersion:3});
      return Response.json({id:"synthetic"},{status:201});
    };
    assert.deepEqual(await request("/bookings","POST",{activityVersion:3},"synthetic-key"),{id:"synthetic"});
  } finally { globalThis.fetch = original; }
});

test("active HTTP client handles gateway HTML, malformed success, empty success and network loss",async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("<html>Gateway error</html>",{status:502});
    await assert.rejects(() => request("/children"),e => e instanceof RequestError && e.status===502 && !e.message.includes("html"));
    globalThis.fetch = async () => new Response("not-json");
    await assert.rejects(() => request("/children"),e => e instanceof RequestError && e.status===502);
    globalThis.fetch = async () => new Response(null,{status:204});
    assert.equal(await request("/notifications/read","POST",{all:true}),undefined);
    globalThis.fetch = async () => {throw new TypeError("socket failed")};
    await assert.rejects(() => request("/children"),e => e instanceof RequestError && e.status===503);
  } finally { globalThis.fetch = original; }
});

test("active HTTP client bounds waits and preserves caller cancellation",async () => {
  const original = globalThis.fetch;
  // Keep Node alive while AbortSignal.timeout's unref timer fires.
  const keepAlive = setInterval(() => {},1000);
  try {
    globalThis.fetch = async (_url,init) => new Promise((_resolve,reject) => {
      const signal = init!.signal!;
      if(signal.aborted) reject(signal.reason);
      else signal.addEventListener("abort",() => reject(signal.reason),{once:true});
    });
    await assert.rejects(() => fetchJson("/test",{},10),e => e instanceof RequestError && e.status===408);
    const controller = new AbortController(); controller.abort();
    await assert.rejects(() => request("/children","GET",undefined,undefined,controller.signal),{name:"AbortError"});
  } finally { clearInterval(keepAlive); globalThis.fetch = original; }
});

test("list queries whitelist endpoint filters and validate pagination",async () => {
  assert.deepEqual(await pageQuery(Promise.resolve({page:"-2",pageSize:"1000",utm_source:"ad",resource:"audit"})),{page:"1",pageSize:"20"});
  assert.deepEqual(await pageQuery(Promise.resolve({page:"2",pageSize:"10",q:" art ",age:"7",scope:"admin"}),["q","age"]),{page:"2",pageSize:"10",q:"art",age:"7"});
  assert.deepEqual(await pageQuery(Promise.resolve({page:["2","3"],state:"UNKNOWN",age:"19"}),["state","age"]),{page:"1",pageSize:"20"});
  assert.equal((await pageQuery(Promise.resolve({q:"x".repeat(500)}),["q"])).q.length,100);
});

test("request JSON limits count bytes without trusting Content-Length",async () => {
  const make = (body:string,type="application/json") => new Request("http://localhost/test",{method:"POST",headers:{"Content-Type":type},body});
  assert.deepEqual(await jsonBody(make('{"name":"synthetic"}'),100),{name:"synthetic"});
  for(const invalid of ["{","null","[]"]) await assert.rejects(() => jsonBody(make(invalid),100),e => e instanceof RequestError && e.status===400);
  await assert.rejects(() => jsonBody(make('{"name":"🌼🌼"}'),12),e => e instanceof RequestError && e.status===413);
  await assert.rejects(() => jsonBody(make("{}","text/plain"),100),e => e instanceof RequestError && e.status===415);
});

test("notification links respect a staff member's workspace even with a parent legacy role",() => {
  const id="11111111-1111-4111-8111-111111111111";
  assert.equal(notificationHref({kind:"booking",workspace:"provider",subject_id:id},"parent"),`/partner/bookings/${id}`);
  assert.equal(notificationHref({kind:"booking",workspace:"family",subject_id:id},"admin"),`/parent/bookings/${id}`);
  assert.equal(notificationHref({kind:"booking",workspace:"provider",subject_id:"https://evil.invalid"},"parent"),"/partner");
});

import test from "node:test";
import assert from "node:assert/strict";
import { resendConfirmation, resendConfirmationMessage } from "../src/lib/resend-confirmation.js";

test("confirmation resend preserves the callback and does not reveal account existence", async () => {
  const calls: Array<[string,string]> = [];
  const send = async (email:string,redirect:string) => {
    calls.push([email,redirect]);
    return {error:{status:404}};
  };
  const result = await resendConfirmation(send,"synthetic@example.invalid","https://example.invalid/auth/callback?next=%2Factivities");
  assert.deepEqual(calls,[["synthetic@example.invalid","https://example.invalid/auth/callback?next=%2Factivities"]]);
  assert.deepEqual(result,{status:200,message:resendConfirmationMessage});
  assert.deepEqual(await resendConfirmation(async () => ({error:null}),"other@example.invalid","https://example.invalid/auth/callback"),result);
});

test("confirmation resend distinguishes retryable rate limits and service failures", async () => {
  assert.equal((await resendConfirmation(async () => ({error:{status:429}}),"a@example.invalid","https://example.invalid")).status,429);
  assert.equal((await resendConfirmation(async () => ({error:{status:503}}),"a@example.invalid","https://example.invalid")).status,503);
});

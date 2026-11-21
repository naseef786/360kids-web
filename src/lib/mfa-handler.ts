import { RequestError } from "./http";
import { jsonBody } from "./request-body";
import { sameOrigin } from "./same-origin";
import { safeNext } from "./navigation";

type AuthError = {status?: number} | null;
type Result<T> = Promise<{data:T | null;error:AuthError}>;
type Factor = {id:string;factor_type:string;status:string};
/** Small structural boundary implemented by the installed Supabase Auth client. */
export interface MfaAuth {
  getUser(): Promise<{data:{user:{id:string} | null};error:AuthError}>;
  mfa: {
    listFactors(): Result<{all:Factor[]}>;
    getAuthenticatorAssuranceLevel(): Result<{currentLevel:string | null}>;
    enroll(params:{factorType:"totp";friendlyName:string;issuer:string}): Result<{id:string;totp:{qr_code:string;secret:string}}>;
    challengeAndVerify(params:{factorId:string;code:string}): Result<unknown>;
    unenroll(params:{factorId:string}): Result<unknown>;
  };
}
export type MfaStatus = {
  verified: boolean;
  factors: {id:string}[];
  pending: {id:string}[];
  canEnroll: boolean;
};
export type MfaEnrollment = {factorId:string;qrCode:string;secret:string};

function check(error: AuthError, message: string) {
  if (error) throw new RequestError(error.status === 429 ? 429 : error.status && error.status >= 500 ? 503 : 422,message);
}

/** Tokens are only persisted through HttpOnly cookies by the route's SSR client. */
export async function handleMfa(request: Request, getAuth: () => Promise<MfaAuth>): Promise<Response> {
  const headers = {"Cache-Control":"private, no-store", "Pragma":"no-cache"};
  const json = (data:unknown,status=200) => Response.json(data,{status,headers});
  try {
    if (!sameOrigin(request)) throw new RequestError(403,"Please use this website to continue.");
    const body = await jsonBody(request,2048);
    if (!["status","enroll","verify","cancel-enrollment"].includes(String(body.action)))
      throw new RequestError(422,"Unknown action.");
    const allowed = body.action === "verify" ? ["action","factorId","code","next"] : body.action === "cancel-enrollment" ? ["action","factorId"] : ["action"];
    if (Object.keys(body).some(key => !allowed.includes(key))) throw new RequestError(422,"Invalid verification request.");
    const auth = await getAuth();
    const user = await auth.getUser();
    if (user.error || !user.data.user)
      throw new RequestError(user.error?.status && user.error.status >= 500 ? 503 : 401,"Sign in to verify your identity.");
    const factors = await auth.mfa.listFactors();
    check(factors.error,"Unable to load authenticators. Please try again.");
    if (!factors.data) throw new RequestError(503,"Unable to load authenticators. Please try again.");
    const totp = factors.data.all.filter(f => f.factor_type === "totp");
    if (body.action === "status") {
      const assurance = await auth.mfa.getAuthenticatorAssuranceLevel();
      check(assurance.error,"Unable to check verification. Please try again.");
      return json({verified:assurance.data?.currentLevel === "aal2",
        factors:totp.filter(f => f.status === "verified").map(({id}) => ({id})),
        pending:totp.filter(f => f.status === "unverified").map(({id}) => ({id})),
        canEnroll:!factors.data.all.some(f => f.status === "verified") && totp.length === 0,
      } satisfies MfaStatus);
    }
    if (body.action === "enroll") {
      // Never use enrollment to replace or bypass a verified second factor.
      if (factors.data.all.some(f => f.status === "verified") || totp.length)
        throw new RequestError(409,"Use your existing authenticator or cancel an unfinished setup first.");
      const enrolled = await auth.mfa.enroll({factorType:"totp",friendlyName:"360 Kids authenticator",issuer:"360 Kids Activity"});
      check(enrolled.error,"Unable to start authenticator setup. Please try again.");
      if (!enrolled.data) throw new RequestError(503,"Unable to start authenticator setup. Please try again.");
      return json({factorId:enrolled.data.id,qrCode:enrolled.data.totp.qr_code,secret:enrolled.data.totp.secret} satisfies MfaEnrollment);
    }
    const factor = totp.find(f => f.id === body.factorId);
    if (!factor) throw new RequestError(404,"Authenticator not found. Reload and try again.");
    if (body.action === "cancel-enrollment") {
      if (factor.status !== "unverified") throw new RequestError(403,"Verified authenticators cannot be removed here.");
      const cancelled = await auth.mfa.unenroll({factorId:factor.id});
      check(cancelled.error,"Unable to cancel setup. Please try again.");
      return json({saved:true});
    }
    if (typeof body.code !== "string" || !/^\d{6}$/.test(body.code))
      throw new RequestError(422,"Enter the six-digit authenticator code.");
    const result = await auth.mfa.challengeAndVerify({factorId:factor.id,code:body.code});
    check(result.error,"Unable to verify this code. Try the latest code from your authenticator.");
    if (!result.data) throw new RequestError(503,"Verification is temporarily unavailable.");
    // Verification refreshes the session; never serialize the SDK result/tokens.
    return json({next:safeNext(body.next)});
  } catch (error) {
    return json({message:error instanceof RequestError ? error.message : "Verification is temporarily unavailable. Please try again."},error instanceof RequestError ? error.status : 503);
  }
}

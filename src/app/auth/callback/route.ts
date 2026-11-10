import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/server-api";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const auth = await supabase();
  const result = code
    ? await auth.auth.exchangeCodeForSession(code)
    : token_hash &&
        (type === "signup" || type === "recovery" || type === "email")
      ? await auth.auth.verifyOtp({ token_hash, type })
      : null;
  return NextResponse.redirect(
    new URL(
      result && !result.error
        ? safeNext(request.nextUrl.searchParams.get("next"))
        : "/login?error=link",
      request.url,
    ),
  );
}

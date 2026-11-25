import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { authCallbackPath } from "@/lib/navigation";
import { requestOrigin } from "@/lib/same-origin";
import { apiOrigin } from "@/lib/server-api";
import { fetchJson } from "@/lib/http";
import { resolveAuthorizedNext } from "@/lib/permissions";
import type { Identity } from "@/lib/types";

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
  let destination = authCallbackPath(
    request.nextUrl.searchParams.get("next"),
    type,
    !!result && !result.error,
  );
  if (result && !result.error && type !== "recovery" && result.data.session?.access_token) {
    try {
      const actor = await fetchJson<Identity>(
        `${apiOrigin()}/v1/me`,
        {
          headers: { Authorization: `Bearer ${result.data.session.access_token}` },
          cache: "no-store",
        },
        5000,
      );
      destination = resolveAuthorizedNext(actor, destination);
    } catch {
      if (destination.startsWith("/admin") || (destination.startsWith("/partner") && destination !== "/partner/apply")) {
        destination = "/parent";
      }
    }
  }
  return NextResponse.redirect(new URL(destination, requestOrigin(request)));
}

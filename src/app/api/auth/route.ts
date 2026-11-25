import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { apiOrigin, safeNext } from "@/lib/server-api";
import { passwordResetPath } from "@/lib/navigation";
import { jsonBody } from "@/lib/request-body";
import { fetchJson, RequestError } from "@/lib/http";
import { sameOrigin, requestOrigin } from "@/lib/same-origin";
import { resendConfirmation } from "@/lib/resend-confirmation";
import { resolveAuthorizedNext } from "@/lib/permissions";
import type { Identity } from "@/lib/types";

async function authorizedDestination(accessToken: string | undefined, requestedNext: unknown): Promise<string> {
  const fallbackSafe = safeNext(requestedNext);
  const safeDefault =
    fallbackSafe.startsWith("/admin") ||
    (fallbackSafe.startsWith("/partner") && fallbackSafe !== "/partner/apply")
      ? "/parent"
      : fallbackSafe;
  if (!accessToken) return safeDefault;
  try {
    const actor = await fetchJson<Identity>(
      `${apiOrigin()}/v1/me`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
      5000,
    );
    return resolveAuthorizedNext(actor, requestedNext);
  } catch {
    return safeDefault;
  }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { message: "Please use this website to continue." },
      { status: 403 },
    );
  if (Number(request.headers.get("content-length") ?? 0) > 8192)
    return NextResponse.json(
      { message: "Request too large." },
      { status: 413 },
    );
  try {
    const body = await jsonBody(request,8192);
    const auth = await supabase();
    const action = body.action;
    if (action === "signout") {
      const { error } = await auth.auth.signOut();
      if (error)
        return NextResponse.json(
          { message: "Unable to sign out. Try again." },
          { status: 503 },
        );
      return NextResponse.json({ next: "/login" });
    }
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    if (
      action !== "update-password" &&
      (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    )
      return NextResponse.json(
        { message: "Enter a valid email address." },
        { status: 422 },
      );
    if (
      action !== "recover" && action !== "resend-confirmation" &&
      (password.length < (action === "signin" ? 1 : 8) || password.length > 128)
    )
      return NextResponse.json(
        { message: "Use a password between 8 and 128 characters." },
        { status: 422 },
      );
    if (action === "signin") {
      const { data, error } = await auth.auth.signInWithPassword({ email, password });
      if (error)
        return NextResponse.json(
          {
            message:
              error.code === "email_not_confirmed"
                ? "Please confirm your email before signing in."
                : "Unable to sign in. Check your email and password.",
          },
          { status: error.status && error.status >= 500 ? 503 : error.status === 429 ? 429 : 401 },
        );
      return NextResponse.json({
        next: await authorizedDestination(data.session?.access_token, body.next),
      });
    }
    if (action === "resend-confirmation") {
      const redirectTo = `${requestOrigin(request)}/auth/callback?next=${encodeURIComponent(safeNext(body.next))}`;
      const result = await resendConfirmation(
        async (address, destination) => {
          const { error } = await auth.auth.resend({
            type: "signup",
            email: address,
            options: { emailRedirectTo: destination },
          });
          return { error };
        },
        email,
        redirectTo,
      );
      return NextResponse.json({ message: result.message }, { status: result.status });
    }
    if (action === "signup") {
      const { data, error } = await auth.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${requestOrigin(request)}/auth/callback?next=${encodeURIComponent(safeNext(body.next))}`,
        },
      });
      if (error)
        return NextResponse.json(
          {
            message:
              error.status === 429
                ? "Please wait before requesting another confirmation link."
                : error.status && error.status >= 500
                  ? "Sign-in is temporarily unavailable. Please try again."
                  : error.code === "weak_password"
                    ? "Use a password between 8 and 128 characters."
                    : "Unable to create this account. Please try again or sign in.",
          },
          {
            status:
              error.status === 429
                ? 429
                : error.status && error.status >= 500
                  ? 503
                  : 422,
          },
        );
      return NextResponse.json(
        data.session
          ? {
              next: await authorizedDestination(
                data.session.access_token,
                body.next,
              ),
            }
          : {
              message:
                "Check your email to confirm your account, then sign in.",
            },
      );
    }
    if (action === "recover") {
      const {error} = await auth.auth.resetPasswordForEmail(email, {
        redirectTo: `${requestOrigin(request)}/auth/callback?${new URLSearchParams({ next: passwordResetPath(body.next) })}`,
      });
      if(error) return NextResponse.json({message:"Password recovery is temporarily unavailable. Please try again."},{status:error.status === 429 ? 429 : 503});
      return NextResponse.json({
        message:
          "If an account exists, a password reset link will arrive by email.",
      });
    }
    if (action === "update-password") {
      const {
        data: { user },
      } = await auth.auth.getUser();
      if (!user)
        return NextResponse.json(
          { message: "Open a valid reset link or sign in first." },
          { status: 401 },
        );
      const { error } = await auth.auth.updateUser({ password });
      if (error)
        return NextResponse.json(
          {
            message:
              "Unable to update the password. Please try a new reset link.",
          },
          { status: 422 },
        );
      const {
        data: { session },
      } = await auth.auth.getSession();
      return NextResponse.json({
        next: await authorizedDestination(session?.access_token, body.next),
      });
    }
    return NextResponse.json({ message: "Unknown action." }, { status: 422 });
  } catch(error) {
    return NextResponse.json(
      { message: error instanceof RequestError ? error.message : "Sign-in is temporarily unavailable. Please try again." },
      { status: error instanceof RequestError ? error.status : 503 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/server-api";
import { jsonBody } from "@/lib/request-body";
import { RequestError } from "@/lib/http";
import { sameOrigin, requestOrigin } from "@/lib/same-origin";
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
      action !== "recover" &&
      (password.length < (action === "signin" ? 1 : 8) || password.length > 128)
    )
      return NextResponse.json(
        { message: "Use a password between 8 and 128 characters." },
        { status: 422 },
      );
    if (action === "signin") {
      const { error } = await auth.auth.signInWithPassword({ email, password });
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
      return NextResponse.json({ next: safeNext(body.next) });
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
              "Unable to create this account. Please try again or sign in.",
          },
          { status: 422 },
        );
      return NextResponse.json(
        data.session
          ? { next: safeNext(body.next) }
          : {
              message:
                "Check your email to confirm your account, then sign in.",
            },
      );
    }
    if (action === "recover") {
      const {error} = await auth.auth.resetPasswordForEmail(email, {
        redirectTo: `${requestOrigin(request)}/auth/callback?next=/reset-password`,
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
      return NextResponse.json({ next: "/parent" });
    }
    return NextResponse.json({ message: "Unknown action." }, { status: 422 });
  } catch(error) {
    return NextResponse.json(
      { message: error instanceof RequestError ? error.message : "Sign-in is temporarily unavailable. Please try again." },
      { status: error instanceof RequestError ? error.status : 503 },
    );
  }
}

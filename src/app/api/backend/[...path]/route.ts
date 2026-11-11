import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { apiOrigin } from "@/lib/server-api";
import { jsonBody } from "@/lib/request-body";
import { RequestError } from "@/lib/http";
import { sameOrigin } from "@/lib/same-origin";
async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!path.length || path.some((part) => !/^[a-zA-Z0-9-]+$/.test(part)))
    return NextResponse.json({ message: "Invalid address." }, { status: 400 });
  if (
    !["GET", "HEAD"].includes(request.method) &&
    !sameOrigin(request)
  )
    return NextResponse.json(
      { message: "Please use this website to continue." },
      { status: 403 },
    );
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    const isPublic = request.method === "GET" && ["activities","content","status"].includes(path[0]);
    if (!isPublic || request.cookies.getAll().some(c => c.name.startsWith("sb-"))) {
      const auth = await supabase();
      const {
        data: { user }, error,
      } = await auth.auth.getUser();
      if(error && error.status && error.status >= 500) throw new RequestError(503,"Sign-in is temporarily unavailable.");
      if (!user && !isPublic)
        return NextResponse.json(
          { message: "Sign in to continue." },
          { status: 401 },
        );
      const {
        data: { session },
      } = await auth.auth.getSession();
      if (!session && !isPublic)
        return NextResponse.json(
          { message: "Please sign in again." },
          { status: 401 },
        );
      if(user && session) headers.Authorization = `Bearer ${session.access_token}`;
    }
    const key = request.headers.get("idempotency-key");
    if (key) headers["Idempotency-Key"] = key;
    let body: string | undefined;
    if (!["GET", "HEAD"].includes(request.method)) {
      body = JSON.stringify(await jsonBody(request,32768));
    }
    const response = await fetch(
      `${apiOrigin()}/v1/${path.join("/")}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    const payload = response.status === 204 ? null : await response.text();
    if(payload !== null) { try { JSON.parse(payload); } catch { throw new RequestError(502,"The service returned an unexpected response. Please try again."); } }
    return new NextResponse(payload, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  } catch(error) {
    return NextResponse.json(
      { message: error instanceof RequestError ? error.message : "The service is temporarily unavailable. Please try again." },
      { status: error instanceof RequestError ? error.status : 503, headers:{"Cache-Control":"private, no-store"} },
    );
  }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE };

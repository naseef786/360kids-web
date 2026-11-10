import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { apiOrigin } from "@/lib/server-api";
async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!path.length || path.some((part) => !/^[a-zA-Z0-9-]+$/.test(part)))
    return NextResponse.json({ message: "Invalid address." }, { status: 400 });
  if (
    !["GET", "HEAD"].includes(request.method) &&
    request.headers.get("origin") !== request.nextUrl.origin
  )
    return NextResponse.json(
      { message: "Please use this website to continue." },
      { status: 403 },
    );
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    const isPublic = request.method === "GET" && path[0] === "activities";
    if (!isPublic) {
      const auth = await supabase();
      const {
        data: { user },
      } = await auth.auth.getUser();
      if (!user)
        return NextResponse.json(
          { message: "Sign in to continue." },
          { status: 401 },
        );
      const {
        data: { session },
      } = await auth.auth.getSession();
      if (!session)
        return NextResponse.json(
          { message: "Please sign in again." },
          { status: 401 },
        );
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    const key = request.headers.get("idempotency-key");
    if (key) headers["Idempotency-Key"] = key;
    let body: string | undefined;
    if (!["GET", "HEAD"].includes(request.method)) {
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        return NextResponse.json(
          { message: "JSON is required." },
          { status: 415 },
        );
      body = await request.text();
      if (new TextEncoder().encode(body).length > 32768)
        return NextResponse.json(
          { message: "Request too large." },
          { status: 413 },
        );
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
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "The service is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE };

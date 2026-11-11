import { NextRequest, NextResponse } from "next/server";
import { parseLocale } from "@/lib/i18n";
import { jsonBody } from "@/lib/request-body";
import { sameOrigin } from "@/lib/same-origin";
import { RequestError } from "@/lib/http";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { message: "Please use this website to continue." },
      { status: 403 },
    );
  try {
    const body = await jsonBody(request, 1024);
    const locale = parseLocale(body.locale);
    if (!locale)
      return NextResponse.json(
        { message: "Choose a supported language." },
        { status: 422 },
      );
    const response = NextResponse.json({ locale });
    response.cookies.set("locale", locale, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof RequestError
            ? error.message
            : "Unable to change language.",
      },
      { status: error instanceof RequestError ? error.status : 400 },
    );
  }
}

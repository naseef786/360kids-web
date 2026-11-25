import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchJson, RequestError } from "@/lib/http";
import { jsonBody } from "@/lib/request-body";
import { requestOrigin, sameOrigin } from "@/lib/same-origin";
import { apiOrigin } from "@/lib/server-api";
import { supabase } from "@/lib/supabase/server";

const guestChildSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  surname: z.string().trim().max(80).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const guestBookingSchema = z.object({
  activityId: z.string().uuid(),
  activityVersion: z.number().int().positive(),
  sessionId: z.string().uuid(),
  email: z.string().trim().email().max(254),
  children: z.array(guestChildSchema).min(1).max(10),
  policyAccepted: z.literal(true),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { message: "Please use this website to continue." },
      { status: 403 },
    );
  }
  if (Number(request.headers.get("content-length") ?? 0) > 16384) {
    return NextResponse.json({ message: "Request too large." }, { status: 413 });
  }

  try {
    const raw = await jsonBody(request, 16384);
    const parsed = guestBookingSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Check your email, session selection, and child details." },
        { status: 422 },
      );
    }

    const input = parsed.data;
    const auth = await supabase();
    const generatedPassword = `${randomBytes(18).toString("base64url")}!Aa1`;
    const redirectTo = `${requestOrigin(request)}/auth/callback?next=${encodeURIComponent(`/activities/${input.activityId}`)}`;

    const { data, error } = await auth.auth.signUp({
      email: input.email,
      password: generatedPassword,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      if (error.code === "user_already_exists" || error.status === 422) {
        return NextResponse.json(
          {
            message:
              "An account with this email already exists. Please sign in to complete your booking.",
            existingAccount: true,
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { message: "Unable to start guest booking right now. Please try again." },
        { status: error.status && error.status >= 500 ? 503 : 400 },
      );
    }

    const token = data.session?.access_token;
    if (!token) {
      return NextResponse.json(
        {
          message:
            "Check your email to confirm your address, then sign in to finish your booking.",
          needsConfirmation: true,
        },
        { status: 202 },
      );
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const childIds: string[] = [];
    for (const child of input.children) {
      const created = await fetchJson<{ id: string }>(
        `${apiOrigin()}/v1/children`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            firstName: child.firstName,
            ...(child.surname ? { surname: child.surname } : {}),
            birthDate: child.birthDate,
          }),
        },
      );
      childIds.push(created.id);
    }

    const booking = await fetchJson<{ id: string }>(
      `${apiOrigin()}/v1/bookings`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Idempotency-Key": input.idempotencyKey ?? randomUUID(),
        },
        body: JSON.stringify({
          sessionId: input.sessionId,
          activityVersion: input.activityVersion,
          childIds,
          policyAccepted: true,
        }),
      },
    );

    return NextResponse.json(
      { ok: true, bookingId: booking.id, next: "/parent/bookings" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof RequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: "Unable to complete guest booking. Please try again." },
      { status: 400 },
    );
  }
}

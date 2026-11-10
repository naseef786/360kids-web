import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { supabase } from "./supabase/server";
import type { Identity } from "./types";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const apiOrigin = () => process.env.API_URL ?? "http://127.0.0.1:4000";
export async function backend<T>(path: string, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiOrigin()}/v1${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new ApiError(
      503,
      "The service is temporarily unavailable. Please try again.",
    );
  }
  const data = await response.json();
  if (response.status === 404) notFound();
  if (!response.ok)
    throw new ApiError(
      response.status,
      data.message ?? "Unable to load this page.",
    );
  return data as T;
}
export const identity = cache(async () => {
  const auth = await supabase();
  const {
    data: { user },
    error,
  } = await auth.auth.getUser();
  if (error || !user) return null;
  const {
    data: { session },
  } = await auth.auth.getSession();
  if (!session) return null;
  return {
    actor: await backend<Identity>("/me", session.access_token),
    token: session.access_token,
  };
});
export async function requireIdentity(next: string, role?: string) {
  const session = await identity();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (role && !session.actor.roles.includes(role)) redirect("/access-denied");
  return session;
}
export function safeNext(value: unknown, fallback = "/parent") {
  return typeof value === "string" &&
    /^\/(?!\/)/.test(value) &&
    !/[\\\r\n]/.test(value)
    ? value
    : fallback;
}

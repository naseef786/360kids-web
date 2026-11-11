import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { supabase } from "./supabase/server";
import type { Identity } from "./types";
import { fetchJson, RequestError as ApiError } from "./http";
export { RequestError as ApiError } from "./http";
export { safeNext } from "./navigation";
export const apiOrigin = () => {
  const configured = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "")
    .trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:4000";
  throw new Error("Missing API_URL for the production web app.");
};
export async function backend<T>(path: string, token?: string): Promise<T> {
  try {
    return await fetchJson<T>(`${apiOrigin()}/v1${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    },12000);
  } catch(error) {
    if(error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
export const identity = cache(async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null;
  const auth = await supabase();
  const {
    data: { user },
    error,
  } = await auth.auth.getUser();
  if (error && error.status && error.status >= 500) throw new ApiError(503,"Sign-in is temporarily unavailable. Please try again.");
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

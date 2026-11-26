import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { supabase } from "./supabase/server";
import type { Identity } from "./types";
import { canUseAdminPath } from "./permissions";
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
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const auth = await supabase();
  const {
    data: { session },
  } = await auth.auth.getSession();
  if (!session?.access_token) return null;
  const [userResult, actorResult] = await Promise.all([
    auth.auth.getUser(),
    backend<Identity>("/me", session.access_token).then(
      (actor) => ({ ok: true as const, actor }),
      (err) => ({ ok: false as const, err }),
    ),
  ]);
  if (userResult.error && userResult.error.status && userResult.error.status >= 500) {
    throw new ApiError(503, "Sign-in is temporarily unavailable. Please try again.");
  }
  if (userResult.error || !userResult.data.user) return null;
  if (!actorResult.ok) throw actorResult.err;
  return {
    actor: actorResult.actor,
    token: session.access_token,
  };
});
export async function requireIdentity(next: string, role?: string) {
  const session = await identity();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (role === "superadmin" ? !canUseAdminPath(session.actor,next) : role && !session.actor.roles.includes(role))
    redirect("/access-denied");
  return session;
}

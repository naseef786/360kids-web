import { Brand } from "@/components/shell";
import { AuthForm } from "@/components/account-controls";
import { safeNext } from "@/lib/server-api";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  return (
    <main className="auth-page">
      <Brand />
      <AuthForm
        mode="signup"
        next={safeNext(q.next)}
        linkError={q.error === "link"}
      />
    </main>
  );
}

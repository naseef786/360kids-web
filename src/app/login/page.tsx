import { AuthScreen } from "@/components/auth-screen";
import { safeNext } from "@/lib/server-api";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  return (
    <AuthScreen
      mode="signin"
      next={safeNext(query.next)}
      linkError={query.error === "link"}
    />
  );
}

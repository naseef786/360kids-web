import { AuthForm } from "./account-controls";
import { LanguageSwitcher } from "./language-switcher";
import { Brand } from "./shell";
import { authCopy, type AuthMode } from "@/lib/auth-copy";
import { serverDictionary } from "@/lib/server-locale";

export async function AuthScreen({
  mode,
  next,
  linkError = false,
}: {
  mode: AuthMode;
  next: string;
  linkError?: boolean;
}) {
  const { locale, dictionary } = await serverDictionary();
  return (
    <main className="auth-page">
      <div className="auth-topbar">
        <Brand homeLabel={dictionary.brandHome} />
        <LanguageSwitcher locale={locale} label={dictionary.language} />
      </div>
      <AuthForm
        mode={mode}
        next={next}
        linkError={linkError}
        locale={locale}
        copy={authCopy[locale]}
      />
    </main>
  );
}

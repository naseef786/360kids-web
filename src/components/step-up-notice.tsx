import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export function StepUpNotice({next,locale="en"}: {next:string;locale?:Locale}) {
  return <div className="notice">
    <p>{locale === "ar" ? "أكّد هويتك برمز من تطبيق المصادقة قبل المتابعة." : "Confirm your identity with an authenticator code before continuing."}</p>
    <Link className="btn outline" href={`/account/security?next=${encodeURIComponent(next)}`}>
      {locale === "ar" ? "تأكيد الهوية" : "Verify identity"}
    </Link>
  </div>;
}

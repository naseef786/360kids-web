import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import {
  dictionaries,
  localeFromAcceptLanguage,
  parseLocale,
  type Locale,
} from "./i18n";

export const serverLocale = cache(async (): Promise<Locale> => {
  const cookieLocale = parseLocale((await cookies()).get("locale")?.value);
  if (cookieLocale) return cookieLocale;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
});

export async function serverDictionary() {
  const locale = await serverLocale();
  return { locale, dictionary: dictionaries[locale] };
}

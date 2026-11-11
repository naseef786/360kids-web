export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export function parseLocale(value: unknown): Locale | null {
  return typeof value === "string" && locales.includes(value as Locale)
    ? (value as Locale)
    : null;
}

export function localeFromAcceptLanguage(value: string | null): Locale {
  if (!value) return "en";
  const choices = value
    .split(",")
    .map((part) => {
      const [tag, ...parameters] = part.trim().toLowerCase().split(";");
      const quality = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith("q="));
      const score = quality ? Number(quality.slice(2)) : 1;
      return { locale: tag.split("-")[0], score: Number.isFinite(score) ? score : 0 };
    })
    .sort((a, b) => b.score - a.score);
  for (const choice of choices) {
    if (choice.score <= 0) continue;
    if (choice.locale === "ar" || choice.locale === "en")
      return choice.locale;
  }
  return "en";
}

export type ShellDictionary = {
  brandHome: string;
  website: string;
  workspaceNavigation: string;
  parentNavigation: string;
  explore: string;
  categories: string;
  howItWorks: string;
  parent: string;
  partner: string;
  superadmin: string;
  signIn: string;
  becomePartner: string;
  notifications: string;
  skip: string;
  development: string;
  preview: string;
  familyLabel: string;
  partnerLabel: string;
  adminLabel: string;
  familyAccount: string;
  partnerAccount: string;
  platformTeam: string;
  language: string;
  signOut: string;
  signingOut: string;
  updates: string;
  updatesUnavailable: string;
  retry: string;
  nav: {
    overview: string;
    exploreActivities: string;
    myBookings: string;
    childrenAccount: string;
    savedActivities: string;
    support: string;
    requests: string;
    listings: string;
    organizations: string;
    teamAccess: string;
    providerReviews: string;
    catalogue: string;
    allBookings: string;
    correctionsAudit: string;
    supportRequests: string;
    websiteContent: string;
    saved: string;
    bookings: string;
    profile: string;
  };
  footer: {
    tagline: string;
    location: string;
    information: string;
    about: string;
    contact: string;
    faq: string;
    terms: string;
    privacy: string;
  };
};

export const dictionaries = {
  en: {
    brandHome: "360 Kids Activity home",
    website: "Website",
    workspaceNavigation: "Workspace navigation",
    parentNavigation: "Parent navigation",
    explore: "Explore",
    categories: "Categories",
    howItWorks: "How it works",
    parent: "Parent",
    partner: "Partner",
    superadmin: "Superadmin",
    signIn: "Sign in",
    becomePartner: "Become a partner",
    notifications: "Notifications",
    skip: "Skip to content",
    development: "Development",
    preview: "Use fictional family details while we prepare for launch.",
    familyLabel: "YOUR FAMILY",
    partnerLabel: "PARTNER WORKSPACE",
    adminLabel: "SUPERADMIN",
    familyAccount: "Your family",
    partnerAccount: "Partner account",
    platformTeam: "Platform team",
    language: "Language",
    signOut: "Sign out",
    signingOut: "Signing out…",
    updates: "Updates",
    updatesUnavailable: "updates unavailable",
    retry: "Retry",
    nav: {
      overview: "Overview",
      exploreActivities: "Explore activities",
      myBookings: "My bookings",
      childrenAccount: "Children & account",
      savedActivities: "Saved activities",
      support: "Support",
      requests: "Requests",
      listings: "Listings",
      organizations: "My organizations",
      teamAccess: "Team access",
      providerReviews: "Provider reviews",
      catalogue: "Catalogue",
      allBookings: "All bookings",
      correctionsAudit: "Corrections & audit",
      supportRequests: "Support requests",
      websiteContent: "Website content",
      saved: "Saved",
      bookings: "Bookings",
      profile: "Profile",
    },
    footer: {
      tagline: "360 Kids Activity · Explore. Play. Grow.",
      location: "Dubai, United Arab Emirates",
      information: "Information",
      about: "About",
      contact: "Contact",
      faq: "FAQ",
      terms: "Terms",
      privacy: "Privacy",
    },
  },
  ar: {
    brandHome: "الصفحة الرئيسية لـ 360 Kids Activity",
    website: "الموقع",
    workspaceNavigation: "التنقل في مساحة العمل",
    parentNavigation: "تنقل ولي الأمر",
    explore: "استكشف",
    categories: "الفئات",
    howItWorks: "كيف تعمل المنصة",
    parent: "ولي الأمر",
    partner: "الشريك",
    superadmin: "الإدارة",
    signIn: "تسجيل الدخول",
    becomePartner: "انضم كشريك",
    notifications: "الإشعارات",
    skip: "انتقل إلى المحتوى",
    development: "نسخة تجريبية",
    preview: "استخدم بيانات عائلية وهمية أثناء استعدادنا للإطلاق.",
    familyLabel: "عائلتك",
    partnerLabel: "مساحة عمل الشريك",
    adminLabel: "الإدارة",
    familyAccount: "عائلتك",
    partnerAccount: "حساب الشريك",
    platformTeam: "فريق المنصة",
    language: "اللغة",
    signOut: "تسجيل الخروج",
    signingOut: "جارٍ تسجيل الخروج…",
    updates: "التحديثات",
    updatesUnavailable: "التحديثات غير متاحة",
    retry: "إعادة المحاولة",
    nav: {
      overview: "نظرة عامة",
      exploreActivities: "استكشف الأنشطة",
      myBookings: "طلباتي",
      childrenAccount: "الأطفال والحساب",
      savedActivities: "الأنشطة المحفوظة",
      support: "الدعم",
      requests: "الطلبات",
      listings: "الأنشطة",
      organizations: "مؤسساتي",
      teamAccess: "صلاحيات الفريق",
      providerReviews: "مراجعة المزودين",
      catalogue: "دليل الأنشطة",
      allBookings: "جميع الطلبات",
      correctionsAudit: "التصحيحات والتدقيق",
      supportRequests: "طلبات الدعم",
      websiteContent: "محتوى الموقع",
      saved: "المحفوظة",
      bookings: "الطلبات",
      profile: "الملف الشخصي",
    },
    footer: {
      tagline: "360 Kids Activity · استكشف. العب. تطوّر.",
      location: "دبي، الإمارات العربية المتحدة",
      information: "معلومات",
      about: "من نحن",
      contact: "اتصل بنا",
      faq: "الأسئلة الشائعة",
      terms: "الشروط",
      privacy: "الخصوصية",
    },
  },
} as const satisfies Record<Locale, ShellDictionary>;

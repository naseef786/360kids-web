import type { Locale } from "./i18n";

export type AuthMode = "signin" | "signup" | "recover" | "update-password";

export type AuthCopy = {
  eyebrow: string;
  titles: Record<AuthMode, string>;
  descriptions: Record<AuthMode, string>;
  email: string;
  password: string;
  passwordHint: string;
  pleaseWait: string;
  submit: Record<AuthMode, string>;
  forgotPassword: string;
  createAccount: string;
  backToSignIn: string;
  invalidLink: string;
};

export const authCopy = {
  en: {
    eyebrow: "EXPLORE. PLAY. GROW.",
    titles: {
      signin: "Welcome back",
      signup: "Start your family account",
      recover: "Reset your password",
      "update-password": "Choose a new password",
    },
    descriptions: {
      signin: "A little more discovery, a lot more possibility.",
      signup: "Find activities and manage your family in one place.",
      recover: "We’ll help you get back to your family activities.",
      "update-password": "Create a secure password for your account.",
    },
    email: "Email address",
    password: "Password",
    passwordHint: "At least 8 characters.",
    pleaseWait: "Please wait…",
    submit: {
      signin: "Sign in",
      signup: "Create account",
      recover: "Send reset link",
      "update-password": "Update password",
    },
    forgotPassword: "Forgot password?",
    createAccount: "Create an account",
    backToSignIn: "Back to sign in",
    invalidLink: "This link has expired or is invalid. Please request a new one.",
  },
  ar: {
    eyebrow: "استكشف. العب. تطوّر.",
    titles: {
      signin: "مرحباً بعودتك",
      signup: "أنشئ حساب عائلتك",
      recover: "إعادة تعيين كلمة المرور",
      "update-password": "اختر كلمة مرور جديدة",
    },
    descriptions: {
      signin: "اكتشف المزيد من الأنشطة والفرص لعائلتك.",
      signup: "ابحث عن الأنشطة وأدر عائلتك في مكان واحد.",
      recover: "سنساعدك على العودة إلى أنشطة عائلتك.",
      "update-password": "أنشئ كلمة مرور آمنة لحسابك.",
    },
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    passwordHint: "8 أحرف على الأقل.",
    pleaseWait: "يرجى الانتظار…",
    submit: {
      signin: "تسجيل الدخول",
      signup: "إنشاء الحساب",
      recover: "إرسال رابط إعادة التعيين",
      "update-password": "تحديث كلمة المرور",
    },
    forgotPassword: "هل نسيت كلمة المرور؟",
    createAccount: "إنشاء حساب",
    backToSignIn: "العودة إلى تسجيل الدخول",
    invalidLink: "انتهت صلاحية هذا الرابط أو أنه غير صالح. اطلب رابطاً جديداً.",
  },
} as const satisfies Record<Locale, AuthCopy>;

const arabicMessages: Record<string, string> = {
  "Please use this website to continue.": "يرجى المتابعة من خلال هذا الموقع.",
  "Request too large.": "حجم الطلب كبير جداً.",
  "Unable to sign out. Try again.": "تعذر تسجيل الخروج. حاول مرة أخرى.",
  "Enter a valid email address.": "أدخل بريداً إلكترونياً صالحاً.",
  "Use a password between 8 and 128 characters.":
    "استخدم كلمة مرور يتراوح طولها بين 8 و128 حرفاً.",
  "Please confirm your email before signing in.":
    "أكد بريدك الإلكتروني قبل تسجيل الدخول.",
  "Unable to sign in. Check your email and password.":
    "تعذر تسجيل الدخول. تحقق من بريدك الإلكتروني وكلمة المرور.",
  "Unable to create this account. Please try again or sign in.":
    "تعذر إنشاء هذا الحساب. حاول مرة أخرى أو سجل الدخول.",
  "Check your email to confirm your account, then sign in.":
    "تحقق من بريدك الإلكتروني لتأكيد حسابك، ثم سجل الدخول.",
  "Password recovery is temporarily unavailable. Please try again.":
    "استعادة كلمة المرور غير متاحة مؤقتاً. حاول مرة أخرى.",
  "If an account exists, a password reset link will arrive by email.":
    "إذا كان الحساب موجوداً، فسيصلك رابط إعادة تعيين كلمة المرور عبر البريد الإلكتروني.",
  "Open a valid reset link or sign in first.":
    "افتح رابط إعادة تعيين صالحاً أو سجل الدخول أولاً.",
  "Unable to update the password. Please try a new reset link.":
    "تعذر تحديث كلمة المرور. اطلب رابط إعادة تعيين جديداً.",
  "Unknown action.": "الإجراء غير معروف.",
  "Sign-in is temporarily unavailable. Please try again.":
    "تسجيل الدخول غير متاح مؤقتاً. حاول مرة أخرى.",
};

export function localizedAuthMessage(locale: Locale, message: string): string {
  return locale === "ar" ? (arabicMessages[message] ?? message) : message;
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "./language-switcher";
import { SignOut } from "./account-controls";
import type { Locale, ShellDictionary } from "@/lib/i18n";

export function MobileAccountMenu({
  signedIn,
  locale,
  dictionary,
  canPartner,
  canAdmin,
  adminHref,
}: {
  signedIn: boolean;
  locale: Locale;
  dictionary: ShellDictionary;
  canPartner: boolean;
  canAdmin: boolean;
  adminHref: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="mobile-menu-wrap">
      <button
        ref={triggerRef}
        type="button"
        className="btn outline small mobile-menu-btn"
        aria-expanded={open}
        aria-controls="mobile-account-menu"
        aria-label={locale === "ar" ? "القائمة والحساب" : "Account and menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <span>{locale === "ar" ? "القائمة" : "Menu"}</span>
      </button>

      {open && (
        <div
          className="mobile-menu-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            id="mobile-account-menu"
            className="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label={locale === "ar" ? "قائمة الحساب" : "Account menu"}
          >
            <div className="mobile-menu-head">
              <strong>{locale === "ar" ? "الحساب والإعدادات" : "Account & Settings"}</strong>
              <button type="button" className="btn outline small" onClick={close}>
                {locale === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
            <div className="mobile-menu-body">
              <div className="mobile-menu-row">
                <LanguageSwitcher locale={locale} label={dictionary.language} />
              </div>
              <nav className="mobile-menu-links" aria-label={dictionary.workspaceNavigation}>
                {signedIn ? (
                  <>
                    <Link href="/parent" onClick={() => setOpen(false)}>
                      {dictionary.nav.overview}
                    </Link>
                    {canPartner && (
                      <Link href="/partner" onClick={() => setOpen(false)}>
                        {dictionary.partner}
                      </Link>
                    )}
                    {canAdmin && (
                      <Link href={adminHref} onClick={() => setOpen(false)}>
                        {dictionary.superadmin}
                      </Link>
                    )}
                    <Link href="/account/security" onClick={() => setOpen(false)}>
                      {locale === "ar" ? "أمان الحساب" : "Account security"}
                    </Link>
                    <Link href="/parent/support" onClick={() => setOpen(false)}>
                      {dictionary.nav.support}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      {dictionary.signIn}
                    </Link>
                    <Link href="/signup" onClick={() => setOpen(false)}>
                      {locale === "ar" ? "إنشاء حساب" : "Create account"}
                    </Link>
                    <Link href="/partner/apply" onClick={() => setOpen(false)}>
                      {dictionary.becomePartner}
                    </Link>
                  </>
                )}
              </nav>
              {signedIn && (
                <div className="mobile-menu-signout">
                  <SignOut
                    locale={locale}
                    label={dictionary.signOut}
                    pendingLabel={dictionary.signingOut}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

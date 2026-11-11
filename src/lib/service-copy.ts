import type { Locale } from "./i18n";

const notificationEvents = {
  en: {
    "request.submitted": "Booking request submitted",
    accept: "Places accepted and held",
    offer: "Revised booking offer ready",
    "accept-offer": "Revised offer accepted",
    decline: "Booking request declined",
    cancel: "Booking cancelled",
    "booking.expired": "Unpaid booking hold expired",
    proof: "Payment submitted for review",
    verify: "Booking confirmed",
    "provider.applied": "Provider application submitted",
    "provider.approved": "Provider application approved",
    "provider.rejected": "Provider application reviewed",
    "provider.suspended": "Provider access updated",
    "activity.created": "Activity created",
    "activity.updated": "Activity listing updated",
    "activity.published": "Activity published",
    "activity.unpublished": "Activity unpublished",
    "session.created": "Activity session added",
    "support.created": "Support request opened",
    "support.updated": "Support response updated",
    "child.created": "Child profile added",
    "child.updated": "Child profile updated",
    "content.updated": "Website content updated",
    "refund.completed": "Refund recorded",
  },
  ar: {
    "request.submitted": "تم إرسال طلب الحجز",
    accept: "تم قبول الأماكن وحجزها مؤقتاً",
    offer: "عرض حجز معدل جاهز",
    "accept-offer": "تم قبول العرض المعدل",
    decline: "تم رفض طلب الحجز",
    cancel: "تم إلغاء الحجز",
    "booking.expired": "انتهت مهلة الحجز غير المدفوع",
    proof: "تم إرسال الدفع للمراجعة",
    verify: "تم تأكيد الحجز",
    "provider.applied": "تم إرسال طلب المزود",
    "provider.approved": "تمت الموافقة على طلب المزود",
    "provider.rejected": "تمت مراجعة طلب المزود",
    "provider.suspended": "تم تحديث وصول المزود",
    "activity.created": "تم إنشاء النشاط",
    "activity.updated": "تم تحديث النشاط",
    "activity.published": "تم نشر النشاط",
    "activity.unpublished": "تم إلغاء نشر النشاط",
    "session.created": "تمت إضافة جلسة النشاط",
    "support.created": "تم فتح طلب الدعم",
    "support.updated": "تم تحديث رد الدعم",
    "child.created": "تمت إضافة ملف الطفل",
    "child.updated": "تم تحديث ملف الطفل",
    "content.updated": "تم تحديث محتوى الموقع",
    "refund.completed": "تم تسجيل الاسترداد",
  },
} as const;

export type ServiceCopy = {
  notifications: {
    title: string;
    unreadUpdates: (count: number) => string;
    refreshNote: string;
    read: string;
    unread: string;
    dubaiTime: string;
    viewUpdate: string;
    markRead: string;
    markAllRead: string;
    emptyTitle: string;
    emptyNote: string;
    eventFallback: string;
  };
  support: {
    title: string;
    note: string;
    status: string;
    allStatuses: string;
    applyFilter: string;
    statuses: Record<"open" | "in_progress" | "resolved", string>;
    teamResponse: string;
    emptyTitle: string;
    emptyNote: string;
    helpTitle: string;
    saveResponse: string;
    submitRequest: string;
    reply: string;
    topic: string;
    message: string;
    topics: Record<string, string>;
    saving: string;
    saved: string;
  };
  pager: {
    pagination: string;
    result: string;
    results: string;
    page: string;
    of: string;
    unavailable: string;
    previous: string;
    next: string;
    back: string;
  };
};

export const serviceCopy: Record<Locale, ServiceCopy> = {
  en: {
    notifications: {
      title: "Notifications",
      unreadUpdates: (count) => `${count} unread updates.`,
      refreshNote: "Updates refresh every 30 seconds while this page is visible.",
      read: "Read",
      unread: "Unread",
      dubaiTime: "Dubai time",
      viewUpdate: "View update",
      markRead: "Mark read",
      markAllRead: "Mark all read",
      emptyTitle: "No notifications here",
      emptyNote: "Your booking and account updates will appear here.",
      eventFallback: "Your account was updated",
    },
    support: {
      title: "Support",
      note: "Requests and replies stay in your account. No external messages are sent.",
      status: "Status",
      allStatuses: "All statuses",
      applyFilter: "Apply filter",
      statuses: { open: "Open", in_progress: "In progress", resolved: "Resolved" },
      teamResponse: "Team response",
      emptyTitle: "No support requests",
      emptyNote: "Requests matching this filter will appear here.",
      helpTitle: "How can we help?",
      saveResponse: "Save response",
      submitRequest: "Submit support request",
      reply: "Reply in account",
      topic: "Topic",
      message: "How can we help?",
      topics: {
        Booking: "Booking",
        "Child profile": "Child profile",
        Account: "Account",
        "Provider application": "Provider application",
        Other: "Other",
      },
      saving: "Saving…",
      saved: "Saved successfully.",
    },
    pager: {
      pagination: "Pagination",
      result: "result",
      results: "results",
      page: "Page",
      of: "of",
      unavailable: "This page is no longer available",
      previous: "Previous",
      next: "Next",
      back: "Back to results",
    },
  },
  ar: {
    notifications: {
      title: "الإشعارات",
      unreadUpdates: (count) => `${count} تحديثات غير مقروءة.`,
      refreshNote: "تُحدَّث البيانات كل 30 ثانية أثناء عرض هذه الصفحة.",
      read: "مقروء",
      unread: "غير مقروء",
      dubaiTime: "بتوقيت دبي",
      viewUpdate: "عرض التحديث",
      markRead: "تحديد كمقروء",
      markAllRead: "تحديد الكل كمقروء",
      emptyTitle: "لا توجد إشعارات",
      emptyNote: "ستظهر تحديثات الحجز والحساب هنا.",
      eventFallback: "تم تحديث حسابك",
    },
    support: {
      title: "الدعم",
      note: "تبقى الطلبات والردود في حسابك. لا تُرسل رسائل خارجية.",
      status: "الحالة",
      allStatuses: "جميع الحالات",
      applyFilter: "تطبيق الفلتر",
      statuses: { open: "مفتوح", in_progress: "قيد المعالجة", resolved: "تم الحل" },
      teamResponse: "رد الفريق",
      emptyTitle: "لا توجد طلبات دعم",
      emptyNote: "ستظهر هنا الطلبات المطابقة لهذا الفلتر.",
      helpTitle: "كيف يمكننا مساعدتك؟",
      saveResponse: "حفظ الرد",
      submitRequest: "إرسال طلب الدعم",
      reply: "الرد داخل الحساب",
      topic: "الموضوع",
      message: "كيف يمكننا مساعدتك؟",
      topics: {
        Booking: "الحجز",
        "Child profile": "ملف الطفل",
        Account: "الحساب",
        "Provider application": "طلب المزود",
        Other: "أخرى",
      },
      saving: "جارٍ الحفظ…",
      saved: "تم الحفظ بنجاح.",
    },
    pager: {
      pagination: "ترقيم الصفحات",
      result: "نتيجة",
      results: "نتائج",
      page: "الصفحة",
      of: "من",
      unavailable: "هذه الصفحة لم تعد متاحة",
      previous: "السابق",
      next: "التالي",
      back: "العودة إلى النتائج",
    },
  },
};

export function notificationEventLabel(locale: Locale, event: string): string {
  const labels = notificationEvents[locale] as Record<string, string>;
  return labels[event] ?? serviceCopy[locale].notifications.eventFallback;
}

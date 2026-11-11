import type { Locale } from "./i18n";

export type ParentCopy = {
  viewActivity: string;
  ages: string;
  years: string;
  perChild: string;
  activity: string;
  searchPlaceholder: string;
  childAge: string;
  allAges: string;
  area: string;
  areaPlaceholder: string;
  category: string;
  allActivities: string;
  exploreActivities: string;
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  exploreByCategory: string;
  discoverNew: string;
  viewAll: string;
  photographyNote: string;
  emptyActivitiesTitle: string;
  emptyActivitiesNote: string;
  journeyTitle: string;
  requestPlace: string;
  requestPlaceNote: string;
  reviewResponse: string;
  reviewResponseNote: string;
  confirmBooking: string;
  confirmBookingNote: string;
  catalogueNote: string;
  noMatches: string;
  noMatchesNote: string;
  clearFilters: string;
  allActivitiesBack: string;
  aboutActivity: string;
  cancellationPolicy: string;
  illustrativePhoto: string;
  booking: {
    dubaiTime: string;
    child: string;
    children: string;
    viewRequest: string;
    myBookings: string;
    progressNote: string;
    status: string;
    allStatuses: string;
    apply: string;
    emptyTitle: string;
    emptyNote: string;
    allRequests: string;
    session: string;
    total: string;
    reference: string;
    responseDue: string;
    paymentDeadline: string;
    providerOffer: string;
    expires: string;
    acceptedPolicy: string;
    payment: string;
    refund: string;
    nextSteps: string;
    confirmedRule: string;
    placeStatus: string;
    requiredAction: string;
    deadline: string;
    noDeadline: string;
    acceptOffer: string;
    acceptOfferNote: string;
    paymentDueNotice: string;
    paymentDisabledNotice: string;
    submitReference: string;
    paymentReference: string;
    cancelThisRequest: string;
    cancelRequest: string;
    cancellationReason: string;
  };
  request: {
    perChild: string;
    cancellationPolicy: string;
    signInIntroTitle: string;
    signInIntro: string;
    signIn: string;
    title: string;
    from: string;
    providerConfirmation: string;
    platformHoldNote: string;
    noSessions: string;
    backToSessions: string;
    addChildNotice: string;
    addChild: string;
    send: string;
    chooseChildError: string;
    chooseSession: string;
    selectDate: string;
    requestsClosed: string;
    providerConfirms: string;
    previousSessions: string;
    moreSessions: string;
    joining: string;
    selected: string;
    selectionLimit: string;
    previousChildren: string;
    moreChildren: string;
    estimatedTotal: string;
    noReservation: string;
    acceptPolicy: string;
  };
};

export const parentCopy = {
  en: {
    viewActivity: "View activity",
    ages: "Ages",
    years: "years",
    perChild: "Per child",
    activity: "Activity",
    searchPlaceholder: "Find something they’ll love",
    childAge: "Child’s age",
    allAges: "All ages",
    area: "Area",
    areaPlaceholder: "Any neighbourhood",
    category: "Category",
    allActivities: "All activities",
    exploreActivities: "Explore activities",
    heroEyebrow: "A WORLD OF LITTLE POSSIBILITIES",
    heroTitle: "Find their next favourite activity",
    heroText: "Classes, play and family experiences in Dubai",
    exploreByCategory: "Explore by category",
    discoverNew: "Discover something new",
    viewAll: "View all activities",
    photographyNote: "Explore published activities · Photography is illustrative.",
    emptyActivitiesTitle: "New adventures are on the way",
    emptyActivitiesNote: "Approved activities will appear here as providers join.",
    journeyTitle: "From discovery to a confirmed place",
    requestPlace: "Request a place",
    requestPlaceNote: "Choose an activity, session and children. A request does not reserve a place.",
    reviewResponse: "Review the response",
    reviewResponseNote: "Your provider checks availability and may propose a revised total.",
    confirmBooking: "Confirm your booking",
    confirmBookingNote: "Follow the agreed payment process. Confirmation is a separate step.",
    catalogueNote: "Find the right fit for their age, interests and neighbourhood.",
    noMatches: "No matching activities",
    noMatchesNote: "Try another age, area or category.",
    clearFilters: "Clear filters",
    allActivitiesBack: "All activities",
    aboutActivity: "About this activity",
    cancellationPolicy: "Cancellation policy",
    illustrativePhoto: "Illustrative activity photography",
    booking: {
      dubaiTime: "Dubai time",
      child: "child",
      children: "children",
      viewRequest: "View request",
      myBookings: "My bookings",
      progressNote: "Review requests, responses and booking progress.",
      status: "Status",
      allStatuses: "All statuses",
      apply: "Apply",
      emptyTitle: "No requests here yet",
      emptyNote: "Choose an activity to send your first request.",
      allRequests: "All requests",
      session: "Session",
      total: "Total",
      reference: "Request reference",
      responseDue: "Response due",
      paymentDeadline: "Payment deadline",
      providerOffer: "Provider offer",
      expires: "Expires",
      acceptedPolicy: "Accepted cancellation policy",
      payment: "Payment",
      refund: "Refund",
      nextSteps: "Next steps",
      confirmedRule: "A request is confirmed only when its status says Confirmed.",
      placeStatus: "Place status",
      requiredAction: "Required action",
      deadline: "Deadline",
      noDeadline: "No action deadline",
      acceptOffer: "Accept offer",
      acceptOfferNote: "Accept the revised total and proceed to the payment stage.",
      paymentDueNotice: "Payment is due by the deadline shown above.",
      paymentDisabledNotice: "Payment collection is not enabled during development. No money should be transferred.",
      submitReference: "Submit reference",
      paymentReference: "Payment reference",
      cancelThisRequest: "Cancel this request",
      cancelRequest: "Cancel request",
      cancellationReason: "Cancellation reason",
    },
    request: {
      perChild: "per child",
      cancellationPolicy: "Cancellation policy",
      signInIntroTitle: "Make room for discovery",
      signInIntro: "Sign in to choose your children and request a place.",
      signIn: "Sign in to request",
      title: "Request a place",
      from: "From",
      providerConfirmation: "The provider confirms external availability after you send the request.",
      platformHoldNote: "A session may close when all platform-held places are allocated.",
      noSessions: "No sessions are currently accepting requests on this page.",
      backToSessions: "Back to available sessions",
      addChildNotice: "Add a fictional child profile to try this activity.",
      addChild: "Add a child",
      send: "Send booking request",
      chooseChildError: "Choose at least one child.",
      chooseSession: "Choose a session",
      selectDate: "Select date and time",
      requestsClosed: "Requests closed",
      providerConfirms: "Provider confirms availability",
      previousSessions: "Previous sessions",
      moreSessions: "More sessions",
      joining: "Who’s joining?",
      selected: "selected",
      selectionLimit: "Up to 10 children per request.",
      previousChildren: "Previous children",
      moreChildren: "More children",
      estimatedTotal: "Estimated total",
      noReservation: "The provider reviews your request. Sending it does not reserve or confirm a place.",
      acceptPolicy: "I accept this activity’s cancellation policy.",
    },
  },
  ar: {
    viewActivity: "عرض النشاط",
    ages: "الأعمار",
    years: "سنوات",
    perChild: "لكل طفل",
    activity: "النشاط",
    searchPlaceholder: "ابحث عن نشاط مناسب لطفلك",
    childAge: "عمر الطفل",
    allAges: "جميع الأعمار",
    area: "المنطقة",
    areaPlaceholder: "أي منطقة",
    category: "الفئة",
    allActivities: "جميع الأنشطة",
    exploreActivities: "استكشف الأنشطة",
    heroEyebrow: "عالم من الإمكانات الصغيرة",
    heroTitle: "اعثر على النشاط المفضل القادم لطفلك",
    heroText: "دروس ولعب وتجارب عائلية في دبي",
    exploreByCategory: "استكشف حسب الفئة",
    discoverNew: "اكتشف شيئاً جديداً",
    viewAll: "عرض جميع الأنشطة",
    photographyNote: "استكشف الأنشطة المنشورة · الصور توضيحية.",
    emptyActivitiesTitle: "مغامرات جديدة قريباً",
    emptyActivitiesNote: "ستظهر الأنشطة المعتمدة هنا عند انضمام المزودين.",
    journeyTitle: "من الاستكشاف إلى تأكيد المكان",
    requestPlace: "اطلب مكاناً",
    requestPlaceNote: "اختر النشاط والموعد والأطفال. إرسال الطلب لا يحجز مكاناً.",
    reviewResponse: "راجع الرد",
    reviewResponseNote: "يتحقق المزود من التوفر وقد يقترح مبلغاً معدلاً.",
    confirmBooking: "أكّد الحجز",
    confirmBookingNote: "اتبع عملية الدفع المتفق عليها. التأكيد خطوة منفصلة.",
    catalogueNote: "اعثر على النشاط المناسب للعمر والاهتمامات والمنطقة.",
    noMatches: "لا توجد أنشطة مطابقة",
    noMatchesNote: "جرّب عمراً أو منطقة أو فئة أخرى.",
    clearFilters: "مسح عوامل التصفية",
    allActivitiesBack: "جميع الأنشطة",
    aboutActivity: "عن هذا النشاط",
    cancellationPolicy: "سياسة الإلغاء",
    illustrativePhoto: "صورة توضيحية للنشاط",
    booking: {
      dubaiTime: "بتوقيت دبي",
      child: "طفل",
      children: "أطفال",
      viewRequest: "عرض الطلب",
      myBookings: "طلباتي",
      progressNote: "راجع الطلبات والردود وتقدم الحجز.",
      status: "الحالة",
      allStatuses: "جميع الحالات",
      apply: "تطبيق",
      emptyTitle: "لا توجد طلبات حتى الآن",
      emptyNote: "اختر نشاطاً لإرسال طلبك الأول.",
      allRequests: "جميع الطلبات",
      session: "الموعد",
      total: "الإجمالي",
      reference: "مرجع الطلب",
      responseDue: "موعد رد المزود",
      paymentDeadline: "الموعد النهائي للدفع",
      providerOffer: "عرض المزود",
      expires: "ينتهي",
      acceptedPolicy: "سياسة الإلغاء المقبولة",
      payment: "الدفع",
      refund: "الاسترداد",
      nextSteps: "الخطوات التالية",
      confirmedRule: "لا يصبح الطلب مؤكداً إلا عندما تظهر حالته كمؤكد.",
      placeStatus: "حالة المكان",
      requiredAction: "الإجراء المطلوب",
      deadline: "الموعد النهائي",
      noDeadline: "لا يوجد موعد نهائي للإجراء",
      acceptOffer: "قبول العرض",
      acceptOfferNote: "اقبل الإجمالي المعدل للانتقال إلى مرحلة الدفع.",
      paymentDueNotice: "يجب إكمال الدفع قبل الموعد النهائي الموضح أعلاه.",
      paymentDisabledNotice: "تحصيل المدفوعات غير مفعّل في النسخة التجريبية. لا تحوّل أي أموال.",
      submitReference: "إرسال المرجع",
      paymentReference: "مرجع الدفع",
      cancelThisRequest: "إلغاء هذا الطلب",
      cancelRequest: "إلغاء الطلب",
      cancellationReason: "سبب الإلغاء",
    },
    request: {
      perChild: "لكل طفل",
      cancellationPolicy: "سياسة الإلغاء",
      signInIntroTitle: "ابدأ رحلة الاكتشاف",
      signInIntro: "سجّل الدخول لاختيار أطفالك وطلب مكان.",
      signIn: "سجّل الدخول للطلب",
      title: "اطلب مكاناً",
      from: "ابتداءً من",
      providerConfirmation: "يؤكد المزود التوفر الخارجي بعد إرسال الطلب.",
      platformHoldNote: "قد يُغلق الموعد عند تخصيص جميع الأماكن المحتجزة عبر المنصة.",
      noSessions: "لا توجد مواعيد تقبل الطلبات في هذه الصفحة حالياً.",
      backToSessions: "العودة إلى المواعيد المتاحة",
      addChildNotice: "أضف ملف طفل وهمياً لتجربة هذا النشاط.",
      addChild: "إضافة طفل",
      send: "إرسال طلب الحجز",
      chooseChildError: "اختر طفلاً واحداً على الأقل.",
      chooseSession: "اختر موعداً",
      selectDate: "اختر التاريخ والوقت",
      requestsClosed: "الطلبات مغلقة",
      providerConfirms: "يؤكد المزود التوفر",
      previousSessions: "المواعيد السابقة",
      moreSessions: "مواعيد إضافية",
      joining: "من سيشارك؟",
      selected: "تم الاختيار",
      selectionLimit: "يمكن اختيار 10 أطفال كحد أقصى لكل طلب.",
      previousChildren: "الأطفال السابقون",
      moreChildren: "أطفال إضافيون",
      estimatedTotal: "الإجمالي التقديري",
      noReservation: "يراجع المزود طلبك. إرسال الطلب لا يحجز أو يؤكد مكاناً.",
      acceptPolicy: "أوافق على سياسة إلغاء هذا النشاط.",
    },
  },
} as const satisfies Record<Locale, ParentCopy>;

export function bookingStatusCopy(locale: Locale, state: string) {
  const copy = locale === "ar" ? {
    REQUESTED: ["لا يوجد مكان محجوز بعد", "انتظر حتى يتحقق المزود من التوفر"],
    OFFER_PENDING: ["المكان غير مؤكد", "راجع عرض المزود واقبله أو ارفضه"],
    PAYMENT_DUE: ["الأماكن محتجزة مؤقتاً", "أكمل الدفع وفق التعليمات المتفق عليها"],
    PAYMENT_CHECKING: ["الأماكن محتجزة أثناء مراجعة الدفع", "لا يلزم إجراء حالياً"],
    CONFIRMED: ["المكان مؤكد", "لا يلزم إجراء"],
    DECLINED: ["لا يوجد مكان", "اختر نشاطاً أو موعداً آخر"],
    EXPIRED: ["لا يوجد مكان", "أرسل طلباً جديداً إذا كان الموعد ما زال مناسباً"],
    CANCELLED: ["لا يوجد مكان", "لا يلزم إجراء"],
  } : {
    REQUESTED: ["No place is reserved yet", "Wait for the provider to check availability"],
    OFFER_PENDING: ["The place is not confirmed", "Review and accept or decline the provider offer"],
    PAYMENT_DUE: ["Places are held temporarily", "Complete payment using the agreed instructions"],
    PAYMENT_CHECKING: ["Places are held while payment is reviewed", "No action is needed now"],
    CONFIRMED: ["The place is confirmed", "No action is needed"],
    DECLINED: ["No place is reserved", "Choose another activity or session"],
    EXPIRED: ["No place is reserved", "Send a new request if the session still suits you"],
    CANCELLED: ["No place is reserved", "No action is needed"],
  };
  const [place, action] = copy[state as keyof typeof copy] ?? [state, state];
  return { place, action };
}

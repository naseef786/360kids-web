"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { ParentCopy } from "@/lib/parent-copy";

export function ExploreFilters({
  query,
  copy,
  categories,
  locale,
  totalCount,
  actionPath = "/parent/activities",
  showResultSummary = false,
}: {
  query: Record<string, string>;
  copy: ParentCopy;
  categories: string[];
  locale: Locale;
  totalCount?: number;
  actionPath?: string;
  showResultSummary?: boolean;
}) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [q, setQ] = useState(query.q ?? "");
  const [draftAge, setDraftAge] = useState(query.age ?? "");
  const [draftArea, setDraftArea] = useState(query.area ?? "");
  const [draftCategory, setDraftCategory] = useState(query.category ?? "");

  const allCategories = [
    ...new Set([...categories, ...(query.category ? [query.category] : [])]),
  ];

  const activeFilters: Array<{ key: string; label: string; clear: () => void }> = [];
  if (query.q) activeFilters.push({ key: "q", label: `${copy.activity}: ${query.q}`, clear: () => applyFilters({ q: "" }) });
  if (query.age) activeFilters.push({ key: "age", label: `${copy.childAge}: ${query.age}`, clear: () => applyFilters({ age: "" }) });
  if (query.area) activeFilters.push({ key: "area", label: `${copy.area}: ${query.area}`, clear: () => applyFilters({ area: "" }) });
  if (query.category) activeFilters.push({ key: "category", label: `${copy.category}: ${query.category}`, clear: () => applyFilters({ category: "" }) });

  useEffect(() => {
    if (!sheetOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSheetOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sheetOpen]);

  function openSheet() {
    setDraftAge(query.age ?? "");
    setDraftArea(query.area ?? "");
    setDraftCategory(query.category ?? "");
    setSheetOpen(true);
  }

  function cancelSheet() {
    setDraftAge(query.age ?? "");
    setDraftArea(query.area ?? "");
    setDraftCategory(query.category ?? "");
    setSheetOpen(false);
    triggerRef.current?.focus();
  }

  function applyFilters(overrides?: Partial<{ q: string; age: string; area: string; category: string }>) {
    const next = {
      q: overrides?.q !== undefined ? overrides.q : q,
      age: overrides?.age !== undefined ? overrides.age : draftAge,
      area: overrides?.area !== undefined ? overrides.area : draftArea,
      category: overrides?.category !== undefined ? overrides.category : draftCategory,
    };
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.age) params.set("age", next.age);
    if (next.area.trim()) params.set("area", next.area.trim());
    if (next.category) params.set("category", next.category);
    const qs = params.toString();
    setSheetOpen(false);
    router.push(qs ? `${actionPath}?${qs}` : actionPath);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    applyFilters({
      age: query.age ?? "",
      area: query.area ?? "",
      category: query.category ?? "",
    });
  }

  function clearAll() {
    setQ("");
    setDraftAge("");
    setDraftArea("");
    setDraftCategory("");
    setSheetOpen(false);
    router.push(actionPath);
  }

  return (
    <section className="explore-filter-wrap" aria-label={copy.exploreActivities}>
      <form className="panel live-filters" onSubmit={handleSubmit} action={actionPath}>
        <label className="search-input-field">
          <span className="filter-field-label">{copy.activity}</span>
          <input
            name="q"
            type="search"
            aria-label={copy.activity}
            placeholder={copy.searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="desktop-filter-field">
          <span className="filter-field-label">{copy.childAge}</span>
          <select name="age" value={draftAge} onChange={(e) => setDraftAge(e.target.value)}>
            <option value="">{copy.allAges}</option>
            {Array.from({ length: 18 }, (_, i) => (
              <option key={i} value={String(i)}>
                {i} {copy.years}
              </option>
            ))}
          </select>
        </label>
        <label className="desktop-filter-field">
          <span className="filter-field-label">{copy.area}</span>
          <input
            name="area"
            placeholder={copy.areaPlaceholder}
            value={draftArea}
            onChange={(e) => setDraftArea(e.target.value)}
          />
        </label>
        {(allCategories.length > 0 || draftCategory) && (
          <label className="desktop-filter-field">
            <span className="filter-field-label">{copy.category}</span>
            <select name="category" value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}>
              <option value="">{copy.allActivities}</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        <div className="filter-submit-row">
          <button type="submit" className="btn small">
            {locale === "ar" ? "بحث" : "Search"}
          </button>
          <button
            ref={triggerRef}
            type="button"
            className="btn outline small mobile-filter-trigger"
            onClick={openSheet}
            aria-expanded={sheetOpen}
          >
            {locale === "ar" ? "تصفية" : "Filters"}
            {activeFilters.length > 0 && (
              <span className="filter-count-pill">{activeFilters.length}</span>
            )}
          </button>
        </div>
      </form>

      {(showResultSummary || activeFilters.length > 0) && (
        <div className="filter-summary-bar">
          {typeof totalCount === "number" && (
            <p className="record-meta" role="status">
              <strong>{totalCount}</strong>{" "}
              {locale === "ar"
                ? totalCount === 1 ? "نشاط متاح" : "أنشطة متاحة"
                : totalCount === 1 ? "programme found" : "programmes found"}
            </p>
          )}
          {activeFilters.length > 0 && (
            <div className="applied-filter-chips">
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className="filter-chip"
                  onClick={f.clear}
                  aria-label={`${locale === "ar" ? "إزالة" : "Remove"} ${f.label}`}
                >
                  <span>{f.label}</span>
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              <button
                type="button"
                className="text-link small"
                onClick={clearAll}
              >
                {copy.clearFilters}
              </button>
            </div>
          )}
        </div>
      )}

      {sheetOpen && (
        <div
          className="filter-sheet-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={locale === "ar" ? "تصفية الأنشطة" : "Filter programmes"}
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelSheet();
          }}
        >
          <div className="filter-sheet">
            <div className="filter-sheet-head">
              <h2>{locale === "ar" ? "تصفية النتائج" : "Filter programmes"}</h2>
              <button
                type="button"
                className="btn outline small"
                onClick={cancelSheet}
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
            <div className="form-stack">
              <label>
                {copy.childAge}
                <select value={draftAge} onChange={(e) => setDraftAge(e.target.value)}>
                  <option value="">{copy.allAges}</option>
                  {Array.from({ length: 18 }, (_, i) => (
                    <option key={i} value={String(i)}>
                      {i} {copy.years}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {copy.area}
                <input
                  placeholder={copy.areaPlaceholder}
                  value={draftArea}
                  onChange={(e) => setDraftArea(e.target.value)}
                />
              </label>
              {allCategories.length > 0 && (
                <label>
                  {copy.category}
                  <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}>
                    <option value="">{copy.allActivities}</option>
                    {allCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="card-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={clearAll}
                >
                  {copy.clearFilters}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => applyFilters()}
                >
                  {locale === "ar" ? "تطبيق التصفية" : "Apply filters"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

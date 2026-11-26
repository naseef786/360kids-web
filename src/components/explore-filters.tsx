"use client";

import { useState, type FormEvent } from "react";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [q, setQ] = useState(query.q ?? "");
  const [age, setAge] = useState(query.age ?? "");
  const [area, setArea] = useState(query.area ?? "");
  const [category, setCategory] = useState(query.category ?? "");

  const allCategories = [
    ...new Set([...categories, ...(category ? [category] : [])]),
  ];

  const activeFilters: Array<{ key: string; label: string; clear: () => void }> = [];
  if (query.q) activeFilters.push({ key: "q", label: `${copy.activity}: ${query.q}`, clear: () => applyFilters({ q: "" }) });
  if (query.age) activeFilters.push({ key: "age", label: `${copy.childAge}: ${query.age}`, clear: () => applyFilters({ age: "" }) });
  if (query.area) activeFilters.push({ key: "area", label: `${copy.area}: ${query.area}`, clear: () => applyFilters({ area: "" }) });
  if (query.category) activeFilters.push({ key: "category", label: `${copy.category}: ${query.category}`, clear: () => applyFilters({ category: "" }) });

  function applyFilters(overrides?: Partial<{ q: string; age: string; area: string; category: string }>) {
    const next = {
      q: overrides?.q !== undefined ? overrides.q : q,
      age: overrides?.age !== undefined ? overrides.age : age,
      area: overrides?.area !== undefined ? overrides.area : area,
      category: overrides?.category !== undefined ? overrides.category : category,
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
    applyFilters();
  }

  function resetAll() {
    setQ("");
    setAge("");
    setArea("");
    setCategory("");
    setSheetOpen(false);
    router.push(actionPath);
  }

  return (
    <section className="explore-filter-wrap" aria-label={copy.exploreActivities}>
      <form className="panel live-filters" onSubmit={handleSubmit} action={actionPath}>
        <label>
          {copy.activity}
          <input
            name="q"
            type="search"
            placeholder={copy.searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="desktop-filter-field">
          {copy.childAge}
          <select name="age" value={age} onChange={(e) => setAge(e.target.value)}>
            <option value="">{copy.allAges}</option>
            {Array.from({ length: 18 }, (_, i) => (
              <option key={i} value={String(i)}>
                {i} {copy.years}
              </option>
            ))}
          </select>
        </label>
        <label className="desktop-filter-field">
          {copy.area}
          <input
            name="area"
            placeholder={copy.areaPlaceholder}
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </label>
        {(allCategories.length > 0 || category) && (
          <label className="desktop-filter-field">
            {copy.category}
            <select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{copy.allActivities}</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        <div className="filter-submit-row">
          <button
            type="button"
            className="btn outline mobile-filter-trigger"
            onClick={() => setSheetOpen(true)}
            aria-expanded={sheetOpen}
          >
            {locale === "ar" ? "تصفية" : "Filters"}
            {activeFilters.length > 0 && (
              <span className="filter-count-pill">{activeFilters.length}</span>
            )}
          </button>
          <button type="submit" className="btn">
            {copy.exploreActivities}
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
                onClick={resetAll}
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
            if (e.target === e.currentTarget) setSheetOpen(false);
          }}
        >
          <div className="filter-sheet">
            <div className="filter-sheet-head">
              <h2>{locale === "ar" ? "تصفية النتائج" : "Filter programmes"}</h2>
              <button
                type="button"
                className="btn outline small"
                onClick={() => setSheetOpen(false)}
              >
                {locale === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
            <div className="form-stack">
              <label>
                {copy.childAge}
                <select value={age} onChange={(e) => setAge(e.target.value)}>
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
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </label>
              {allCategories.length > 0 && (
                <label>
                  {copy.category}
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
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
                  onClick={resetAll}
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

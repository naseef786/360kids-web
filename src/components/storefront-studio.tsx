"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, request } from "@/lib/client-api";
import {
  DEFAULT_STOREFRONT_THEME,
  parseCollections,
  parseTheme,
  type StorefrontCollection,
  type StorefrontTheme,
} from "@/lib/storefront";
import type { ContentPage } from "./service-forms";

const CATEGORIES = ["", "Sports", "Arts", "Music", "Learning", "Outdoors", "Indoor play", "STEM", "Swimming", "Nature"];

export function CollectionsStudio({
  page,
}: {
  page: ContentPage | null;
}) {
  const router = useRouter();
  const [version, setVersion] = useState(page?.version ?? 0);
  const [items, setItems] = useState<StorefrontCollection[]>(() => parseCollections(page?.body));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function addCollection() {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "Weekend STEM & Coding",
        subtitle: "Hands-on workshops for curious young builders.",
        badge: "Featured",
        tone: "aqua",
        category: "Learning",
        area: "",
        age: "",
        published: true,
      },
    ]);
  }

  function updateItem(id: string, patch: Partial<StorefrontCollection>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function saveAll() {
    setSaving(true);
    setStatus("");
    setError("");
    try {
      const saved = await request<ContentPage>("/manage/content/collections", "PUT", {
        title: "Storefront Collections",
        body: JSON.stringify(items),
        published: true,
        version,
      });
      setVersion(saved.version);
      setStatus("Collections saved and published to the storefront.");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Shopify-style Collections</h2>
          <p className="record-meta">
            Create curated activity collections with smart category, area, and age rules. Published collections appear on Home.
          </p>
        </div>
        <div className="card-actions" style={{ marginTop: 0 }}>
          <button type="button" className="btn outline small" onClick={addCollection}>
            + Add collection
          </button>
          <button type="button" className="btn small" disabled={saving} onClick={() => void saveAll()}>
            {saving ? "Saving..." : "Save & Publish"}
          </button>
        </div>
      </div>

      {status && <p className="notice success" role="status">{status}</p>}
      {error && <p className="notice error" role="alert">{error}</p>}

      {!items.length ? (
        <div className="empty-state">
          <p>No collections yet. Click &ldquo;+ Add collection&rdquo; to create your first curated storefront section.</p>
        </div>
      ) : (
        <div className="stack">
          {items.map((item, idx) => (
            <article key={item.id} className="panel stack">
              <div className="section-heading">
                <strong>Collection #{idx + 1}: {item.title || "Untitled"}</strong>
                <div className="card-actions" style={{ marginTop: 0 }}>
                  <label className="checkbox-row" style={{ fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      checked={item.published}
                      onChange={(e) => updateItem(item.id, { published: e.target.checked })}
                    />
                    <span>Published</span>
                  </label>
                  <button
                    type="button"
                    className="btn outline small"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  Collection title
                  <input
                    value={item.title}
                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                    maxLength={80}
                  />
                </label>
                <label>
                  Badge label
                  <input
                    value={item.badge}
                    onChange={(e) => updateItem(item.id, { badge: e.target.value })}
                    maxLength={24}
                  />
                </label>
                <label className="wide">
                  Subtitle
                  <input
                    value={item.subtitle}
                    onChange={(e) => updateItem(item.id, { subtitle: e.target.value })}
                    maxLength={160}
                  />
                </label>
                <label>
                  Card tone
                  <select
                    value={item.tone}
                    onChange={(e) => updateItem(item.id, { tone: e.target.value as StorefrontCollection["tone"] })}
                  >
                    <option value="aqua">Teal / Aqua</option>
                    <option value="pink">Pastel Pink</option>
                    <option value="cream">Warm Cream</option>
                  </select>
                </label>
                <label>
                  Category rule
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(item.id, { category: e.target.value })}
                  >
                    <option value="">Any category</option>
                    {CATEGORIES.filter(Boolean).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Area rule (optional)
                  <input
                    value={item.area}
                    placeholder="e.g. Dubai Marina"
                    onChange={(e) => updateItem(item.id, { area: e.target.value })}
                  />
                </label>
                <label>
                  Child age rule (optional)
                  <input
                    type="number"
                    min={0}
                    max={17}
                    value={item.age}
                    placeholder="Any age"
                    onChange={(e) => updateItem(item.id, { age: e.target.value })}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThemeCustomizer({
  page,
}: {
  page: ContentPage | null;
}) {
  const router = useRouter();
  const [version, setVersion] = useState(page?.version ?? 0);
  const [theme, setTheme] = useState<StorefrontTheme>(() => parseTheme(page?.body));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function saveTheme() {
    setSaving(true);
    setStatus("");
    setError("");
    try {
      const saved = await request<ContentPage>("/manage/content/theme", "PUT", {
        title: "Storefront Theme",
        body: JSON.stringify(theme),
        published: true,
        version,
      });
      setVersion(saved.version);
      setStatus("Storefront design saved and published.");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Storefront Design Customizer</h2>
          <p className="record-meta">
            Customize announcement banner, hero messaging, color preset, and card density while keeping the 360 Kids brand system.
          </p>
        </div>
        <div className="card-actions" style={{ marginTop: 0 }}>
          <button
            type="button"
            className="btn outline small"
            onClick={() => setTheme(DEFAULT_STOREFRONT_THEME)}
          >
            Reset defaults
          </button>
          <button type="button" className="btn small" disabled={saving} onClick={() => void saveTheme()}>
            {saving ? "Saving..." : "Save & Publish"}
          </button>
        </div>
      </div>

      {status && <p className="notice success" role="status">{status}</p>}
      {error && <p className="notice error" role="alert">{error}</p>}

      <div className="form-grid">
        <label className="wide">
          Top announcement banner (leave blank to hide)
          <input
            value={theme.announcement}
            placeholder="e.g. Winter Term 2026 bookings now open across Dubai!"
            onChange={(e) => setTheme({ ...theme, announcement: e.target.value })}
            maxLength={140}
          />
        </label>
        <label>
          Hero eyebrow
          <input
            value={theme.heroEyebrow}
            placeholder="Default: DUBAI FAMILY MARKETPLACE"
            onChange={(e) => setTheme({ ...theme, heroEyebrow: e.target.value })}
            maxLength={60}
          />
        </label>
        <label>
          Color accent preset
          <select
            value={theme.preset}
            onChange={(e) => setTheme({ ...theme, preset: e.target.value as StorefrontTheme["preset"] })}
          >
            <option value="default">360 Kids Classic (Warm Cream + Teal + Orange)</option>
            <option value="sunset">Warm Sunset (Golden Apricot + Coral)</option>
            <option value="lagoon">Dubai Lagoon (Crisp Aqua + Deep Teal)</option>
          </select>
        </label>
        <label className="wide">
          Hero headline override
          <input
            value={theme.heroTitle}
            placeholder="Leave blank to use default localized headline"
            onChange={(e) => setTheme({ ...theme, heroTitle: e.target.value })}
            maxLength={120}
          />
        </label>
        <label className="wide">
          Hero subtitle override
          <textarea
            value={theme.heroText}
            placeholder="Leave blank to use default localized subtitle"
            onChange={(e) => setTheme({ ...theme, heroText: e.target.value })}
            maxLength={320}
          />
        </label>
        <label>
          Activity card density
          <select
            value={theme.cardDensity}
            onChange={(e) => setTheme({ ...theme, cardDensity: e.target.value as StorefrontTheme["cardDensity"] })}
          >
            <option value="comfortable">Comfortable (Recommended)</option>
            <option value="compact">Compact</option>
          </select>
        </label>
      </div>
    </div>
  );
}

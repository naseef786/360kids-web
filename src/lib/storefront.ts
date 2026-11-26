export type StorefrontCollection = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  tone: "aqua" | "pink" | "cream";
  category: string;
  area: string;
  age: string;
  published: boolean;
};

export type StorefrontTheme = {
  announcement: string;
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  preset: "default" | "sunset" | "lagoon";
  cardDensity: "comfortable" | "compact";
};

export const DEFAULT_STOREFRONT_THEME: StorefrontTheme = {
  announcement: "",
  heroEyebrow: "",
  heroTitle: "",
  heroText: "",
  preset: "default",
  cardDensity: "comfortable",
};

export const DEFAULT_COLLECTIONS: StorefrontCollection[] = [
  {
    id: "default-stem",
    title: "STEM & Future Builders",
    subtitle: "Robotics, coding & hands-on discovery",
    badge: "Popular",
    tone: "aqua",
    category: "Learning",
    area: "",
    age: "",
    published: true,
  },
  {
    id: "default-sports",
    title: "Active Kids & Swimming",
    subtitle: "High-energy sports & water confidence",
    badge: "Trending",
    tone: "cream",
    category: "Sports",
    area: "",
    age: "",
    published: true,
  },
  {
    id: "default-arts",
    title: "Creative Arts & Music",
    subtitle: "Painting, rhythm & imaginative play",
    badge: "Studio",
    tone: "pink",
    category: "Arts",
    area: "",
    age: "",
    published: true,
  },
  {
    id: "default-outdoors",
    title: "Outdoors & Nature",
    subtitle: "Fresh-air adventures across Dubai",
    badge: "Weekend",
    tone: "aqua",
    category: "Outdoors",
    area: "",
    age: "",
    published: true,
  },
];

export function parseCollections(raw: string | undefined | null): StorefrontCollection[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        id: typeof item.id === "string" && item.id ? item.id : crypto.randomUUID(),
        title: typeof item.title === "string" ? item.title : "Curated Collection",
        subtitle: typeof item.subtitle === "string" ? item.subtitle : "",
        badge: typeof item.badge === "string" ? item.badge : "Featured",
        tone: item.tone === "pink" || item.tone === "cream" ? item.tone : "aqua",
        category: typeof item.category === "string" ? item.category : "",
        area: typeof item.area === "string" ? item.area : "",
        age: typeof item.age === "string" ? item.age : "",
        published: item.published !== false,
      }));
  } catch {
    return [];
  }
}

export function parseTheme(raw: string | undefined | null): StorefrontTheme {
  if (!raw) return DEFAULT_STOREFRONT_THEME;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return DEFAULT_STOREFRONT_THEME;
    const obj = data as Record<string, unknown>;
    return {
      announcement: typeof obj.announcement === "string" ? obj.announcement : "",
      heroEyebrow: typeof obj.heroEyebrow === "string" ? obj.heroEyebrow : "",
      heroTitle: typeof obj.heroTitle === "string" ? obj.heroTitle : "",
      heroText: typeof obj.heroText === "string" ? obj.heroText : "",
      preset: obj.preset === "sunset" || obj.preset === "lagoon" ? obj.preset : "default",
      cardDensity: obj.cardDensity === "compact" ? "compact" : "comfortable",
    };
  } catch {
    return DEFAULT_STOREFRONT_THEME;
  }
}

export function collectionHref(c: StorefrontCollection): string {
  const params = new URLSearchParams();
  if (c.category) params.set("category", c.category);
  if (c.area) params.set("area", c.area);
  if (c.age) params.set("age", c.age);
  const qs = params.toString();
  return qs ? `/parent/activities?${qs}` : "/parent/activities";
}

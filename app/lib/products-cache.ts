import { unstable_cache } from "next/cache";

const BACKEND = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

// ─── Products ────────────────────────────────────────────────────────────────
// revalidate: false (permanent static cache, updated on-demand only when admin edits)
export const getCachedProducts = unstable_cache(
  async () => {
    try {
      const res = await fetch(`${BACKEND}/api/products`, { cache: "no-store" });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },
  ["all-products"],
  { revalidate: false, tags: ["products"] }
);

// ─── Hero Banners ─────────────────────────────────────────────────────────────
export const getCachedBanners = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const res = await fetch(`${BACKEND}/api/admin/banners`, { cache: "no-store" });
      if (!res.ok) return [];
      const data: { url: string }[] = await res.json();
      return Array.isArray(data)
        ? data.map((b) => (b.url.startsWith("http") ? b.url : `${BACKEND}${b.url}`))
        : [];
    } catch {
      return [];
    }
  },
  ["hero-banners"],
  { revalidate: false, tags: ["banners"] }
);

// ─── Home Config (settings + max) ────────────────────────────────────────────
export const getCachedHomeConfig = unstable_cache(
  async () => {
    try {
      const [settingsRes, maxRes] = await Promise.all([
        fetch(`${BACKEND}/api/admin/sub-categories/home-settings`, { cache: "no-store" }),
        fetch(`${BACKEND}/api/admin/sub-categories/max`, { cache: "no-store" }),
      ]);
      const settings = settingsRes.ok ? await settingsRes.json() : [];
      const { max = 4 } = maxRes.ok ? await maxRes.json() : {};
      return { settings, max };
    } catch {
      return { settings: [], max: 4 };
    }
  },
  ["home-config"],
  { revalidate: false, tags: ["home-settings"] }
);

// ─── Category Banners Bulk ────────────────────────────────────────────────────
export const getCachedBannerMap = unstable_cache(
  async (categoriesKey: string): Promise<Record<string, string[]>> => {
    if (!categoriesKey) return {};
    try {
      const res = await fetch(
        `${BACKEND}/api/admin/category-banners-bulk?categories=${encodeURIComponent(categoriesKey)}`,
        { cache: "no-store" }
      );
      return res.ok ? res.json() : {};
    } catch {
      return {};
    }
  },
  ["category-banners-bulk"],
  { revalidate: false, tags: ["category-banners"] }
);

// ─── Company ──────────────────────────────────────────────────────────────────
export const getCachedCompany = unstable_cache(
  async () => {
    try {
      const res = await fetch(`${BACKEND}/api/admin/company`, { cache: "no-store" });
      return res.ok ? res.json() : {};
    } catch {
      return {};
    }
  },
  ["company"],
  { revalidate: false, tags: ["company"] }
);

// ─── Sub-categories Public ────────────────────────────────────────────────────
export const getCachedSubCategoriesPublic = unstable_cache(
  async () => {
    try {
      const res = await fetch(`${BACKEND}/api/admin/sub-categories/public`, { cache: "no-store" });
      return res.ok ? res.json() : [];
    } catch {
      return [];
    }
  },
  ["sub-categories-public"],
  { revalidate: false, tags: ["products"] }
);

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const getCachedReviews = unstable_cache(
  async () => {
    try {
      const res = await fetch(`${BACKEND}/api/admin/reviews`, { cache: "no-store" });
      return res.ok ? res.json() : [];
    } catch {
      return [];
    }
  },
  ["reviews"],
  { revalidate: false, tags: ["reviews"] }
);

// ─── Single product (for product detail page) ────────────────────────────────
// Always fetches full data with ?full=1 to bypass the card projection
export const getCachedProduct = (id: string) =>
  unstable_cache(
    async () => {
      try {
        const cleanId = encodeURIComponent(String(id || "").trim());
        const res = await fetch(`${BACKEND}/api/products/${cleanId}?full=1`, {
          cache: "no-store",
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) {
          if (res.status === 404) return null;
          throw new Error(`Upstream error ${res.status}`);
        }
        return res.json();
      } catch (err: any) {
        if (err?.message?.includes("Upstream error 404")) return null;
        // Don't cache transient network/timeout errors!
        throw err;
      }
    },
    [`product-${id}`],
    { revalidate: false, tags: ["products"] }
  )();

// ─── Search (uses cached products, no extra DB hit) ──────────────────────────
export async function searchCachedProducts(q: string, brand?: string) {
  const products: Record<string, string>[] = await getCachedProducts();
  const query = q.toLowerCase();
  return products.filter((p) => {
    const matchQ =
      !q ||
      p.name?.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query);
    const matchBrand = !brand || p.brand?.toLowerCase() === brand.toLowerCase();
    return matchQ && matchBrand;
  });
}

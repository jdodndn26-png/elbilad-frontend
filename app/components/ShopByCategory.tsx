import CategorySlider from "./CategorySlider";
import { getCachedSubCategoriesPublic } from "../lib/products-cache";
import { resolveHref } from "../lib/resolveHref";

type Category = { name: string; count: number; image: string };
type Setting = { category: string; subCategory: string; showInHome: boolean; order: number };
type HomeConfig = { settings: Setting[]; max: number };

const COMING_SOON_CARDS = [
  {
    name: "ايفون 18 برو ماكس",
    count: 0,
    image: "/8435e6ba-7c1d-4fc7-98fa-0193c4db8529.jpg",
    href: "/smartphones/iphone-18-pro-max",
    comingSoon: true,
  },
  {
    name: "ايفون 18 برو",
    count: 0,
    image: "/8435e6ba-7c1d-4fc7-98fa-0193c4db8529.jpg",
    href: "/smartphones/iphone-18-pro",
    comingSoon: true,
  },
  {
    name: "ايفون 18 دو",
    count: 0,
    image: "https://res.cloudinary.com/dllmx2yf3/image/upload/v1789347106/5b3e6b54-5d81-4779-bf50-b785d673956a_de1evw.webp",
    href: "/smartphones/iphone-18-duo",
    comingSoon: true,
  },
];

export default async function ShopByCategory({
  homeConfig,
}: {
  homeConfig: HomeConfig;
  categories: string[];
}) {
  const allCats: Category[] = await getCachedSubCategoriesPublic();

  if (!allCats.length) return null;

  const { settings } = homeConfig;
  const orderMap = new Map(
    settings.filter((s) => s.showInHome).map((s) => [s.category, s.order])
  );

  const sorted = [...allCats].sort((a, b) => {
    const aHome = orderMap.has(a.name);
    const bHome = orderMap.has(b.name);
    if (aHome && !bHome) return -1;
    if (!aHome && bHome) return 1;
    if (aHome && bHome)
      return (orderMap.get(a.name) ?? 0) - (orderMap.get(b.name) ?? 0);
    return 0;
  });

  const comingSoonHrefs = new Set(COMING_SOON_CARDS.map((c) => c.href));

  const categoriesWithHref = [
    ...COMING_SOON_CARDS,
    ...sorted
      .map((cat) => ({ ...cat, href: resolveHref(cat.name) }))
      .filter((cat) => !comingSoonHrefs.has(cat.href)),
  ];

  return (
    <section className="w-full" dir="rtl">
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a2e38 0%, #155E6F 50%, #1F7A8C 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6DBE00, transparent)" }} />
        <div className="absolute -bottom-10 right-10 w-52 h-52 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6DBE00, transparent)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #6DBE00, #4fa800)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
                <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[#6DBE00] text-xs font-bold uppercase tracking-widest leading-none mb-1">
                تسوق الآن
              </p>
              <h2 className="text-white text-xl sm:text-2xl font-extrabold leading-tight">
                تسوق حسب الأقسام
              </h2>
            </div>
          </div>

          {/* Right accent */}
          <div className="flex flex-col gap-1 items-end">
            <div className="h-2 w-16 rounded-full" style={{ background: "linear-gradient(90deg, #6DBE00, #4fa800)" }} />
            <div className="h-1 w-10 rounded-full opacity-50" style={{ background: "#6DBE00" }} />
            <div className="h-1 w-6 rounded-full opacity-30" style={{ background: "#6DBE00" }} />
          </div>
        </div>
      </div>

      {/* Slider area */}
      <div
        style={{
          background: "linear-gradient(180deg, #d4ece8 0%, #edf7f5 60%, #f5fbf9 100%)",
        }}
        className="px-3 sm:px-5 lg:px-6 py-5 sm:py-7"
      >
        <div className="max-w-7xl mx-auto">
          <CategorySlider categories={categoriesWithHref} />
        </div>
      </div>
    </section>
  );
}

export interface SlugConfig {
  label: string;
  parentLabel: string;
  parentHref: string;
  filters: {
    brand?: string;
    category?: string;
    nameIncludes?: string[];
  };
}

export const slugConfigs: Record<string, SlugConfig> = {
  // ─── Smartphones ───────────────────────────────────────────
  "iphone-13-pro-max": {
    label: "آيفون 13 برو ماكس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { nameIncludes: ["13", "١٣"] },
  },
  "iphone-14-pro-max": {
    label: "آيفون 14 برو ماكس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 14 برو ماكس", nameIncludes: ["14 برو ماكس", "14 Pro Max"] },
  },
  "iphone-14-pro": {
    label: "آيفون 14 برو",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 14 برو", nameIncludes: ["14 برو", "14 Pro"] },
  },
  "iphone-14-plus": {
    label: "آيفون 14 بلس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 14 بلس", nameIncludes: ["14 بلس", "14 Plus"] },
  },
  "iphone-14": {
    label: "آيفون 14 عادي",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 14", nameIncludes: ["ايفون 14", "آيفون 14", "iPhone 14"] },
  },
  "iphone-15-pro-max": {
    label: "آيفون 15 برو ماكس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 15 برو ماكس", nameIncludes: ["15 برو ماكس", "15 Pro Max"] },
  },
  "iphone-15-pro": {
    label: "آيفون 15 برو",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { brand: "Apple", nameIncludes: ["15 Pro", "15 pro", "15 برو"] },
  },
  "iphone-15-plus": {
    label: "آيفون 15 بلس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 15 بلس", nameIncludes: ["15 بلس", "15 Plus"] },
  },
  "iphone-15": {
    label: "آيفون 15 عادي",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 15", nameIncludes: ["ايفون 15", "آيفون 15", "iPhone 15"] },
  },
  "iphone-16-pro-max": {
    label: "ابل ايفون 16 برو ماكس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 16 برو ماكس", nameIncludes: ["16 برو ماكس", "16 Pro Max"] },
  },
  "iphone-16-pro": {
    label: "ابل ايفون 16 برو",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ايفون 16 برو", nameIncludes: ["16 برو", "16 Pro"] },
  },
  "iphone-16-plus": {
    label: "ابل ايفون 16 بلس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ايفون 16 بلس", nameIncludes: ["16 بلس", "16 Plus"] },
  },
  "iphone-16": {
    label: "ابل ايفون 16 عادي",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ايفون 16", nameIncludes: ["ايفون 16", "آيفون 16", "iPhone 16"] },
  },
  "iphone-17-pro-max": {
    label: "ابل ايفون 17 برو ماكس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 17 برو ماكس", nameIncludes: ["17 برو ماكس", "17 Pro Max"] },
  },
  "iphone-17-pro": {
    label: "ابل ايفون 17 برو",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 17 برو", nameIncludes: ["17 برو", "17 Pro"] },
  },
  "iphone-17": {
    label: "ابل ايفون 17 عادي",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 17", nameIncludes: ["ايفون 17", "آيفون 17", "iPhone 17"] },
  },
  "iphone-17-air": {
    label: "ابل ايفون 17 Air",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 17 اير", nameIncludes: ["اير", "Air"] },
  },
  "iphone-18-pro-max": {
    label: "ايفون 18 برو ماكس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { nameIncludes: ["ايفون 18 برو ماكس", "18 pro max", "18 Pro Max"] },
  },
  "iphone-18-pro": {
    label: "ايفون 18 برو",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { nameIncludes: ["ايفون 18 برو", "18 pro", "18 Pro"] },
  },
  "iphone-18-duo": {
    label: "ايفون 18 دو",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { nameIncludes: ["ايفون 18 دو", "18 duo", "18 Duo"] },
  },
  "apple-only": {
    label: "فقط آبل",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { brand: "Apple" },
  },
  "samsung-s22-ultra": {
    label: "سامسونج جالكسي اس 22 الترا",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { brand: "Samsung", nameIncludes: ["s22", "S22", "اس 22", "جالكسي 22", "جالاكسي 22", "galaxy s22"] },
  },
  "samsung-s23-ultra": {
    label: "سامسونج جالكسي اس 23 الترا",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { brand: "Samsung", nameIncludes: ["s23", "S23", "اس 23", "جالكسي 23", "جالاكسي 23", "galaxy s23"] },
  },
  "samsung-s24-ultra": {
    label: "سامسونج جالكسي اس 24 الترا",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { brand: "Samsung", nameIncludes: ["s24", "S24", "اس 24", "جالكسي 24", "جالاكسي 24", "galaxy s24"] },
  },
  "samsung-s25": {
    label: "سامسونج جالاكسي S25",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { brand: "Samsung", nameIncludes: ["s25", "S25", "اس 25", "جالكسي 25", "galaxy s25"] },
  },
  "samsung-s25-ultra": {
    label: "سامسونج جالاكسي S25 الترا",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "سامسونج جالاكسي S25", nameIncludes: ["S25", "اس 25"] },
  },
  "samsung-s26-ultra": {
    label: "سامسونج جالاكسي S26",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { brand: "Samsung", nameIncludes: ["s26", "S26", "اس 26", "جالكسي 26", "galaxy s26"] },
  },

  // ─── Apple Watches ─────────────────────────────────────────
  se: {
    label: "ساعات ابل",
    parentLabel: "ساعات ابل",
    parentHref: "/apple-watches",
    filters: { category: "ساعات ابل", nameIncludes: ["ساعة", "watch", "ابل"] },
  },

  // ─── Smart Watches ─────────────────────────────────────────
  "smart-watches": {
    label: "الساعات الذكية",
    parentLabel: "الساعات الذكية",
    parentHref: "/smart-watches",
    filters: { category: "ساعات ابل", nameIncludes: ["ساعة", "watch", "ساعات", "ابل"] },
  },

  // ─── Audio ─────────────────────────────────────────────────
  "airpods-pro": {
    label: "سماعات أبل",
    parentLabel: "أجهزة صوت و سماعات",
    parentHref: "/audio",
    filters: { category: "سماعات", nameIncludes: ["AirPods", "ابل", "برو", "ايربودز"] },
  },
  "airpods-max": {
    label: "سماعات سبيكر",
    parentLabel: "أجهزة صوت و سماعات",
    parentHref: "/audio",
    filters: { category: "سماعات", nameIncludes: ["ماكس", "رأس", "فاخرة", "speaker"] },
  },
  "samsung-buds": {
    label: "سماعات متنوعة",
    parentLabel: "أجهزة صوت و سماعات",
    parentHref: "/audio",
    filters: { category: "سماعات" },
  },

  // ─── PlayStation ───────────────────────────────────────────
  ps5: {
    label: "بلاي ستيشن 5",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "PS5", nameIncludes: ["5", "ps5", "بلايستيشن 5", "سليم"] },
  },
  "ps5-slim": {
    label: "بلاي ستيشن 4",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "بلاستيشن وملحقاته", nameIncludes: ["سليم", "slim", "ستاند", "قاعدة", "4", "ps4"] },
  },
  "xbox-one": {
    label: "أكس بوكس ون",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "بلاستيشن وملحقاته", nameIncludes: ["اكس بوكس", "xbox", "شاشة", "محمولة"] },
  },
  controllers: {
    label: "يد تحكم",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "بلاستيشن وملحقاته", nameIncludes: ["تحكم", "دوال", "يد", "controller"] },
  },
  "ps-accessories": {
    label: "ملحقات بلاي ستيشن",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "بلاستيشن وملحقاته" },
  },
  accessories: {
    label: "ملحقات بلاي ستيشن",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "بلاستيشن وملحقاته" },
  },

  // ─── Laptops ───────────────────────────────────────────────
  "macbook-pro": {
    label: "لابتوبات أبل",
    parentLabel: "لابتوبات وشاشات",
    parentHref: "/laptops",
    filters: { nameIncludes: ["ماك", "macbook", "اير", "إير", "برو"] },
  },
  "macbook-air": {
    label: "ماك بوك اير",
    parentLabel: "لابتوبات وشاشات",
    parentHref: "/laptops",
    filters: { category: "ماك بوك إير", nameIncludes: ["ماك", "macbook", "اير", "إير"] },
  },
  "samsung-monitors": {
    label: "شاشات سامسونج",
    parentLabel: "لابتوبات وشاشات",
    parentHref: "/laptops",
    filters: { category: "monitor", nameIncludes: ["شاش", "monitor"] },
  },

  // ─── Tablets ───────────────────────────────────────────────
  "ipad-pro": {
    label: "أبل",
    parentLabel: "الاجهزة اللوحية ايبادات",
    parentHref: "/tablets",
    filters: { category: "tablet", nameIncludes: ["ايباد", "آيباد", "ipad", "لوحي"] },
  },
  "ipad-air": {
    label: "ايبادات ابل",
    parentLabel: "الاجهزة اللوحية ايبادات",
    parentHref: "/tablets",
    filters: { brand: "Apple", nameIncludes: ["ipad air", "ايباد اير", "آيباد إير", "آيباد اير", "آيباد", "ايباد"] },
  },

  // ─── Accessories ───────────────────────────────────────────
  "anker-batteries": {
    label: "بطاريات متنقلة",
    parentLabel: "بطاريات متنقلة وكيابل",
    parentHref: "/accessories",
    filters: { category: "بطاريات متنقله", nameIncludes: ["بطار", "شاحن", "كيبل", "سلك"] },
  },

  // ─── Games ─────────────────────────────────────────────────
  "ps5-games": {
    label: "ألعاب الفيديو",
    parentLabel: "ألعاب الفيديو",
    parentHref: "/games",
    filters: { nameIncludes: ["لعبة", "العاب", "ألعاب", "game", "اف سي", "سبورتس", "قيادة", "بطاقة"] },
  },
  "mice-keyboards": {
    label: "ماوسات وكيبوردات ألعاب",
    parentLabel: "ألعاب الفيديو",
    parentHref: "/games",
    filters: { nameIncludes: ["ماوس", "كيبورد", "لوحة", "فارة", "عجلة", "قيادة"] },
  },
  microphones: {
    label: "مايكروفونات",
    parentLabel: "ألعاب الفيديو",
    parentHref: "/games",
    filters: { nameIncludes: ["مايك", "ميكروفون", "سماعة"] },
  },
  figures: {
    label: "مجسمات وفيقرز",
    parentLabel: "ألعاب الفيديو",
    parentHref: "/games",
    filters: { nameIncludes: ["مجسم", "فيقرز", "figure", "اكسسوار"] },
  },
  "rgb-lighting": {
    label: "اضاءات RGB",
    parentLabel: "ألعاب الفيديو",
    parentHref: "/games",
    filters: { nameIncludes: ["اضاءة", "إضاءة", "لايت", "light", "rgb"] },
  },
};

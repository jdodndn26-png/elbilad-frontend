import type { Metadata } from "next";
import AppleWatchesClient from "../apple-watches/AppleWatchesClient";
import { getCachedProducts, getCachedCompany } from "../../lib/products-cache";

export const revalidate = false;

const SITE_URL = "https://www.albiladksa.com";

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCachedCompany();
  const siteName = company.nameAr || "مؤسسة البلاد الحديثة للإلكترونيات";
  const title = `الساعات الذكية | ${siteName}`;
  const description = `تسوق أحدث الساعات الذكية بأفضل الأسعار وبالأقساط المريحة في ${siteName}. Apple Watch وأكثر.`;

  return {
    title,
    description,
    keywords: ["ساعات ذكية", "Apple Watch", "أبل ووتش", "أقساط", "السعودية", siteName],
    openGraph: {
      type: "website",
      url: `${SITE_URL}/smart-watches`,
      title,
      description,
      siteName,
      locale: "ar_SA",
    },
    alternates: { canonical: `${SITE_URL}/smart-watches` },
  };
}

export default async function SmartWatchesPage() {
  const products = await getCachedProducts();
  return <AppleWatchesClient initialProducts={products} />;
}

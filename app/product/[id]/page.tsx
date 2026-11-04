import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPageClient from "./ProductPageClient";
import { getCachedProduct, getCachedCompany, getCachedProducts } from "../../lib/products-cache";

export const revalidate = false;

const BACKEND = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const SITE_URL = "https://www.albiladksa.com";

async function fetchProductWithFallback(id: string) {
  const decoded = decodeURIComponent(id || "").trim();
  if (!decoded) return null;

  // 1. Try cache
  try {
    const cached = await getCachedProduct(decoded);
    if (cached && cached._id) return cached;
  } catch {
    // transient cache error or timeout, continue to direct fetch
  }

  // 2. Direct fetch with timeout
  try {
    const res = await fetch(`${BACKEND}/api/products/${encodeURIComponent(decoded)}?full=1`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data._id) return data;
    }
  } catch {
    // continue to all-products search
  }

  // 3. Fallback: match by name or slug from all products
  try {
    const allProducts = await getCachedProducts();
    const cleanQuery = decoded.replace(/[-_]+/g, " ").toLowerCase();

    const match = allProducts.find((p: any) => {
      if (p._id === decoded) return true;
      const name = (p.name || "").toLowerCase();
      if (name === decoded.toLowerCase() || name === cleanQuery) return true;
      const slug = name.replace(/[^\w\u0600-\u06FF]+/g, "-");
      if (slug === decoded.toLowerCase()) return true;
      return false;
    });

    if (match?._id) {
      try {
        const fullRes = await fetch(`${BACKEND}/api/products/${match._id}?full=1`, {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        if (fullRes.ok) return await fullRes.json();
      } catch {}
      return match;
    }
  } catch {}

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const [product, company] = await Promise.all([
    fetchProductWithFallback(id),
    getCachedCompany().catch(() => ({})),
  ]);

  if (!product) {
    return { title: "المنتج غير موجود" };
  }

  const siteName = company?.nameAr || "مؤسسة البلاد الحديثة للإلكترونيات";
  const title = product.name;

  const parts: string[] = [];
  if (product.brand) parts.push(product.brand);
  if (product.storage) parts.push(product.storage);
  if (product.color) parts.push(product.color);
  if (product.salePrice || product.price) {
    const price = product.salePrice || product.price;
    parts.push(`${price} ريال`);
  }
  if (product.installment?.available) parts.push("بالأقساط الميسرة");

  const description = product.description
    ? product.description.slice(0, 160)
    : `${title}${parts.length ? " - " + parts.join(" | ") : ""} - متوفر الآن مع الضمان والأقساط في ${siteName}.`;

  const rawImg = product.images?.[0] || product.image || "";
  const imageUrl = rawImg.startsWith("http") ? rawImg : rawImg ? `${BACKEND}${rawImg}` : "";

  return {
    title: `${title} | ${siteName}`,
    description,
    keywords: [
      product.name,
      product.brand || "",
      product.category || "",
      "أقساط", "شراء", "السعودية", siteName,
    ].filter(Boolean),
    openGraph: {
      type: "website",
      url: `${SITE_URL}/product/${encodeURIComponent(id)}`,
      title: `${title} | ${siteName}`,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: title }] : [],
      siteName,
      locale: "ar_SA",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/product/${encodeURIComponent(id)}`,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, company] = await Promise.all([
    fetchProductWithFallback(id),
    getCachedCompany().catch(() => ({})),
  ]);

  if (!product) {
    notFound();
  }

  const siteName = company?.nameAr || "مؤسسة البلاد الحديثة للإلكترونيات";
  const price = product.salePrice || product.price || 0;
  const rawImg = product.images?.[0] || product.image || "";
  const imageUrl = rawImg.startsWith("http") ? rawImg : rawImg ? `${BACKEND}${rawImg}` : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: imageUrl,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${encodeURIComponent(id)}`,
      priceCurrency: "SAR",
      price: price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: siteName },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageClient id={id} initialProduct={product} />
    </>
  );
}

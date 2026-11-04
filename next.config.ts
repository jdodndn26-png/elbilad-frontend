import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/products/:id*",
        destination: "/product/:id*",
        permanent: true,
      },
      {
        source: "/categories/:slug*",
        destination: "/:slug*",
        permanent: true,
      },
      {
        source: "/smartphones/iphone-18",
        destination: "/smartphones/iphone-18-pro-max",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/sitemap.xml", destination: "/sitemap.xml" },
        { source: "/robots.txt", destination: "/robots.txt" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 1080, 1200],
    imageSizes: [32, 64, 128, 256],
    minimumCacheTTL: 2592000, // 30 days cache for optimized images
    remotePatterns: [
      { hostname: "ibb.co" },
      { hostname: "i.ibb.co" },
      { protocol: "https", hostname: "www.albiladksa.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;

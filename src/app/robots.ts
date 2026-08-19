import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/api",
        "/r",
        "/p",
        "/auth",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

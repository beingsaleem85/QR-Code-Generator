import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

const ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/qr-generator", priority: 0.9, changeFrequency: "weekly" },
  { path: "/qr-types", priority: 0.8, changeFrequency: "monthly" },
  { path: "/features", priority: 0.8, changeFrequency: "monthly" },
  { path: "/static-qr", priority: 0.6, changeFrequency: "monthly" },
  { path: "/dynamic-qr", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

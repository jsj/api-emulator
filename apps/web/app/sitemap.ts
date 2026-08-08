import type { MetadataRoute } from "next";
import { PAGE_TITLES } from "@/lib/page-titles";

const ORIGIN = "https://api-emulator.jsj.sh";

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = Object.keys(PAGE_TITLES)
    .filter(Boolean)
    .map((slug) => ({
      url: `${ORIGIN}/docs/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [
    {
      url: ORIGIN,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${ORIGIN}/docs`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...docs,
  ];
}

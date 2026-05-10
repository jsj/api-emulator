import type { Metadata } from "next";
import { PAGE_TITLES } from "./page-titles";

const DESCRIPTION = "Local API emulators you can run, share, and extend with plugins.";

export function pageMetadata(slug: string): Metadata {
  const title = PAGE_TITLES[slug];
  if (!title) return {};

  const displayTitle = title.replace(/\n/g, " ");
  const fullTitle = `${displayTitle} | api-emulator`;
  const ogImageUrl = slug ? `/og/${slug}` : "/og";

  return {
    title: displayTitle,
    description: DESCRIPTION,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "api-emulator",
      title: fullTitle,
      description: DESCRIPTION,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayTitle} - api-emulator`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: DESCRIPTION,
      images: [ogImageUrl],
    },
  };
}

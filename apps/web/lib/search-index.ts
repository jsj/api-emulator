import { allDocsPages } from "./docs-navigation";

export type IndexEntry = {
  title: string;
  href: string;
  content: string;
};

let cached: IndexEntry[] | null = null;

export async function getSearchIndex(): Promise<IndexEntry[]> {
  if (cached) return cached;

  const entries: IndexEntry[] = [];

  for (const item of allDocsPages) {
    entries.push({
      title: item.name,
      href: item.href,
      content: `${item.name} ${item.href.replaceAll("/", " ")}`,
    });
  }

  cached = entries;
  return entries;
}

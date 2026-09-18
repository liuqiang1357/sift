import type { SourceItem } from "./data.ts";

// Only compare complete text. Summaries, short snippets and media need review.
function bodyKey(item: SourceItem): string | undefined {
  if (
    !item.body?.length ||
    item.cover ||
    item.body.some((section) => section.media?.length)
  )
    return;
  const text = item.body
    .flatMap((section) => [section.heading, ...section.paragraphs])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length >= 120 ? text : undefined;
}

// Run once on ingestion. Existing links (or null for a reviewed non-match) win.
// The target is a matching publication, not a claim of original authorship.
export function linkExactDuplicates(records: SourceItem[]): SourceItem[] {
  const representatives = new Map<string, string>();
  const linked = new Map<string, SourceItem>();
  const ordered = [...records].sort(
    (a, b) =>
      Date.parse(a.receivedAt) - Date.parse(b.receivedAt) ||
      a.id.localeCompare(b.id),
  );
  for (const item of ordered) {
    const key = bodyKey(item);
    if (!key || item.duplicateOf !== undefined || item.supersedes) {
      linked.set(item.id, item);
      continue;
    }
    const representative = representatives.get(key);
    linked.set(
      item.id,
      representative ? { ...item, duplicateOf: representative } : item,
    );
    if (!representative) representatives.set(key, item.id);
  }
  return records.map((item) => linked.get(item.id)!);
}

// Duplicates point to an exact publication version, never through its revisions.
export function duplicateRoot(item: SourceItem, pool: SourceItem[]): string {
  const seen = new Set<string>();
  let current = item;
  while (current.duplicateOf && !seen.has(current.id)) {
    seen.add(current.id);
    const previous = pool.find(
      (candidate) => candidate.id === current.duplicateOf,
    );
    if (!previous) break;
    current = previous;
  }
  return current.id;
}

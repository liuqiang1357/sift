import { briefDrafts, legacyBriefNotes } from "./briefs.ts";
import type { BriefEdition, BriefHighlight } from "./briefs.ts";
export type { BriefEdition } from "./briefs.ts";
import { sourceItems, topics } from "./data.ts";
import type { SourceItem } from "./data.ts";
import { emptyChoices } from "./reading-choices.ts";
import type { ReadingChoices } from "./reading-choices.ts";
import { collections } from "./collections.ts";
import type {
  ContentRef,
  ContentCollection,
  CollectionVersion,
} from "./collections.ts";
import { matchesSearch } from "./i18n.ts";
import { duplicateRoot } from "./duplicates.ts";

import { demoNow, briefCutoff, demoEdition } from "./demo-scenario.ts";
export { demoNow, briefCutoff } from "./demo-scenario.ts";
export type Channel = "关注" | "推荐" | "热点";
export type ContentEntry = Pick<
  SourceItem,
  | "title"
  | "summary"
  | "topics"
  | "assets"
  | "focusAssets"
  | "importance"
  | "publishedAt"
  | "points"
  | "type"
  | "cover"
  | "note"
> & {
  ref: ContentRef;
  source?: string;
  sourceIds: string[];
  primaryIds: string[];
  mainSourceIds: string[];
  progressAt: string;
};

export const sourceTargets = (item: SourceItem) => [
  ...item.assets,
  ...item.topics,
  item.source,
];
export const refKey = (ref: ContentRef) =>
  ref.kind === "item" ? ref.id : `collection:${ref.id}:${ref.version}`;
export function parseRef(key: string): ContentRef {
  const match = key.match(/^collection:([^:]+):(\d+)$/);
  return match
    ? { kind: "collection", id: match[1], version: Number(match[2]) }
    : { kind: "item", id: key };
}

export function sourceRoot(item: SourceItem, pool = sourceItems): string {
  const seen = new Set<string>();
  let current = item;
  while (!seen.has(current.id)) {
    seen.add(current.id);
    const previous = pool.find(
      (candidate) =>
        candidate.id === current.supersedes &&
        candidate.source === current.source,
    );
    if (!previous) break;
    current = previous;
  }
  return current.id;
}
export function informationTime(item: SourceItem, pool = sourceItems): number {
  const root = duplicateRoot(item, pool);
  return Math.min(
    ...[
      item,
      ...pool.filter((candidate) => duplicateRoot(candidate, pool) === root),
    ].map((candidate) => Date.parse(candidate.publishedAt)),
  );
}
export function latestSourceVersion(item: SourceItem, pool = sourceItems) {
  const root = sourceRoot(item, pool);
  return (
    pool
      .filter(
        (candidate) =>
          candidate.source === item.source &&
          sourceRoot(candidate, pool) === root,
      )
      .sort(
        (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
      )[0] ?? item
  );
}
export function sourceVersions(item: SourceItem) {
  return sourceItems
    .filter(
      (candidate) =>
        candidate.source === item.source &&
        sourceRoot(candidate) === sourceRoot(item),
    )
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}
export function collapseSources(pool: SourceItem[], all = sourceItems) {
  // Pick an eligible representative before selecting each source's latest revision.
  // An old reprint can disappear from a list without becoming the revised original.
  const duplicates = new Map<string, SourceItem>();
  for (const item of [...pool].sort(
    (a, b) =>
      Date.parse(a.receivedAt) - Date.parse(b.receivedAt) ||
      a.id.localeCompare(b.id),
  )) {
    const key = duplicateRoot(item, all);
    if (!duplicates.has(key) || item.id === key) duplicates.set(key, item);
  }
  const groups = new Map<string, SourceItem>();
  for (const item of duplicates.values()) {
    const key = sourceRoot(item, all),
      current = groups.get(key);
    if (
      !current ||
      Date.parse(item.publishedAt) > Date.parse(current.publishedAt)
    )
      groups.set(key, item);
  }
  return [...groups.values()].sort(
    (a, b) => informationTime(b, all) - informationTime(a, all),
  );
}
export function otherPublications(
  item: SourceItem,
  at = demoNow,
  pool = sourceItems,
) {
  const available = pool.filter(
    (candidate) =>
      Date.parse(candidate.receivedAt) <= Date.parse(at) &&
      Date.parse(candidate.publishedAt) <= Date.parse(at),
  );
  const root = duplicateRoot(item, available);
  return available
    .filter(
      (candidate) =>
        candidate.id !== item.id &&
        duplicateRoot(candidate, available) === root,
    )
    .sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt));
}
export function currentVersion(collection: ContentCollection, at = demoNow) {
  return collection.versions
    .filter((version) => Date.parse(version.publishedAt) <= Date.parse(at))
    .sort((a, b) => b.version - a.version)[0];
}
export function sourceEntry(
  item: SourceItem,
  pool = sourceItems,
): ContentEntry {
  return {
    ...item,
    ref: { kind: "item", id: item.id },
    sourceIds: [item.id],
    primaryIds: [duplicateRoot(item, pool)],
    mainSourceIds: [item.id],
    progressAt: item.publishedAt,
  };
}
function entryInformationTime(entry: ContentEntry, pool = sourceItems) {
  const item =
    entry.ref.kind === "item" && pool.find((item) => item.id === entry.ref.id);
  return item ? informationTime(item, pool) : Date.parse(entry.progressAt);
}
export function collectionEntry(
  collection: ContentCollection,
  version: CollectionVersion,
): ContentEntry {
  return {
    ref: { kind: "collection", id: collection.id, version: version.version },
    title: version.title,
    summary: version.summary,
    cover: version.cover,
    topics: collection.topics,
    assets: collection.assets,
    focusAssets: collection.focusAssets,
    importance: collection.importance,
    publishedAt: version.publishedAt,
    progressAt: version.progressAt,
    points: version.points.map((point) => point.text),
    type: collection.kind === "event" ? "事件" : "专题",
    note: version.note,
    mainSourceIds: version.materials
      .filter((material) => material.role === "main")
      .map((material) => material.sourceId),
    sourceIds: version.materials.map((material) => material.sourceId),
    primaryIds: [
      ...new Set(
        version.materials
          .filter((material) => material.role === "main")
          .map((material) =>
            sourceItems.find((item) => item.id === material.sourceId),
          )
          .filter((item): item is SourceItem => !!item)
          .map((item) => duplicateRoot(item, sourceItems)),
      ),
    ],
  };
}
export function resolveEntry(ref: ContentRef): ContentEntry | undefined {
  if (ref.kind === "item") {
    const item = sourceItems.find((candidate) => candidate.id === ref.id);
    return item && sourceEntry(item);
  }
  const collection = collections.find((candidate) => candidate.id === ref.id);
  const version = collection?.versions.find(
    (candidate) => candidate.version === ref.version,
  );
  return collection && version
    ? collectionEntry(collection, version)
    : undefined;
}
export function latestEntry(entry: ContentEntry, at = demoNow): ContentEntry {
  if (entry.ref.kind === "item") {
    const item = sourceItems.find((candidate) => candidate.id === entry.ref.id);
    return item
      ? sourceEntry(
          latestSourceVersion(
            item,
            sourceItems.filter(
              (source) =>
                Date.parse(source.publishedAt) <= Date.parse(at) &&
                Date.parse(source.receivedAt) <= Date.parse(at),
            ),
          ),
        )
      : entry;
  }
  const collection = collections.find(
    (candidate) => candidate.id === entry.ref.id,
  );
  const version = collection && currentVersion(collection, at);
  return collection && version ? collectionEntry(collection, version) : entry;
}
// Only the content's own published versions count as updates.
export function entryUpdate(
  entry: ContentEntry,
  at = demoNow,
): ContentEntry | undefined {
  const latest = latestEntry(entry, at);
  if (entry.ref.kind === "item") {
    const original = sourceItems.find((item) => item.id === entry.ref.id);
    const updated = sourceItems.find((item) => item.id === latest.ref.id);
    return original &&
      updated &&
      Date.parse(updated.publishedAt) > Date.parse(original.publishedAt)
      ? latest
      : undefined;
  }
  if (
    latest.ref.kind === "collection" &&
    latest.ref.version > entry.ref.version &&
    Date.parse(latest.progressAt) > Date.parse(entry.progressAt)
  )
    return latest;
}

export function entryNote(entry: ContentEntry, at = demoNow) {
  return entry.note && Date.parse(entry.note.publishedAt) <= Date.parse(at)
    ? entry.note
    : undefined;
}

// A brief note belongs to its own text, not to its referenced material.
export function briefNote(item: BriefHighlight, at = demoNow) {
  return item.note && Date.parse(item.note.publishedAt) <= Date.parse(at)
    ? item.note
    : undefined;
}

export function hasUnreadChanges(entry: ContentEntry, history: ContentEntry[]) {
  const identity = (item: ContentEntry) => {
    if (item.ref.kind === "collection") return `collection:${item.ref.id}`;
    const source = sourceItems.find((source) => source.id === item.ref.id);
    return `item:${source ? sourceRoot(source) : item.ref.id}`;
  };
  const seen = history.filter((item) => identity(item) === identity(entry));
  return (
    seen.length > 0 &&
    seen.every(
      (item) => Date.parse(item.progressAt) < Date.parse(entry.progressAt),
    )
  );
}

export function collectionEntries(at = demoNow) {
  return collections.flatMap((collection) => {
    const version = currentVersion(collection, at);
    return version ? [collectionEntry(collection, version)] : [];
  });
}
export function relatedCollections(
  collection: ContentCollection,
  at = demoNow,
) {
  return collectionEntries(at).filter((entry) =>
    collection.related?.some((link) => link.id === entry.ref.id),
  );
}

export type ReadingContext = {
  reference?: ContentRef;
  briefId?: string;
  assetId?: string;
};
export function contextEntries(
  context: ReadingContext,
  editions: BriefEdition[],
) {
  const references = context.reference
    ? [context.reference]
    : (editions
        .find((edition) => edition.id === context.briefId)
        ?.items.flatMap((item) => item.references) ?? []);
  return references
    .filter(
      (ref, index) =>
        references.findIndex((other) => refKey(other) === refKey(ref)) ===
        index,
    )
    .map(resolveEntry)
    .filter((entry): entry is ContentEntry => !!entry);
}
export function collectionsForSource(item: SourceItem) {
  const root = sourceRoot(item);
  return collectionEntries().filter((entry) => {
    const collection = collections.find(
      (candidate) => candidate.id === entry.ref.id,
    )!;
    return collection.versions.some((version) =>
      version.materials.some((material) => {
        const source = sourceItems.find(
          (candidate) => candidate.id === material.sourceId,
        );
        return source && sourceRoot(source) === root;
      }),
    );
  });
}
function entryTargets(entry: ContentEntry) {
  if (entry.source) return [...entry.assets, ...entry.topics, entry.source];
  const sources = entry.sourceIds
    .map((id) => sourceItems.find((item) => item.id === id))
    .filter((item): item is SourceItem => !!item);
  return [
    ...entry.assets,
    ...entry.topics,
    ...sources.map((item) => item.source),
  ];
}
// Followed publishers are matched against the main material, never incidental citations.
function entryOwners(entry: ContentEntry) {
  if (entry.source) return [entry.source];
  return entry.mainSourceIds.flatMap((id) => {
    const item = sourceItems.find((item) => item.id === id);
    return item ? [item.source] : [];
  });
}
export function matchesInterest(entry: ContentEntry, id: string) {
  return topics.includes(id)
    ? entry.topics.includes(id)
    : entryTargets(entry).includes(id);
}
export function recommendationDirections(entry: ContentEntry) {
  return topics.filter((topic) => entry.topics.includes(topic));
}
function personalizationScore(
  entry: ContentEntry,
  choices: ReadingChoices,
  applyReduction = true,
) {
  if (
    applyReduction &&
    choices.deemphasized?.some((id) => matchesInterest(entry, id))
  )
    return -2;
  const owner = entryOwners(entry).find((id) => choices.sources.includes(id));
  if (owner) return 4;
  const asset =
    entry.focusAssets?.find((id) => choices.watchlist.includes(id)) ??
    entry.assets.find((id) => choices.watchlist.includes(id));
  if (asset) return entry.focusAssets?.includes(asset) ? 4 : 2;
  const interest = choices.interests.find((id) => matchesInterest(entry, id));
  return interest ? 1 : 0;
}

export type PersonalRelevance = {
  label:
    | "与你的自选相关"
    | "根据兴趣"
    | "来自你关注的来源"
    | "主要材料来自你关注的来源"
    | "重要信息"
    | "拓展视野";
  target?: string;
};

// Explain the most specific current connection, without changing ranking weights.
// References must be resolved from the displayed version, including saved briefs.
function personalRelevance(
  entries: ContentEntry[],
  choices: ReadingChoices,
): PersonalRelevance | undefined {
  const eligible = entries.filter(
    (entry) =>
      ![...choices.excluded, ...(choices.deemphasized ?? [])].some((id) =>
        matchesInterest(entry, id),
      ),
  );
  const asset =
    eligible
      .flatMap((entry) => entry.focusAssets ?? [])
      .find((id) => choices.watchlist.includes(id)) ??
    eligible
      .flatMap((entry) => entry.assets)
      .find((id) => choices.watchlist.includes(id));
  if (asset) return { label: "与你的自选相关", target: asset };
  const interest = choices.interests.find(
    (id) =>
      topics.includes(id) &&
      eligible.some((entry) => entry.topics.includes(id)),
  );
  if (interest) return { label: "根据兴趣", target: interest };
  for (const entry of eligible) {
    const source = entryOwners(entry).find((id) =>
      choices.sources.includes(id),
    );
    if (source)
      return {
        label:
          entry.ref.kind === "item"
            ? "来自你关注的来源"
            : "主要材料来自你关注的来源",
        target: source,
      };
  }
  // Highest-priority coverage is worth knowing outside current interests.
  // Other eligible coverage adds perspective without inventing a personal match.
  const lead = eligible.sort((a, b) => b.importance - a.importance)[0];
  if (lead)
    return {
      label: lead.importance === 3 ? "重要信息" : "拓展视野",
      target: lead.topics[0],
    };
}

export function recommendationReason(
  entry: ContentEntry,
  choices: ReadingChoices,
) {
  return personalRelevance([entry], choices);
}

export function briefRelevance(item: BriefHighlight, choices: ReadingChoices) {
  return personalRelevance(
    item.references
      .map(resolveEntry)
      .filter((entry): entry is ContentEntry => !!entry),
    choices,
  );
}
export function selectFeed({
  channel,
  choices = emptyChoices,
  focusAssets,
  topic = "全部",
  pool = sourceItems,
  at = demoNow,
  since,
  includeCollections = true,
}: {
  channel: Channel;
  choices?: ReadingChoices;
  focusAssets?: string[];
  topic?: string;
  pool?: SourceItem[];
  at?: string;
  since?: string;
  includeCollections?: boolean;
}) {
  const end = Date.parse(at),
    start = since ? Date.parse(since) : end - 24 * 60 * 60 * 1000;
  const available = pool.filter(
    (item) =>
      Date.parse(item.publishedAt) <= end && Date.parse(item.receivedAt) <= end,
  );
  const allowed = available.filter(
    (item) =>
      informationTime(item, available) > start &&
      (topic === "全部" || item.topics.includes(topic)),
  );
  if (channel === "关注") {
    const followed = allowed.filter((item) =>
      choices.sources.includes(item.source),
    );
    return collapseSources(followed, available)
      .map((item) => sourceEntry(item, available))
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  }
  const eligible = (entry: ContentEntry) => {
    if (topic !== "全部" && !entry.topics.includes(topic)) return false;
    if (
      focusAssets &&
      !entry.focusAssets?.some((id) => focusAssets.includes(id))
    )
      return false;
    if (
      channel === "推荐" &&
      choices.excluded.some((id) => matchesInterest(entry, id))
    )
      return false;
    if (channel === "热点")
      return (
        entry.importance >= 2 && entry.type !== "专题" && entry.type !== "观点"
      );
    return (
      entry.importance >= 2 || personalizationScore(entry, choices, false) > 0
    );
  };
  let entries = [
    ...collapseSources(
      allowed.filter((item) => eligible(sourceEntry(item, available))),
      available,
    ).map((item) => sourceEntry(item, available)),
    ...(includeCollections
      ? collectionEntries(at).filter(
          (entry) => Date.parse(entry.progressAt) > start && eligible(entry),
        )
      : []),
  ];
  // Discovery may replace a covered report with its event; the source feed returns earlier.
  const covered = new Set(
    entries
      .filter((entry) => entry.type === "事件")
      .flatMap((entry) => entry.primaryIds),
  );
  entries = entries.filter(
    (entry) =>
      entry.ref.kind !== "item" ||
      !entry.primaryIds.some((id) => covered.has(id)),
  );
  const informationAt = (entry: ContentEntry) =>
    entryInformationTime(entry, available);
  if (channel === "热点")
    return entries.sort(
      (a, b) =>
        b.importance - a.importance || informationAt(b) - informationAt(a),
    );
  const score = (entry: ContentEntry) =>
    entry.importance + personalizationScore(entry, choices);
  const ordered: ContentEntry[] = [];
  while (entries.length) {
    const previous = ordered.at(-1);
    const diversified = (entry: ContentEntry) =>
      score(entry) -
      (previous?.topics.some((topic) => entry.topics.includes(topic)) ? 2 : 0) -
      (previous?.primaryIds.some((id) => entry.primaryIds.includes(id))
        ? 5
        : 0);
    entries.sort(
      (a, b) =>
        diversified(b) - diversified(a) || informationAt(b) - informationAt(a),
    );
    ordered.push(entries.shift()!);
  }
  // Give one major update and one discovery a visible place outside personal matches.
  // Keep the rest of the relevance order and never add filtered-out content.
  for (const [label, position] of [
    ["重要信息", 2],
    ["拓展视野", 5],
  ] as const) {
    const index = ordered.findIndex(
      (entry) => recommendationReason(entry, choices)?.label === label,
    );
    if (index > position)
      ordered.splice(position, 0, ordered.splice(index, 1)[0]);
  }
  return ordered;
}
export function browseContent(query = "", asset?: string) {
  const matches = (entry: ContentEntry) =>
    (!asset || entry.assets.includes(asset)) &&
    matchesSearch(
      [entry.title, entry.summary, ...entryTargets(entry)].join(" "),
      query,
    );
  return [
    ...collapseSources(
      sourceItems.filter((item) => matches(sourceEntry(item))),
    ).map((item) => sourceEntry(item)),
    ...collectionEntries().filter(matches),
  ].sort((a, b) => Date.parse(b.progressAt) - Date.parse(a.progressAt));
}
export function createBriefEditions(choices: ReadingChoices): BriefEdition[] {
  const cutoff = Date.parse(briefCutoff);
  const candidates = briefDrafts.flatMap((item) => {
    const entries = item.references.map(resolveEntry);
    // Never remove a citation while keeping copy that depends on it.
    if (
      entries.some(
        (entry) =>
          !entry ||
          Date.parse(entry.publishedAt) > cutoff ||
          entry.sourceIds.some((id) => {
            const source = sourceItems.find((source) => source.id === id);
            return (
              !source ||
              Date.parse(source.receivedAt) > cutoff ||
              Date.parse(source.publishedAt) > cutoff
            );
          }) ||
          choices.excluded.some((id) => matchesInterest(entry, id)),
      )
    )
      return [];
    const available = entries as ContentEntry[];
    if (
      !available.some(
        (entry) =>
          entry.importance >= 2 ||
          personalizationScore(entry, choices, false) > 0,
      )
    )
      return [];
    return [
      {
        item,
        topics: [...new Set(available.flatMap((entry) => entry.topics))],
        primaryIds: [
          ...new Set(available.flatMap((entry) => entry.primaryIds)),
        ],
        score: Math.max(
          ...available.map(
            (entry) => entry.importance + personalizationScore(entry, choices),
          ),
        ),
        progressAt: Math.max(
          ...available.map((entry) => entryInformationTime(entry)),
        ),
      },
    ];
  });
  const selected: typeof candidates = [];
  const used = new Set<string>();
  while (candidates.length && selected.length < 3) {
    const previous = selected.at(-1);
    const score = (candidate: (typeof candidates)[number]) =>
      candidate.score -
      (previous?.topics.some((topic) => candidate.topics.includes(topic))
        ? 2
        : 0);
    candidates.sort(
      (a, b) => score(b) - score(a) || b.progressAt - a.progressAt,
    );
    const candidate = candidates.shift()!;
    if (candidate.primaryIds.some((id) => used.has(id))) continue;
    selected.push(candidate);
    candidate.primaryIds.forEach((id) => used.add(id));
  }
  return structuredClone([
    {
      id: demoEdition,
      cutoff: briefCutoff,
      personalized: [
        choices.sources,
        choices.watchlist,
        choices.interests,
        choices.excluded,
        choices.deemphasized ?? [],
      ].some((values) => values.length > 0),
      items: selected.map(({ item }) => item),
    },
    {
      id: "09.17",
      cutoff: "2025-09-17T09:30:00+08:00",
      personalized: false,
      items: [snapshotHighlight({ kind: "item", id: "policy-preview" })],
    },
    {
      id: "09.16",
      cutoff: "2025-09-16T09:30:00+08:00",
      personalized: false,
      items: [snapshotHighlight({ kind: "item", id: "gold-week-open" })],
    },
  ]);
}

function snapshotHighlight(ref: ContentRef): BriefHighlight {
  const entry = resolveEntry(ref);
  return {
    id: refKey(ref),
    title: entry?.title ?? "内容暂不可用",
    summary: entry?.summary ?? "",
    references: [ref],
    ...(legacyBriefNotes[refKey(ref)]
      ? { note: legacyBriefNotes[refKey(ref)] }
      : {}),
  };
}

export function migrateBriefEditions(value: unknown): BriefEdition[] {
  if (!Array.isArray(value)) throw new Error("Invalid brief editions");
  return value.map((edition) => {
    if (
      !edition ||
      typeof edition.id !== "string" ||
      typeof edition.cutoff !== "string"
    )
      throw new Error("Invalid brief edition");
    let items = edition.items;
    if (!Array.isArray(items)) {
      const references =
        edition.entries ??
        edition.storyIds?.map((id: string) => ({ kind: "item", id }));
      if (!Array.isArray(references))
        throw new Error("Missing brief references");
      items = references.map(snapshotHighlight);
    }
    const validReference = (ref: ContentRef) =>
      ref &&
      typeof ref.id === "string" &&
      (ref.kind === "item" ||
        (ref.kind === "collection" && Number.isInteger(ref.version)));
    if (
      items.some(
        (item: BriefHighlight) =>
          !item ||
          typeof item.id !== "string" ||
          typeof item.title !== "string" ||
          typeof item.summary !== "string" ||
          !Array.isArray(item.references) ||
          !item.references.length ||
          !item.references.every(validReference),
      )
    )
      throw new Error("Invalid brief highlight");
    return structuredClone({
      id: edition.id,
      cutoff: edition.cutoff,
      personalized: edition.personalized,
      items,
    });
  });
}

export function formatContentTime(
  value: string,
  english: boolean,
  full = false,
) {
  return new Intl.DateTimeFormat(english ? "en-US" : "zh-CN", {
    ...(full
      ? ({
          month: "2-digit",
          day: "2-digit",
          ...(new Date(value).getFullYear() !== new Date(demoNow).getFullYear()
            ? { year: "numeric" }
            : {}),
        } as const)
      : {}),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatListTime(value: string, english: boolean) {
  // Compare local dates, matching the timezone used to render the timestamp.
  const sameDay =
    new Date(value).toDateString() === new Date(demoNow).toDateString();
  return formatContentTime(value, english, !sameDay);
}

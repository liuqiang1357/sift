import test from "node:test";
import assert from "node:assert/strict";
import { sourceItems } from "../src/data.ts";
import { collections } from "../src/collections.ts";
import { defaultChoices, emptyChoices } from "../src/reading-choices.ts";
import {
  selectFeed,
  createBriefEditions,
  migrateBriefEditions,
  collapseSources,
  informationTime,
  latestSourceVersion,
  recommendationReason,
  resolveEntry,
  refKey,
  parseRef,
  collectionEntries,
  collectionsForSource,
  entryUpdate,
  entryNote,
  briefNote,
  hasUnreadChanges,
  browseContent,
  currentVersion,
  relatedCollections,
  contextEntries,
  sourceVersions,
  otherPublications,
  formatListTime,
  formatContentTime,
} from "../src/content.ts";

const keys = (items) => items.map((entry) => refKey(entry.ref));
const source = (id) => sourceItems.find((item) => item.id === id);
const choices = defaultChoices;
const oldFeature = { kind: "collection", id: "ai-power", version: 1 };

test("discovery replaces covered reports with events but preserves explicit source follows", () => {
  const discovery = keys(selectFeed({ channel: "推荐", choices }));
  assert.ok(discovery.includes("collection:datacenter-expansion:2"));
  assert.ok(discovery.includes("collection:ai-power:2"));
  assert.ok(!discovery.includes("ai-correction"));
  assert.ok(!discovery.includes("ai-reprint"));
  const followed = selectFeed({ channel: "关注", choices });
  assert.ok(keys(followed).includes("ai-correction"));
  assert.ok(keys(followed).includes("view"));
  for (let i = 1; i < followed.length; i++)
    assert.ok(
      Date.parse(followed[i - 1].progressAt) >=
        Date.parse(followed[i].progressAt),
    );
  assert.deepEqual(selectFeed({ channel: "关注" }), []);
  assert.deepEqual(
    keys(
      selectFeed({
        channel: "关注",
        choices: { ...emptyChoices, sources: ["产业观察"] },
      }),
    ),
    [
      "ai-correction",
      "power-video",
      "nvda-delivery",
      "apple-services",
      "microsoft-capex",
      "iphone-launch",
      "chip-packaging",
    ],
  );
});

test("source revisions stay separate from aggregation and preserve authored perspectives", () => {
  assert.equal(latestSourceVersion(source("ai")).id, "ai-correction");
  assert.equal(
    informationTime(source("ai-reprint")),
    Date.parse(source("ai").publishedAt),
  );
  const independent = {
    ...source("ai"),
    id: "another-report",
    title: "Independent reporting on the same project",
  };
  const pool = [
    source("ai"),
    source("ai-reprint"),
    source("ai-correction"),
    source("view"),
    independent,
  ];
  const result = collapseSources(pool, pool).map((item) => item.id);
  assert.ok(result.includes("ai-correction"));
  assert.ok(result.includes("another-report"));
  assert.ok(result.includes("view"));
  assert.ok(!result.includes("ai-reprint"));
});

test("all collection claims cite available material and sources can support multiple collections", () => {
  for (const collection of collections)
    for (const version of collection.versions) {
      assert.ok(Date.parse(version.cutoff) <= Date.parse(version.publishedAt));
      const ids = new Set(
        version.materials.map((material) => material.sourceId),
      );
      for (const material of version.materials) {
        const item = source(material.sourceId);
        assert.ok(item);
        assert.ok(Date.parse(item.publishedAt) <= Date.parse(version.cutoff));
        assert.ok(Date.parse(item.receivedAt) <= Date.parse(version.cutoff));
      }
      for (const point of [...version.points, ...(version.body ?? [])]) {
        assert.ok(point.sourceIds.length);
        for (const id of point.sourceIds) assert.ok(ids.has(id));
      }
    }
  assert.equal(collectionsForSource(source("ai")).length, 2);
  const features = collectionEntries().filter((entry) => entry.type === "专题");
  assert.equal(features.length, 2);
  assert.ok(features.every((entry) => entry.sourceIds.includes("view")));
  const event = resolveEntry({
    kind: "collection",
    id: "datacenter-expansion",
    version: 2,
  });
  assert.equal(event.publishedAt, "2025-09-18T10:10:00+08:00");
  assert.equal(event.progressAt, "2025-09-18T10:05:00+08:00");
  assert.notDeepEqual(features[0].primaryIds, features[1].primaryIds);
  assert.ok(
    browseContent("power").some((entry) => entry.ref.id === "ai-power"),
  );
});

test("new source content stays visible without claiming a collection has already updated", () => {
  const entry = resolveEntry(oldFeature),
    snapshot = JSON.stringify(entry);
  assert.equal(entryUpdate(entry, "2025-09-18T10:05:30+08:00"), undefined);
  assert.equal(entryUpdate(entry, "2025-09-18T10:07:00+08:00"), undefined);
  assert.equal(entryNote(entry, "2025-09-18T10:05:30+08:00"), undefined);
  assert.match(entryNote(entry, "2025-09-18T10:07:00+08:00").text, /12 月/);
  const duringGap = keys(
    selectFeed({ channel: "热点", at: "2025-09-18T10:07:00+08:00" }),
  );
  assert.ok(duringGap.includes("ai-correction"));
  assert.equal(entryUpdate(entry).ref.version, 2);
  assert.equal(JSON.stringify(entry), snapshot);
  assert.equal(resolveEntry(oldFeature).ref.version, 1);
  const feature = collections.find((item) => item.id === "ai-power");
  assert.equal(currentVersion(feature, "2025-09-18T02:07:00Z").version, 1);
});

test("only unread substantive changes to the same content get an update indicator", () => {
  const old = resolveEntry(oldFeature);
  const current = resolveEntry({ ...oldFeature, version: 2 });
  const original = resolveEntry({ kind: "item", id: "ai" });
  const corrected = resolveEntry({ kind: "item", id: "ai-correction" });
  assert.equal(hasUnreadChanges(current, []), false);
  assert.equal(hasUnreadChanges(current, [old]), true);
  assert.equal(hasUnreadChanges(current, [old, current]), false);
  assert.equal(hasUnreadChanges(old, [current]), false);
  assert.equal(hasUnreadChanges(current, [original]), false);
  assert.equal(hasUnreadChanges(corrected, [original]), true);
  assert.equal(hasUnreadChanges(corrected, [corrected]), false);
  assert.equal(
    hasUnreadChanges(current, [resolveEntry({ kind: "item", id: "view" })]),
    false,
  );
  assert.equal(
    hasUnreadChanges({ ...current, progressAt: old.progressAt }, [old]),
    false,
  );
});

test("explicit notes stay with the mistaken version through later ordinary updates", () => {
  const feature = collections.find((item) => item.id === "ai-power");
  const old = resolveEntry(oldFeature);
  const corrected = resolveEntry({ ...oldFeature, version: 2 });
  const note = entryNote(old);
  assert.ok(note);
  assert.equal(entryNote(corrected), undefined);
  feature.versions.push({
    ...feature.versions.at(-1),
    version: 3,
    publishedAt: "2025-09-18T10:25:00+08:00",
    progressAt: "2025-09-18T10:23:00+08:00",
  });
  try {
    assert.equal(entryUpdate(corrected).ref.version, 3);
    assert.equal(entryNote(corrected), undefined);
    assert.deepEqual(entryNote(old), note);
    feature.versions.at(-1).progressAt = corrected.progressAt;
    assert.equal(entryUpdate(corrected), undefined);
    assert.deepEqual(entryNote(old), note);
  } finally {
    feature.versions.pop();
  }
});

test("brief notes belong to the saved highlight, never to a corrected reference", () => {
  const item = createBriefEditions(choices)[0].items.find(
    (item) => item.id === "power-delivery",
  );
  assert.ok(entryNote(resolveEntry(item.references[0])));
  assert.equal(briefNote(item), undefined);
  const note = {
    text: "An explicit correction to this highlight",
    publishedAt: "2025-09-18T10:00:00+08:00",
  };
  const annotated = { ...item, note };
  assert.equal(briefNote(annotated, "2025-09-18T09:30:00+08:00"), undefined);
  assert.deepEqual(briefNote(annotated), note);
  assert.equal(briefNote(item), undefined);
  const migrated = migrateBriefEditions([
    {
      id: "09.18",
      cutoff: "2025-09-18T09:30:00+08:00",
      entries: [
        { kind: "collection", id: "datacenter-expansion", version: 1 },
        oldFeature,
      ],
    },
  ])[0];
  assert.match(migrated.items[0].summary, /9 月/);
  assert.match(briefNote(migrated.items[0]).text, /12 月/);
  assert.equal(briefNote(migrated.items[1]), undefined);
});

test("exclusions filter recommendations and synthesis without changing public headlines or explicit lookup", () => {
  const baseline = keys(selectFeed({ channel: "热点" }));
  assert.deepEqual(baseline, [
    "northshore-grid",
    "fed",
    "collection:datacenter-expansion:2",
    "collection:ethereum-network:1",
    "nvda-delivery",
    "apple-services",
    "yield-curve",
    "btc",
    "microsoft-capex",
    "iphone-launch",
  ]);
  const excluded = { ...choices, excluded: ["产业观察"] };
  assert.deepEqual(
    keys(selectFeed({ channel: "热点", choices: excluded })),
    baseline,
  );
  assert.ok(
    !selectFeed({ channel: "推荐", choices: excluded }).some((entry) =>
      entry.sourceIds.includes("ai-correction"),
    ),
  );
  assert.ok(
    keys(selectFeed({ channel: "关注", choices: excluded })).includes(
      "ai-correction",
    ),
  );
  assert.ok(browseContent("AI").some((entry) => entry.ref.id === "ai-power"));
});

test("interest reasons reflect actual matches and repeated main material is separated", () => {
  const interested = { ...emptyChoices, interests: ["AI 与科技"] };
  const entries = selectFeed({ channel: "推荐", choices: interested });
  assert.ok(entries[0].topics.includes("AI 与科技"));
  assert.deepEqual(recommendationReason(entries[0], interested), {
    label: "根据兴趣",
    target: "AI 与科技",
  });
  assert.notEqual(entries[0].primaryIds[0], entries[1].primaryIds[0]);
});

test("briefs save independent copy, combine explicit developments and freeze all references", () => {
  const editions = createBriefEditions(choices);
  const merged = editions[0].items.find((item) => item.id === "power-delivery");
  assert.equal(merged.references.length, 2);
  assert.deepEqual(
    merged.references.map((ref) => ref.id),
    ["ai", "power-grid"],
  );
  for (const ref of merged.references)
    assert.notEqual(merged.summary, resolveEntry(ref).summary);
  for (const edition of editions) {
    const used = new Set();
    for (const item of edition.items) {
      assert.ok(item.title && item.summary);
      for (const ref of item.references) {
        const entry = resolveEntry(ref);
        for (const id of entry.primaryIds) {
          assert.ok(!used.has(id));
          used.add(id);
        }
        assert.ok(Date.parse(entry.publishedAt) <= Date.parse(edition.cutoff));
        for (const id of entry.sourceIds) {
          assert.ok(
            Date.parse(source(id).publishedAt) <= Date.parse(edition.cutoff),
          );
          assert.ok(
            Date.parse(source(id).receivedAt) <= Date.parse(edition.cutoff),
          );
        }
      }
    }
  }
  const snapshot = JSON.stringify(editions);
  const original = source("ai").summary;
  try {
    source("ai").summary =
      "Later processing must not rewrite a saved highlight";
    createBriefEditions({ ...emptyChoices, excluded: ["AI 与科技"] });
    assert.equal(JSON.stringify(editions), snapshot);
    assert.notEqual(merged.summary, source("ai").summary);
  } finally {
    source("ai").summary = original;
  }
  editions[0].items[0].title = "edited";
  assert.equal(JSON.stringify(createBriefEditions(choices)), snapshot);
});

test("brief synthesis never keeps text after dropping an excluded or late reference", () => {
  const choices = {
    ...emptyChoices,
    interests: ["AI 与科技"],
    excluded: ["全球市场观察"],
  };
  assert.ok(
    !createBriefEditions(choices)[0].items.some(
      (item) => item.id === "power-delivery",
    ),
  );
  const original = source("power-grid").receivedAt;
  try {
    source("power-grid").receivedAt = "2025-09-18T09:31:00+08:00";
    assert.ok(
      !createBriefEditions(defaultChoices)[0].items.some(
        (item) => item.id === "power-delivery",
      ),
    );
  } finally {
    source("power-grid").receivedAt = original;
  }
});

test("legacy editions snapshot the original copy and preserve selections and versions", () => {
  const legacy = [
    {
      id: "09.18",
      cutoff: "2025-09-18T09:30:00+08:00",
      storyIds: ["ai", "fed"],
      personalized: true,
    },
  ];
  const snapshot = JSON.stringify(legacy);
  const migrated = migrateBriefEditions(legacy);
  assert.deepEqual(
    migrated[0].items.map((item) => item.references),
    [[{ kind: "item", id: "ai" }], [{ kind: "item", id: "fed" }]],
  );
  assert.equal(migrated[0].items[0].title, source("ai").title);
  assert.equal(migrated[0].items[0].summary, source("ai").summary);
  assert.equal(JSON.stringify(legacy), snapshot);
  migrated[0].items[0].summary = "Saved independent text";
  assert.deepEqual(migrateBriefEditions(migrated), migrated);
  assert.deepEqual(parseRef(refKey(oldFeature)), oldFeature);
  assert.throws(() => migrateBriefEditions({}));
});

test("late arrivals and reprints do not become fresh by ingestion time", () => {
  const fed = source("fed");
  const late = {
    ...fed,
    id: "late",
    publishedAt: "2025-09-18T01:00:00+08:00",
    receivedAt: "2025-09-18T10:00:00+08:00",
  };
  const opts = {
    channel: "关注",
    choices: { ...emptyChoices, sources: ["美联储"] },
    pool: [fed, late],
    includeCollections: false,
  };
  assert.deepEqual(
    keys(selectFeed({ ...opts, at: "2025-09-18T09:30:00+08:00" })),
    ["fed"],
  );
  assert.deepEqual(keys(selectFeed(opts)), ["fed", "late"]);
  const old = {
    ...source("ai"),
    id: "old",
    publishedAt: "2025-09-16T08:00:00+08:00",
    receivedAt: "2025-09-16T08:01:00+08:00",
  };
  const reprint = {
    ...old,
    id: "new-reprint",
    duplicateOf: "old",
    publishedAt: "2025-09-18T09:00:00+08:00",
    receivedAt: "2025-09-18T09:01:00+08:00",
  };
  assert.deepEqual(
    selectFeed({
      channel: "关注",
      choices: { ...emptyChoices, sources: ["产业观察"] },
      pool: [old, reprint],
      includeCollections: false,
    }),
    [],
  );
});

test("related links do not inherit evidence or create links from shared background", () => {
  const power = collections.find((item) => item.id === "ai-power");
  const rates = collections.find((item) => item.id === "rates-and-assets");
  const snapshot = JSON.stringify(power.versions);
  assert.ok(
    power.versions[0].materials.some((item) => item.sourceId === "view"),
  );
  assert.ok(
    rates.versions[0].materials.some((item) => item.sourceId === "view"),
  );
  assert.deepEqual(relatedCollections(rates), []);
  assert.deepEqual(keys(relatedCollections(power)), [
    "collection:datacenter-expansion:2",
  ]);
  assert.deepEqual(relatedCollections({ ...power, related: [] }), []);
  assert.equal(JSON.stringify(power.versions), snapshot);
  assert.equal(resolveEntry(oldFeature).ref.version, 1);
});

test("source history preserves publisher versions and a reprint alone is not an update", () => {
  assert.deepEqual(
    sourceVersions(source("ai-correction")).map((item) => item.id),
    ["ai-correction", "ai"],
  );
  assert.deepEqual(
    sourceVersions(source("ai-reprint")).map((item) => item.id),
    ["ai-reprint"],
  );
  const reprint = resolveEntry({ kind: "item", id: "ai-reprint" });
  assert.equal(entryUpdate(reprint, "2025-09-18T09:30:00+08:00"), undefined);
  assert.equal(entryUpdate(reprint), undefined);
});

test("other publications retain exact versions, source names and their own publication times", () => {
  const original = source("ai"),
    reprint = source("ai-reprint"),
    revised = source("ai-correction");
  assert.equal(reprint.duplicateOf, original.id);
  assert.deepEqual(
    otherPublications(original).map((item) => item.id),
    [reprint.id],
  );
  assert.deepEqual(
    otherPublications(reprint).map((item) => item.id),
    [original.id],
  );
  assert.deepEqual(otherPublications(revised), []);
  assert.deepEqual(
    otherPublications(original, "2025-09-18T09:05:30+08:00"),
    [],
  );
  assert.equal(
    resolveEntry({ kind: "item", id: reprint.id }).progressAt,
    reprint.publishedAt,
  );
  assert.equal(latestSourceVersion(reprint).id, reprint.id);
  const entries = [original, reprint, revised].map((item) =>
    resolveEntry({ kind: "item", id: item.id }),
  );
  assert.equal(hasUnreadChanges(entries[1], [entries[0]]), false);
  assert.equal(hasUnreadChanges(entries[2], [entries[1]]), false);
  assert.equal(hasUnreadChanges(entries[2], [entries[0]]), true);
});

test("source and exclusion filters run before duplicate collapsing", () => {
  const pool = [source("ai"), source("ai-reprint")];
  const feed = (channel, choices) =>
    selectFeed({ channel, choices, pool, includeCollections: false });
  const following = feed("关注", {
    ...emptyChoices,
    sources: ["全球市场观察"],
  });
  assert.deepEqual(keys(following), ["ai-reprint"]);
  assert.equal(following[0].source, "全球市场观察");
  assert.equal(following[0].progressAt, source("ai-reprint").publishedAt);
  assert.deepEqual(
    keys(
      feed("关注", { ...emptyChoices, sources: ["产业观察", "全球市场观察"] }),
    ),
    ["ai"],
  );
  assert.deepEqual(
    keys(feed("推荐", { ...emptyChoices, excluded: ["产业观察"] })),
    ["ai-reprint"],
  );
  assert.ok(keys(browseContent("全球市场观察")).includes("ai-reprint"));
  assert.equal(
    informationTime(source("ai-reprint")),
    Date.parse(source("ai").publishedAt),
  );
});

test("chat context uses the saved brief edition and does not infer citations from titles", () => {
  const editions = migrateBriefEditions([
    {
      id: "09.18",
      cutoff: "2025-09-18T09:30:00+08:00",
      personalized: true,
      entries: [oldFeature, { kind: "item", id: "fed" }],
    },
  ]);
  const context = { briefId: "09.18" };
  const before = JSON.stringify({ editions, context });
  const entries = contextEntries(context, editions);
  assert.deepEqual(keys(entries), ["collection:ai-power:1", "fed"]);
  assert.equal(entryUpdate(entries[0]).ref.version, 2);
  selectFeed({
    channel: "推荐",
    choices: { ...emptyChoices, excluded: ["AI 与科技"] },
  });
  assert.deepEqual(keys(contextEntries(context, editions)), keys(entries));
  assert.deepEqual(
    contextEntries({ context: source("ai").title }, editions),
    [],
  );
  assert.deepEqual(contextEntries({ briefId: "missing" }, editions), []);
  assert.equal(JSON.stringify({ editions, context }), before);
});

test("compact timestamps use the display timezone to distinguish today from earlier days", () => {
  const previousTimezone = process.env.TZ;
  try {
    process.env.TZ = "America/Los_Angeles";
    const sameDay = "2025-09-17T23:00:00+08:00";
    const previousDay = "2025-09-17T01:00:00+08:00";
    assert.equal(
      formatListTime(sameDay, true),
      formatContentTime(sameDay, true),
    );
    assert.equal(
      formatListTime(previousDay, true),
      formatContentTime(previousDay, true, true),
    );
    assert.doesNotMatch(formatListTime(previousDay, true), /GMT|UTC|PDT|PST/);
    assert.match(formatListTime("2024-09-15T09:00:00Z", true), /2024/);
    assert.equal(formatContentTime("2026-01-15T12:00:00Z", true), "04:00");
    assert.equal(formatContentTime("2026-07-15T12:00:00Z", true), "05:00");
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test("an ordinary background update does not claim that the collection has a new version", () => {
  const feature = resolveEntry({
    kind: "collection",
    id: "rates-and-assets",
    version: 1,
  });
  assert.equal(entryUpdate(feature), undefined);
  assert.equal(entryNote(feature), undefined);
  assert.equal(
    entryUpdate(resolveEntry({ kind: "item", id: "gold" })).ref.id,
    "gold-update",
  );
});

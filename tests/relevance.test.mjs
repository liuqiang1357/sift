import test from "node:test";
import assert from "node:assert/strict";
import {
  recommendationReason,
  briefRelevance,
  resolveEntry,
  createBriefEditions,
  migrateBriefEditions,
  selectFeed,
} from "../src/content.ts";
import { defaultChoices, emptyChoices } from "../src/reading-choices.ts";
import { briefDrafts } from "../src/briefs.ts";

const item = (id) => resolveEntry({ kind: "item", id });
const feature = resolveEntry({
  kind: "collection",
  id: "ai-power",
  version: 1,
});

test("relevance names the most specific explicit connection without inferring holdings", () => {
  assert.deepEqual(
    recommendationReason(item("nvda-delivery"), defaultChoices),
    {
      label: "与你的自选相关",
      target: "NVDA",
    },
  );
  assert.deepEqual(recommendationReason(feature, defaultChoices), {
    label: "根据兴趣",
    target: "AI 与科技",
  });
  const onlyAsset = { ...emptyChoices, watchlist: ["NVDA"] };
  assert.deepEqual(recommendationReason(feature, onlyAsset), {
    label: "拓展视野",
    target: "AI 与科技",
  });
  assert.deepEqual(recommendationReason(item("chip-packaging"), onlyAsset), {
    label: "拓展视野",
    target: "AI 与科技",
  });
  assert.deepEqual(recommendationReason(item("nvda-delivery"), emptyChoices), {
    label: "拓展视野",
    target: "AI 与科技",
  });
});

test("source relevance respects primary material, exact source identities and negative preferences", () => {
  assert.deepEqual(
    recommendationReason(feature, { ...emptyChoices, sources: ["产业观察"] }),
    {
      label: "主要材料来自你关注的来源",
      target: "产业观察",
    },
  );
  assert.deepEqual(
    recommendationReason(feature, { ...emptyChoices, sources: ["林序"] }),
    { label: "拓展视野", target: "AI 与科技" },
  );
  assert.deepEqual(
    recommendationReason(item("lin-ai"), {
      ...emptyChoices,
      sources: ["林序"],
    }),
    { label: "拓展视野", target: "AI 与科技" },
  );
  for (const negative of [
    { excluded: ["半导体"] },
    { deemphasized: ["半导体"] },
  ])
    assert.equal(
      recommendationReason(item("nvda-delivery"), {
        ...defaultChoices,
        ...negative,
      }),
      undefined,
    );
});

test("merged briefs inspect all pinned references and share recommendation relevance rules", () => {
  const merged = briefDrafts.find(
    (highlight) => highlight.id === "power-delivery",
  );
  assert.deepEqual(
    briefRelevance(merged, { ...emptyChoices, sources: ["全球市场观察"] }),
    {
      label: "来自你关注的来源",
      target: "全球市场观察",
    },
  );
  assert.deepEqual(
    briefRelevance(merged, { ...emptyChoices, watchlist: ["NVDA"] }),
    { label: "拓展视野", target: "AI 与科技" },
  );
  const gold = briefDrafts.find((highlight) => highlight.id === "gold-rates");
  assert.deepEqual(
    briefRelevance(gold, defaultChoices),
    recommendationReason(item("gold"), defaultChoices),
  );
  assert.equal(
    briefRelevance(
      { ...gold, references: [{ kind: "item", id: "missing" }] },
      defaultChoices,
    ),
    undefined,
  );
});

test("current relevance updates for saved and legacy briefs without rewriting their snapshots", () => {
  const editions = migrateBriefEditions(createBriefEditions(defaultChoices));
  const before = JSON.stringify(editions);
  const saved = editions[0].items.find(
    (highlight) => highlight.id === "gold-rates",
  );
  assert.deepEqual(briefRelevance(saved, defaultChoices), {
    label: "与你的自选相关",
    target: "XAU",
  });
  assert.deepEqual(
    briefRelevance(saved, { ...emptyChoices, interests: ["宏观经济"] }),
    {
      label: "根据兴趣",
      target: "宏观经济",
    },
  );
  assert.deepEqual(briefRelevance(saved, emptyChoices), {
    label: "拓展视野",
    target: "宏观经济",
  });
  assert.equal(JSON.stringify(editions), before);
  const [legacy] = migrateBriefEditions([
    {
      id: "09.18",
      cutoff: editions[0].cutoff,
      storyIds: ["gold"],
      personalized: true,
    },
  ]);
  assert.deepEqual(
    briefRelevance(legacy.items[0], defaultChoices),
    briefRelevance(saved, defaultChoices),
  );
});

test("fallback reasons distinguish importance from discovery without making up topics", () => {
  assert.deepEqual(recommendationReason(item("fed"), emptyChoices), {
    label: "重要信息",
    target: "宏观经济",
  });
  assert.deepEqual(
    recommendationReason({ ...item("view"), topics: [] }, emptyChoices),
    { label: "拓展视野", target: undefined },
  );
  const merged = briefDrafts.find(
    (highlight) => highlight.id === "power-delivery",
  );
  assert.deepEqual(
    briefRelevance(
      { ...merged, references: [...merged.references].reverse() },
      emptyChoices,
    ),
    { label: "拓展视野", target: "AI 与科技" },
  );
  assert.equal(
    briefRelevance(merged, { ...emptyChoices, excluded: ["AI 与科技"] }),
    undefined,
  );
});

test("default recommendations visibly include important updates and discovery with honest reasons", () => {
  const feed = selectFeed({ channel: "推荐", choices: defaultChoices });
  const importantIndex = feed.findIndex(
    (entry) => entry.ref.id === "northshore-grid",
  );
  const discoveryIndex = feed.findIndex(
    (entry) => entry.ref.id === "bond-return-basics",
  );
  assert.ok(importantIndex >= 0 && importantIndex < 3);
  assert.ok(discoveryIndex >= 0 && discoveryIndex < 6);
  assert.deepEqual(recommendationReason(feed[importantIndex], defaultChoices), {
    label: "重要信息",
    target: "能源与电力",
  });
  assert.deepEqual(recommendationReason(feed[discoveryIndex], defaultChoices), {
    label: "拓展视野",
    target: "国债与利率",
  });
  assert.deepEqual(
    recommendationReason(feed[discoveryIndex], {
      ...defaultChoices,
      interests: [...defaultChoices.interests, "国债与利率"],
    }),
    { label: "根据兴趣", target: "国债与利率" },
  );
  assert.ok(
    selectFeed({ channel: "关注", choices: defaultChoices }).every(
      (entry) =>
        !["northshore-grid", "bond-return-basics"].includes(entry.ref.id),
    ),
  );
  const headlines = selectFeed({ channel: "热点", choices: defaultChoices });
  assert.ok(
    headlines.every(
      (entry, index) =>
        !index || headlines[index - 1].importance >= entry.importance,
    ),
  );
});

test("discovery positions never bypass topic, source, time or negative preference filters", () => {
  const choices = { ...defaultChoices, excluded: ["能源与电力", "国债与利率"] };
  const filtered = selectFeed({ channel: "推荐", choices });
  assert.ok(
    filtered.every(
      (entry) =>
        !["northshore-grid", "bond-return-basics"].includes(entry.ref.id),
    ),
  );
  const reduced = {
    ...defaultChoices,
    deemphasized: ["能源与电力", "国债与利率"],
  };
  assert.ok(
    selectFeed({ channel: "推荐", choices: reduced })
      .slice(0, 6)
      .every(
        (entry) =>
          !["northshore-grid", "bond-return-basics"].includes(entry.ref.id),
      ),
  );
  const topicFeed = selectFeed({
    channel: "推荐",
    choices: defaultChoices,
    topic: "半导体",
  });
  assert.ok(topicFeed.every((entry) => entry.topics.includes("半导体")));
  const sources = selectFeed({
    channel: "推荐",
    choices: { ...defaultChoices, excluded: ["全球市场观察", "市场数据"] },
  });
  assert.ok(
    sources.every(
      (entry) =>
        !["northshore-grid", "bond-return-basics"].includes(entry.ref.id),
    ),
  );
  const early = selectFeed({
    channel: "推荐",
    choices: defaultChoices,
    at: "2025-09-18T09:00:00+08:00",
  });
  assert.ok(
    early.every(
      (entry) =>
        !["northshore-grid", "bond-return-basics"].includes(entry.ref.id),
    ),
  );
});

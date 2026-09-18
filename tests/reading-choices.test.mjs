import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultChoices,
  emptyChoices,
  migrateReadingChoices,
  toggleChoice,
  toggleInterest,
  excludeRecommendation,
  restoreRecommendation,
} from "../src/reading-choices.ts";
import {
  recommendationReason,
  recommendationDirections,
  browseContent,
  matchesInterest,
  resolveEntry,
  selectFeed,
  createBriefEditions,
  refKey,
} from "../src/content.ts";
import { sourceItems, topics } from "../src/data.ts";

const keys = (entries) => entries.map((entry) => refKey(entry.ref));
const item = (id) => resolveEntry({ kind: "item", id });

test("legacy follows and split preferences merge without inferring new choices or mutating input", () => {
  const legacy = [
    "NVDA",
    "BTC",
    "AI 与科技",
    "加密资产",
    "林序",
    "产业观察",
    "NVDA",
    "unknown",
  ];
  const before = JSON.stringify(legacy);
  assert.deepEqual(migrateReadingChoices(legacy), {
    sources: ["林序", "产业观察"],
    watchlist: ["NVDA", "BTC"],
    interests: ["AI 与科技", "加密资产"],
    excluded: [],
  });
  assert.equal(JSON.stringify(legacy), before);
  assert.deepEqual(migrateReadingChoices([]), emptyChoices);
  assert.deepEqual(migrateReadingChoices(null), defaultChoices);
  const split = {
    sources: ["林序"],
    watchlist: ["BTC"],
    topics: ["加密资产"],
    markets: ["加密资产", "美股"],
  };
  assert.deepEqual(migrateReadingChoices(split), {
    sources: ["林序"],
    watchlist: ["BTC"],
    interests: ["加密资产"],
    excluded: [],
  });
});

test("saved market rules are removed without changing topics, asset preferences or raw text", () => {
  const original = {
    ...defaultChoices,
    interests: ["美股", "商品", "AI 与科技", "BTC", "产业观察"],
    excluded: ["商品", "全球市场观察"],
    deemphasized: ["美股", "加密资产"],
    preferenceText: "多看美股和 AI，少看加密资产。",
  };
  const snapshot = structuredClone(original);
  const migrated = migrateReadingChoices(original);
  assert.deepEqual(migrated, {
    ...original,
    interests: ["AI 与科技", "BTC", "产业观察"],
    excluded: ["全球市场观察"],
    deemphasized: ["加密资产"],
  });
  assert.deepEqual(original, snapshot);
  assert.deepEqual(migrateReadingChoices(migrated), migrated);
  assert.deepEqual(
    migrateReadingChoices({ markets: ["加密资产", "商品"] }).interests,
    [],
  );
  assert.deepEqual(toggleInterest(emptyChoices, "美股"), emptyChoices);
});

test("legacy text migrates once, preserves raw wording and leaves ambiguous rules inactive", () => {
  const raw =
    "多看 AI 与科技\nLess Global markets;Hide NVDA\n只看下周涨幅超过 10% 的股票";
  const choices = migrateReadingChoices([], raw);
  assert.deepEqual(choices, {
    ...emptyChoices,
    interests: ["AI 与科技"],
    excluded: ["NVDA"],
    legacyText: raw,
  });
  assert.deepEqual(
    migrateReadingChoices([], "多看 BTC\n不看 BTC\nMore Bitcoin").interests,
    [],
  );
  assert.deepEqual(
    migrateReadingChoices([], "多看 BTC\n不看 BTC\nMore Bitcoin").excluded,
    [],
  );
  const more = migrateReadingChoices([], "More Bitcoin;多看 产业观察");
  assert.deepEqual(more.interests, ["BTC", "产业观察"]);
  assert.deepEqual(more.watchlist, []);
  assert.deepEqual(more.sources, []);
  const restored = restoreRecommendation(choices, "NVDA");
  assert.deepEqual(migrateReadingChoices(restored, raw), restored);
  assert.deepEqual(migrateReadingChoices(emptyChoices, raw), emptyChoices);
  assert.deepEqual(emptyChoices.excluded, []);
  assert.deepEqual(defaultChoices.excluded, []);
  assert.deepEqual(
    migrateReadingChoices({ topics: ["AI 与科技"] }, "不看 AI 与科技")
      .interests,
    [],
  );
});

test("interest and exclusion are mutually exclusive while restoring is neutral", () => {
  const original = { ...defaultChoices, interests: ["AI 与科技"] };
  const excluded = excludeRecommendation(original, "AI 与科技");
  assert.deepEqual(excluded.interests, []);
  assert.deepEqual(excluded.excluded, ["AI 与科技"]);
  assert.deepEqual(excludeRecommendation(excluded, "AI 与科技"), excluded);
  const restored = restoreRecommendation(excluded, "AI 与科技");
  assert.deepEqual(restored.interests, []);
  assert.deepEqual(restored.excluded, []);
  assert.deepEqual(toggleInterest(excluded, "AI 与科技"), original);
  assert.deepEqual(excluded.sources, original.sources);
  assert.deepEqual(excluded.watchlist, original.watchlist);
  assert.deepEqual(original.interests, ["AI 与科技"]);
});

test("source feeds ignore asset interests and exclusions and do not include aggregates", () => {
  const interests = {
    ...emptyChoices,
    watchlist: ["NVDA", "BTC"],
    interests: ["AI 与科技", "美股"],
  };
  assert.deepEqual(selectFeed({ channel: "关注", choices: interests }), []);
  const choices = {
    ...interests,
    sources: ["产业观察", "林序"],
    excluded: ["产业观察"],
  };
  const baseline = keys(selectFeed({ channel: "关注", choices }));
  assert.deepEqual(baseline, [
    "ai-correction",
    "power-video",
    "nvda-delivery",
    "apple-services",
    "microsoft-capex",
    "iphone-launch",
    "view",
    "chip-packaging",
  ]);
  assert.deepEqual(
    keys(
      selectFeed({
        channel: "关注",
        choices: toggleChoice(choices, "watchlist", "XAU"),
      }),
    ),
    baseline,
  );
});

test("a combined source is one identity for follows, recommendations and exclusions", () => {
  const combined = item("lin-ai");
  const source = "林序 · 产业观察";
  for (const other of ["林序", "产业观察"]) {
    assert.ok(
      !keys(
        selectFeed({
          channel: "关注",
          choices: { ...emptyChoices, sources: [other] },
        }),
      ).includes("lin-ai"),
    );
    assert.deepEqual(
      recommendationReason(combined, { ...emptyChoices, sources: [other] }),
      { label: "拓展视野", target: "AI 与科技" },
    );
    assert.ok(
      keys(
        selectFeed({
          channel: "推荐",
          choices: {
            ...emptyChoices,
            interests: ["AI 与科技"],
            excluded: [other],
          },
        }),
      ).includes("lin-ai"),
    );
  }
  assert.deepEqual(
    keys(
      selectFeed({
        channel: "关注",
        choices: { ...emptyChoices, sources: [source] },
      }),
    ),
    ["lin-ai"],
  );
  assert.deepEqual(
    recommendationReason(combined, { ...emptyChoices, sources: [source] }),
    { label: "来自你关注的来源", target: source },
  );
  const excluded = keys(
    selectFeed({
      channel: "推荐",
      choices: {
        ...emptyChoices,
        interests: ["AI 与科技", "宏观经济"],
        excluded: [source],
      },
    }),
  );
  assert.ok(!excluded.includes("lin-ai"));
  assert.ok(excluded.includes("view"));
  assert.ok(excluded.includes("nvda-delivery"));
});

test("a followed reprint stays under its publisher without promoting quoted publishers", () => {
  const original = sourceItems.find((entry) => entry.id === "ai");
  const reprint = {
    ...original,
    id: "test-reprint",
    source: "测试媒体",
    duplicateOf: original.id,
  };
  assert.deepEqual(
    keys(
      selectFeed({
        channel: "关注",
        choices: { ...emptyChoices, sources: ["测试媒体"] },
        pool: [original, reprint],
        includeCollections: false,
      }),
    ),
    ["test-reprint"],
  );
  assert.deepEqual(
    recommendationReason(
      resolveEntry({ kind: "collection", id: "ai-power", version: 2 }),
      { ...emptyChoices, sources: ["林序"] },
    ),
    { label: "拓展视野", target: "AI 与科技" },
  );
});

test("interest options and recommendation directions use content topics", () => {
  for (const [id, choices, reason] of [
    [
      "btc",
      { ...emptyChoices, watchlist: ["BTC"] },
      { label: "与你的自选相关", target: "BTC" },
    ],
    [
      "gold",
      { ...emptyChoices, interests: ["宏观经济"] },
      { label: "根据兴趣", target: "宏观经济" },
    ],
    [
      "ai-correction",
      { ...emptyChoices, interests: ["AI 与科技"] },
      { label: "根据兴趣", target: "AI 与科技" },
    ],
    [
      "view",
      { ...emptyChoices, sources: ["林序"] },
      { label: "来自你关注的来源", target: "林序" },
    ],
  ])
    assert.deepEqual(recommendationReason(item(id), choices), reason);
  assert.equal(
    recommendationDirections(item("btc")).filter((id) => id === "加密资产")
      .length,
    1,
  );
  for (const source of sourceItems) {
    assert.ok(source.topics.every((topic) => topics.includes(topic)));
    assert.deepEqual(recommendationDirections(item(source.id)), source.topics);
  }
  const choices = { ...emptyChoices, interests: ["宏观经济"] };
  const before = JSON.stringify(choices);
  const normal = keys(selectFeed({ channel: "推荐", choices }));
  assert.ok(normal.includes("gold-update"));
  selectFeed({ channel: "推荐", choices, topic: "宏观经济" });
  assert.equal(JSON.stringify(choices), before);
  assert.deepEqual(keys(selectFeed({ channel: "推荐", choices })), normal);
});

test("a linked asset's market does not determine topic interests or exclusions", () => {
  // Even an explicit comparison with BTC must not imply a crypto topic.
  const macro = { ...item("fed"), assets: ["BTC"] };
  assert.equal(matchesInterest(macro, "加密资产"), false);
  assert.equal(matchesInterest(macro, "宏观经济"), true);
  assert.equal(matchesInterest(macro, "美股"), false);
  assert.deepEqual(
    recommendationReason(item("gold"), {
      ...emptyChoices,
      interests: ["商品"],
    }),
    { label: "拓展视野", target: "宏观经济" },
  );
  const choices = { ...emptyChoices, excluded: ["加密资产"] };
  const entries = selectFeed({ channel: "推荐", choices });
  assert.ok(entries.some((entry) => entry.ref.id === "fed"));
  assert.ok(entries.every((entry) => !entry.topics.includes("加密资产")));
});

test("broad industry coverage does not imply specific asset relationships", () => {
  const choices = { ...emptyChoices, watchlist: ["NVDA", "BTC"] };
  for (const id of [
    "fed",
    "ai",
    "ai-correction",
    "power-grid",
    "power-background",
    "chip-packaging",
    "view",
  ]) {
    assert.deepEqual(item(id).assets, [], id);
    assert.ok(
      ["重要信息", "拓展视野"].includes(
        recommendationReason(item(id), choices)?.label,
      ),
      id,
    );
  }
  assert.deepEqual(item("btc").assets, ["BTC"]);
  assert.deepEqual(keys(browseContent("", "NVDA")), ["nvda-delivery"]);
  assert.ok(!browseContent("", "ETH").some((entry) => entry.ref.id === "btc"));
  assert.deepEqual(recommendationReason(item("nvda-delivery"), choices), {
    label: "与你的自选相关",
    target: "NVDA",
  });
  const excluded = selectFeed({
    channel: "推荐",
    choices: { ...emptyChoices, excluded: ["NVDA", "BTC"] },
  });
  assert.ok(excluded.some((entry) => entry.ref.id === "fed"));
  assert.ok(excluded.some((entry) => entry.ref.id === "datacenter-expansion"));
  assert.ok(!excluded.some((entry) => entry.ref.id === "nvda-delivery"));
  const rates = resolveEntry({
    kind: "collection",
    id: "rates-and-assets",
    version: 1,
  });
  assert.deepEqual(rates.assets, ["XAU"]);
  assert.ok(
    !selectFeed({ channel: "热点", focusAssets: ["XAU"] }).some(
      (entry) => entry.ref.id === rates.ref.id,
    ),
  );
});

test("narrow topics are reusable filters without changing existing interests", () => {
  for (const [topic, id] of [
    ["半导体", "nvda-delivery"],
    ["国债与利率", "fed"],
  ]) {
    const entries = selectFeed({ channel: "推荐", topic });
    assert.ok(entries.some((entry) => entry.ref.id === id));
    assert.ok(entries.every((entry) => entry.topics.includes(topic)));
  }
  const before = structuredClone(defaultChoices);
  assert.deepEqual(migrateReadingChoices(before), before);
  assert.deepEqual(before.interests, ["宏观经济", "AI 与科技"]);
});

test("multiple topics match any filter without stacking interest boosts or excluding untagged news", () => {
  const ai = item("ai");
  assert.deepEqual(ai.topics, ["AI 与科技", "能源与电力"]);
  for (const topic of ai.topics) {
    assert.ok(matchesInterest(ai, topic));
    assert.ok(
      selectFeed({ channel: "推荐", topic }).some(
        (entry) => entry.ref.id === "datacenter-expansion",
      ),
    );
  }
  const pool = [
    { ...sourceItems[0], id: "first", topics: ["AI 与科技"], importance: 2 },
    {
      ...sourceItems[0],
      id: "second",
      topics: ai.topics,
      importance: 2,
      publishedAt: "2025-09-18T09:00:00+08:00",
    },
    { ...sourceItems[0], id: "untagged", topics: [], importance: 3 },
  ];
  const options = { channel: "推荐", pool, includeCollections: false };
  const single = selectFeed({
    ...options,
    choices: { ...emptyChoices, interests: ["AI 与科技"] },
  });
  const multiple = selectFeed({
    ...options,
    choices: { ...emptyChoices, interests: ai.topics },
  });
  assert.deepEqual(keys(single), keys(multiple));
  assert.ok(keys(multiple).includes("untagged"));
  assert.ok(
    !keys(selectFeed({ ...options, topic: "能源与电力" })).includes("untagged"),
  );
  const excluded = selectFeed({
    channel: "推荐",
    choices: {
      ...emptyChoices,
      interests: ["AI 与科技"],
      excluded: ["能源与电力"],
    },
  });
  assert.ok(excluded.every((entry) => !entry.topics.includes("能源与电力")));
});

test("watchlist headlines require direct subject matches and are unaffected by exclusions", () => {
  assert.deepEqual(
    keys(selectFeed({ channel: "热点", focusAssets: ["BTC"] })),
    ["btc"],
  );
  assert.deepEqual(
    keys(selectFeed({ channel: "热点", focusAssets: ["NVDA"] })),
    ["nvda-delivery"],
  );
  assert.deepEqual(
    keys(selectFeed({ channel: "热点", focusAssets: ["ETH"] })),
    ["collection:ethereum-network:1"],
  );
  for (const focusAssets of [[], ["UNKNOWN"]])
    assert.deepEqual(selectFeed({ channel: "热点", focusAssets }), []);
  assert.deepEqual(
    keys(
      selectFeed({
        channel: "热点",
        focusAssets: ["BTC"],
        choices: { ...emptyChoices, excluded: ["BTC"] },
      }),
    ),
    ["btc"],
  );
});

test("choices affect future brief selection without rewriting a saved edition", () => {
  const choices = { ...emptyChoices, watchlist: ["BTC"] };
  const editions = createBriefEditions(choices);
  const snapshot = JSON.stringify(editions);
  assert.equal(editions[0].personalized, true);
  const changed = excludeRecommendation(choices, "产业观察");
  const revised = createBriefEditions(changed);
  assert.ok(
    revised.every((edition) =>
      edition.items
        .flatMap((item) => item.references)
        .every(
          (ref) =>
            !resolveEntry(ref).sourceIds.some((id) =>
              sourceItems
                .find((item) => item.id === id)
                .source.startsWith("产业观察"),
            ),
        ),
    ),
  );
  assert.equal(JSON.stringify(editions), snapshot);
  assert.deepEqual(choices.excluded, []);
});

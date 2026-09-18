import test from "node:test";
import assert from "node:assert/strict";
import {
  interpretPreference,
  applyPreferenceText,
} from "../src/preferences.ts";
import { emptyChoices } from "../src/reading-choices.ts";
import {
  recommendationReason,
  resolveEntry,
  selectFeed,
  refKey,
} from "../src/content.ts";

test("natural descriptions recognize common directions and distinguish reduction from exclusion", () => {
  assert.deepEqual(
    interpretPreference(
      "我想了解宏观政策和人工智能，少看加密资产，不看市场数据。",
    ),
    { more: ["宏观经济", "AI 与科技"], less: ["加密资产"], hide: ["市场数据"] },
  );
  assert.deepEqual(
    interpretPreference("More AI and less crypto; exclude Market Data."),
    { more: ["AI 与科技"], less: ["加密资产"], hide: ["市场数据"] },
  );
  assert.deepEqual(interpretPreference("对加密资产不感兴趣"), {
    more: [],
    less: [],
    hide: ["加密资产"],
  });
  assert.deepEqual(interpretPreference("not interested in crypto"), {
    more: [],
    less: [],
    hide: ["加密资产"],
  });
});

test("ambiguous descriptions and word fragments do not silently create preferences", () => {
  for (const text of [
    "多看 BTC，不看 BTC",
    "不要排除加密资产",
    "AI 要不要多看？",
    "rain daily",
    "下周必涨十倍",
    "多看美股，少看商品",
    "More US stocks; less commodities",
  ])
    assert.deepEqual(
      interpretPreference(text),
      { more: [], less: [], hide: [] },
      text,
    );
});

test("natural language still supports explicit asset and source preferences", () => {
  const choices = applyPreferenceText(
    emptyChoices,
    "多看 BTC 和产业观察，少看 AI",
  );
  assert.deepEqual(choices.interests, ["产业观察", "BTC"]);
  assert.deepEqual(choices.deemphasized, ["AI 与科技"]);
  assert.deepEqual(choices.sources, []);
  assert.deepEqual(choices.watchlist, []);
});

test("a combined source name is not split into separate preference targets", () => {
  for (const text of ["不看林序 · 产业观察", "Hide Lin Xu · Industry Watch"])
    assert.deepEqual(interpretPreference(text), {
      more: [],
      less: [],
      hide: ["林序 · 产业观察"],
    });
  assert.deepEqual(interpretPreference("多看林序 · 产业观察，少看林序"), {
    more: ["林序 · 产业观察"],
    less: ["林序"],
    hide: [],
  });
});

test("specific topic aliases do not expand to markets, companies or broader topics", () => {
  for (const text of [
    "多看芯片，少看国债",
    "More semiconductors; less treasuries",
  ])
    assert.deepEqual(interpretPreference(text), {
      more: ["半导体"],
      less: ["国债与利率"],
      hide: [],
    });
  assert.deepEqual(interpretPreference("多看利率，少看 AI"), {
    more: ["国债与利率"],
    less: ["AI 与科技"],
    hide: [],
  });
});

test("editing a description replaces its recognized targets and preserves other choices", () => {
  const initial = {
    ...emptyChoices,
    sources: ["林序"],
    watchlist: ["NVDA"],
    excluded: ["产业观察"],
  };
  const raw = "关注 AI 与科技，少看加密资产。";
  const saved = applyPreferenceText(initial, raw);
  assert.equal(saved.preferenceText, raw);
  assert.deepEqual(saved.interests, ["AI 与科技"]);
  assert.deepEqual(saved.deemphasized, ["加密资产"]);
  const changed = applyPreferenceText(saved, "关注宏观经济，不看市场数据");
  assert.deepEqual(changed.interests, ["宏观经济"]);
  assert.deepEqual(changed.deemphasized, []);
  assert.deepEqual(changed.excluded, ["产业观察", "市场数据"]);
  assert.deepEqual(changed.sources, ["林序"]);
  assert.deepEqual(changed.watchlist, ["NVDA"]);
  const cleared = applyPreferenceText(changed, "");
  assert.deepEqual(cleared.interests, []);
  assert.deepEqual(cleared.excluded, ["产业观察"]);
});

test("less lowers recommendation priority without removing content or changing headlines", () => {
  const choices = applyPreferenceText(
    { ...emptyChoices, watchlist: ["BTC"] },
    "少看加密资产",
  );
  const entries = selectFeed({ channel: "推荐", choices });
  assert.ok(entries.some((entry) => entry.ref.id === "btc"));
  assert.equal(
    recommendationReason(resolveEntry({ kind: "item", id: "btc" }), choices),
    undefined,
  );
  assert.deepEqual(
    selectFeed({ channel: "热点", choices }).map((entry) => refKey(entry.ref)),
    selectFeed({ channel: "热点" }).map((entry) => refKey(entry.ref)),
  );
  const excluded = applyPreferenceText(choices, "不看加密资产");
  assert.ok(
    !selectFeed({ channel: "推荐", choices: excluded }).some(
      (entry) => entry.ref.id === "btc",
    ),
  );
});

test("reducing a matched low-priority story does not remove it from recommendations", () => {
  const choices = applyPreferenceText(
    { ...emptyChoices, sources: ["林序"] },
    "少看宏观经济",
  );
  assert.ok(
    selectFeed({ channel: "推荐", choices }).some(
      (entry) => entry.ref.id === "view",
    ),
  );
});

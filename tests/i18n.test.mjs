import test from "node:test";
import assert from "node:assert/strict";
import { translate, matchesSearch, createLocalizer } from "../src/i18n.ts";
import { briefDrafts } from "../src/briefs.ts";
import { collections } from "../src/collections.ts";
import { overviewOptions } from "../src/market-overview.ts";
import {
  sourceItems,
  assets,
  topics,
  sections,
  sourceProfiles,
} from "../src/data.ts";

test("all bundled content has an English translation without changing its source", () => {
  const content = {
    briefDrafts,
    collections,
    sourceItems,
    assets,
    topics,
    sections,
    sourceProfiles,
    overviewOptions,
  };
  const before = JSON.stringify(content);
  function check(value) {
    if (typeof value === "string") {
      assert.equal(
        /[\u3400-\u9fff]/u.test(translate(value, true)),
        false,
        value,
      );
      assert.equal(translate(value, false), value);
    } else if (Array.isArray(value)) value.forEach(check);
    else if (value && typeof value === "object")
      Object.values(value).forEach(check);
  }
  check(content);
  assert.equal(JSON.stringify(content), before);
});

test("search finds the same asset, author and topic in either language", () => {
  for (const [text, english, chinese] of [
    ["英伟达NVDA", "nvidia", "英伟达"],
    ["林序", "lin xu", "林序"],
    ["宏观经济", "macroeconomics", "宏观"],
    [sourceItems.find((item) => item.id === "gold").title, "gold", "黄金"],
  ]) {
    assert.ok(matchesSearch(text, english));
    assert.ok(matchesSearch(text, chinese));
    assert.equal(matchesSearch(text, "no-match-xyz"), false);
  }
});

test("composed labels and multiline content keep complete phrase translations", () => {
  assert.equal(translate("取消关注 林序", true), "Unfollow Lin Xu");
  assert.equal(
    translate(sourceItems[0].points.join("\n\n"), true),
    sourceItems[0].points.map((p) => translate(p, true)).join("\n\n"),
  );
  const localize = createLocalizer(true);
  assert.deepEqual(localize(["我的关注", 3, null]), ["Following", 3, null]);
  assert.equal(localize(""), "");
});

import test from "node:test";
import assert from "node:assert/strict";
import { sourceItems, sourceProfiles, assets, topics } from "../src/data.ts";
import { collections } from "../src/collections.ts";
import { createBriefEditions, resolveEntry } from "../src/content.ts";
import { defaultChoices, emptyChoices } from "../src/reading-choices.ts";
import {
  demoNow,
  briefCutoff,
  demoEdition,
  demoRecordKey,
} from "../src/demo-scenario.ts";
import { demoConversations } from "../src/demo-records.ts";
import { overviewOptions } from "../src/market-overview.ts";

const source = (id) => sourceItems.find((item) => item.id === id);

test("scenario records have unique identities, complete targets and a consistent clock", () => {
  for (const records of [
    sourceItems,
    collections,
    assets,
    sourceProfiles,
    demoConversations,
  ])
    assert.equal(
      new Set(records.map((record) => record.id)).size,
      records.length,
    );
  const topicIds = new Set(topics);
  const assetIds = new Set(assets.map((asset) => asset.id));
  for (const item of [...sourceItems, ...collections]) {
    assert.ok(
      item.topics.every((id) => topicIds.has(id)),
      item.id,
    );
    assert.ok(
      item.assets.every((id) => assetIds.has(id)),
      item.id,
    );
    assert.ok(
      (item.focusAssets ?? []).every((id) => item.assets.includes(id)),
      item.id,
    );
  }
  for (const item of sourceItems) {
    assert.equal(
      sourceProfiles.filter((profile) => profile.id === item.source).length,
      1,
    );
    assert.ok(
      Date.parse(item.publishedAt) <= Date.parse(item.receivedAt),
      item.id,
    );
    assert.ok(Date.parse(item.receivedAt) <= Date.parse(demoNow), item.id);
    if (item.note)
      assert.ok(
        Date.parse(item.note.publishedAt) >= Date.parse(item.publishedAt),
      );
    if (item.supersedes) {
      const previous = source(item.supersedes);
      assert.equal(previous?.source, item.source);
      assert.ok(
        Date.parse(previous.publishedAt) < Date.parse(item.publishedAt),
      );
    }
  }
  assert.equal(
    Date.parse(source("fed").publishedAt),
    Date.parse("2025-09-17T14:00:00-04:00"),
  );
  for (const quote of [...assets, ...overviewOptions]) {
    assert.ok(Date.parse(quote.asOf) <= Date.parse(demoNow), quote.id);
    assert.equal(quote.up, quote.change.startsWith("+"), quote.id);
    assert.ok(quote.points.length >= 8, quote.id);
  }
});

test("fictional project reports neither impersonate a public release nor imply a stock supplier", () => {
  for (const id of [
    "ai",
    "ai-reprint",
    "ai-correction",
    "power-grid",
    "power-video",
  ]) {
    assert.equal(source(id).url, "", id);
    assert.deepEqual(source(id).assets, [], id);
  }
  assert.equal(source("ai-reprint").duplicateOf, "ai");
  assert.deepEqual(source("ai-reprint").body, source("ai").body);
  assert.equal(source("ai-reprint").note, undefined);
  assert.equal(source("ai-correction").supersedes, "ai");
  assert.match(source("ai-correction").summary, /录入错误/);
  assert.match(source("ai-correction").summary, /并非宣布新增延期/);
  // Links for researched pieces identify a specific supporting document, not a homepage.
  for (const item of sourceItems.filter((item) => item.url))
    assert.ok(
      new URL(item.url).pathname.split("/").filter(Boolean).length >= 3,
      item.id,
    );
});

test("every brief respects its own cutoff, including historic editions and personal choices", () => {
  for (const choices of [emptyChoices, defaultChoices]) {
    const editions = createBriefEditions(choices);
    assert.equal(editions[0].id, demoEdition);
    assert.equal(editions[0].cutoff, briefCutoff);
    for (const edition of editions) {
      assert.ok(edition.items.length > 0);
      for (const highlight of edition.items) {
        for (const ref of highlight.references) {
          const entry = resolveEntry(ref);
          assert.ok(entry, ref.id);
          assert.ok(
            Date.parse(entry.publishedAt) <= Date.parse(edition.cutoff),
          );
          for (const id of entry.sourceIds)
            assert.ok(
              Date.parse(source(id).receivedAt) <= Date.parse(edition.cutoff),
              id,
            );
        }
      }
    }
  }
  const merged = createBriefEditions(defaultChoices)[0].items.find(
    (item) => item.references.length > 1,
  );
  assert.deepEqual(
    merged.references.map((ref) => ref.id),
    ["ai", "power-grid"],
  );
  assert.doesNotMatch(merged.summary, /9 月|12 月/);
});

test("market examples agree across early observations, ordinary updates and quote snapshots", () => {
  const gold = assets.find((asset) => asset.id === "XAU");
  assert.ok(source("gold-update").summary.includes(gold.value));
  assert.ok(source("gold-update").summary.includes(gold.change.slice(1)));
  assert.equal(source("gold-update").supersedes, "gold");
  assert.equal(source("gold").note, undefined);
  // Both published percentage changes round to the same illustrative previous close.
  const earlyPreviousClose = 3658.2 / 1.0023;
  const laterPreviousClose = Number(gold.value.replaceAll(",", "")) / 1.0062;
  assert.ok(Math.abs(earlyPreviousClose - laterPreviousClose) < 0.1);
  assert.equal(((3672.4 / 3658.2 - 1) * 100).toFixed(2), "0.39");
  assert.equal(Math.round((1 - 0.61 / 0.84) * 100), 27);
  assert.ok(source("eth-fees").summary.includes("09:30"));
});

test("starter conversations cover all contextual entry points and use separate fixture storage", () => {
  assert.ok(
    demoConversations.some(
      (conversation) => conversation.reference?.kind === "item",
    ),
  );
  assert.ok(
    demoConversations.some(
      (conversation) => conversation.reference?.kind === "collection",
    ),
  );
  assert.ok(
    demoConversations.some(
      (conversation) => conversation.briefId === demoEdition,
    ),
  );
  assert.ok(
    demoConversations.some((conversation) => conversation.assetId === "NVDA"),
  );
  for (const key of ["saved", "read", "conversations", "brief-editions"])
    assert.notEqual(demoRecordKey(key), `sift-${key}`);
});

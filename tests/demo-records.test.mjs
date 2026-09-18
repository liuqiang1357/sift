import test from "node:test";
import assert from "node:assert/strict";
import {
  demoSaved,
  demoRead,
  demoConversations,
  createDemoState,
  createEmptyDemoState,
} from "../src/demo-records.ts";
import {
  parseRef,
  resolveEntry,
  selectFeed,
  migrateBriefEditions,
} from "../src/content.ts";
import {
  emptyChoices,
  defaultChoices,
  migrateReadingChoices,
} from "../src/reading-choices.ts";
import { defaultOverview } from "../src/market-overview.ts";
import { sourceItems, assets } from "../src/data.ts";
import { collections } from "../src/collections.ts";
import { readFileSync } from "node:fs";

test("starter records open existing content and include Chinese conversations", () => {
  assert.ok(demoSaved.length > 0);
  for (const id of [...demoSaved, ...demoRead])
    assert.ok(resolveEntry(parseRef(id)) || id === "brief-09.18");
  for (const conversation of demoConversations) {
    assert.ok(
      conversation.reference
        ? resolveEntry(conversation.reference)
        : conversation.assetId
          ? assets.some((asset) => asset.id === conversation.assetId)
          : createDemoState().editions.some(
              (edition) => edition.id === conversation.briefId,
            ),
    );
    assert.ok(conversation.messages.some((message) => message.role === "user"));
    assert.ok(
      conversation.messages.some((message) => message.role === "assistant"),
    );
    assert.ok(
      conversation.messages.every((message) =>
        /[\u3400-\u9fff]/u.test(message.text),
      ),
    );
  }
});

test("reset creates complete, independent demo records", () => {
  const state = createDemoState();
  const before = structuredClone(state);
  state.choices.sources.length = 0;
  state.conversations[0].messages[0].text = "edited";
  state.read.length = 0;
  state.editions[0].items.length = 0;
  assert.deepEqual(createDemoState(), before);
  assert.ok(before.choices.sources.length && before.choices.watchlist.length);
  assert.ok(
    before.choices.preferenceText.length &&
      before.saved.length &&
      before.read.length,
  );
  assert.ok(before.editions.every((edition) => edition.items.length > 0));
});

test("clearing removes personal records and preserves an unpersonalized demo after migration", () => {
  const state = createEmptyDemoState();
  assert.deepEqual(state.choices, emptyChoices);
  assert.deepEqual(state.overview, defaultOverview);
  for (const key of ["saved", "read", "conversations"])
    assert.deepEqual(state[key], [], key);
  assert.ok(state.editions.length > 0);
  assert.ok(
    state.editions.every(
      (edition) => !edition.personalized && edition.items.length > 0,
    ),
  );

  const persisted = JSON.parse(JSON.stringify(state));
  assert.deepEqual(
    migrateReadingChoices(persisted.choices, defaultChoices.preferenceText),
    emptyChoices,
  );
  assert.deepEqual(migrateBriefEditions(persisted.editions), state.editions);

  state.choices.sources.push("产业观察");
  state.saved.push("gold");
  state.overview.length = 0;
  state.editions[0].items.length = 0;
  assert.deepEqual(createEmptyDemoState(), persisted);
  assert.ok(createDemoState().saved.length > 0);
});

test("default feeds expose image and video stories with matching detail media", () => {
  for (const channel of ["关注", "推荐"]) {
    const feed = selectFeed({ channel, choices: createDemoState().choices });
    for (const kind of ["image", "video"]) {
      const entry = feed.find(
        (entry) => entry.ref.kind === "item" && entry.cover?.kind === kind,
      );
      assert.ok(entry, `${channel}: ${kind}`);
      const story = sourceItems.find((item) => item.id === entry.ref.id);
      assert.ok(
        story.body.some((section) =>
          section.media?.some((media) => media.src === entry.cover.src),
        ),
      );
    }
  }
  const saved = demoSaved
    .map((id) => resolveEntry(parseRef(id)))
    .filter(Boolean);
  assert.ok(saved.some((entry) => entry.cover?.kind === "image"));
  assert.ok(saved.some((entry) => entry.cover?.kind === "video"));
});

test("bundled media, posters and captions exist for every sample version", () => {
  const records = [
    ...sourceItems,
    ...collections.flatMap((item) => item.versions),
  ];
  const media = records.flatMap((item) => [
    ...(item.cover ? [item.cover] : []),
    ...(item.body?.flatMap((section) => section.media ?? []) ?? []),
  ]);
  const readAsset = (src) =>
    readFileSync(new URL(`../public${src}`, import.meta.url));
  for (const item of media) {
    assert.ok(readAsset(item.src).length > 0, item.src);
    if (item.kind === "video") {
      assert.ok(readAsset(item.poster).length > 0);
      assert.deepEqual(
        item.captions.map((track) => track.language),
        ["zh-CN", "en"],
      );
      for (const track of item.captions)
        assert.match(readAsset(track.src).toString(), /^WEBVTT/);
    }
  }
});

test("samples cover every asset and source, and demonstrate both ordinary updates and corrections", async () => {
  const { assets, sourceProfiles, sourceItems } =
    await import("../src/data.ts");
  const { browseContent, collectionEntries, hasUnreadChanges, entryNote } =
    await import("../src/content.ts");
  for (const asset of assets)
    assert.ok(browseContent("", asset.id).length, asset.id);
  for (const source of sourceProfiles)
    assert.ok(
      sourceItems.some((item) => item.source === source.id),
      source.id,
    );
  assert.ok(
    collectionEntries().filter((entry) => entry.type === "事件").length >= 2,
  );
  assert.ok(
    collectionEntries().filter((entry) => entry.type === "专题").length >= 2,
  );
  const history = demoRead.map((id) => resolveEntry(parseRef(id)));
  assert.ok(
    hasUnreadChanges(
      resolveEntry({ kind: "item", id: "gold-update" }),
      history,
    ),
  );
  assert.equal(
    entryNote(resolveEntry({ kind: "item", id: "gold" })),
    undefined,
  );
  assert.ok(entryNote(resolveEntry({ kind: "item", id: "ai" })));
  for (const item of sourceItems)
    assert.equal(
      sourceProfiles.filter((source) => source.id === item.source).length,
      1,
      item.id,
    );
  assert.equal(
    sourceItems.find((item) => item.id === "lin-ai").source,
    "林序 · 产业观察",
  );
});

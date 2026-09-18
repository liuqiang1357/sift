import test from "node:test";
import assert from "node:assert/strict";
import { linkExactDuplicates, duplicateRoot } from "../src/duplicates.ts";
import { sourceItems } from "../src/data.ts";

const original = sourceItems.find((item) => item.id === "ai");
const copy = (overrides = {}) => ({
  ...structuredClone(original),
  id: "copy",
  source: "Another publisher",
  title: "A different headline for the same text",
  publishedAt: "2025-09-18T09:00:00+08:00",
  receivedAt: "2025-09-18T09:01:00+08:00",
  ...overrides,
});

test("complete identical text is linked without changing publication records or input order", () => {
  const publication = copy();
  publication.body[0].paragraphs[0] += "\n  ";
  const input = [publication, original];
  const before = structuredClone(input);
  const output = linkExactDuplicates(input);
  assert.deepEqual(input, before);
  assert.deepEqual(
    output.map((item) => item.id),
    ["copy", "ai"],
  );
  assert.deepEqual(output[0], { ...publication, duplicateOf: "ai" });
  assert.equal(output[1], original);
  assert.deepEqual(linkExactDuplicates(output), output);
});

test("summaries, short text and media do not qualify for automatic collapsing", () => {
  for (const overrides of [
    { body: undefined },
    { body: [{ heading: "Short", paragraphs: ["Same short text"] }] },
    { cover: { kind: "image", src: "/sample.svg" } },
    { body: [{ ...original.body[0], media: [{ kind: "image" }] }] },
  ]) {
    const a = copy({ id: "a", ...overrides });
    const b = copy({ id: "b", ...overrides });
    assert.ok(linkExactDuplicates([a, b]).every((item) => !item.duplicateOf));
  }
});

test("changed numbers, dates, negation and additional facts stay separate", () => {
  for (const transform of [
    (text) => text.replace("9 月", "12 月"),
    (text) => text.replace("不代表", "代表"),
    (text) => text + " 项目已完成设备验收。",
  ]) {
    const changed = copy();
    changed.body = changed.body.map((section) => ({
      ...section,
      paragraphs: section.paragraphs.map(transform),
    }));
    assert.notDeepEqual(changed.body, original.body);
    assert.equal(
      linkExactDuplicates([original, changed])[1].duplicateOf,
      undefined,
    );
  }
});

test("reviewed links and non-matches are preserved; revision links are independent", () => {
  for (const overrides of [
    { duplicateOf: "reviewed-match" },
    { duplicateOf: null },
    { supersedes: "earlier-version" },
  ]) {
    const reviewed = copy(overrides);
    assert.deepEqual(linkExactDuplicates([original, reviewed])[1], reviewed);
  }
  const revised = copy({
    id: "revision",
    supersedes: original.id,
    source: original.source,
  });
  assert.equal(duplicateRoot(revised, [original, revised]), "revision");
  assert.equal(
    duplicateRoot(copy({ duplicateOf: original.id }), [original, revised]),
    "ai",
  );
});

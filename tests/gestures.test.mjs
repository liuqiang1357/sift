import test from "node:test";
import assert from "node:assert/strict";
import {
  adjacentTab,
  gestureIntent,
  pullDistance,
  refreshThreshold,
  swipeDirection,
} from "../src/gestures.ts";

const enabled = { swipe: true, refresh: true, atTop: true };

test("gestures distinguish taps, horizontal swipes and normal vertical scrolling", () => {
  assert.equal(gestureIntent(5, 4, enabled), "pending");
  assert.equal(gestureIntent(-40, 8, enabled), "swipe");
  assert.equal(gestureIntent(8, -40, enabled), "scroll");
  assert.equal(gestureIntent(35, 35, enabled), "scroll");
  assert.equal(gestureIntent(-40, 8, { ...enabled, swipe: false }), "scroll");
  assert.equal(swipeDirection(-80, 12), 1);
  assert.equal(swipeDirection(80, 12), -1);
  assert.equal(swipeDirection(35, 0), 0);
  assert.equal(swipeDirection(65, 60), 0);
});

test("refresh only starts at the top and requires a deliberate pull", () => {
  assert.equal(gestureIntent(8, 40, enabled), "pull");
  assert.equal(gestureIntent(8, 40, { ...enabled, atTop: false }), "scroll");
  assert.equal(gestureIntent(8, 40, { ...enabled, refresh: false }), "scroll");
  assert.ok(pullDistance(100) < refreshThreshold);
  assert.ok(pullDistance(150) >= refreshThreshold);
  assert.equal(pullDistance(-20), 0);
  assert.equal(pullDistance(1000), 88);
});

test("channel swipes stay within their group without wrapping or crossing modules", () => {
  const tabs = ["following", "recommended", "headlines", "features"];
  assert.equal(adjacentTab(tabs, "recommended", 1), "headlines");
  assert.equal(adjacentTab(tabs, "recommended", -1), "following");
  assert.equal(adjacentTab(tabs, "following", -1), undefined);
  assert.equal(adjacentTab(tabs, "features", 1), undefined);
  assert.equal(adjacentTab(tabs, "markets", 1), undefined);
});

import test from "node:test";
import assert from "node:assert/strict";
import { assets } from "../src/data.ts";
import { quoteChartTimes } from "../src/quotes.ts";
import {
  defaultOverview,
  overviewOptions,
  toggleOverview,
  moveOverview,
} from "../src/market-overview.ts";
import { createDemoState } from "../src/demo-records.ts";

test("overview defaults are complementary and previous selections remain available", () => {
  assert.deepEqual(defaultOverview, ["SPX", "US10Y", "DXY"]);
  assert.deepEqual(createDemoState().overview, defaultOverview);
  const old = ["SPX", "IXIC", "DXY"];
  assert.ok(
    old.every((id) => overviewOptions.some((option) => option.id === id)),
  );
  const changed = toggleOverview(toggleOverview(old, "IXIC"), "US10Y");
  assert.deepEqual(moveOverview(changed, "US10Y", -1), defaultOverview);
  assert.deepEqual(old, ["SPX", "IXIC", "DXY"]);
});

test("yields, index levels and asset prices retain distinct units and change periods", () => {
  const quote = (id) =>
    overviewOptions.find((q) => q.id === id) ?? assets.find((q) => q.id === id);
  assert.equal(quote("US10Y").unit, "%");
  assert.equal(quote("US10Y").change, "+3 bp");
  assert.equal(quote("US10Y").status, "日度");
  assert.equal(quote("SPX").unit, "点");
  assert.equal(quote("DXY").unit, "点");
  for (const id of ["NVDA", "AAPL"]) {
    assert.equal(quote(id).unit, "USD");
    assert.equal(quote(id).changePeriod, "较前收盘");
    assert.equal(quote(id).status, "收盘");
  }
  for (const id of ["BTC", "ETH"])
    assert.equal(quote(id).changePeriod, "24 小时");
  assert.equal(quote("XAU").unit, "USD/oz");
});

test("chart time ranges respect each quote's session and timestamp", () => {
  for (const asset of assets) {
    for (const [period, days] of [
      ["日内", 1],
      ["一周", 7],
      ["一月", 30],
    ]) {
      const times = quoteChartTimes(asset, period).map(Date.parse);
      assert.equal(times.at(-1), Date.parse(asset.asOf));
      assert.equal(
        times[0],
        period === "日内" && asset.sessionStart
          ? Date.parse(asset.sessionStart)
          : Date.parse(asset.asOf) - days * 86400000,
      );
      assert.ok(times.every((time, i) => i === 0 || time > times[i - 1]));
    }
  }
});

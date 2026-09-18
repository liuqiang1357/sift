import { assets } from "./data.ts";
import type { MarketQuote } from "./quotes.ts";

export const defaultOverview = ["SPX", "US10Y", "DXY"];
export const overviewOptions: (MarketQuote & { id: string; name: string })[] = [
  {
    id: "SPX",
    name: "标普 500",
    value: "6,602.90",
    unit: "点",
    change: "+0.54%",
    changePeriod: "较前收盘",
    asOf: "2025-09-17T16:00:00-04:00",
    status: "收盘",
    up: true,
    points: [24, 32, 28, 43, 37, 50, 46, 62, 57, 72, 68, 80],
  },
  {
    id: "IXIC",
    name: "纳斯达克综合",
    value: "22,240.60",
    unit: "点",
    change: "+0.65%",
    changePeriod: "较前收盘",
    asOf: "2025-09-17T16:00:00-04:00",
    status: "收盘",
    up: true,
    points: [20, 35, 30, 47, 38, 42, 58, 51, 69, 62, 78, 84],
  },
  {
    id: "US10Y",
    name: "美债 10 年期",
    value: "4.08",
    unit: "%",
    change: "+3 bp",
    changePeriod: "较前一日",
    asOf: "2025-09-17T15:30:00-04:00",
    status: "日度",
    up: true,
    points: [32, 40, 37, 45, 42, 50, 46, 58, 54, 63, 60, 68],
  },
  {
    id: "DXY",
    name: "美元指数",
    value: "96.98",
    unit: "点",
    change: "−0.21%",
    changePeriod: "较前收盘",
    asOf: "2025-09-18T10:30:00+08:00",
    status: "快照",
    up: false,
    points: [78, 70, 76, 59, 64, 51, 57, 42, 48, 35, 39, 26],
  },
  ...assets.filter((asset) => ["BTC", "ETH", "XAU"].includes(asset.id)),
];

export function toggleOverview(ids: string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((value) => value !== id);
  if (ids.length >= 3 || !overviewOptions.some((option) => option.id === id))
    return ids;
  return [...ids, id];
}

export function moveOverview(
  ids: string[],
  id: string,
  direction: -1 | 1,
): string[] {
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

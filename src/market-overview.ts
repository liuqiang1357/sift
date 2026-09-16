import { assets } from "./data";

export const defaultOverview = ["SPX", "IXIC", "DXY"];
export const overviewOptions = [
  {
    id: "SPX",
    name: "标普 500",
    price: "5,634.58",
    change: "+0.54%",
    up: true,
  },
  {
    id: "IXIC",
    name: "纳斯达克",
    price: "17,683.98",
    change: "+0.65%",
    up: true,
  },
  { id: "DXY", name: "美元指数", price: "100.72", change: "−0.18%", up: false },
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

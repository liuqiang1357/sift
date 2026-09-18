export type GestureIntent = "pending" | "swipe" | "pull" | "scroll";

export const refreshThreshold = 60;

export function gestureIntent(
  dx: number,
  dy: number,
  options: { swipe: boolean; refresh: boolean; atTop: boolean },
): GestureIntent {
  const x = Math.abs(dx);
  const y = Math.abs(dy);
  if (Math.max(x, y) < 12) return "pending";
  if (x > y * 1.4) return options.swipe ? "swipe" : "scroll";
  if (y > x * 1.4)
    return options.refresh && options.atTop && dy > 0 ? "pull" : "scroll";
  return Math.max(x, y) > 28 ? "scroll" : "pending";
}

export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.4) return 0;
  return dx < 0 ? 1 : -1;
}

export function pullDistance(dy: number) {
  return Math.min(88, Math.max(0, dy) * 0.45);
}

export function adjacentTab<T>(tabs: readonly T[], current: T, step: -1 | 1) {
  const index = tabs.indexOf(current);
  return index < 0 ? undefined : tabs[index + step];
}

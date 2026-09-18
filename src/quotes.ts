// Display metadata belongs to each quote, not to the active market tab.
export type MarketQuote = {
  value: string;
  unit: "USD" | "USD/oz" | "点" | "%";
  change: string;
  changePeriod: "较前收盘" | "较前一日" | "24 小时";
  asOf: string;
  status: "收盘" | "日度" | "快照";
  sessionStart?: string;
  up: boolean;
  points: number[];
};

// Sample chart labels end at the quote timestamp, never at the current clock.
export function quoteChartTimes(quote: MarketQuote, period: string): string[] {
  const end = Date.parse(quote.asOf);
  const days = period === "一周" ? 7 : period === "一月" ? 30 : 1;
  const start =
    period === "日内" && quote.sessionStart
      ? Date.parse(quote.sessionStart)
      : end - days * 86400000;
  return Array.from({ length: 4 }, (_, i) =>
    new Date(start + ((end - start) * i) / 3).toISOString(),
  );
}

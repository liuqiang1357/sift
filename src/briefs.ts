import type { ContentRef } from "./collections.ts";
import type { ContentNote } from "./data.ts";

export type BriefHighlight = {
  id: string;
  title: string;
  summary: string;
  references: ContentRef[];
  note?: ContentNote;
};
export type BriefEdition = {
  id: string;
  cutoff: string;
  items: BriefHighlight[];
  personalized: boolean;
};

// Prewritten synthesis demonstrates the production output; no model runs in the demo.
// Related developments are grouped explicitly, never inferred from shared topics.
export const briefDrafts: BriefHighlight[] = [
  {
    id: "power-delivery",
    title: "松岭园区推进一期建设，接入条件尚待落实",
    summary:
      "两份报道指向同一座园区：一期规划 24 MW，设备采购与接入评估并行。园区尚未公布商用日期，跟进重点是接入审批、联调和负载测试。",
    references: [
      {
        kind: "item",
        id: "ai",
      },
      {
        kind: "item",
        id: "power-grid",
      },
    ],
  },
  {
    id: "policy-outlook",
    title: "美联储降息 25 个基点，后续路径仍看数据",
    summary:
      "政策目标区间降至 4.00%—4.25%。声明更关注就业下行风险，同时指出通胀仍偏高；这次决定不能直接外推成连续降息。",
    references: [
      {
        kind: "item",
        id: "fed",
      },
    ],
  },
  {
    id: "gold-rates",
    title: "黄金早盘小幅走高，先区分政策利率与实际利率",
    summary:
      "截至 08:10，黄金为每盎司 3,658.20 美元，较前收盘涨 0.23%。政策降息已落地，后续仍需把美元、实际利率和资金流放在一致的时间窗口内观察。",
    references: [
      {
        kind: "item",
        id: "gold",
      },
    ],
  },
  {
    id: "bitcoin-positioning",
    title: "比特币站上 11.6 万美元，费率变化仍温和",
    summary:
      "截至 08:30，比特币 24 小时涨 1.84%，8 小时资金费率为 0.006%。价格和费率暂未同步升温，还需结合现货成交和未平仓合约判断资金结构。",
    references: [
      {
        kind: "item",
        id: "btc",
      },
    ],
  },
];

// Only the old demo reused this mistaken summary. Keep its explicit note on migration.
export const legacyBriefNotes: Record<string, ContentNote> = {
  "collection:datacenter-expansion:1": {
    text: "供电项目的交付月份应为 12 月，本条摘要误写为 9 月。",
    publishedAt: "2025-09-18T10:06:00+08:00",
  },
};

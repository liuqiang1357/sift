import { powerFeature } from "./longform.ts";
import type { EvidenceSection } from "./longform.ts";
import { powerVideo } from "./media.ts";
import type { VisualMedia } from "./media.ts";
import type { ContentNote } from "./data.ts";

export type ContentRef =
  | { kind: "item"; id: string }
  | { kind: "collection"; id: string; version: number };

export type MaterialRole = "main" | "background" | "viewpoint";
export type CollectionVersion = {
  version: number;
  title: string;
  summary: string;
  cutoff: string;
  publishedAt: string;
  progressAt: string;
  change?: string;
  note?: ContentNote;
  points: { text: string; sourceIds: string[] }[];
  body?: EvidenceSection[];
  cover?: VisualMedia;
  materials: { sourceId: string; role: MaterialRole }[];
};
export type ContentCollection = {
  id: string;
  kind: "event" | "feature";
  topics: string[];
  assets: string[];
  focusAssets?: string[];
  importance: 1 | 2 | 3;
  // Navigation links only: summaries and evidence never inherit from these collections.
  related?: { id: string; reason: string }[];
  versions: CollectionVersion[];
};

// Published versions are snapshots. A source can support several collections.
export const collections: ContentCollection[] = [
  {
    id: "datacenter-expansion",
    related: [
      {
        id: "ai-power",
        reason: "从松岭园区继续了解电网接入与长期用电需求。",
      },
    ],
    kind: "event",
    topics: ["AI 与科技", "能源与电力"],
    assets: [],
    importance: 2,
    versions: [
      {
        version: 1,
        title: "松岭园区扩建：一期 24 MW，接入条件待落实",
        note: {
          text: "供电项目的交付月份应为 12 月，本条摘要误写为 9 月。",
          publishedAt: "2025-09-18T10:06:00+08:00",
        },
        summary:
          "园区规划分两期建设，原稿预计供电设备 9 月交付；另一份跟进确认，接入方案仍在评估。",
        cutoff: "2025-09-18T09:10:00+08:00",
        publishedAt: "2025-09-18T09:12:00+08:00",
        progressAt: "2025-09-18T08:58:00+08:00",
        points: [
          {
            text: "总规划为 48 MW，一期为 24 MW；服务器、冷却和供电设备纳入本轮建设。",
            sourceIds: ["ai"],
          },
          {
            text: "原稿预计供电设备 9 月交付，但没有公布商用日期。",
            sourceIds: ["ai"],
          },
          {
            text: "接入评估与设备采购并行；正式运行仍需联调和负载测试。",
            sourceIds: ["power-grid"],
          },
        ],
        materials: [
          {
            sourceId: "ai",
            role: "main",
          },
          {
            sourceId: "ai-reprint",
            role: "main",
          },
          {
            sourceId: "power-grid",
            role: "main",
          },
        ],
      },
      {
        version: 2,
        title: "松岭园区：交付月份更正，接入评估仍在推进",
        summary:
          "供电设备应为 12 月交付，原稿的 9 月为录入错误；一期 24 MW 的规模不变，正式投运日期尚未公布。",
        cutoff: "2025-09-18T10:06:00+08:00",
        publishedAt: "2025-09-18T10:10:00+08:00",
        progressAt: "2025-09-18T10:05:00+08:00",
        change: "更正报道中的月份，不代表项目新增延期。",
        points: [
          {
            text: "来源将供电设备交付由 9 月更正为 12 月，说明原稿录入有误。",
            sourceIds: ["ai-correction"],
          },
          {
            text: "48 MW 总规划、24 MW 一期规模及其他建设安排均未改变。",
            sourceIds: ["ai-correction"],
          },
          {
            text: "设备交付与投运是不同节点：接入方案仍在评估，负载测试和商用时间待定。",
            sourceIds: ["power-grid"],
          },
        ],
        materials: [
          {
            sourceId: "ai-correction",
            role: "main",
          },
          {
            sourceId: "power-grid",
            role: "main",
          },
        ],
      },
    ],
  },
  {
    id: "ai-power",
    related: [
      {
        id: "datacenter-expansion",
        reason: "查看松岭园区的具体项目进度与交付日期更正。",
      },
    ],
    kind: "feature",
    topics: ["AI 与科技", "能源与电力"],
    assets: [],
    importance: 2,
    versions: [
      {
        version: 1,
        title: "AI 扩建的下一道关：从供电设备到可用算力",
        note: {
          text: "文中供电项目的交付月份应为 12 月，原文误写为 9 月。",
          publishedAt: "2025-09-18T10:06:00+08:00",
        },
        summary:
          "从松岭园区的 24 MW 一期计划出发，结合 IEA 用电预测，拆开建设、接入与实际运行。",
        cutoff: "2025-09-18T09:10:00+08:00",
        publishedAt: "2025-09-18T09:25:00+08:00",
        progressAt: "2025-09-18T09:25:00+08:00",
        points: [
          {
            text: "园区计划建设一期 24 MW；原稿将设备交付写为 9 月。",
            sourceIds: ["ai"],
          },
          {
            text: "IEA 的 2030 年基准情景为约 945 TWh。全球需求预测不等于某座园区已经具备接入条件。",
            sourceIds: ["power-background"],
          },
          {
            text: "把事实、计划与解释分开，才能区分设备到场、园区投运和投资回报。",
            sourceIds: ["view"],
          },
        ],
        materials: [
          {
            sourceId: "ai",
            role: "main",
          },
          {
            sourceId: "power-background",
            role: "background",
          },
          {
            sourceId: "view",
            role: "viewpoint",
          },
        ],
      },
      {
        version: 2,
        title: "AI 扩建的下一道关：从供电设备到可用算力",
        summary:
          "从松岭园区的 24 MW 一期计划出发，结合 IEA 用电预测，拆开建设、接入与实际运行。",
        cutoff: "2025-09-18T10:06:00+08:00",
        publishedAt: "2025-09-18T10:20:00+08:00",
        progressAt: "2025-09-18T10:05:00+08:00",
        change: "修正松岭园区交付月份，保留对全球需求与本地约束的区分。",
        body: powerFeature,
        cover: powerVideo,
        points: [
          {
            text: "园区一期 24 MW，设备交付应为 12 月；这是报道更正，不是新增延期。",
            sourceIds: ["ai-correction"],
          },
          {
            text: "IEA 的 2030 年基准情景为约 945 TWh。全球需求预测不等于某座园区已经具备接入条件。",
            sourceIds: ["power-background"],
          },
          {
            text: "把事实、计划与解释分开，才能区分设备到场、园区投运和投资回报。",
            sourceIds: ["view"],
          },
        ],
        materials: [
          {
            sourceId: "ai-correction",
            role: "main",
          },
          {
            sourceId: "power-background",
            role: "background",
          },
          {
            sourceId: "view",
            role: "viewpoint",
          },
        ],
      },
    ],
  },
  {
    id: "rates-and-assets",
    kind: "feature",
    topics: ["宏观经济", "国债与利率"],
    assets: ["XAU"],
    importance: 2,
    versions: [
      {
        version: 1,
        title: "降息之后，黄金与长端利率为什么可能不同步？",
        summary:
          "把已公布的 25 个基点降息、黄金早盘价格和长期政策预期放在各自的时间范围内理解。",
        cutoff: "2025-09-18T09:21:00+08:00",
        publishedAt: "2025-09-18T09:28:00+08:00",
        progressAt: "2025-09-18T09:28:00+08:00",
        points: [
          {
            text: "本次决定将政策目标区间降至 4.00%—4.25%，但没有承诺下一次降息。",
            sourceIds: ["fed"],
          },
          {
            text: "黄金早盘为每盎司 3,658.20 美元；政策利率、实际利率与美元是不同的观察维度。",
            sourceIds: ["gold"],
          },
          {
            text: "价格可能已经反映部分预期，不能只用公告标题解释市场反应。",
            sourceIds: ["view"],
          },
        ],
        materials: [
          {
            sourceId: "fed",
            role: "main",
          },
          {
            sourceId: "gold",
            role: "background",
          },
          {
            sourceId: "view",
            role: "viewpoint",
          },
        ],
      },
    ],
  },
  {
    id: "ethereum-network",
    kind: "event",
    topics: ["加密资产"],
    assets: ["ETH"],
    focusAssets: ["ETH"],
    importance: 2,
    versions: [
      {
        version: 1,
        title: "以太坊活动分化：费用降约 27%，二层交易增 8%",
        summary:
          "同一 24 小时窗口内，主网平均交易费由 0.84 美元降至 0.61 美元；执行活动增加不等于主网收入同比例增长。",
        cutoff: "2025-09-18T09:49:00+08:00",
        publishedAt: "2025-09-18T09:55:00+08:00",
        progressAt: "2025-09-18T09:48:00+08:00",
        points: [
          {
            text: "截至 09:30，所跟踪二层网络交易笔数增加 8%，主网平均交易费下降约 27%；笔数不等于用户数。",
            sourceIds: ["eth-fees"],
          },
          {
            text: "Rollup 将执行与主网结算分开，批次压缩、提交频率和 blob 费用都会影响收入捕获。",
            sourceIds: ["eth-report"],
          },
        ],
        materials: [
          {
            sourceId: "eth-fees",
            role: "main",
          },
          {
            sourceId: "eth-report",
            role: "main",
          },
        ],
      },
    ],
  },
];

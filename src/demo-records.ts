import { createBriefEditions } from "./content.ts";
import type { ReadingContext } from "./content.ts";
import { defaultChoices, emptyChoices } from "./reading-choices.ts";
import { defaultOverview } from "./market-overview.ts";
export type Message = { role: "user" | "assistant"; text: string };
export type Conversation = ReadingContext & {
  id: string;
  context: string;
  messages: Message[];
};

export const demoSaved = [
  "brief-09.18",
  "power-video",
  "nvda-delivery",
  "collection:ai-power:1",
  "collection:ethereum-network:1",
  "power-background",
  "view",
  "ai",
  "gold",
];
export const demoRead = [
  "gold",
  "collection:ai-power:1",
  "ai",
  "fed",
  "view",
  "microsoft-capex",
];
export const demoConversations: Conversation[] = [
  {
    id: "demo-pine-ridge",
    context: "松岭园区扩建：一期 24 MW，供电设备列入交付计划",
    messages: [
      {
        role: "user",
        text: "一期 24 MW 就是已经开始用电了吗？",
      },
      {
        role: "assistant",
        text: "不是。24 MW 是一期规划的额定容量，原稿没有提供实际负载或投运记录。设备采购、接入审批和负载测试是三个不同节点。\n\n这份原稿的交付月份也已被更正为 12 月，可以回到引用内容查看更正说明。",
      },
      {
        role: "user",
        text: "那是项目延期了三个月吗？",
      },
      {
        role: "assistant",
        text: "目前材料只确认报道把月份写错：9 月应为 12 月。它没有宣布项目本次新增三个月延期。后续应看接入方案是否获批，以及联调和商用日期。",
      },
    ],
    reference: {
      kind: "item",
      id: "ai",
    },
  },
  {
    id: "demo-gold-rates",
    context: "降息落地后的黄金：先看美元，再看长端利率",
    messages: [
      {
        role: "user",
        text: "降息了，为什么还要看长端利率？",
      },
      {
        role: "assistant",
        text: "政策目标区间是短端利率工具，黄金还受实际利率和美元影响。长端收益率包含对未来政策和期限溢价的判断，未必跟着本次政策利率同幅下降。\n\n这条引用记录的是 08:10、每盎司 3,658.20 美元；后续价格更新不会改写这份早盘记录。",
      },
    ],
    reference: {
      kind: "item",
      id: "gold",
    },
  },
  {
    id: "demo-power-feature",
    context: "AI 扩建的下一道关：从供电设备到可用算力",
    messages: [
      {
        role: "user",
        text: "IEA 的 945 TWh 能说明这个园区会缺电吗？",
      },
      {
        role: "assistant",
        text: "不能。945 TWh 是 IEA 对 2030 年全球数据中心用电的基准预测；松岭园区的 24 MW 是一期额定功率，两者的单位、范围和时间都不同。\n\n判断园区进度，要看当地接入审批和负载测试。当前引用的是专题初版，交付月份已有更正，可打开最新整理继续核对。",
      },
    ],
    reference: {
      kind: "collection",
      id: "ai-power",
      version: 1,
    },
  },
  {
    id: "demo-daily-brief",
    context: "09.18 每日简报",
    messages: [
      {
        role: "user",
        text: "这期简报为什么没有上午 10:05 的更正？",
      },
      {
        role: "assistant",
        text: "这期简报的材料截点是 09:30。10:05 发布、10:06 收到的更正出现在截点之后，所以不会被补写进本期原始摘要。\n\n如果本期引用了相关报道，可以从依据进入原文，再查看更正说明和最新版本。简报保留当时的记录，后续变化由内容版本承接。",
      },
    ],
    briefId: "09.18",
  },
  {
    id: "demo-nvidia-asset",
    context: "英伟达 · NVDA",
    messages: [
      {
        role: "user",
        text: "行情里的涨幅和财报的增长率能直接比吗？",
      },
      {
        role: "assistant",
        text: "不能。行情的 +1.12% 是相对前一交易日收盘的股价变化；财报的 56% 是季度收入同比增长。它们衡量不同对象，时间窗口也不同。\n\n英伟达这份财报截至 2025 年 7 月 27 日，数据中心收入为 411 亿美元。可以从资产相关内容进入财报图解，再核对业务增长和下一季指引。",
      },
    ],
    assetId: "NVDA",
  },
];

export function createDemoState() {
  const choices = structuredClone(defaultChoices);
  return {
    choices,
    overview: [...defaultOverview],
    saved: [...demoSaved],
    read: [...demoRead],
    conversations: structuredClone(demoConversations),
    editions: createBriefEditions(choices),
  };
}

export function createEmptyDemoState(): ReturnType<typeof createDemoState> {
  const choices = structuredClone(emptyChoices);
  return {
    choices,
    overview: [...defaultOverview],
    saved: [],
    read: [],
    conversations: [],
    editions: createBriefEditions(choices),
  };
}

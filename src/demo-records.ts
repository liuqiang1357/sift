export type Message = { role: "user" | "assistant"; text: string };
export type Conversation = { id: string; context: string; messages: Message[] };

export const demoSaved = ["brief-09.16", "ai", "gold"];
export const demoRead = ["ai", "gold"];
export const demoConversations: Conversation[] = [
  {
    id: "demo-ai-infrastructure",
    context: "算力需求的下一站，是电力与基础设施",
    messages: [
      { role: "user", text: "为什么 AI 的发展会影响电力基础设施？" },
      {
        role: "assistant",
        text: "这是一段中文演示对话，未检索实时资料。\n\n数据中心运行需要持续供电。随着计算需求增加，配套投资可能延伸至供电、散热和电网连接。\n\n但需求增长不等于收入已经兑现。还需要核对订单、项目进度和实际利用率。",
      },
      { role: "user", text: "那我接下来应该关注什么？" },
      {
        role: "assistant",
        text: "可以把观察重点分成三项：\n\n1. 企业公布的资本开支与项目交付进度。\n2. 数据中心的供电能力和利用率。\n3. 订单转化为收入的时间。\n\n这些是示例研究方向，不是实时判断或投资建议。",
      },
    ],
  },
  {
    id: "demo-gold-yields",
    context: "黄金保持韧性，实际利率仍是关键变量",
    messages: [
      { role: "user", text: "黄金上涨，就说明市场预期降息吗？" },
      {
        role: "assistant",
        text: "不能只靠一次价格上涨得出这个结论。实际利率、美元和避险需求都可能影响黄金。\n\n本 Demo 中的涨幅是固定样本。判断真实行情时，应结合相同时间范围的数据，并区分相关性与因果关系。",
      },
    ],
  },
];

export function addMissingRecords<T>(
  existing: T[],
  examples: T[],
  key: (item: T) => string,
): T[] {
  const ids = new Set(existing.map(key));
  return [...existing, ...examples.filter((item) => !ids.has(key(item)))];
}

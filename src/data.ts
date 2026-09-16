export type Story = {
  id: string;
  title: string;
  summary: string;
  topic: string;
  assets: string[];
  source: string;
  author?: string;
  time: string;
  type: string;
  points: string[];
  reason: string;
  url: string;
};
export const stories: Story[] = [
  {
    id: "fed",
    title: "降息预期升温，市场还在等待下一份答案",
    summary: "通胀放缓与就业韧性并存。比方向更重要的，是宽松兑现的节奏。",
    topic: "宏观经济",
    assets: ["BTC", "NVDA"],
    source: "美联储 · 情景示例",
    time: "09:20",
    type: "进展",
    points: [
      "通胀回落强化了宽松预期，但单月数据不足以确认趋势。",
      "成长股与加密资产均受流动性预期影响，关注后续就业数据。",
    ],
    reason: "你关注了美联储与 BTC",
    url: "https://www.federalreserve.gov/",
  },
  {
    id: "ai",
    title: "算力需求的下一站，是电力与基础设施",
    summary: "从芯片订单到数据中心供电，AI 资本开支正在沿产业链传导。",
    topic: "AI 与科技",
    assets: ["NVDA"],
    source: "产业观察 · 情景示例",
    time: "08:45",
    type: "资讯",
    points: [
      "示例情景中，数据中心投资从服务器延伸至电力配套。",
      "订单增长与收入兑现存在时间差，仍需核对利用率和交付进度。",
    ],
    reason: "你关注了 AI 与科技",
    url: "https://investor.nvidia.com/",
  },
  {
    id: "btc",
    title: "比特币走高，资金费率却保持平静",
    summary:
      "价格与衍生品数据没有给出同一个信号，当前涨幅尚不足以说明资金拥挤。",
    topic: "加密资产",
    assets: ["BTC", "ETH"],
    source: "市场数据 · 情景示例",
    time: "08:32",
    type: "异动",
    points: [
      "示例价格在 24 小时内上涨 2.34%，资金费率未同步显著抬升。",
      "价格与费率相关但不构成确定因果，目前没有足够证据解释此次变化。",
    ],
    reason: "你关注了 BTC",
    url: "https://www.coingecko.com/",
  },
  {
    id: "gold",
    title: "黄金保持韧性，实际利率仍是关键变量",
    summary: "美元与利率预期交织，单日价格变化不足以确认长期趋势。",
    topic: "全球市场",
    assets: ["XAU"],
    source: "全球市场观察 · 情景示例",
    time: "08:10",
    type: "资讯",
    points: [
      "示例行情中，黄金价格上涨 0.68%。",
      "关注实际利率、美元和风险偏好的共同变化。",
    ],
    reason: "拓展视野 · 全球市场",
    url: "https://www.gold.org/",
  },
  {
    id: "view",
    title: "看懂一轮行情，先区分预期和事实",
    summary: "研究者林序认为，价格先行并不意味着基本面已经兑现。",
    topic: "宏观经济",
    assets: ["NVDA", "BTC"],
    source: "林序 · 虚构作者",
    author: "林序",
    time: "07:50",
    type: "观点",
    points: [
      "作者观点：“价格交易的是预期，研究要不断回到事实。”",
      "AI 解读：可以记录待验证的指标，但不应把观点当作已证实的结论。",
    ],
    reason: "与你关注的宏观主题相关",
    url: "https://www.federalreserve.gov/",
  },
];
export const assets = [
  {
    id: "NVDA",
    name: "英伟达",
    market: "美股",
    price: "128.40",
    change: "+1.22%",
    up: true,
    color: "#65a443",
    points: [32, 38, 35, 45, 42, 58, 48, 54, 70, 65, 76, 72],
  },
  {
    id: "BTC",
    name: "比特币",
    market: "加密资产",
    price: "64,285.30",
    change: "+2.34%",
    up: true,
    color: "#f19c38",
    points: [20, 28, 25, 39, 36, 45, 57, 50, 68, 63, 70, 80],
  },
  {
    id: "ETH",
    name: "以太坊",
    market: "加密资产",
    price: "2,645.80",
    change: "−0.86%",
    up: false,
    color: "#7b82a9",
    points: [78, 64, 70, 57, 60, 48, 54, 39, 44, 32, 39, 27],
  },
  {
    id: "AAPL",
    name: "苹果",
    market: "美股",
    price: "226.78",
    change: "+0.42%",
    up: true,
    color: "#777e8d",
    points: [30, 35, 31, 44, 40, 43, 50, 47, 59, 54, 61, 65],
  },
  {
    id: "XAU",
    name: "现货黄金",
    market: "商品",
    price: "2,578.20",
    change: "+0.68%",
    up: true,
    color: "#c39b3d",
    points: [35, 32, 40, 38, 46, 52, 48, 58, 52, 65, 62, 72],
  },
];
export const topics = ["宏观经济", "AI 与科技", "加密资产", "全球市场"];
export const sourceNames = ["美联储", "产业观察", "市场数据", "全球市场观察"];
export const sections = [
  {
    id: "brief",
    name: "今日简报",
    en: "DAILY BRIEF",
    description: "用几分钟，看清今天的重要变化。",
    purpose: "定时总结，有始有终",
    details: [
      "跨来源合并同一事件，突出本期变化。",
      "有截止时间，保留历史版本。",
      "从摘要进入事实与依据，再继续追问。",
    ],
  },
  {
    id: "explore",
    name: "探索资讯",
    en: "DISCOVER",
    description: "跟进你关心的，也看见新的可能。",
    purpose: "主动查找，自由探索",
    details: [
      "关注看更新，推荐看相关，热门看全局。",
      "浏览不等于喜欢，偏好由你明确表达。",
      "用搜索与主题直接找到所需内容。",
    ],
  },
  {
    id: "markets",
    name: "市场行情",
    en: "MARKETS",
    description: "价格之外，理解变化的来由。",
    purpose: "行情与资讯，在一起",
    details: [
      "自选与关注资产使用同一份数据。",
      "价格、走势与相关资讯相互连接。",
      "标明数据时间，不把关注当作持仓。",
    ],
  },
  {
    id: "profile",
    name: "个人空间",
    en: "YOUR SPACE",
    description: "你的关注，你来决定。",
    purpose: "偏好清楚，控制直接",
    details: [
      "统一管理关注、偏好与收藏。",
      "偏好可编辑、可清空，不建立隐形画像。",
      "语言和主题设置实时生效。",
    ],
  },
  {
    id: "onboarding",
    name: "首次使用",
    en: "GET STARTED",
    description: "选择几个方向，就可以开始。",
    purpose: "先提供价值，再完善偏好",
    details: [
      "一页完成兴趣选择，也可以跳过。",
      "没有偏好时提供通用简报。",
      "随时回来修改，无需连接外部账号。",
    ],
  },
];

export const authors = [
  {
    id: "林序",
    bio: "关注宏观经济与资产定价，习惯从数据出发，区分市场预期与已知事实。",
    label: "宏观研究 · 虚构作者",
  },
];

import type { MarketQuote } from "./quotes.ts";
import {
  datacenterReport,
  deliveryReport,
  powerExplainer,
  powerReport,
  researchEssay,
} from "./longform.ts";
import type { ArticleSection } from "./longform.ts";
import { revenueDiagram, powerDiagram, powerVideo } from "./media.ts";
import type { VisualMedia } from "./media.ts";
import { linkExactDuplicates } from "./duplicates.ts";

// An explicit editorial note, separate from the published text. Never inherited.
export type ContentNote = {
  text: string;
  publishedAt: string;
};

export type SourceItem = {
  id: string;
  title: string;
  summary: string;
  topics: string[];
  assets: string[];
  // Only explicit asset references belong here; focusAssets are the main subjects.
  focusAssets?: string[];
  // One source profile per item, including any author/publication combination.
  source: string;
  publishedAt: string;
  receivedAt: string;
  importance: 1 | 2 | 3;
  // Exact publication match; null keeps a reviewed non-match separate.
  duplicateOf?: string | null;
  // A newer version published by this same source.
  supersedes?: string;
  change?: string;
  note?: ContentNote;
  type: string;
  points: string[];
  body?: ArticleSection[];
  cover?: VisualMedia;
  url: string;
};
export const sourceItems: SourceItem[] = linkExactDuplicates([
  {
    id: "fed",
    title: "美联储降息 25 个基点，目标区间降至 4.00%—4.25%",
    summary:
      "9 月决议将就业下行风险放在更显著的位置，同时指出通胀仍偏高；后续政策继续取决于数据。",
    topics: ["宏观经济", "国债与利率"],
    assets: [],
    source: "美联储",
    publishedAt: "2025-09-18T02:00:00+08:00",
    receivedAt: "2025-09-18T02:01:00+08:00",
    importance: 3,
    type: "报道",
    points: [
      "美联储于美国东部时间 9 月 17 日 14:00 公布决议，将联邦基金利率目标区间下调 25 个基点至 4.00%—4.25%。",
      "声明指出就业增长放缓、就业下行风险上升，同时通胀仍然偏高。后续调整将评估数据、前景和风险平衡，并未承诺连续降息。",
    ],
    url: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20250917a.htm",
  },
  {
    id: "ai",
    note: {
      text: "文中供电项目的交付月份应为 12 月，原文误写为 9 月。",
      publishedAt: "2025-09-18T10:06:00+08:00",
    },
    title: "松岭园区扩建：一期 24 MW，供电设备列入交付计划",
    summary:
      "园区总规划 48 MW，分两期推进；服务器供应商和正式商用日期尚未公布。",
    topics: ["AI 与科技", "能源与电力"],
    assets: [],
    source: "产业观察",
    publishedAt: "2025-09-18T08:45:00+08:00",
    receivedAt: "2025-09-18T08:46:00+08:00",
    importance: 2,
    type: "报道",
    points: [
      "本轮建设覆盖服务器、冷却和变配电设备；原稿将供电设备预计交付月份写为 9 月。",
      "一期额定容量为 24 MW，不代表园区已经按这一负载运行。",
    ],
    url: "",
    body: datacenterReport,
  },
  {
    id: "power-grid",
    title: "松岭园区跟进：接入方案仍在评估，暂未确定投运日期",
    summary: "接入评估与设备采购并行推进；正式商用仍要经过线路联调和负载测试。",
    topics: ["AI 与科技", "能源与电力"],
    assets: [],
    source: "全球市场观察",
    publishedAt: "2025-09-18T08:58:00+08:00",
    receivedAt: "2025-09-18T08:59:00+08:00",
    importance: 1,
    type: "报道",
    points: [
      "本条跟进同一座松岭园区：一期 24 MW 的电网接入方案仍在评估。设备采购可以先行，但不能替代接入审批。",
      "园区未披露接入获批时间、负载测试日程或正式投运日期，因此不能从设备交付月份反推开始运营的时间。",
    ],
    url: "",
  },
  {
    id: "btc",
    title: "比特币升至 11.6 万美元上方，资金费率未见明显升温",
    summary:
      "08:30 的价格截点为 116,480 美元，24 小时上涨 1.84%；资金费率与价格暂未同步走高。",
    topics: ["加密资产"],
    assets: ["BTC"],
    focusAssets: ["BTC"],
    source: "市场数据",
    publishedAt: "2025-09-18T08:32:00+08:00",
    receivedAt: "2025-09-18T08:33:00+08:00",
    importance: 2,
    type: "行情观察",
    points: [
      "价格统计截至 08:30；永续合约的 8 小时资金费率为 0.006%，前一观察窗口为 0.005%。这里比较的是费率水平，不是年化收益。",
      "价格走高而费率变化有限，暂未出现明显的杠杆拥挤信号。还需观察未平仓合约和现货成交，不能仅用上涨幅度推断资金来源。",
    ],
    url: "",
  },
  {
    id: "gold",
    title: "降息落地后的黄金：先看美元，再看长端利率",
    summary:
      "08:10，现货黄金为每盎司 3,658.20 美元，较前收盘涨 0.23%；政策利率与长端收益率不是同一个指标。",
    topics: ["宏观经济", "国债与利率"],
    assets: ["XAU"],
    focusAssets: ["XAU"],
    source: "全球市场观察",
    publishedAt: "2025-09-18T08:10:00+08:00",
    receivedAt: "2025-09-18T08:11:00+08:00",
    importance: 1,
    type: "报道",
    points: [
      "美联储已经下调政策利率，但黄金的持有成本还受实际利率与美元变化影响。不能把一次降息直接等同于金价持续上行。",
      "08:10 的报价只记录早盘状态；对照后续更新时，应保持美元每盎司和较前收盘的口径一致。",
    ],
    url: "",
  },
  {
    id: "view",
    title: "林序：降息已经落地，别把下一步也写成事实",
    summary:
      "一份决定、一条价格和一个投资计划，分别能证明什么？用三栏笔记把事实、计划与解释分开。",
    topics: ["宏观经济"],
    assets: [],
    source: "林序",
    publishedAt: "2025-09-18T07:50:00+08:00",
    receivedAt: "2025-09-18T07:51:00+08:00",
    importance: 1,
    type: "观点",
    points: [
      "作者建议先标注信息所属的日期与范围，再区分已经发生的结果和未来计划。",
      "本次降息可以确认；下一次降息和企业投资回报，都需要新的材料回答。",
    ],
    url: "",
    body: researchEssay,
  },
  {
    id: "ai-reprint",
    title: "松岭园区服务器与供电配套同步推进，规划容量 48 MW",
    summary:
      "园区分两期建设，一期 24 MW；原稿预计供电设备 9 月交付，尚未确定商用日期。",
    topics: ["AI 与科技", "能源与电力"],
    assets: [],
    source: "全球市场观察",
    publishedAt: "2025-09-18T09:05:00+08:00",
    receivedAt: "2025-09-18T09:06:00+08:00",
    importance: 2,
    type: "报道",
    points: [
      "本条完整转载产业观察的项目报道，保留原文的容量、交付月份及工程安排。",
    ],
    url: "",
    body: datacenterReport,
  },
  {
    id: "ai-correction",
    title: "松岭园区更正：供电设备预计 12 月交付，非 9 月",
    summary:
      "产业观察修正原稿月份录入错误，48 MW 总规划及一期 24 MW 的安排不变；本次并非宣布新增延期。",
    topics: ["AI 与科技", "能源与电力"],
    assets: [],
    source: "产业观察",
    publishedAt: "2025-09-18T10:05:00+08:00",
    receivedAt: "2025-09-18T10:06:00+08:00",
    importance: 2,
    supersedes: "ai",
    change: "修正原稿交付月份；项目规模与其他安排不变。",
    type: "报道",
    points: [
      "供电设备预计交付月份应为 12 月，原稿误写为 9 月。更正针对报道文字，不表示项目计划本次又推迟了三个月。",
      "本次更正未改变建设范围，也未公布正式投运日期。仍需结合接入审批和负载测试判断后续进度。",
    ],
    url: "",
  },
  {
    id: "policy-preview",
    title: "议息会议前瞻：关注就业判断与后续政策措辞",
    summary:
      "北京时间 9 月 18 日凌晨将公布决议；在此之前，降息幅度与后续路径仍是待确认信息。",
    topics: ["宏观经济", "国债与利率"],
    assets: [],
    source: "全球市场观察",
    publishedAt: "2025-09-17T09:00:00+08:00",
    receivedAt: "2025-09-17T09:01:00+08:00",
    importance: 3,
    type: "报道",
    points: [
      "本条发布于 9 月 17 日上午，会议结果尚未公布。先记录当前的 4.25%—4.50% 目标区间，再对照正式声明。",
      "除了本次行动，还应观察就业风险、通胀判断与缩表安排。多个政策维度不应被压缩成一个“宽松”标签。",
    ],
    url: "",
  },
  {
    id: "power-background",
    title: "图解：数据中心用电到 2030 年会怎样增长？",
    summary:
      "IEA 基准情景预计，2030 年全球数据中心用电约 945 TWh；长期需求与具体园区的接入进度，需要分开理解。",
    topics: ["AI 与科技", "能源与电力"],
    assets: [],
    source: "全球市场观察",
    publishedAt: "2025-09-17T16:00:00+08:00",
    receivedAt: "2025-09-17T16:01:00+08:00",
    importance: 1,
    type: "报道",
    points: [
      "IEA 的 2025 年 4 月报告提供全球需求背景，不能代替某个园区的接入审批或运行记录。",
    ],
    url: "https://www.iea.org/reports/energy-and-ai/executive-summary",
    body: powerReport,
    cover: powerDiagram,
  },
  {
    id: "gold-week-open",
    title: "黄金周初观察：把议息会议和 ETF 月度流入分开看",
    summary:
      "08:50，现货黄金为每盎司 3,641.80 美元；本周政策决定尚未公布，8 月资金流反映的是更早的持仓变化。",
    topics: ["宏观经济", "国债与利率"],
    assets: ["XAU"],
    focusAssets: ["XAU"],
    source: "全球市场观察",
    publishedAt: "2025-09-16T09:00:00+08:00",
    receivedAt: "2025-09-16T09:01:00+08:00",
    importance: 1,
    type: "报道",
    points: [
      "本条记录 9 月 16 日早盘状态，不预设后续议息结果。月度 ETF 资金流与当日价格属于不同窗口，不宜相互替代。",
    ],
    url: "",
  },
  {
    id: "gold-update",
    title: "黄金早盘扩大涨幅：美元回落，利率仍需分期限观察",
    summary:
      "10:15，现货黄金升至每盎司 3,672.40 美元，较前收盘涨 0.62%；较 08:10 的记录再涨约 0.39%。",
    topics: ["宏观经济", "国债与利率"],
    assets: ["XAU"],
    focusAssets: ["XAU"],
    source: "全球市场观察",
    publishedAt: "2025-09-18T10:15:00+08:00",
    receivedAt: "2025-09-18T10:16:00+08:00",
    importance: 1,
    supersedes: "gold",
    type: "报道",
    points: [
      "价格由早盘的 3,658.20 美元升至 3,672.40 美元；美元指数在 10:15 为 96.98 点，较前收盘回落 0.21%。这是同日上午的新观察，不修改早盘记录。",
      "政策利率下调与长端收益率变化可能不同步。评估黄金时，应分别记录美元、实际利率和资金流；当前价格变化本身不能拆出每项因素的贡献。",
    ],
    url: "",
  },
  {
    id: "eth-fees",
    title: "以太坊观察：主网费用下降，二层交易笔数上升",
    summary:
      "截至 09:30 的同一 24 小时窗口，主网平均交易费由 0.84 美元降至 0.61 美元；所跟踪二层网络交易笔数增加 8%。",
    topics: ["加密资产"],
    assets: ["ETH"],
    focusAssets: ["ETH"],
    source: "市场数据",
    publishedAt: "2025-09-18T09:40:00+08:00",
    receivedAt: "2025-09-18T09:41:00+08:00",
    importance: 2,
    type: "行情观察",
    points: [
      "平均交易费下降约 27%，但均值会受交易类型影响。二层交易笔数不是用户数，单个地址也可能产生多笔交易。",
      "这组变化反映执行活动与成本，不能直接相加得到以太坊收入。结算频率和 blob 费用属于另一些指标。",
    ],
    url: "",
  },
  {
    id: "eth-report",
    title: "二层更忙，为什么以太坊主网收入未必同步增加？",
    summary:
      "Rollup 把执行放在二层，再向主网提交数据和状态；交易笔数增长与结算收入之间并非固定比例。",
    topics: ["加密资产"],
    assets: ["ETH"],
    focusAssets: ["ETH"],
    source: "全球市场观察",
    publishedAt: "2025-09-18T09:48:00+08:00",
    receivedAt: "2025-09-18T09:49:00+08:00",
    importance: 1,
    type: "报道",
    points: [
      "以 optimistic rollup 为例，多笔交易在二层执行后成批提交到以太坊。主网承担验证争议、结算和数据相关功能，不能只用主网交易笔数衡量整个生态的活动。",
      "批次压缩、提交频率以及独立的 blob 费用市场都会影响单位成本。观察 ETH 时，需要把使用规模与费用捕获分别记录。",
    ],
    url: "https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/",
  },
  {
    id: "apple-services",
    title: "苹果财报回看：服务创新高，不能只用新机销量解释",
    summary:
      "2025 财年第三季度收入 940 亿美元，同比增长 10%，服务收入创历史新高；观察新机周期，也要看存量用户业务。",
    topics: ["AI 与科技"],
    assets: ["AAPL"],
    focusAssets: ["AAPL"],
    source: "产业观察",
    publishedAt: "2025-09-18T09:35:00+08:00",
    receivedAt: "2025-09-18T09:36:00+08:00",
    importance: 2,
    type: "报道",
    points: [
      "这份财报于 7 月 31 日发布，报告期截至 6 月 28 日。每股摊薄收益为 1.57 美元，同比增长 12%；它不是 9 月新机发售后的成绩单。",
      "服务业务与设备存量有关，新机发布则影响后续换机节奏。把两个时间维度分开，有助于避免用发售热度解释已经结束的财季。",
    ],
    url: "https://www.apple.com/newsroom/2025/07/apple-reports-third-quarter-results/",
  },
  {
    id: "nvda-delivery",
    title: "英伟达财报图解：467 亿美元收入，数据中心占近九成",
    summary:
      "数据中心季度收入 411 亿美元，Blackwell 继续增长；读下一季 540 亿美元指引时，要留意 H20 的假设。",
    topics: ["AI 与科技", "半导体"],
    assets: ["NVDA"],
    focusAssets: ["NVDA"],
    source: "产业观察",
    publishedAt: "2025-09-18T09:45:00+08:00",
    receivedAt: "2025-09-18T09:46:00+08:00",
    importance: 2,
    type: "报道",
    points: [
      "这份财报覆盖截至 2025 年 7 月 27 日的季度，发布于 8 月 27 日；本条为 9 月 18 日的财报回看。",
    ],
    url: "https://investor.nvidia.com/news/press-release-details/2025/NVIDIA-Announces-Financial-Results-for-Second-Quarter-Fiscal-2026/default.aspx",
    body: deliveryReport,
    cover: revenueDiagram,
  },
  {
    id: "power-video",
    title: "18 秒看懂：供电设备到场，机房就能运行吗？",
    summary:
      "用松岭园区的一期 24 MW 计划，解释建设、接入和实际运行的三个节点。",
    topics: ["AI 与科技", "能源与电力"],
    assets: [],
    source: "产业观察",
    publishedAt: "2025-09-18T09:55:00+08:00",
    receivedAt: "2025-09-18T09:56:00+08:00",
    importance: 1,
    type: "报道",
    points: [
      "设备交付之后，还需要接入审批、联调和负载测试；三个环节各有自己的记录。",
    ],
    url: "",
    body: powerExplainer,
    cover: powerVideo,
  },
  {
    id: "lin-ai",
    title: "林序：算 AI 投资回报，别把季度投入除以全年收入",
    summary:
      "微软的季度资本开支与 Azure 全年收入，是两个不同口径的数字；还要留意融资租赁与现金支出的区别。",
    topics: ["AI 与科技"],
    assets: ["MSFT"],
    source: "林序 · 产业观察",
    publishedAt: "2025-09-18T09:50:00+08:00",
    receivedAt: "2025-09-18T09:51:00+08:00",
    importance: 1,
    type: "观点",
    points: [
      "微软 2025 财年第四季度资本开支为 242 亿美元，其中包括 65 亿美元融资租赁；Azure 全年收入超过 750 亿美元。",
      "季度投入除以全年收入，既混合了时间范围，也把资本性支出与经营成果混为一谈。分析回报需要一致的期间、折旧和成本分摊。",
    ],
    url: "https://www.microsoft.com/en-us/investor/events/fy-2025/earnings-fy-2025-q4",
    focusAssets: ["MSFT"],
  },
  {
    id: "microsoft-capex",
    source: "产业观察",
    publishedAt: "2025-09-18T08:20:00+08:00",
    receivedAt: "2025-09-18T08:21:00+08:00",
    importance: 2,
    type: "报道",
    topics: ["AI 与科技"],
    assets: ["MSFT"],
    url: "https://www.microsoft.com/en-us/investor/events/fy-2025/earnings-fy-2025-q4",
    focusAssets: ["MSFT"],
    title: "微软云业务回看：Azure 年收入超 750 亿美元，投入也在加速",
    summary:
      "2025 财年第四季度资本开支为 242 亿美元，包含融资租赁；云增长和建设投入需要用各自的口径阅读。",
    points: [
      "微软在 7 月的第四季度业绩会上披露，Azure 全年收入超过 750 亿美元，同比增长 34%。这是年度收入，并不是单季收入。",
      "季度资本开支的 242 亿美元中包括 65 亿美元融资租赁。理解现金流时，不能将全部资本开支直接当作当季现金支付。",
    ],
  },
  {
    id: "iphone-launch",
    source: "产业观察",
    publishedAt: "2025-09-18T08:05:00+08:00",
    receivedAt: "2025-09-18T08:06:00+08:00",
    importance: 2,
    type: "报道",
    topics: ["AI 与科技"],
    assets: ["AAPL"],
    url: "https://www.apple.com/newsroom/2025/09/apple-debuts-iphone-17/",
    focusAssets: ["AAPL"],
    title: "iPhone 17 明日开售：发布、预购与收入确认是三件事",
    summary:
      "苹果已公布 9 月 19 日发售安排；预购于 9 月 12 日启动，当前还没有这一轮发售的完整销量数据。",
    points: [
      "苹果 9 月 9 日发布 iPhone 17，随后开放预购。明日开售意味着交付阶段开始，不能从发布会关注度直接推断整季销量。",
      "跟进 AAPL 时，可以把产品发售与季度财报分开记录：前者描述产品节奏，后者才提供已实现的业务结果。",
    ],
  },
  {
    id: "gold-etf",
    source: "全球市场观察",
    publishedAt: "2025-09-16T08:15:00+08:00",
    receivedAt: "2025-09-16T08:16:00+08:00",
    importance: 1,
    type: "报道",
    topics: ["宏观经济", "国债与利率"],
    assets: ["XAU"],
    url: "https://www.gold.org/goldhub/research/gold-etfs-holdings-and-flows/2025/09",
    focusAssets: ["XAU"],
    title: "8 月黄金 ETF 净流入 55 亿美元，连续第三个月流入",
    summary:
      "世界黄金协会月报显示，全球实物黄金 ETF 持仓增加 53 吨至 3,692 吨；月度资金流为本周金价提供背景。",
    points: [
      "9 月 5 日发布的报告统计的是 8 月：净流入 55 亿美元，月末资产规模约 4,070 亿美元。金额、吨数和资产规模是不同指标。",
      "月度流入无法证明某一小时上涨的原因。把它作为持仓背景，再与当日美元和收益率变化对照，更容易看清时间范围。",
    ],
  },
  {
    id: "yield-curve",
    source: "市场数据",
    publishedAt: "2025-09-18T09:00:00+08:00",
    receivedAt: "2025-09-18T09:01:00+08:00",
    importance: 2,
    type: "报道",
    topics: ["宏观经济", "国债与利率"],
    assets: [],
    url: "",
    title: "降息 25 个基点，为何十年期收益率反而上行？",
    summary:
      "十年期名义收益率的日度记录为 4.08%，较前一日高 3 个基点；期限溢价与政策利率共同影响长端。",
    points: [
      "政策目标区间是短端利率工具，十年期收益率还反映未来短端利率预期与期限溢价。两者短期反向变化并不矛盾。",
      "这里的 +3 bp 指收益率上升 0.03 个百分点，不是债券价格上涨 3%，也不是债券总回报。",
    ],
  },
  {
    id: "chip-packaging",
    source: "产业观察",
    publishedAt: "2025-09-17T15:20:00+08:00",
    receivedAt: "2025-09-17T15:21:00+08:00",
    importance: 1,
    type: "报道",
    topics: ["AI 与科技", "半导体"],
    assets: [],
    url: "",
    title: "先进封装为何重要：晶圆完成之后，还有一道交付关",
    summary:
      "AI 加速器需要把计算芯片、内存与互连组成可用系统；前端制造产能不能直接等同于成品交付能力。",
    points: [
      "晶圆制造、先进封装与系统测试是不同环节。即使前端产量增加，封装和测试节奏也会影响最终可交付的数量。",
      "理解交付安排时，还要看封装设备、内存配套和系统测试。只追踪晶圆产量，可能遗漏后段工艺的等待时间。",
    ],
  },
  {
    id: "northshore-grid",
    source: "全球市场观察",
    publishedAt: "2025-09-18T09:20:00+08:00",
    receivedAt: "2025-09-18T09:21:00+08:00",
    importance: 3,
    type: "报道",
    topics: ["能源与电力"],
    assets: [],
    url: "",
    title: "北岸电网两座变电站延期，工业接电计划重新排期",
    summary:
      "关键设备验收推迟六周，新增工业用户的接电窗口需要调整；现有用户供电不受影响。",
    points: [
      "北岸电网通知，两座新建变电站的关键设备仍在验收，预计投运时间比原计划晚六周。影响集中在等待新增容量的工业用户，并非现有网络停电。",
      "接电排期需要逐个项目确认。设备验收、线路联调和用户接入是不同节点，不能直接用变电站延期天数推算每家工厂的投产日期。",
    ],
  },
  {
    id: "bond-return-basics",
    source: "市场数据",
    publishedAt: "2025-09-18T09:10:00+08:00",
    receivedAt: "2025-09-18T09:11:00+08:00",
    importance: 2,
    type: "观点",
    topics: ["国债与利率"],
    assets: [],
    url: "",
    title: "看懂债券收益：票息、到期收益率与持有回报",
    summary:
      "票息写在条款里，到期收益率随价格变化，持有回报还取决于买卖时点。三个数字回答的是不同问题。",
    points: [
      "固定利率债券的票息按发行条款计算；到期收益率综合当前买入价格、剩余期限和约定现金流，不能与票面利率直接等同。",
      "现金流与偿付预期不变时，价格上涨对应到期收益率下降。提前卖出的实际回报，还要计入收到的利息、买卖价差与交易成本。",
    ],
  },
]);
export const assets: (MarketQuote & {
  id: string;
  name: string;
  market: string;
  color: string;
})[] = [
  {
    id: "NVDA",
    name: "英伟达",
    market: "美股",
    unit: "USD",
    changePeriod: "较前收盘",
    asOf: "2025-09-17T16:00:00-04:00",
    status: "收盘",
    sessionStart: "2025-09-17T09:30:00-04:00",
    value: "176.80",
    change: "+1.12%",
    up: true,
    color: "#65a443",
    points: [42, 39, 44, 50, 48, 35, 28, 37, 52, 59, 55, 65],
  },
  {
    id: "BTC",
    name: "比特币",
    market: "加密资产",
    unit: "USD",
    changePeriod: "24 小时",
    asOf: "2025-09-18T10:30:00+08:00",
    status: "快照",
    value: "116,820.00",
    change: "+2.14%",
    up: true,
    color: "#f19c38",
    points: [28, 25, 33, 31, 45, 42, 48, 61, 56, 62, 72, 70],
  },
  {
    id: "ETH",
    name: "以太坊",
    market: "加密资产",
    unit: "USD",
    changePeriod: "24 小时",
    asOf: "2025-09-18T10:30:00+08:00",
    status: "快照",
    value: "4,582.60",
    change: "−0.74%",
    up: false,
    color: "#7b82a9",
    points: [64, 72, 68, 57, 49, 52, 59, 47, 43, 46, 33, 35],
  },
  {
    id: "AAPL",
    name: "苹果",
    market: "美股",
    unit: "USD",
    changePeriod: "较前收盘",
    asOf: "2025-09-17T16:00:00-04:00",
    status: "收盘",
    sessionStart: "2025-09-17T09:30:00-04:00",
    value: "238.40",
    change: "−0.31%",
    up: false,
    color: "#777e8d",
    points: [58, 62, 50, 47, 55, 60, 54, 49, 41, 46, 39, 44],
  },
  {
    id: "XAU",
    name: "现货黄金",
    market: "商品",
    unit: "USD/oz",
    changePeriod: "较前收盘",
    asOf: "2025-09-18T10:30:00+08:00",
    status: "快照",
    value: "3,672.40",
    change: "+0.62%",
    up: true,
    color: "#c39b3d",
    points: [31, 34, 29, 38, 46, 42, 40, 51, 63, 60, 67, 67],
  },
  {
    id: "MSFT",
    name: "微软",
    market: "美股",
    unit: "USD",
    changePeriod: "较前收盘",
    asOf: "2025-09-17T16:00:00-04:00",
    status: "收盘",
    sessionStart: "2025-09-17T09:30:00-04:00",
    value: "511.30",
    change: "+0.48%",
    up: true,
    color: "#347ca5",
    points: [39, 44, 41, 48, 52, 46, 40, 45, 50, 58, 54, 60],
  },
];
export const topicAliases: Record<string, string[]> = {
  宏观经济: ["宏观", "货币政策", "macro", "monetary policy"],
  "AI 与科技": ["科技", "人工智能", "AI", "technology"],
  半导体: ["芯片", "semiconductors", "chips"],
  能源与电力: ["能源", "电力", "energy", "power"],
  国债与利率: [
    "国债",
    "美债",
    "利率",
    "treasuries",
    "treasury",
    "interest rates",
    "bonds",
  ],
  加密资产: ["加密", "crypto"],
};
export const topics = Object.keys(topicAliases);
export const sections = [
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
      "关注看来源发布，推荐看个人相关内容，热点看平台重要动态。",
      "浏览不等于喜欢，偏好由你明确表达。",
      "用搜索查找内容，用专题串起问题的背景。",
    ],
  },
  {
    id: "markets",
    name: "市场行情",
    en: "MARKETS",
    description: "价格之外，理解变化的来由。",
    purpose: "行情与资讯，在一起",
    details: [
      "自选管理资产，关注管理信息来源。",
      "价格、走势与相关资讯相互连接。",
      "标明数据时间，自选不代表持仓。",
    ],
  },
  {
    id: "profile",
    name: "个人空间",
    en: "YOUR SPACE",
    description: "你的关注，你来决定。",
    purpose: "偏好清楚，控制直接",
    details: [
      "统一管理来源关注、自选资产与阅读记录。",
      "兴趣直接选择，不推荐的内容可随时恢复。",
      "语言和主题设置实时生效。",
    ],
  },
];

export const sourceProfiles = [
  {
    id: "林序",
    bio: "关注宏观经济与资产定价，习惯从数据出发，区分市场预期与已知事实。",
    label: "宏观研究",
  },
  {
    id: "林序 · 产业观察",
    label: "专栏",
    bio: "林序在产业观察发表的科技产业与投资研究。",
  },
  {
    id: "美联储",
    label: "机构",
    bio: "宏观经济、货币政策与公开数据。",
  },
  {
    id: "产业观察",
    label: "媒体",
    bio: "关注科技产业、企业经营与基础设施。",
  },
  {
    id: "市场数据",
    label: "数据来源",
    bio: "跟踪价格、交易与资金变化。",
  },
  {
    id: "全球市场观察",
    label: "媒体",
    bio: "观察全球资产与商品市场的重要变化。",
  },
];

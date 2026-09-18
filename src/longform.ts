import {
  deliveryDiagram,
  revenueDiagram,
  powerDiagram,
  powerVideo,
  readingAudio,
} from "./media.ts";
import type { ArticleMedia } from "./media.ts";

// Original editorial copy based on the sources documented in docs/demo-scenarios.md.
export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  media?: ArticleMedia[];
};
export type EvidenceSection = ArticleSection & { sourceIds: string[] };

export const datacenterReport: ArticleSection[] = [
  {
    heading: "松岭园区的一期计划",
    paragraphs: [
      "松岭园区计划分两期建设 48 MW 的数据中心，一期为 24 MW。本轮采购包括服务器、冷却系统和变配电设备，园区尚未披露服务器供应商。",
      "项目进度表将变配电设备的预计交付写为 9 月。设备抵达后还需安装、联调和负载测试，园区没有公布正式商用日期。",
    ],
  },
  {
    heading: "容量还不是用电量",
    paragraphs: [
      "24 MW 描述一期的额定容量，不代表园区已经以这一负载运行。要估算全年用电，还需知道运行小时数与平均负载；当前材料没有提供这两项数据。",
      "建设方将供电设备交付、电网接入和机房投运列为三个节点。接下来最有用的进展，是接入方案是否获批，以及联调何时开始。",
    ],
  },
];

export const deliveryReport: ArticleSection[] = [
  {
    heading: "先分清财季和自然年",
    paragraphs: [
      "英伟达 8 月 27 日披露的 2026 财年第二季度，截至 2025 年 7 月 27 日。季度收入为 467 亿美元，同比增长 56%；其中数据中心收入 411 亿美元。",
    ],
    media: [revenueDiagram],
  },
  {
    heading: "增长来自哪里",
    paragraphs: [
      "Blackwell 数据中心收入环比增长 17%。这一指标描述产品平台收入变化，不能直接当成出货台数或客户机房的利用率。",
      "客户扩建往往经历采购、交付和部署。下图用三个节点整理要核对的问题，不代表英伟达具体合同的收入确认条件。",
    ],
    media: [deliveryDiagram],
  },
  {
    heading: "指引里的条件",
    paragraphs: [
      "公司给出的第三季度收入指引为 540 亿美元、上下浮动 2%，未假设向中国发运 H20。指引是公司的前瞻预期，应与下一份实际业绩分开记录。",
    ],
  },
];

export const powerReport: ArticleSection[] = [
  {
    heading: "全球预测与本地接入是两个问题",
    paragraphs: [
      "国际能源署在 2025 年 4 月发布的《能源与人工智能》中估计，数据中心 2024 年用电约 415 TWh；基准情景下，2030 年将达到约 945 TWh。这是一项预测，并非已经发生的用电增长。",
      "同一情景下，数据中心占全球用电仍不到 3%。全球占比不高，不意味着每座城市都能及时提供新增容量；需求集中在少数地点时，接入条件更关键。",
    ],
  },
  {
    heading: "把工程拆成三个节点",
    paragraphs: [
      "供电建设关注设备和变电设施；机房接入关注线路、保护和联调；实际运行则关注负载、稳定性与能效。每个节点都有不同的验收依据。",
    ],
    media: [powerDiagram],
  },
  {
    heading: "怎样读园区的扩建新闻",
    paragraphs: [
      "MW 是功率，TWh 是一段时间内的电量。把园区的额定功率直接与全球年度用电量比较，会混淆不同单位。园区是否投运，应看接入和运行记录，而不是只看采购公告。",
    ],
    media: [powerVideo],
  },
];

export const powerExplainer: ArticleSection[] = [
  {
    heading: "先交付，再接入，最后运行",
    paragraphs: [
      "松岭园区的一期容量为 24 MW。即使变配电设备已经交付，也还要完成安装、并网和负载测试。下面的动画用三个节点解释这段距离。",
    ],
    media: [powerVideo],
  },
  {
    heading: "下一条消息该看什么",
    paragraphs: [
      "先看接入方案有没有获批，再看联调和负载测试的安排。对这个园区来说，公布可商用日期，比再次重复总投资规模更有信息量。",
    ],
  },
];

export const researchEssay: ArticleSection[] = [
  {
    heading: "决定公布了，路径还没有",
    paragraphs: [
      "美联储已经降息 25 个基点，这是本次会议的决定。下一次会议如何行动，仍取决于就业、通胀与风险评估。林序认为，应把“已经发生”与“市场继续期待”分成两栏。",
    ],
  },
  {
    heading: "用三个问题阅读一份公告",
    paragraphs: [
      "第一，数字属于哪个时间段？第二，它是已经披露的结果，还是未来的计划？第三，发布者能直接证明什么？同样的方法既适用于降息声明，也适用于数据中心的扩建计划。",
      "例如，企业公布采购设备，只能确认采购安排；设备抵达之后，能否按时投运仍需下一份进度。讨论投资回报时，把两者放在同一个日期上，会高估确定性。",
    ],
    media: [readingAudio],
  },
  {
    heading: "价格为什么未必照着标题走",
    paragraphs: [
      "如果投资者此前已经预期降息，正式公布时价格反应可能很小；如果后续措辞改变了对未来路径的判断，长端利率也可能与本次政策利率反向变化。标题本身不足以说明市场在重新定价什么。",
    ],
  },
];

export const powerFeature: EvidenceSection[] = [
  {
    heading: "先把松岭园区的日期读对",
    paragraphs: [
      "产业观察更正了变配电设备的预计交付月份：应为 12 月，而不是原文的 9 月。该来源说明这是原稿录入错误，并未宣布项目计划新增延期。一期 24 MW、总规划 48 MW 的规模没有变化。",
    ],
    sourceIds: ["ai-correction"],
  },
  {
    heading: "工程进度与行业需求分开读",
    paragraphs: [
      "IEA 的 2030 年用电预测说明长期需求可能扩大；园区的交付月份回答的是某个项目何时拿到设备。这两种材料互为背景，却不能互相证明。",
      "行业总量之外，还要观察电网容量、变电设备和接入审批。供电配套是 AI 扩建的一项约束，是否构成瓶颈取决于具体地点与进度。",
    ],
    media: [powerDiagram],
    sourceIds: ["power-background", "ai-correction"],
  },
  {
    heading: "不把计划写成结果",
    paragraphs: [
      "林序提出的三栏笔记法，把事实、计划和解释分开。应用到松岭园区，事实是来源已修正文案，计划是设备预计 12 月交付，解释是供电可能影响扩建节奏。后两项都不等于园区已经投运。",
    ],
    sourceIds: ["view", "ai-correction"],
  },
  {
    heading: "下一步看接入和负载",
    paragraphs: [
      "下一次更新最需要回答两个问题：接入条件是否落实，负载测试何时开始。只有运行记录出现后，才能讨论实际容量和利用率。下面的视频概括这几个工程节点。",
    ],
    media: [powerVideo],
    sourceIds: ["power-background"],
  },
];

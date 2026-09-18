type MediaDescription = {
  src: string;
  title: string;
  caption: string;
  credit: string;
};

export type ArticleMedia = MediaDescription &
  (
    | { kind: "image"; alt: string; width: number; height: number }
    | {
        kind: "video";
        poster: string;
        transcript: string;
        captions: { src: string; language: string; label: string }[];
      }
    | { kind: "audio"; transcript: string }
  );

export type VisualMedia = Extract<ArticleMedia, { kind: "image" | "video" }>;

export const deliveryDiagram: VisualMedia = {
  kind: "image",
  src: "/media/delivery-stages.svg",
  width: 960,
  height: 600,
  alt: "三个需要分别核对的环节：01 订单、02 生产交付、03 客户验收。",
  title: "图示 · 订单不等于交付",
  caption:
    "01 订单 → 02 生产交付 → 03 客户验收。各环节需要不同依据，不能直接用订单推算已确认收入。",
  credit: "图示：Sift",
};

export const powerDiagram: VisualMedia = {
  kind: "image",
  src: "/media/power-stages.svg",
  width: 960,
  height: 600,
  alt: "三个相连的环节：01 供电建设、02 机房接入、03 实际运行。",
  title: "图示 · 从建设到运行",
  caption:
    "01 供电建设 → 02 机房接入 → 03 实际运行。每个环节需要各自的验收或运行记录。",
  credit: "图示：Sift",
};

export const powerVideo: VisualMedia = {
  kind: "video",
  src: "/media/power-stages.mp4",
  poster: "/media/power-poster.jpg",
  title: "视频 · 三个环节，分别核对",
  caption: "建设、接入与运行的区别 · 18 秒 · 中英文字幕",
  credit: "动画：Sift",
  transcript:
    "01：先核对供电建设和设备验收。02：再确认接入条件与机房测试。03：最后查看实际运行与利用率。前一个环节完成，不代表后一个环节已经完成。",
  captions: [
    { src: "/media/power-stages.zh.vtt", language: "zh-CN", label: "简体中文" },
    { src: "/media/power-stages.en.vtt", language: "en", label: "English" },
  ],
};

export const readingAudio: ArticleMedia = {
  kind: "audio",
  src: "/media/reading-notes.mp3",
  title: "音频 · 三种信息，分开记录",
  caption: "用三栏笔记区分事实、计划与解释。",
  credit: "合成语音：Sift",
  transcript:
    "阅读一条消息时，可以把笔记分成三栏：已经发生的事实、当事人的计划，以及自己的解释。设备采购可以核对，未来利用率是计划，投资能否成功还需要验证。保留时间、范围和条件，再看下一份材料回答了什么。",
};

export const revenueDiagram: VisualMedia = {
  kind: "image",
  src: "/media/nvidia-revenue.svg",
  width: 960,
  height: 600,
  alt: "英伟达 2026 财年第二季度收入结构：数据中心 411 亿美元，其他业务 56 亿美元，合计 467 亿美元。",
  title: "图解 · 数据中心占收入近九成",
  caption:
    "截至 2025 年 7 月 27 日的财季；其他业务按总额减数据中心计算，因四舍五入取近似值。",
  credit: "制图：Sift · 数据：英伟达财报",
};

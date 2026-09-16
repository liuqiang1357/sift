import {
  defaultOverview,
  overviewOptions,
  toggleOverview,
  moveOverview,
} from "./market-overview";
import {
  demoSaved,
  demoRead,
  demoConversations,
  addMissingRecords,
} from "./demo-records";
import type { Message, Conversation } from "./demo-records";
import { createLocalizer, matchesSearch } from "./i18n";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Compass,
  Globe2,
  History,
  LayoutGrid,
  MessageCircle,
  Monitor,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TrendingUp,
  UserRound,
  Wifi,
  X,
  FileText,
  BatteryFull,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  assets,
  authors,
  sections,
  sourceNames,
  stories,
  topics,
} from "./data";
import type { Story } from "./data";
import { useStored } from "./store";

type Page = {
  kind: string;
  id?: string;
  title?: string;
  followingIds?: string[];
};
const navIcons = [FileText, Compass, TrendingUp, UserRound];
const initialFollowing = [
  "NVDA",
  "BTC",
  "宏观经济",
  "AI 与科技",
  "林序",
  "产业观察",
];
function Sparkline({
  values,
  large = false,
  up = true,
  english = false,
}: {
  values: number[];
  large?: boolean;
  up?: boolean;
  english?: boolean;
}) {
  const l = createLocalizer(english);
  const points = values
    .map((v, i) => `${(i * 300) / (values.length - 1)},${100 - v}`)
    .join(" ");
  return (
    <svg
      className={large ? "chart" : "sparkline"}
      viewBox="0 0 300 100"
      preserveAspectRatio="none"
      role="img"
      aria-label={l("示例价格走势")}
    >
      <title>{l("示例价格走势，非实时数据")}</title>
      {large &&
        [20, 50, 80].map((y) => (
          <line
            key={y}
            x1="0"
            x2="300"
            y1={y}
            y2={y}
            stroke="currentColor"
            opacity=".1"
          />
        ))}
      {large && (
        <polygon
          points={`0,100 ${points} 300,100`}
          fill={up ? "#148877" : "#d4666c"}
          opacity=".07"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={up ? "#148877" : "#d4666c"}
        strokeWidth={large ? "2" : "4"}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
function App() {
  const [tab, setTab] = useState("brief"),
    [stack, setStack] = useState<Page[]>([]);
  const [following, setFollowing] = useStored<string[]>(
    "sift-following",
    initialFollowing,
  );
  const [overview, setOverview] = useStored<string[]>(
    "sift-market-overview",
    defaultOverview,
  );
  const [overviewDraft, setOverviewDraft] = useState<string[]>([]);
  const [saved, setSaved] = useStored<string[]>("sift-saved", demoSaved);
  const [read, setRead] = useStored<string[]>("sift-read", demoRead);
  const [theme, setTheme] = useStored("sift-theme", "system"),
    [language, setLanguage] = useStored("sift-language", "zh");
  const [pref, setPref] = useStored(
    "sift-pref",
    "关注宏观政策对科技与加密资产的影响，优先官方消息。",
  );
  const [notice, setNotice] = useStored("sift-notice", false),
    [quiet, setQuiet] = useStored("sift-quiet", true);
  const [briefTime, setBriefTime] = useStored("sift-brief-time", "08:00");
  const [conversations, setConversations] = useStored<Conversation[]>(
    "sift-conversations",
    demoConversations,
  );
  const [channel, setChannel] = useState("推荐"),
    [filter, setFilter] = useState("全部"),
    [market, setMarket] = useState("自选");
  const [query, setQuery] = useState(""),
    [searchType, setSearchType] = useState("资讯"),
    [period, setPeriod] = useState("日内");
  const [chatInput, setChatInput] = useState(""),
    [messages, setMessages] = useState<Message[]>([]),
    [chatId, setChatId] = useState("");
  const [toast, setToast] = useState(""),
    [systemDark, setSystemDark] = useState(false),
    [historyType, setHistoryType] = useState("浏览");
  const [clearHistory, setClearHistory] = useState(false);
  const [managingHistory, setManagingHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<string[]>([]);
  const [undoHistory, setUndoHistory] = useState<{
    kind: string;
    read?: string[];
    conversations?: Conversation[];
  } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null),
    positions = useRef<number[]>([]),
    tabPositions = useRef<Record<string, number>>({});
  const page = stack.at(-1),
    english = language === "en",
    t = (zh: string, en: string) => (english ? en : zh);
  const l = createLocalizer(english);
  const section = sections.find((s) => s.id === tab) ?? sections[0];
  const dark = theme === "dark" || (theme === "system" && systemDark);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.documentElement.lang = english ? "en" : "zh-CN";
    document.title = english
      ? "Sift · See what matters"
      : "Sift · 看见重要的变化";
  }, [english]);
  function navigate(next: string) {
    tabPositions.current[tab] = bodyRef.current?.scrollTop ?? 0;
    setTab(next);
    setStack([]);
    setClearHistory(false);
    setUndoHistory(null);
    setManagingHistory(false);
    setSelectedHistory([]);
    positions.current = [];
    requestAnimationFrame(() =>
      bodyRef.current?.scrollTo(0, tabPositions.current[next] ?? 0),
    );
  }
  function push(p: Page) {
    if (page?.kind === "history") {
      setUndoHistory(null);
      setManagingHistory(false);
      setSelectedHistory([]);
      setClearHistory(false);
    }
    positions.current.push(bodyRef.current?.scrollTop ?? 0);
    setStack((s) => [
      ...s,
      p.kind === "following" ? { ...p, followingIds: [...following] } : p,
    ]);
    requestAnimationFrame(() => bodyRef.current?.scrollTo(0, 0));
  }
  function back() {
    if (page?.kind === "history") {
      setUndoHistory(null);
      setManagingHistory(false);
      setSelectedHistory([]);
      setClearHistory(false);
    }
    setStack((s) => s.slice(0, -1));
    const y = positions.current.pop() ?? 0;
    requestAnimationFrame(() => bodyRef.current?.scrollTo(0, y));
  }
  function toggleFollow(id: string) {
    setFollowing((s) =>
      s.includes(id) ? s.filter((v) => v !== id) : [...s, id],
    );
  }
  function toggleSave(id: string) {
    setSaved((s) => (s.includes(id) ? s.filter((v) => v !== id) : [...s, id]));
    setToast(saved.includes(id) ? "已取消收藏" : "已加入收藏");
  }
  function openStory(s: Story) {
    setRead((r) => [s.id, ...r.filter((id) => id !== s.id)]);
    push({ kind: "story", id: s.id, title: "事件详情" });
  }
  function chat(context: string) {
    setMessages([]);
    setChatId(crypto.randomUUID());
    push({ kind: "chat", title: l(context) });
  }
  function demoReply(context: string, question: string) {
    const evidence =
      stories
        .find((story) => story.title === context || l(story.title) === context)
        ?.points.join("\n\n") ??
      "先核对来源、发布时间与统计周期，再观察后续数据是否支持当前预期。单次价格变化不能证明因果关系。";
    return english
      ? `This is a local demo response without live research.\n\nRegarding “${l(context)}”, separate the facts from assumptions:\n\n${l(evidence)}\n\nFor your question “${question}”, the demo cannot provide a real-time assessment. Check the story details for the sample evidence.`
      : `这是一段本地演示回答，未检索实时资料。\n\n关于「${context}」，可以先分开看事实与推测：\n\n${evidence}\n\n对于问题「${question}」，当前演示数据不足以给出实时判断。你可以返回详情查看情景依据。`;
  }
  function send(text: string) {
    if (!text.trim()) return;
    const context = page?.title || "当前问题";
    const reply = demoReply(context, text.trim());
    const next: Message[] = [
      ...messages,
      { role: "user", text: text.trim() },
      {
        role: "assistant",
        text: reply,
      },
    ];
    setMessages(next);
    setChatInput("");
    setConversations((c) => [
      { id: chatId, context: page?.title ?? "通用对话", messages: next },
      ...c.filter((v) => v.id !== chatId),
    ]);
    requestAnimationFrame(() =>
      bodyRef.current?.scrollTo({
        top: bodyRef.current.scrollHeight,
        behavior: "smooth",
      }),
    );
  }
  const iconButton = (label: string, icon: ReactNode, action: () => void) => (
    <button
      className="icon-button"
      aria-label={l(label)}
      title={l(label)}
      onClick={action}
    >
      {l(icon)}
    </button>
  );
  function SearchButton() {
    return iconButton("搜索", <Search size={20} />, () => {
      setQuery("");
      setSearchType(tab === "markets" ? "资产" : "资讯");
      push({ kind: "search", title: "搜索" });
    });
  }
  function Follow({ id }: { id: string }) {
    return (
      <button
        className={`follow ${following.includes(id) ? "is-following" : ""}`}
        aria-label={l(`${following.includes(id) ? "取消关注" : "关注"} ${id}`)}
        onClick={() => toggleFollow(id)}
      >
        {following.includes(id) ? <Check size={14} /> : <Plus size={14} />}
        {l(" ")}
        {l(
          following.includes(id)
            ? t("已关注", "Following")
            : t("关注", "Follow"),
        )}
      </button>
    );
  }
  function StoryRow({ story: s, number }: { story: Story; number?: number }) {
    return (
      <article className="story-row">
        {number && (
          <span className="rank">{l(String(number).padStart(2, "0"))}</span>
        )}
        <div className="story-main">
          <div className="meta">
            <span className={s.type === "进展" ? "new-label" : ""}>
              {l(s.type)}
            </span>
            <span>{l(s.time)}</span>
            {read.includes(s.id) && <span>{l("已读")}</span>}
          </div>
          <button className="story-title" onClick={() => openStory(s)}>
            {l(s.title)}
          </button>
          <p>{l(s.summary)}</p>
          <div className="tags">
            {s.assets.map((id) => (
              <button
                key={id}
                onClick={() => push({ kind: "asset", id, title: "资产详情" })}
              >
                {l(id)}
              </button>
            ))}
            <button
              onClick={() => {
                push({ kind: "topic", id: s.topic, title: "主题详情" });
              }}
            >
              {l(s.topic)}
            </button>
          </div>
          <div className="source-line">
            {s.author ? (
              <button
                className="author-link"
                onClick={() =>
                  push({
                    kind: "author",
                    id: s.author,
                    title: "作者",
                  })
                }
              >
                {l(s.author)}
                <ChevronRight size={12} />
              </button>
            ) : (
              <button
                className="author-link"
                onClick={() =>
                  push({
                    kind: "source",
                    id: s.source.split(" · ")[0],
                    title: "机构与媒体",
                  })
                }
              >
                {l(s.source)}
                <ChevronRight size={12} />
              </button>
            )}
            {iconButton(
              saved.includes(s.id) ? "取消收藏" : "收藏",
              <Bookmark
                size={16}
                fill={saved.includes(s.id) ? "currentColor" : "none"}
              />,
              () => toggleSave(s.id),
            )}
          </div>
          {channel === "推荐" && tab === "explore" && (
            <div className="reason">
              <Sparkles size={12} />
              {l(s.reason)}
            </div>
          )}
        </div>
      </article>
    );
  }
  function AssetRow({ asset: a }: { asset: (typeof assets)[number] }) {
    return (
      <button
        className="asset-row"
        onClick={() => push({ kind: "asset", id: a.id, title: "资产详情" })}
      >
        <span
          className="asset-logo"
          style={{ background: a.color + "18", color: a.color }}
        >
          {l(a.id === "BTC" ? "₿" : a.id === "ETH" ? "Ξ" : a.id[0])}
        </span>
        <span className="asset-name">
          <b>{l(a.name)}</b>
          <small>
            {l(a.id)} · {l(a.market)}
          </small>
        </span>
        <Sparkline english={english} values={a.points} up={a.up} />
        <span className="asset-price">
          <b>{l(a.price)}</b>
          <small className={a.up ? "positive" : "negative"}>
            {l(a.change)}
          </small>
        </span>
      </button>
    );
  }
  function Empty({
    text = "暂无内容",
    hint = "可以到探索中发现更多资讯。",
  }: {
    text?: string;
    hint?: string;
  }) {
    return (
      <div className="empty">
        <Search size={30} />
        <h3>{l(text)}</h3>
        <p>{l(hint)}</p>
        <button className="text-button" onClick={() => navigate("explore")}>
          {l("去探索")}
          <ArrowRight size={15} />
        </button>
      </div>
    );
  }
  function GroupRow({
    icon,
    label,
    note,
    onClick,
  }: {
    icon: ReactNode;
    label: string;
    note?: string;
    onClick: () => void;
  }) {
    return (
      <button className="group-row" onClick={onClick}>
        <span className="row-icon">{l(icon)}</span>
        <b>{l(label)}</b>
        <span>{l(note)}</span>
        <ChevronRight size={16} />
      </button>
    );
  }
  function Toggle({
    label,
    value,
    onChange,
    hint,
  }: {
    label: string;
    value: boolean;
    onChange: () => void;
    hint?: string;
  }) {
    return (
      <div className="setting-row">
        <div>
          <b>{l(label)}</b>
          {hint && <small>{l(hint)}</small>}
        </div>
        <button
          role="switch"
          aria-checked={value}
          aria-label={l(label)}
          className={`switch ${value ? "on" : ""}`}
          onClick={onChange}
        >
          <span />
        </button>
      </div>
    );
  }
  function renderBrief(day = "09.16", detail = false) {
    return (
      <>
        <div className="eyebrow">SEPTEMBER {l(day.slice(-2))} · 2026</div>
        <div className="title-row">
          <h1>
            {l(
              detail
                ? `${day} 每日简报`
                : t("早安，今天看这些。", "Your morning, distilled."),
            )}
          </h1>
          {iconButton("往期简报", <History size={20} />, () =>
            push({ kind: "archive", title: "往期简报" }),
          )}
        </div>
        <p className="subtitle">
          {l(
            following.length
              ? t(
                  "为你整理重要变化，留出思考的时间。",
                  "The changes that matter to you.",
                )
              : t(
                  "通用简报 · 从今天的重要变化开始。",
                  "General brief · Today’s key changes.",
                ),
          )}
        </p>
        <div className="brief-cover">
          <div className="cover-top">
            <span>DAILY BRIEF</span>
            <span>VOL. {l(day === "09.16" ? "026" : "025")}</span>
          </div>
          <div className="cover-title">
            {day === "09.16" ? (
              <>
                {l("在变化中，")}
                <br />
                {l("找到确定的线索。")}
              </>
            ) : (
              <>
                {l("回望市场，")}
                <br />
                {l("留意预期的变化。")}
              </>
            )}
          </div>
          <div className="cover-bottom">
            <span>
              {english
                ? `Sep ${Number(day.slice(-2))}`
                : day.replace(".", " 月 ")}
              {english ? " · As of 09:30" : "日 · 截至 09:30"}
            </span>
            <span>{l("3 个重点 · 约 3 分钟")}</span>
          </div>
          <div className="cover-lines" aria-hidden="true" />
        </div>
        <div className="section-heading">
          <h2>{l(t("今日要点", "The essentials"))}</h2>
          <span>01 — 03</span>
        </div>
        {stories
          .slice(day === "09.16" ? 0 : 1, day === "09.16" ? 3 : 4)
          .map((s, i) => (
            <button
              className="brief-point"
              key={s.id}
              onClick={() => openStory(s)}
            >
              <span className="point-index">0{l(i + 1)}</span>
              <div>
                <span className="point-topic">{l(s.topic)}</span>
                <h3>{l(s.title)}</h3>
                <p>{l(s.summary)}</p>
              </div>
              <ChevronRight size={17} />
            </button>
          ))}
        <div className="why-box">
          <span className="row-icon">
            <Sparkles size={18} />
          </span>
          <div>
            <b>{l(t("和你有什么关系？", "Why it matters to you"))}</b>
            <p>
              {l(
                following.length
                  ? "你关注的科技与加密资产，都处在利率预期的传导链上。今天，关注数据能否支持预期。"
                  : "本期覆盖宏观、科技与全球市场。关注资产或主题后，这里将展示与你的关联。",
              )}
            </p>
          </div>
        </div>
        <button
          className="primary wide"
          onClick={() => chat(`${day} 今日简报`)}
        >
          <Sparkles size={17} /> {l(t("问问这份简报", "Ask about this brief"))}
          <ArrowRight size={16} />
        </button>
        <button
          className="secondary wide"
          onClick={() => toggleSave(`brief-${day}`)}
        >
          <Bookmark size={16} />
          {l(
            saved.includes(`brief-${day}`) ? "已收藏这份简报" : "收藏这份简报",
          )}
        </button>
        <div className="end-note">
          <CheckCheck size={17} />
          <span>{l("本期重点已读完")}</span>
          <small>
            {l("下一份简报将于明日")}
            {l(briefTime)}
            {l("生成")}
          </small>
        </div>
      </>
    );
  }
  function renderExplore() {
    const list = stories.filter(
      (s) =>
        (filter === "全部" || s.topic === filter) &&
        (channel !== "关注" ||
          [
            ...s.assets,
            ...(s.author ? [s.author] : []),
            s.topic,
            ...sourceNames.filter((n) => s.source.includes(n)),
          ].some((id) => following.includes(id))),
    );
    return (
      <>
        <div className="title-row">
          <h1>
            {l(t("探索", "Explore"))}
            <span className="title-dot">.</span>
          </h1>
          <div className="actions">
            <SearchButton />
            {iconButton("浏览主题", <LayoutGrid size={20} />, () =>
              push({ kind: "topics", title: "浏览主题" }),
            )}
          </div>
        </div>
        <p className="subtitle">
          {l(
            t(
              "保持好奇，也保持自己的判断。",
              "Stay curious. Keep your perspective.",
            ),
          )}
        </p>
        <div className="tabs">
          {["关注", "推荐", "热门"].map((s, i) => (
            <button
              key={s}
              className={channel === s ? "active" : ""}
              onClick={() => setChannel(s)}
            >
              {l(english ? ["Following", "For you", "Trending"][i] : s)}
            </button>
          ))}
        </div>
        <div className="chips">
          {["全部", ...topics].map((s) => (
            <button
              key={s}
              className={filter === s ? "selected" : ""}
              onClick={() => setFilter(s)}
            >
              {l(s)}
            </button>
          ))}
        </div>
        <div className="section-heading">
          <h2>
            {l(
              channel === "热门"
                ? "市场正在关注"
                : channel === "关注"
                  ? "关注对象的新动态"
                  : "值得你关注",
            )}
          </h2>
          <span>
            {l(
              channel === "关注"
                ? "最新优先"
                : channel === "热门"
                  ? "示例热度排序"
                  : "按相关性排序",
            )}
          </span>
        </div>
        {list.length ? (
          list.map((s, i) => (
            <StoryRow
              key={s.id}
              story={s}
              number={channel === "热门" ? i + 1 : undefined}
            />
          ))
        ) : (
          <Empty
            text={l("这里还没有更新")}
            hint={l("试试其他主题，或添加新的关注对象。")}
          />
        )}
        <div className="small-note">{l("平台示例内容 · 热度不代表可信度")}</div>
      </>
    );
  }
  function renderMarkets() {
    const list = assets.filter((a) =>
      market === "自选"
        ? following.includes(a.id)
        : market === "全部" || a.market === market,
    );
    return (
      <>
        <div className="title-row">
          <h1>
            {l(t("行情", "Markets"))}
            <span className="title-dot">.</span>
          </h1>
          <div className="actions">
            <SearchButton />
            {iconButton("询问行情", <Sparkles size={20} />, () =>
              chat("市场行情"),
            )}
          </div>
        </div>
        <p className="subtitle">
          {l(
            t(
              "看见价格，也读懂背后的变化。",
              "See the price. Understand the context.",
            ),
          )}
        </p>
        <div className="section-heading overview-heading">
          <h2>{l("市场概览")}</h2>
          <button
            className="text-button"
            onClick={() => {
              setOverviewDraft([...overview]);
              push({ kind: "overview-settings", title: "编辑市场概览" });
            }}
          >
            {l("编辑")}
          </button>
        </div>
        <div
          className="market-overview"
          style={{
            gridTemplateColumns: `repeat(${overview.length || 1}, minmax(0, 1fr))`,
          }}
        >
          {overview
            .map((id) => overviewOptions.find((option) => option.id === id))
            .filter((option) => !!option)
            .map((option) => (
              <div key={option.id}>
                <small>{l(option.name)}</small>
                <b>{option.price}</b>
                <span className={option.up ? "positive" : "negative"}>
                  {option.change}
                </span>
              </div>
            ))}
        </div>
        <div className="chips market-chips">
          {["自选", "全部", "美股", "加密资产", "商品"].map((s) => (
            <button
              key={s}
              className={market === s ? "selected" : ""}
              onClick={() => setMarket(s)}
            >
              {l(s)}
            </button>
          ))}
        </div>
        <div className="section-heading">
          <h2>{l(market === "自选" ? "我的自选" : market)}</h2>
          <span>{l("价格 / 24h 涨跌")}</span>
        </div>
        {list.length ? (
          list.map((a) => <AssetRow key={a.id} asset={a} />)
        ) : (
          <Empty
            text={l("还没有自选资产")}
            hint={l("搜索资产名称或代码，添加你的第一项关注。")}
          />
        )}
        <div className="small-note">
          {l("行情为固定情景样本 · USD · 非实时")}
        </div>
        <div className="section-heading">
          <h2>{l("自选相关更新")}</h2>
          <span>{l("事件去重")}</span>
        </div>
        {stories
          .filter((s) => s.assets.some((id) => following.includes(id)))
          .slice(0, 2)
          .map((s) => (
            <StoryRow key={s.id} story={s} />
          ))}
      </>
    );
  }
  function renderProfile() {
    return (
      <>
        <div className="title-row">
          <h1>
            {l(t("我的", "Your space"))}
            <span className="title-dot">.</span>
          </h1>
          {iconButton("通用 AI 对话", <MessageCircle size={20} />, () =>
            chat("通用对话"),
          )}
        </div>
        <div className="profile-identity">
          <div className="avatar">S</div>
          <div>
            <h2>{l(t("保持好奇的你", "Stay curious"))}</h2>
            <p>{l("每一次关注，都由你决定。")}</p>
          </div>
        </div>
        <div className="profile-stats">
          <button
            onClick={() => push({ kind: "following", title: "我的关注" })}
          >
            <b>{l(following.length)}</b>
            <span>{t("关注", "Following")}</span>
          </button>
          <button onClick={() => push({ kind: "saved", title: "我的收藏" })}>
            <b>{l(saved.length)}</b>
            <span>{t("收藏", "Saved")}</span>
          </button>
          <button
            onClick={() => {
              setHistoryType("对话");
              push({ kind: "history", title: "历史记录" });
            }}
          >
            <b>{l(conversations.length)}</b>
            <span>{l("对话")}</span>
          </button>
        </div>
        <div className="group">
          <GroupRow
            icon={<UserRound size={18} />}
            label={l("我的关注")}
            note={l("资产 · 主题 · 作者")}
            onClick={() => push({ kind: "following", title: "我的关注" })}
          />
          <GroupRow
            icon={<SlidersHorizontal size={18} />}
            label={l("内容偏好")}
            onClick={() => push({ kind: "preferences", title: "内容偏好" })}
          />
          <GroupRow
            icon={<Bookmark size={18} />}
            label={l("我的收藏")}
            onClick={() => push({ kind: "saved", title: "我的收藏" })}
          />
          <GroupRow
            icon={<History size={18} />}
            label={l("历史记录")}
            onClick={() => push({ kind: "history", title: "历史记录" })}
          />
        </div>
        <div className="group">
          <GroupRow
            icon={<Settings size={18} />}
            label={l(t("设置", "Settings"))}
            note={l("语言 · 外观 · 通知")}
            onClick={() => push({ kind: "settings", title: "设置" })}
          />
        </div>
        <div className="privacy-note">
          <ShieldCheck size={20} />
          <div>
            <b>{l("你来选择，我们来筛选")}</b>
            <p>
              {l(
                "来源由平台维护。关注与偏好仅用于你的体验，演示记录保存在此浏览器。",
              )}
            </p>
          </div>
        </div>
        <div className="small-note">SIFT / INTERACTIVE PROTOTYPE · 2026</div>
      </>
    );
  }
  function renderPanel() {
    if (!page) return null;
    const s = stories.find((x) => x.id === page.id),
      a = assets.find((x) => x.id === page.id);
    switch (page.kind) {
      case "overview-settings":
        return (
          <>
            <p className="subtitle">
              {l("选择 1–3 项，按顺序展示。仅调整市场概览，不改变自选或关注。")}
            </p>
            <div className="section-heading">
              <h2>{l("展示顺序")}</h2>
              <span>{overviewDraft.length}/3</span>
            </div>
            {overviewDraft.length === 0 && (
              <p className="small-note">{l("从下方选择至少一项")}</p>
            )}
            {overviewDraft.map((id, index) => (
              <div className="overview-edit-row" key={id}>
                <span className="overview-order">{index + 1}</span>
                <b>
                  {l(
                    overviewOptions.find((option) => option.id === id)?.name ??
                      id,
                  )}
                </b>
                <div className="actions">
                  <button
                    className="icon-button"
                    aria-label={`${l("上移")} ${l(overviewOptions.find((option) => option.id === id)?.name ?? id)}`}
                    disabled={index === 0}
                    onClick={() =>
                      setOverviewDraft((current) =>
                        moveOverview(current, id, -1),
                      )
                    }
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`${l("下移")} ${l(overviewOptions.find((option) => option.id === id)?.name ?? id)}`}
                    disabled={index === overviewDraft.length - 1}
                    onClick={() =>
                      setOverviewDraft((current) =>
                        moveOverview(current, id, 1),
                      )
                    }
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </div>
            ))}
            <div className="section-heading">
              <h2>{l("可选指标")}</h2>
              <span>{l("最多 3 项")}</span>
            </div>
            <div className="overview-options">
              {overviewOptions.map((option) => (
                <button
                  key={option.id}
                  role="checkbox"
                  aria-checked={overviewDraft.includes(option.id)}
                  disabled={
                    !overviewDraft.includes(option.id) &&
                    overviewDraft.length >= 3
                  }
                  onClick={() =>
                    setOverviewDraft((current) =>
                      toggleOverview(current, option.id),
                    )
                  }
                >
                  <span>
                    <b>{l(option.name)}</b>
                    <small>{option.id}</small>
                  </span>
                  <span
                    className={`overview-check ${overviewDraft.includes(option.id) ? "checked" : ""}`}
                  >
                    {overviewDraft.includes(option.id) ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <p className="small-note left">
              {l("已满时先取消一项，再选择其他指标。价格均为演示数据。")}
            </p>
            <div className="overview-editor-actions">
              <button
                className="secondary wide"
                onClick={() => setOverviewDraft([...defaultOverview])}
              >
                {l("恢复默认")}
              </button>
              <button
                className="primary wide"
                disabled={overviewDraft.length < 1 || overviewDraft.length > 3}
                onClick={() => {
                  setOverview([...overviewDraft]);
                  back();
                  setToast("市场概览已更新");
                }}
              >
                {l("保存")}
              </button>
            </div>
            <p className="small-note">{l("返回不保存本次修改")}</p>
          </>
        );

      case "story":
        return (
          s && (
            <>
              <div className="eyebrow">
                {l(s.topic)} / {l(s.type)}
              </div>
              <h1 className="detail-title">{l(s.title)}</h1>
              <div className="detail-meta">
                {l(
                  s.author ? (
                    <div className="author-byline">
                      <button
                        className="author-link"
                        onClick={() =>
                          push({
                            kind: "author",
                            id: s.author,
                            title: "作者",
                          })
                        }
                      >
                        <UserRound size={16} />
                        {l(s.author)}
                        <ChevronRight size={14} />
                      </button>
                      <Follow id={s.author} />
                    </div>
                  ) : (
                    <button
                      className="author-link"
                      onClick={() =>
                        push({
                          kind: "source",
                          id: s.source.split(" · ")[0],
                          title: "机构与媒体",
                        })
                      }
                    >
                      {l(s.source)}
                      <ChevronRight size={14} />
                    </button>
                  ),
                )}
                <br />
                2026.09.16 {l(s.time)} · Asia/Shanghai
              </div>
              <div className="summary-box">
                <div className="section-heading">
                  <h2>
                    <Sparkles size={16} />
                    {l("重点摘要")}
                  </h2>
                  {iconButton(
                    saved.includes(s.id) ? "取消收藏" : "收藏",
                    <Bookmark
                      size={18}
                      fill={saved.includes(s.id) ? "currentColor" : "none"}
                    />,
                    () => toggleSave(s.id),
                  )}
                </div>
                <p>{l(s.summary)}</p>
              </div>
              <h2 className="spaced">{l("事实与观察")}</h2>
              {s.points.map((p, i) => (
                <p className="body-copy" key={p}>
                  <span className="inline-number">0{l(i + 1)}</span>
                  {l(p)}
                </p>
              ))}
              <div className="section-heading">
                <h2>{l("相关资产")}</h2>
              </div>
              {assets
                .filter((a) => s.assets.includes(a.id))
                .map((a) => (
                  <AssetRow key={a.id} asset={a} />
                ))}
              <div className="section-heading">
                <h2>{l("来源与依据")}</h2>
                <ShieldCheck size={17} />
              </div>
              {s.author ? (
                <p className="body-copy">
                  {l("本文为虚构作者的观点示例，暂无外部原文。")}
                </p>
              ) : (
                <a
                  className="source-card"
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe2 size={18} />
                  <div>
                    <b>{l(s.source.split(" · ")[0])}</b>
                    <small>{l("机构主页 · 非本情景的报道原文")}</small>
                  </div>
                  <ArrowUpRight size={17} />
                </a>
              )}
              <div className="small-note">
                {l("本页为虚构情景，不能作为投资依据。")}
              </div>
              <button className="primary wide" onClick={() => chat(s.title)}>
                <Sparkles size={17} />
                {l("问问这件事")}
                <ArrowRight size={16} />
              </button>
            </>
          )
        );
      case "asset":
        return (
          a && (
            <>
              <div className="asset-hero">
                <div className="title-row">
                  <div>
                    <div className="eyebrow">
                      {l(a.market)} / {l(a.id)}
                    </div>
                    <h1>{l(a.name)}</h1>
                  </div>
                  <Follow id={a.id} />
                </div>
                <div className="big-price">
                  {l(a.price)}
                  <small>USD</small>
                </div>
                <span className={a.up ? "positive" : "negative"}>
                  {l(a.change)}{" "}
                  <span className="muted">{l("24 小时 · 示例行情")}</span>
                </span>
                <Sparkline
                  english={english}
                  values={
                    period === "日内"
                      ? a.points
                      : period === "一周"
                        ? [...a.points].reverse()
                        : a.points.map((v, i) => v * 0.6 + i * 2)
                  }
                  up={a.up}
                  large
                />
                <div className="chart-labels">
                  <span>09:30</span>
                  <span>11:30</span>
                  <span>14:00</span>
                  <span>16:00</span>
                </div>
                <div className="periods">
                  {["日内", "一周", "一月"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={period === p ? "selected" : ""}
                    >
                      {l(p)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="secondary wide"
                onClick={() => chat(a.name + "行情")}
              >
                <Sparkles size={17} />
                {l("理解这项资产的变化")}
              </button>
              <div className="section-heading">
                <h2>{l("相关资讯")}</h2>
                <span>{l("按事件整理")}</span>
              </div>
              {stories
                .filter((s) => s.assets.includes(a.id))
                .map((s) => (
                  <StoryRow key={s.id} story={s} />
                ))}
              <div className="small-note">
                {l("关注不代表持有 · 不提供交易操作")}
              </div>
            </>
          )
        );
      case "search": {
        const q = query.trim().toLowerCase();
        return (
          <>
            <div className="search-box">
              <Search size={19} />
              <input
                autoFocus
                aria-label={l("搜索内容")}
                placeholder={l("搜索资讯、资产、主题或作者")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query &&
                iconButton("清除搜索", <X size={16} />, () => setQuery(""))}
            </div>
            <div className="tabs">
              {["资讯", "资产", "关注对象"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSearchType(type)}
                  className={searchType === type ? "active" : ""}
                >
                  {l(type)}
                </button>
              ))}
            </div>
            <p className="subtitle">
              {l(q ? "平台已收录的匹配结果" : "试试 BTC、美联储、AI")}
            </p>
            {searchType === "资讯" ? (
              <>
                {stories
                  .filter((s) =>
                    matchesSearch(
                      s.title + s.topic + s.assets.join() + s.source,
                      q,
                    ),
                  )
                  .map((s) => (
                    <StoryRow key={s.id} story={s} />
                  ))}
                {!stories.some((s) =>
                  matchesSearch(
                    s.title + s.topic + s.assets.join() + s.source,
                    q,
                  ),
                ) && (
                  <Empty
                    text={l("未找到相关资讯")}
                    hint={l("请换个关键词；未找到不代表事件没有发生。")}
                  />
                )}
              </>
            ) : searchType === "资产" ? (
              <>
                {assets
                  .filter((a) => matchesSearch(a.name + a.id, q))
                  .map((a) => (
                    <AssetRow key={a.id} asset={a} />
                  ))}
                {!assets.some((a) => matchesSearch(a.name + a.id, q)) && (
                  <Empty
                    text={l("暂未收录该资产")}
                    hint={l("当前演示覆盖美股、加密资产和黄金。")}
                  />
                )}
              </>
            ) : (
              <>
                {[...topics, ...authors.map((a) => a.id), ...sourceNames]
                  .filter((n) => matchesSearch(n, q))
                  .map((n) => (
                    <div className="topic-row" key={n}>
                      <button
                        className="author-link"
                        onClick={() =>
                          push({
                            kind: authors.some((a) => a.id === n)
                              ? "author"
                              : topics.includes(n)
                                ? "topic"
                                : "source",
                            id: n,
                            title: authors.some((a) => a.id === n)
                              ? "作者"
                              : topics.includes(n)
                                ? "主题详情"
                                : "机构与媒体",
                          })
                        }
                      >
                        {l(n)}
                        <small>
                          {l(
                            authors.some((a) => a.id === n)
                              ? "作者"
                              : topics.includes(n)
                                ? "主题"
                                : "机构与媒体",
                          )}
                        </small>
                        <ChevronRight size={14} />
                      </button>
                      <Follow id={n} />
                    </div>
                  ))}
                {![...topics, ...authors.map((a) => a.id), ...sourceNames].some(
                  (n) => matchesSearch(n, q),
                ) && (
                  <Empty
                    text={l("暂未收录该对象")}
                    hint={l("试试其他主题或来源名称。")}
                  />
                )}
              </>
            )}
          </>
        );
      }
      case "topic": {
        const topic = topics.find((topic) => topic === page.id);
        if (!topic) return null;
        const descriptions: Record<string, string> = {
          宏观经济: "跟进经济数据、货币政策与市场预期的变化。",
          "AI 与科技": "关注技术进展、产业投资与科技公司的变化。",
          加密资产: "了解加密市场、链上生态与监管动态。",
          全球市场: "观察全球资产、商品与跨市场的重要变化。",
        };
        return (
          <>
            <div className="eyebrow">TOPIC</div>
            <div className="title-row">
              <h1>{l(topic)}</h1>
              <Follow id={topic} />
            </div>
            <p className="body-copy">{l(descriptions[topic])}</p>
            <div className="section-heading">
              <h2>{l("最新资讯")}</h2>
              <span>{l("最新优先")}</span>
            </div>
            {stories
              .filter((story) => story.topic === topic)
              .map((story) => (
                <StoryRow key={story.id} story={story} />
              ))}
            <div className="small-note">{l("平台示例内容 · 按主题整理")}</div>
          </>
        );
      }
      case "topics":
        return (
          <>
            <p className="subtitle">
              {l("从一个主题开始，持续了解它的变化。")}
            </p>
            {topics.map((n, i) => (
              <div className="topic-card" key={n}>
                <button
                  onClick={() => {
                    push({ kind: "topic", id: n, title: "主题详情" });
                  }}
                >
                  <span className="topic-number">0{l(i + 1)}</span>
                  <h2>{l(n)}</h2>
                  <small>
                    {l(stories.filter((s) => s.topic === n).length)}
                    {l("条示例资讯")}
                  </small>
                </button>
                <Follow id={n} />
              </div>
            ))}
          </>
        );
      case "archive":
        return (
          <>
            <p className="subtitle">
              {l("保留当时的信息与判断，回看变化的起点。")}
            </p>
            {["09.16", "09.15", "09.14"].map((d, i) => (
              <button
                className="archive-row"
                key={d}
                onClick={() => {
                  push({ kind: "brief-detail", id: d, title: "简报详情" });
                }}
              >
                <div className="date-tile">
                  <small>SEP</small>
                  <b>{l(d.slice(-2))}</b>
                </div>
                <div>
                  <h3>
                    {l(
                      i === 0
                        ? "在变化中，找到确定的线索"
                        : "回望市场，留意预期的变化",
                    )}
                  </h3>
                  <small>{l("3 个重点 · 截至 09:30 · 情景示例")}</small>
                </div>
                <ChevronRight size={18} />
              </button>
            ))}
          </>
        );
      case "author": {
        const author = authors.find((a) => a.id === page.id);
        if (!author) return null;
        return (
          <>
            <div className="profile-identity">
              <div className="avatar">{l(author.id).slice(0, 1)}</div>
              <div>
                <h1>{l(author.id)}</h1>
                <p>{l(author.label)}</p>
              </div>
            </div>
            <p className="body-copy">{l(author.bio)}</p>
            <Follow id={author.id} />
            <div className="section-heading">
              <h2>{l("最新内容")}</h2>
              <span>{l("最新优先")}</span>
            </div>
            {stories
              .filter((s) => s.author === author.id)
              .map((s) => (
                <StoryRow key={s.id} story={s} />
              ))}
          </>
        );
      }
      case "source": {
        const source = sourceNames.find((name) => name === page.id);
        if (!source) return null;
        const descriptions: Record<string, string> = {
          美联储: "这里展示与美联储相关的宏观经济与货币政策情景。",
          产业观察: "这里展示科技产业、算力与基础设施相关的情景。",
          市场数据: "这里展示价格、交易与资金变化相关的情景。",
          全球市场观察: "这里展示全球资产与商品市场相关的情景。",
        };
        return (
          <>
            <div className="eyebrow">SOURCE</div>
            <h1>{l(source)}</h1>
            <p className="body-copy">{l(descriptions[source])}</p>
            <p className="small-note">
              {l("平台来源演示 · 简介与内容均为示例，不代表机构官方发布。")}
            </p>
            <Follow id={source} />
            <div className="section-heading">
              <h2>{l("最新内容")}</h2>
              <span>{l("最新优先")}</span>
            </div>
            {stories
              .filter((story) => story.source.split(" · ")[0] === source)
              .map((story) => (
                <StoryRow key={story.id} story={story} />
              ))}
          </>
        );
      }
      case "following": {
        const visibleIds = [
          ...new Set([...(page.followingIds ?? []), ...following]),
        ];
        const groups = [
          { label: "资产", ids: assets.map((a) => a.id) },
          { label: "主题", ids: topics },
          { label: "作者", ids: authors.map((a) => a.id) },
          { label: "机构与媒体", ids: sourceNames },
        ];
        return (
          <>
            <p className="subtitle">
              {l("已关注的对象。取消后可在本页重新关注。")}
            </p>
            {visibleIds.length === 0 && (
              <Empty
                text={l("还没有关注")}
                hint={l("在探索中发现内容，或搜索资产、主题和作者。")}
              />
            )}
            {groups.map((group) => {
              const ids = group.ids.filter((id) => visibleIds.includes(id));
              if (!ids.length) return null;
              return (
                <section key={group.label}>
                  <div className="section-heading">
                    <h2>{l(group.label)}</h2>
                  </div>
                  {ids.map((id) => (
                    <div className="topic-row" key={id}>
                      <div>
                        <button
                          className="author-link"
                          onClick={() =>
                            push({
                              kind:
                                group.label === "资产"
                                  ? "asset"
                                  : group.label === "主题"
                                    ? "topic"
                                    : group.label === "作者"
                                      ? "author"
                                      : "source",
                              id,
                              title: ["作者", "机构与媒体"].includes(
                                group.label,
                              )
                                ? group.label
                                : `${group.label}详情`,
                            })
                          }
                        >
                          {l(assets.find((a) => a.id === id)?.name ?? id)}
                          {group.label === "资产" && <small>{l(id)}</small>}
                          <ChevronRight size={14} />
                        </button>
                        {!following.includes(id) && (
                          <small className="unfollowed-note">
                            {l("已取消关注")}
                          </small>
                        )}
                      </div>
                      <Follow id={id} />
                    </div>
                  ))}
                </section>
              );
            })}
            <button
              className="secondary wide"
              onClick={() => {
                setQuery("");
                setSearchType("关注对象");
                push({ kind: "search", title: "搜索" });
              }}
            >
              <Plus size={16} />
              {l("添加关注")}
            </button>
          </>
        );
      }
      case "preferences":
        return (
          <>
            <p className="subtitle">
              {l("明确告诉我们什么重要。你可以随时修改。")}
            </p>
            <label className="field-label" htmlFor="preference">
              {l("我的内容偏好")}
            </label>
            <textarea
              id="preference"
              value={pref}
              onChange={(e) => setPref(e.target.value)}
              placeholder={l("例如：关注美联储，不看纯价格播报")}
            />
            <div className="small-note left">
              {l(
                "自动保存，清空即可取消。当前 Demo 仅保存偏好，不改变示例推荐。",
              )}
            </div>
            <button
              className="secondary wide"
              onClick={() => {
                setPref("");
                setToast("已清除偏好，可重新填写");
              }}
            >
              {l("清除这条偏好")}
            </button>
            <div className="why-box">
              <ShieldCheck size={22} />
              <p>
                {l(
                  "一次浏览或临时提问，不会自动变成长期偏好。演示推荐为固定样本，不会调用模型。",
                )}
              </p>
            </div>
          </>
        );
      case "settings":
        return (
          <>
            <h2 className="spaced">
              {l(t("外观与语言", "Appearance & language"))}
            </h2>
            <div className="setting-row">
              <b>{l(t("界面语言", "Interface language"))}</b>
              <select
                aria-label={l("界面语言")}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="zh">{l("简体中文")}</option>
                <option value="en">English</option>
              </select>
            </div>
            <small className="muted">
              {l("界面与平台资讯随语言切换；内容偏好和已有对话保留原文。")}
            </small>
            <div className="setting-row">
              <b>{l(t("界面主题", "Theme"))}</b>
            </div>
            <div className="theme-options">
              {[
                { id: "light", name: "浅色", Icon: Sun },
                { id: "dark", name: "深色", Icon: Moon },
                { id: "system", name: "跟随系统", Icon: Monitor },
              ].map(({ id, name, Icon }) => (
                <button
                  key={id}
                  className={theme === id ? "selected" : ""}
                  onClick={() => setTheme(id)}
                >
                  <Icon size={20} />
                  {l(name)}
                  {theme === id && <Check size={13} />}
                </button>
              ))}
            </div>
            <h2 className="spaced">{l("简报与通知")}</h2>
            <div className="setting-row">
              <b>{l("简报时间")}</b>
              <input
                aria-label={l("简报时间")}
                type="time"
                value={briefTime}
                onChange={(e) => setBriefTime(e.target.value)}
              />
            </div>
            <Toggle
              label={l("简报与重要更新提醒")}
              value={notice}
              onChange={() => setNotice(!notice)}
              hint={l("仅保存演示设置，不发送系统通知")}
            />
            <Toggle
              label={l("夜间免打扰")}
              value={quiet}
              onChange={() => setQuiet(!quiet)}
              hint={l("22:00 – 08:00")}
            />
            <h2 className="spaced">{l("数据与隐私")}</h2>
            <button
              className="secondary wide"
              onClick={() => {
                setSaved((items) =>
                  addMissingRecords(items, demoSaved, (item) => item),
                );
                setRead((items) =>
                  addMissingRecords(items, demoRead, (item) => item),
                );
                setConversations((items) =>
                  addMissingRecords(
                    items,
                    demoConversations,
                    (item) => item.id,
                  ),
                );
                setToast("已添加示例记录，已有内容保持不变");
              }}
            >
              {l("添加示例收藏和中文对话")}
            </button>
            <p className="body-copy">
              {l(
                "关注、收藏、偏好和对话仅保存在当前浏览器。演示无需登录，不上传个人信息。",
              )}
            </p>
          </>
        );
      case "brief-detail":
        return renderBrief(page.id, true);
      case "saved":
        return (
          <>
            {saved
              .filter((id) => id.startsWith("brief-"))
              .map((id) => (
                <button
                  className="archive-row"
                  key={id}
                  onClick={() => {
                    push({
                      kind: "brief-detail",
                      id: id.slice(6),
                      title: "简报详情",
                    });
                  }}
                >
                  <FileText size={24} />
                  <div>
                    <h3>
                      {l(id.slice(6))}
                      {l("每日简报")}
                    </h3>
                    <small>{l("已保存的简报")}</small>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            {stories
              .filter((s) => saved.includes(s.id))
              .map((s) => (
                <StoryRow key={s.id} story={s} />
              ))}
            {!saved.length && (
              <Empty
                text={l("把值得回看的，留在这里")}
                hint={l("点击资讯或简报中的收藏按钮即可保存。")}
              />
            )}
          </>
        );
      case "history": {
        const items =
          historyType === "浏览"
            ? read
                .map((id) => stories.find((story) => story.id === id))
                .filter((story): story is Story => !!story)
                .map((story) => ({
                  id: story.id,
                  title: l(story.title),
                  subtitle: `${l(story.source)} · ${story.time}`,
                  story,
                }))
            : conversations.map((c) => ({
                id: c.id,
                title: c.context,
                subtitle: `${c.messages.filter((m) => m.role === "user").length} ${l("次提问 · 本地保存")}`,
                conversation: c,
              }));
        const allSelected =
          items.length > 0 &&
          items.every((item) => selectedHistory.includes(item.id));
        const resetManagement = () => {
          setManagingHistory(false);
          setSelectedHistory([]);
          setClearHistory(false);
        };
        const removeSelected = () => {
          setUndoHistory(
            historyType === "浏览"
              ? { kind: "浏览", read: [...read] }
              : { kind: "对话", conversations: [...conversations] },
          );
          if (historyType === "浏览")
            setRead((current) =>
              current.filter((id) => !selectedHistory.includes(id)),
            );
          else
            setConversations((current) =>
              current.filter((c) => !selectedHistory.includes(c.id)),
            );
          resetManagement();
        };
        return (
          <>
            <div className="history-heading">
              <div className="tabs">
                {["浏览", "对话"].map((kind) => (
                  <button
                    key={kind}
                    className={historyType === kind ? "active" : ""}
                    onClick={() => {
                      setHistoryType(kind);
                      resetManagement();
                      setUndoHistory(null);
                    }}
                  >
                    {l(kind)}
                  </button>
                ))}
              </div>
              {items.length > 0 && (
                <button
                  className="text-button"
                  onClick={() => {
                    if (managingHistory) resetManagement();
                    else {
                      setManagingHistory(true);
                      setUndoHistory(null);
                    }
                  }}
                >
                  {l(managingHistory ? "完成" : "管理")}
                </button>
              )}
            </div>
            <div className="history-meta">
              <span>
                {items.length} {l("条记录")}
              </span>
              {managingHistory ? (
                <button
                  className="text-button"
                  onClick={() => {
                    setSelectedHistory(
                      allSelected ? [] : items.map((item) => item.id),
                    );
                    setClearHistory(false);
                  }}
                >
                  {l(allSelected ? "取消全选" : "全选")}
                </button>
              ) : (
                <span>{l("最新优先")}</span>
              )}
            </div>
            {undoHistory?.kind === historyType && (
              <div className="history-feedback" role="status">
                <span>
                  <Check size={16} />
                  {l("记录已删除")}
                </span>
                <button
                  className="text-button"
                  onClick={() => {
                    if (undoHistory.read) setRead(undoHistory.read);
                    if (undoHistory.conversations)
                      setConversations(undoHistory.conversations);
                    setUndoHistory(null);
                  }}
                >
                  {l("撤销")}
                </button>
              </div>
            )}
            <div className="history-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`history-record ${managingHistory ? "selectable" : ""} ${managingHistory && selectedHistory.includes(item.id) ? "selected" : ""}`}
                  role={managingHistory ? "checkbox" : undefined}
                  aria-checked={
                    managingHistory
                      ? selectedHistory.includes(item.id)
                      : undefined
                  }
                  onClick={() => {
                    if (managingHistory) {
                      setSelectedHistory((current) =>
                        current.includes(item.id)
                          ? current.filter((id) => id !== item.id)
                          : [...current, item.id],
                      );
                      setClearHistory(false);
                    } else if ("story" in item) openStory(item.story);
                    else {
                      setMessages(item.conversation.messages);
                      setChatId(item.conversation.id);
                      push({ kind: "chat", title: item.conversation.context });
                    }
                  }}
                >
                  {managingHistory ? (
                    <span className="history-checkbox" aria-hidden="true">
                      {selectedHistory.includes(item.id) && <Check size={14} />}
                    </span>
                  ) : (
                    <span className="history-record-icon">
                      {historyType === "浏览" ? (
                        <FileText size={18} />
                      ) : (
                        <MessageCircle size={18} />
                      )}
                    </span>
                  )}
                  <span className="history-record-copy">
                    <b>{item.title}</b>
                    <small>{item.subtitle}</small>
                  </span>
                  {!managingHistory && <ChevronRight size={16} />}
                </button>
              ))}
            </div>
            {!items.length && (
              <Empty
                text={l(
                  historyType === "浏览" ? "还没有浏览记录" : "还没有对话",
                )}
                hint={l(
                  historyType === "浏览"
                    ? "可以到探索中发现更多资讯。"
                    : "从新闻或资产详情发起一次追问。",
                )}
              />
            )}
            {managingHistory && (
              <div className="history-manage-bar">
                {clearHistory ? (
                  <div className="history-confirm" role="alert">
                    <h3>{l("删除所选记录？")}</h3>
                    <p>
                      {selectedHistory.length} {l("条记录")} ·{" "}
                      {l(
                        historyType === "浏览"
                          ? "不影响收藏和关注"
                          : "包含对话中的全部消息",
                      )}
                    </p>
                    <div className="history-confirm-actions">
                      <button
                        className="secondary"
                        onClick={() => setClearHistory(false)}
                      >
                        {l("取消")}
                      </button>
                      <button
                        className="history-delete"
                        onClick={removeSelected}
                      >
                        {l("确认删除")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span>
                      {l("已选择")} {selectedHistory.length} {l("条")}
                    </span>
                    <button
                      className="history-delete"
                      disabled={!selectedHistory.length}
                      onClick={() => setClearHistory(true)}
                    >
                      <Trash2 size={16} />
                      {l("删除所选")}
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        );
      }
      case "chat":
        return (
          <>
            <div className="chat-context">
              <Sparkles size={20} />
              <div>
                <small>{l("当前讨论")}</small>
                <b>{page.title}</b>
              </div>
              {page.title !== "通用对话" &&
                iconButton("结束当前上下文", <X size={16} />, () =>
                  setStack((s) => [
                    ...s.slice(0, -1),
                    { kind: "chat", title: "通用对话" },
                  ]),
                )}
            </div>
            <div className="small-note">
              {l("本地情景回答 · 未连接模型或实时检索")}
            </div>
            {!messages.length && (
              <div className="chat-welcome">
                <span className="ai-orb">
                  <Sparkles size={28} />
                </span>
                <h2>{l("从一个好问题开始。")}</h2>
                <p>{l("把事实、影响和待验证的部分分开看。")}</p>
                {[
                  "这件事为什么值得关注？",
                  "与我关注的资产有什么关系？",
                  "接下来应该核对哪些数据？",
                ].map((q) => (
                  <button key={q} onClick={() => send(l(q))}>
                    {l(q)}
                    <ArrowRight size={15} />
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div className={`message ${m.role}`} key={i}>
                {m.role === "assistant" && (
                  <span className="assistant-label">
                    <Sparkles size={14} />
                    {l("SIFT · 演示回答")}
                  </span>
                )}
                <p>{m.text}</p>
              </div>
            ))}
          </>
        );
      default:
        return null;
    }
  }
  function renderOnboarding() {
    return (
      <>
        <div className="eyebrow">MAKE IT YOURS</div>
        <h1 className="onboard-title">
          {l("你关心的，")}
          <br />
          {l("我们帮你留意。")}
        </h1>
        <p className="subtitle">
          {l("选择几个资产或主题，就可以开始。")}
          <br />
          {l("不必连接任何外部账号。")}
        </p>
        <h2 className="spaced">{l("关注的资产")}</h2>
        <div className="onboard-grid">
          {assets.slice(0, 4).map((a) => (
            <button
              key={a.id}
              className={following.includes(a.id) ? "selected" : ""}
              onClick={() => toggleFollow(a.id)}
            >
              <b>{l(a.id)}</b>
              <span>{l(a.name)}</span>
              {following.includes(a.id) ? (
                <Check size={16} />
              ) : (
                <Plus size={16} />
              )}
            </button>
          ))}
        </div>
        <h2 className="spaced">{l("感兴趣的方向")}</h2>
        <div className="chips wrap">
          {topics.map((n) => (
            <button
              key={n}
              className={following.includes(n) ? "selected" : ""}
              onClick={() => toggleFollow(n)}
            >
              {l(n)}
            </button>
          ))}
        </div>
        <button className="primary wide" onClick={() => navigate("brief")}>
          {l("开始阅读")}
          <ArrowRight size={17} />
        </button>
        <button
          className="text-button wide"
          onClick={() => {
            setFollowing([]);
            navigate("brief");
          }}
        >
          {l("跳过，先看看平台要闻")}
        </button>
      </>
    );
  }
  return (
    <div className={`workspace ${dark ? "dark" : ""}`}>
      <header className="studio-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("brief");
          }}
        >
          <span className="brand-mark">s</span>sift
          <span className="brand-dot">.</span>
          <span className="brand-caption">{l("看见重要的变化")}</span>
        </a>
        <div className="studio-pill">
          <span />
          {l("交互原型")}
          <span className="pill-divider" /> PRODUCT DESIGN
        </div>
        <span className="studio-version">
          SEPTEMBER 2026 <b>V.01</b>
        </span>
      </header>
      <div className="studio-layout">
        <aside className="studio-sidebar">
          <div className="eyebrow">THE EXPERIENCE</div>
          <h2>
            {l("把信息，")}
            <br />
            {l("整理成线索。")}
          </h2>
          <p>
            {l("以关注为起点，")}
            <br />
            {l("以理解为目的。")}
          </p>
          <div className="sidebar-label">{l("产品场景")}</div>
          <nav>
            {sections.map((s, i) => {
              const Icon = navIcons[i] ?? Sparkles;
              return (
                <button
                  key={s.id}
                  className={tab === s.id ? "active" : ""}
                  onClick={() => navigate(s.id)}
                >
                  <span className="nav-index">0{l(i + 1)}</span>
                  <Icon size={17} />
                  <span>{l(s.name)}</span>
                  {tab === s.id && <span className="active-dot" />}
                </button>
              );
            })}
          </nav>
          <div className="sidebar-bottom">
            <ShieldCheck size={18} />
            <p>
              {l("所有来源由平台提供")}
              <br />
              {l("选择关注，无需配置")}
            </p>
            <small>{l("DEMO · 数据为情景样本")}</small>
          </div>
        </aside>
        <main className="stage">
          <div className="stage-heading">
            <span>{l(section.en)}</span>
            <span>
              {page?.kind === "chat"
                ? page.title
                : l(page?.title ?? section.name)}{" "}
              <MoreHorizontal size={17} />
            </span>
          </div>
          <div className="phone">
            <div className="phone-status">
              <b>9:41</b>
              <span className="island" />
              <div>
                <Signal size={14} />
                <Wifi size={14} />
                <BatteryFull size={19} />
              </div>
            </div>
            <div className="app-top">
              <span className="mini-brand">
                sift<span>.</span>
              </span>
              <span>{l("财经资讯助手")}</span>
              <span className="demo-label">DEMO</span>
            </div>
            {page && (
              <div className="page-header">
                {iconButton("返回", <ArrowLeft size={21} />, back)}
                <b>{l(page.kind === "chat" ? "AI 追问" : page.title)}</b>
                <span className="header-spacer" />
              </div>
            )}
            <div className="app-scroll" ref={bodyRef}>
              {page
                ? renderPanel()
                : tab === "brief"
                  ? renderBrief()
                  : tab === "explore"
                    ? renderExplore()
                    : tab === "markets"
                      ? renderMarkets()
                      : tab === "profile"
                        ? renderProfile()
                        : renderOnboarding()}
            </div>
            {page?.kind === "chat" ? (
              <form
                className="chat-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(chatInput);
                }}
              >
                <input
                  aria-label={l("输入问题")}
                  placeholder={l("继续问问…")}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  className="primary"
                  aria-label={l("发送")}
                  disabled={!chatInput.trim()}
                >
                  <Send size={18} />
                </button>
              </form>
            ) : (
              !page && (
                <nav className="bottom-nav" aria-label={l("App 主导航")}>
                  {sections.slice(0, 4).map((s, i) => {
                    const Icon = navIcons[i];
                    return (
                      <button
                        key={s.id}
                        className={tab === s.id ? "active" : ""}
                        onClick={() => navigate(s.id)}
                      >
                        <Icon
                          size={21}
                          strokeWidth={tab === s.id ? 2.3 : 1.7}
                        />
                        <span>
                          {l(
                            english
                              ? ["Brief", "Explore", "Markets", "Me"][i]
                              : ["简报", "探索", "行情", "我的"][i],
                          )}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              )
            )}
            <div className="home-indicator" />
            {toast && (
              <div className="toast" role="status">
                <Check size={16} />
                {l(toast)}
              </div>
            )}
          </div>
          <div className="stage-footer">
            <span>390 × 844 · RESPONSIVE EXPERIENCE</span>
            <span>{l("关注 → 理解 → 追问")}</span>
          </div>
        </main>
        <aside className="design-notes">
          <div className="eyebrow">
            DESIGN NOTE / 0{l(sections.indexOf(section) + 1)}
          </div>
          <h2>{l(section.purpose)}</h2>
          <p className="note-lead">{l(section.description)}</p>
          <div className="note-rule" />
          {section.details.map((d, i) => (
            <div className="design-point" key={d}>
              <span>0{l(i + 1)}</span>
              <p>{l(d)}</p>
            </div>
          ))}
          <div className="value-loop">
            <div className="eyebrow">ONE CONTINUOUS JOURNEY</div>
            <p>{l("发现变化")}</p>
            <div className="loop-line" />
            <p>{l("核对事实与来源")}</p>
            <div className="loop-line" />
            <p>{l("带着上下文继续追问")}</p>
          </div>
          <div className="prototype-note">
            <span className="mini-brand">sift.</span>
            <p>
              {l("可交互的产品原型。")}
              <br />
              {l("关注、收藏与偏好保存在本地。")}
              <br />
              {l("资讯、行情与 AI 回答为演示。")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
export default App;

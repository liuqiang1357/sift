import { demoEdition, demoRecordKey } from "./demo-scenario";
import { quoteChartTimes } from "./quotes";
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
  createDemoState,
  createEmptyDemoState,
} from "./demo-records";
import type { Message, Conversation } from "./demo-records";
import { createLocalizer, matchesSearch } from "./i18n";
import {
  collapseSources,
  createBriefEditions,
  demoNow,
  formatContentTime,
  sourceVersions,
  otherPublications,
  sourceRoot,
  relatedCollections,
  contextEntries,
  formatListTime,
  recommendationDirections,
  recommendationReason,
  briefRelevance,
  browseContent,
  collectionEntries,
  collectionEntry,
  collectionsForSource,
  entryUpdate,
  entryNote,
  briefNote,
  hasUnreadChanges,
  migrateBriefEditions,
  parseRef,
  refKey,
  resolveEntry,
  sourceEntry,
  selectFeed,
} from "./content";
import { collections } from "./collections";
import type { ContentRef, MaterialRole } from "./collections";
import type {
  ContentEntry,
  BriefEdition,
  Channel,
  ReadingContext,
  PersonalRelevance,
} from "./content";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Compass,
  History,
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
  RefreshCw,
} from "lucide-react";
import type { ReactNode } from "react";
import { ChoiceChip } from "./ChoiceChip";
import { ReferenceRow } from "./ReferenceRow";
import { assets, sourceProfiles, sections, sourceItems, topics } from "./data";
import type { SourceItem } from "./data";
import type { ArticleSection } from "./longform";
import { ContentThumbnail, MediaBlock } from "./ArticleMedia";
import { useStored } from "./store";
import {
  markets,
  migrateReadingChoices,
  choiceLabel,
  toggleInterest,
  excludeRecommendation,
  sourceChoices,
  toggleChoice,
} from "./reading-choices";
import type { ReadingChoices } from "./reading-choices";
import { Preferences } from "./PreferenceEditor";
import { adjacentTab, refreshThreshold } from "./gestures";
import { useFeedGestures } from "./useFeedGestures";

type Page = ReadingContext & {
  kind: string;
  id?: string;
  title?: string;
  followingIds?: string[];
  watchlistIds?: string[];
  savedIds?: string[];
  version?: number;
};
const navIcons: Record<string, typeof FileText> = {
  onboarding: Sparkles,
  brief: FileText,
  explore: Compass,
  markets: TrendingUp,
  profile: UserRound,
};
const appSections = sections.filter((section) => section.id !== "onboarding");
const exploreChannels = ["关注", "推荐", "热点", "专题"] as const;
const feedSortLabels: Record<Channel | "专题", string> = {
  关注: "最新优先",
  推荐: "相关优先",
  热点: "重要优先",
  专题: "最新优先",
};
const marketTabs = ["自选", "全部", ...markets];
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
      aria-label={l("价格走势")}
    >
      <title>{l("价格走势")}</title>
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
          fill={up ? "var(--green)" : "var(--red)"}
          opacity=".07"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={up ? "var(--green)" : "var(--red)"}
        strokeWidth="2"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
function App() {
  const [tab, setTab] = useState("brief"),
    [stack, setStack] = useState<Page[]>([]);
  function readStoredValue(key: string) {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "null");
    } catch {
      return null;
    }
  }
  const [choices, setChoices] = useStored<ReadingChoices>(
    "sift-reading-choices",
    () =>
      migrateReadingChoices(
        readStoredValue("sift-following"),
        readStoredValue("sift-pref"),
      ),
    (value) => migrateReadingChoices(value, readStoredValue("sift-pref")),
  );
  const { sources: following, watchlist } = choices;
  const [overview, setOverview] = useStored<string[]>(
    "sift-market-overview",
    defaultOverview,
  );
  const [overviewDraft, setOverviewDraft] = useState<string[]>([]);
  const expandedSections = useRef<Record<string, boolean>>({});
  const [saved, setSaved] = useStored<string[]>(
    demoRecordKey("saved"),
    demoSaved,
  );
  const [read, setRead] = useStored<string[]>(demoRecordKey("read"), demoRead);
  const [theme, setTheme] = useStored("sift-theme", "system"),
    [language, setLanguage] = useStored("sift-language", "zh");
  const [editions, setEditions] = useStored<BriefEdition[]>(
    demoRecordKey("brief-editions"),
    () => createBriefEditions(choices),
    migrateBriefEditions,
  );
  const [conversations, setConversations] = useStored<Conversation[]>(
    demoRecordKey("conversations"),
    demoConversations,
  );
  const [channel, setChannel] = useState<Channel | "专题">("推荐"),
    [filter, setFilter] = useState("全部"),
    [market, setMarket] = useState("自选");
  const [query, setQuery] = useState(""),
    [searchType, setSearchType] = useState("内容"),
    [period, setPeriod] = useState("日内");
  const [chatInput, setChatInput] = useState("");
  const [feedbackEntry, setFeedbackEntry] = useState<ContentEntry | null>(null);
  const feedbackDialog = useRef<HTMLDialogElement>(null);
  const [toast, setToast] = useState("");
  const [systemDark, setSystemDark] = useState(false);
  const [dataAction, setDataAction] = useState<"reset" | "clear" | null>(null);
  const dataDialog = useRef<HTMLDialogElement>(null);
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
  const messages =
    (page?.kind === "chat" &&
      conversations.find((conversation) => conversation.id === page.id)
        ?.messages) ||
    [];
  const l = createLocalizer(english);
  const section = sections.find((s) => s.id === tab) ?? appSections[0];
  const readEntries = read.flatMap((key) => {
    const entry = resolveEntry(parseRef(key));
    return entry ? [entry] : [];
  });
  const readingEntry =
    page?.kind === "story" && page.id
      ? resolveEntry({ kind: "item", id: page.id })
      : page?.kind === "collection" && page.id && page.version
        ? resolveEntry({
            kind: "collection",
            id: page.id,
            version: page.version,
          })
        : undefined;
  const dark = theme === "dark" || (theme === "system" && systemDark);
  const gestures = useFeedGestures(bodyRef, {
    context: page
      ? `${tab}/${page.kind}/${page.id ?? ""}`
      : `${tab}/${tab === "explore" ? `${channel}/${filter}` : market}`,
    enabled: !page && ["brief", "explore", "markets"].includes(tab),
    onSwipe:
      !page && tab === "explore"
        ? (step) => {
            const next = adjacentTab(exploreChannels, channel, step);
            if (next) changeChannel(next);
          }
        : !page && tab === "markets"
          ? (step) => {
              const next = adjacentTab(marketTabs, market, step);
              if (next) changeMarket(next);
            }
          : undefined,
    onRefresh: refreshContent,
    onError: () => setToast("刷新失败，请重试"),
  });

  function changeChannel(next: (typeof exploreChannels)[number]) {
    if (next === channel) return;
    setChannel(next);
    bodyRef.current?.scrollTo(0, 0);
  }
  function changeMarket(next: string) {
    if (next === market) return;
    setMarket(next);
    bodyRef.current?.scrollTo(0, 0);
  }
  async function refreshContent(signal: AbortSignal) {
    // Demonstrate request feedback without inventing live data or a new edition.
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 450);
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
    if (!signal.aborted) setToast("暂无新数据");
  }
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (feedbackEntry) feedbackDialog.current?.showModal();
    else feedbackDialog.current?.close();
  }, [feedbackEntry]);
  useEffect(() => {
    if (dataAction) dataDialog.current?.showModal();
    else dataDialog.current?.close();
  }, [dataAction]);
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
  useEffect(() => {
    if (page || tab !== "markets") return;
    const row = bodyRef.current?.querySelector<HTMLElement>(".market-chips");
    const selected = row?.querySelector<HTMLElement>(".selected");
    if (!row || !selected) return;
    const bounds = row.getBoundingClientRect();
    const button = selected.getBoundingClientRect();
    if (button.left < bounds.left) row.scrollLeft -= bounds.left - button.left;
    else if (button.right > bounds.right)
      row.scrollLeft += button.right - bounds.right;
  }, [market, tab, page]);
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
    if (page?.kind === "reading-history" || page?.kind === "conversations") {
      setUndoHistory(null);
      setManagingHistory(false);
      setSelectedHistory([]);
      setClearHistory(false);
    }
    if (
      p.kind === page?.kind &&
      p.id === page?.id &&
      p.title === page?.title &&
      p.version === page?.version
    )
      return;
    if (p.kind === "asset") setPeriod("日内");
    positions.current.push(bodyRef.current?.scrollTop ?? 0);
    setStack((s) => [
      ...s,
      p.kind === "following"
        ? { ...p, followingIds: [...following] }
        : p.kind === "watchlist"
          ? { ...p, watchlistIds: [...watchlist] }
          : p.kind === "saved"
            ? { ...p, savedIds: [...saved] }
            : p,
    ]);
    requestAnimationFrame(() => bodyRef.current?.scrollTo(0, 0));
  }
  function back() {
    if (page?.kind === "reading-history" || page?.kind === "conversations") {
      setUndoHistory(null);
      setManagingHistory(false);
      setSelectedHistory([]);
      setClearHistory(false);
    }
    setStack((s) => s.slice(0, -1));
    const y = positions.current.pop() ?? 0;
    requestAnimationFrame(() => bodyRef.current?.scrollTo(0, y));
  }
  function applyDemoState(state: ReturnType<typeof createDemoState>) {
    const copy = structuredClone(state);
    try {
      localStorage.removeItem("sift-following");
      localStorage.removeItem("sift-pref");
    } catch {
      /* Storage is optional in private browsing. */
    }
    setChoices(copy.choices);
    setSaved(copy.saved);
    setRead(copy.read);
    setConversations(copy.conversations);
    setEditions(copy.editions);
    setOverview(copy.overview);
    setOverviewDraft([]);
    expandedSections.current = {};
    setChatInput("");
    setQuery("");
    setFilter("全部");
    setChannel("推荐");
    setMarket("自选");
    setManagingHistory(false);
    setSelectedHistory([]);
    setClearHistory(false);
    setUndoHistory(null);
  }
  function toggleFollow(id: string) {
    if (sourceChoices.includes(id))
      setChoices((current) => toggleChoice(current, "sources", id));
  }
  function toggleWatchlist(id: string) {
    setChoices((current) => toggleChoice(current, "watchlist", id));
  }
  function toggleSave(id: string) {
    setSaved((s) => (s.includes(id) ? s.filter((v) => v !== id) : [id, ...s]));
    if (!saved.includes(id)) {
      setStack((current) =>
        current.map((p) =>
          p.kind === "saved" && !p.savedIds?.includes(id)
            ? { ...p, savedIds: [id, ...(p.savedIds ?? [])] }
            : p,
        ),
      );
    }
    setToast(saved.includes(id) ? "已取消收藏" : "已加入收藏");
  }
  function rememberExpanded(key: string, open: boolean) {
    expandedSections.current[key] = open;
  }
  function openSource(s: SourceItem) {
    setRead((r) => [s.id, ...r.filter((id) => id !== s.id)]);
    push({ kind: "story", id: s.id, title: "内容详情" });
  }
  function openEntry(entry: ContentEntry) {
    if (entry.ref.kind === "item") {
      const item = sourceItems.find((item) => item.id === entry.ref.id);
      if (item) openSource(item);
      return;
    }
    const key = refKey(entry.ref);
    setRead((current) => [key, ...current.filter((id) => id !== key)]);
    push({
      kind: "collection",
      id: entry.ref.id,
      version: entry.ref.version,
      title: entry.type === "专题" ? "专题详情" : "事件详情",
    });
  }
  function chat(
    title: string,
    origin: ReadingContext = {},
    replaceCurrent = false,
  ) {
    setChatInput("");
    const next: Page = {
      kind: "chat",
      id: crypto.randomUUID(),
      title,
      reference: origin.reference,
      briefId: origin.briefId,
      assetId: origin.assetId,
    };
    if (replaceCurrent) {
      setStack((current) => [...current.slice(0, -1), next]);
      requestAnimationFrame(() => bodyRef.current?.scrollTo(0, 0));
    } else push(next);
  }
  function demoReply(context: string, question: string) {
    const entries = contextEntries(page ?? {}, editions);
    const edition = editions.find((item) => item.id === page?.briefId);
    const asset = assets.find((item) => item.id === page?.assetId);
    const updated = entries.some((entry) => entryUpdate(entry));
    const evidence = edition
      ? edition.items.length
        ? `${l("简报截至")} ${formatContentTime(edition.cutoff, english, true)}\n\n${edition.items
            .map((item, index) => {
              const note = briefNote(item);
              return `${index + 1}. ${l(item.title)}\n${l(item.summary)}${note ? `\n\n${l(note.text)}` : ""}`;
            })
            .join("\n\n")}`
        : l("本期没有入选内容，无法据此归纳变化。")
      : entries.length
        ? `${updated ? l("所引版本已有更新，以下仍基于当时材料。") + "\n\n" : ""}${entries
            .map((entry) => {
              const note = entryNote(entry);
              const text = entry.points.map((point) => l(point)).join("\n\n");
              return note ? `${text}\n\n${l(note.text)}` : text;
            })
            .join("\n\n")}`
        : asset
          ? `${l(asset.name)} (${asset.id})\n${asset.value} ${l(asset.unit)} · ${asset.change} (${l(asset.changePeriod)})\n${l(asset.status)} · ${formatContentTime(asset.asOf, english, true)}`
          : l(
              "先核对来源、发布时间与统计周期，再观察后续数据是否支持当前预期。单次价格变化不能证明因果关系。",
            );
    return english
      ? `For “${question}”, start with the material about “${l(context)}”:\n\n${l(evidence)}\n\nThe available material may not fully answer the question; further evidence is needed.`
      : `关于「${question}」，可以先核对「${context}」中的材料：\n\n${evidence}\n\n现有材料未必能完整回答这个问题，还需要补充依据。`;
  }
  function send(text: string) {
    if (page?.kind !== "chat" || !page.id || !text.trim()) return;
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
    setChatInput("");
    setConversations((c) => [
      {
        id: page.id!,
        context: page?.title ?? "通用对话",
        messages: next,
        reference: page?.reference,
        briefId: page?.briefId,
        assetId: page?.assetId,
      },
      ...c.filter((v) => v.id !== page.id),
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
  function SaveButton({ id }: { id: string }) {
    const active = saved.includes(id);
    const label = l(active ? "取消收藏" : "收藏");
    return (
      <button
        className="icon-button"
        aria-label={label}
        aria-pressed={active}
        title={label}
        onClick={() => toggleSave(id)}
      >
        <Bookmark size={16} fill={active ? "currentColor" : "none"} />
      </button>
    );
  }
  function SearchButton() {
    return iconButton("搜索", <Search size={20} />, () => {
      setQuery("");
      setSearchType(tab === "markets" ? "资产" : "内容");
      push({ kind: "search", title: "搜索" });
    });
  }
  function Follow({ id }: { id: string }) {
    return (
      <button
        className={`follow ${following.includes(id) ? "is-following" : ""}`}
        aria-pressed={following.includes(id)}
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
  function WatchlistButton({ id }: { id: string }) {
    const selected = watchlist.includes(id);
    return (
      <button
        className={`follow ${selected ? "is-following" : ""}`}
        aria-pressed={selected}
        aria-label={`${l(selected ? "移出自选" : "加入自选")} ${l(assets.find((asset) => asset.id === id)?.name ?? id)}`}
        onClick={() => toggleWatchlist(id)}
      >
        {selected ? <Check size={14} /> : <Plus size={14} />}
        {l(selected ? "已加入自选" : "加入自选")}
      </button>
    );
  }
  function renderInterests() {
    return (
      <section className="interest-group" aria-label={l("感兴趣的主题")}>
        <h2>{l("感兴趣的主题")}</h2>
        <div className="chip-group">
          {topics.map((id) => (
            <ChoiceChip
              key={id}
              selected={choices.interests.includes(id)}
              onClick={() =>
                setChoices((current) => toggleInterest(current, id))
              }
            >
              {l(choiceLabel(id))}
            </ChoiceChip>
          ))}
        </div>
      </section>
    );
  }
  function openPublisher(id: string) {
    push({ kind: "source", id, title: "来源详情" });
  }
  function PublisherLink({
    item,
    follow = false,
    showTime = false,
  }: {
    item: SourceItem;
    follow?: boolean;
    showTime?: boolean;
  }) {
    return (
      <div className={`source-byline${follow ? " with-follow" : ""}`}>
        <div className="source-identity">
          <button
            className="source-link"
            onClick={() => openPublisher(item.source)}
          >
            {l(item.source)}
            {follow && <ChevronRight size={12} />}
          </button>
          {showTime && (
            <time dateTime={item.publishedAt}>
              {formatContentTime(item.publishedAt, english, true)}
            </time>
          )}
        </div>
        {follow && <Follow id={item.source} />}
      </div>
    );
  }
  function SourceRow({ story }: { story: SourceItem }) {
    return <ContentRow entry={sourceEntry(story)} />;
  }
  function UpdateNotice({ entry }: { entry: ContentEntry }) {
    const note = entryNote(entry);
    const update = entryUpdate(entry);
    return note || update ? (
      <aside className="content-update">
        {note && <p>{l(note.text)}</p>}
        {update && (
          <button className="text-button" onClick={() => openEntry(update)}>
            {l("查看最新内容")}
            <ChevronRight size={16} />
          </button>
        )}
      </aside>
    ) : null;
  }
  function EntryMetadata({
    entry,
    status,
    qualifier,
  }: {
    entry: ContentEntry;
    status?: string;
    qualifier?: string;
  }) {
    const classification = [entry.type, ...(qualifier ? [qualifier] : [])]
      .map((label) => l(label))
      .join(" · ");
    return (
      <span className="content-meta">
        <span className="content-classification">{classification}</span>
        {status && <span className="new-label">{l(status)}</span>}
      </span>
    );
  }
  function EntryAttribution({
    entry,
    at = entry.progressAt,
    timeLabel = entry.ref.kind === "collection" ? "最近变化" : "发布于",
  }: {
    entry: ContentEntry;
    at?: string;
    timeLabel?: string;
  }) {
    return (
      <span className="content-attribution">
        <span>{l(entry.source ?? "综合整理")}</span>
        <span className="attribution-time">
          <span aria-hidden="true">·</span>
          <time
            dateTime={at}
            title={`${l(timeLabel)} ${formatContentTime(at, english, true)}`}
          >
            {formatListTime(at, english)}
          </time>
        </span>
      </span>
    );
  }
  function ContentRow({
    entry,
    showCover = true,
    relevance,
  }: {
    entry: ContentEntry;
    showCover?: boolean;
    relevance?: PersonalRelevance;
  }) {
    const update = entryUpdate(entry);
    const status = update
      ? "有新版"
      : hasUnreadChanges(entry, readEntries)
        ? "有更新"
        : undefined;
    const key = refKey(entry.ref);
    return (
      <article className="story-row">
        <div className="story-main">
          <EntryMetadata entry={entry} status={status} />
          <button
            className="story-preview"
            data-gesture-surface
            aria-label={l(entry.title)}
            aria-description={
              showCover && entry.cover?.kind === "video"
                ? l("含视频，打开详情后播放")
                : undefined
            }
            onClick={() => openEntry(entry)}
          >
            <span className="story-title">{l(entry.title)}</span>
            <span className="story-summary">{l(entry.summary)}</span>
            {showCover && entry.cover && (
              <ContentThumbnail cover={entry.cover} english={english} />
            )}
          </button>
          <RelevanceNote relevance={relevance} />
          <div className="source-line">
            <EntryAttribution entry={entry} />
            <div className="actions">
              <SaveButton id={key} />
              {!page &&
                tab === "explore" &&
                channel === "推荐" &&
                iconButton(
                  `${l("调整推荐")} · ${l(entry.title)}`,
                  <MoreHorizontal size={17} />,
                  () => setFeedbackEntry(entry),
                )}
            </div>
          </div>
        </div>
      </article>
    );
  }
  function RelevanceNote({
    relevance,
    brief = false,
  }: {
    relevance?: PersonalRelevance;
    brief?: boolean;
  }) {
    if (!relevance) return null;
    const asset = assets.find((item) => item.id === relevance.target);
    const label =
      relevance.label === "根据兴趣"
        ? "与你的兴趣相关"
        : brief &&
            (relevance.label === "来自你关注的来源" ||
              relevance.label === "主要材料来自你关注的来源")
          ? "引用了你关注的来源"
          : relevance.label;
    return (
      <p className="personal-relevance">
        {l(label)}
        {relevance.target && (
          <>
            {" · "}
            <strong>
              {l(choiceLabel(relevance.target))}
              {asset && ` (${asset.id})`}
            </strong>
          </>
        )}
      </p>
    );
  }
  function RelatedAssets({
    ids,
    origin,
  }: {
    ids: string[];
    origin: ContentRef;
  }) {
    if (!ids.length) return null;
    const sectionKey = `${refKey(origin)}:assets`;
    return (
      <details
        className="reading-disclosure reading-extra reading-context"
        open={expandedSections.current[sectionKey] ?? false}
        onToggle={(event) =>
          rememberExpanded(sectionKey, event.currentTarget.open)
        }
      >
        <summary>
          {l("相关资产")}
          <span className="disclosure-count">{ids.length}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="chip-group content-tags">
          {ids.map((id) => (
            <button
              key={id}
              className="chip chip-link"
              onClick={() => push({ kind: "asset", id, title: "资产详情" })}
            >
              {id}
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      </details>
    );
  }
  function VersionHistory({
    versions,
    current,
    change,
  }: {
    versions: { entry: ContentEntry; at: string }[];
    current: ContentRef;
    change?: string;
  }) {
    if (versions.length < 2) return null;
    const sectionKey = `${refKey(current)}:versions`;
    return (
      <details
        className="reading-disclosure reading-extra collection-versions"
        open={expandedSections.current[sectionKey] ?? false}
        onToggle={(event) =>
          rememberExpanded(sectionKey, event.currentTarget.open)
        }
      >
        <summary>
          {l("查看历史版本")}
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        {change && (
          <p className="version-change">
            {l("本次更新")} · {l(change)}
          </p>
        )}
        {versions.map(({ entry, at }) => (
          <ReferenceRow
            key={refKey(entry.ref)}
            title={l(entry.title)}
            metadata={
              <EntryMetadata
                entry={entry}
                status={
                  refKey(entry.ref) === refKey(current) ? "正在查看" : undefined
                }
              />
            }
            attribution={
              <EntryAttribution
                entry={entry}
                at={at}
                timeLabel={
                  entry.ref.kind === "collection" ? "整理发布" : "发布于"
                }
              />
            }
            disabled={refKey(entry.ref) === refKey(current)}
            onClick={() => openEntry(entry)}
          />
        ))}
      </details>
    );
  }
  function OtherPublications({ item }: { item: SourceItem }) {
    const others = otherPublications(item);
    if (!others.length) return null;
    const sectionKey = `item:${item.id}:publications`;
    return (
      <details
        className="reading-disclosure reading-extra other-publications"
        open={expandedSections.current[sectionKey] ?? false}
        onToggle={(event) =>
          rememberExpanded(sectionKey, event.currentTarget.open)
        }
      >
        <summary>
          {l("其他发布")}
          <span className="disclosure-count">{others.length}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        {others.map((other) => (
          <ReferenceRow
            key={other.id}
            title={l(other.title)}
            metadata={<EntryMetadata entry={sourceEntry(other)} />}
            attribution={<EntryAttribution entry={sourceEntry(other)} />}
            onClick={() => openSource(other)}
          />
        ))}
      </details>
    );
  }
  function RelatedContent({
    entries,
    origin,
  }: {
    entries: ContentEntry[];
    origin: ContentEntry;
  }) {
    if (!entries.length) return null;
    const sectionKey = `${refKey(origin.ref)}:related`;
    const reason = (entry: ContentEntry) => {
      if (origin.ref.kind === "collection")
        return (
          collections
            .find((item) => item.id === origin.ref.id)
            ?.related?.find((link) => link.id === entry.ref.id)?.reason ??
          "延伸阅读"
        );
      if (entry.sourceIds.includes(origin.ref.id))
        return "引用了本文，可结合其他材料继续阅读。";
      const item = sourceItems.find((item) => item.id === origin.ref.id)!;
      return entry.sourceIds.some(
        (id) =>
          sourceRoot(sourceItems.find((source) => source.id === id)!) ===
          sourceRoot(item),
      )
        ? "引用了这份材料的另一版本，可查看最新整理。"
        : "历史版本曾引用本文，可查看当前整理。";
    };
    return (
      <details
        className="reading-disclosure reading-extra related-reading"
        open={expandedSections.current[sectionKey] ?? false}
        onToggle={(event) =>
          rememberExpanded(sectionKey, event.currentTarget.open)
        }
      >
        <summary>
          {l("延伸阅读")}
          <span className="disclosure-count">{entries.length}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        {entries.map((entry) => (
          <ReferenceRow
            key={refKey(entry.ref)}
            metadata={<EntryMetadata entry={entry} />}
            title={l(entry.title)}
            description={l(reason(entry))}
            attribution={<EntryAttribution entry={entry} />}
            onClick={() => openEntry(entry)}
          />
        ))}
      </details>
    );
  }
  function jumpToReadingSection(id: string) {
    const container = bodyRef.current;
    const target = container?.querySelector<HTMLElement>(
      `[data-reading-anchor="${id}"]`,
    );
    if (!container || !target) return;
    const disclosure = target.closest("details");
    if (disclosure) disclosure.open = true;
    const top =
      container.scrollTop +
      target.getBoundingClientRect().top -
      container.getBoundingClientRect().top -
      16;
    container.scrollTo({ top, behavior: "auto" });
    target.focus({ preventScroll: true });
  }
  function Citations({
    ids,
    materials,
  }: {
    ids: string[];
    materials: { sourceId: string }[];
  }) {
    return (
      <div className="inline-citations" aria-label={l("本段依据")}>
        {ids.map((id) => {
          const source = sourceItems.find((item) => item.id === id)!;
          const number =
            materials.findIndex((item) => item.sourceId === id) + 1;
          return (
            <button
              key={id}
              onClick={() => openSource(source)}
              title={l(source.title)}
            >
              <span>[{number}]</span> {l(source.source)}
              <ChevronRight size={12} />
            </button>
          );
        })}
      </div>
    );
  }
  function ArticleBody({
    sections,
    materials,
  }: {
    sections: (ArticleSection & { sourceIds?: string[] })[];
    materials?: { sourceId: string }[];
  }) {
    const showOutline =
      sections.length >= 3 &&
      sections.every((section) => section.heading) &&
      sections.flatMap((section) => section.paragraphs).join("").length >= 600;
    return (
      <>
        {showOutline && (
          <details className="reading-disclosure reading-outline">
            <summary>
              {l("目录")}
              <ChevronDown size={16} />
            </summary>
            <nav aria-label={l("文章目录")}>
              {sections.map((section, index) => (
                <button
                  key={section.heading}
                  onClick={() => jumpToReadingSection(`section-${index}`)}
                >
                  {section.heading ? l(section.heading) : l("正文")}
                </button>
              ))}
            </nav>
          </details>
        )}
        <div className="article-body">
          {sections.map((section, index) => (
            <section
              className="article-section"
              key={index}
              tabIndex={-1}
              data-reading-anchor={`section-${index}`}
            >
              {section.heading && <h2>{l(section.heading)}</h2>}
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{l(paragraph)}</p>
              ))}
              {section.media?.map((media) => (
                <MediaBlock key={media.src} media={media} english={english} />
              ))}
              {!!section.sourceIds?.length && materials && (
                <Citations ids={section.sourceIds} materials={materials} />
              )}
            </section>
          ))}
        </div>
      </>
    );
  }
  function AssetRow({ asset: a }: { asset: (typeof assets)[number] }) {
    return (
      <button
        className="asset-row"
        data-gesture-surface
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
          <b>{l(a.value)}</b>
          <small className={a.up ? "positive" : "negative"}>
            {l(a.change)}
          </small>
          <small className="quote-meta">
            {l(a.unit)} · {l(a.changePeriod)}
          </small>
        </span>
      </button>
    );
  }
  function Empty({
    text = "暂无内容",
    hint = "可以到探索中发现更多内容。",
    actionLabel = "去探索",
    onAction = () => navigate("explore"),
  }: {
    text?: string;
    hint?: string;
    actionLabel?: string;
    onAction?: () => void;
  }) {
    return (
      <div className="empty">
        <Search size={30} />
        <h3>{l(text)}</h3>
        <p>{l(hint)}</p>
        <button className="text-button" onClick={onAction}>
          {l(actionLabel)}
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
  function renderBrief(day = demoEdition, detail = false) {
    const edition = editions.find((item) => item.id === day);
    if (!edition) return <Empty text={l("暂无这期简报")} />;
    const items = edition.items;
    return (
      <>
        <div className="title-row">
          <h1>{detail ? `${day} ${l("每日简报")}` : l("今日简报")}</h1>
          <div className="actions">
            {iconButton("往期简报", <History size={20} />, () =>
              push({ kind: "archive", title: "往期简报" }),
            )}
            {iconButton(
              saved.includes(`brief-${day}`)
                ? "已收藏这份简报"
                : "收藏这份简报",
              <Bookmark
                size={20}
                fill={saved.includes(`brief-${day}`) ? "currentColor" : "none"}
              />,
              () => toggleSave(`brief-${day}`),
            )}
          </div>
        </div>
        <div className="brief-edition">
          <span className="edition-date">
            {day}
            <small>{edition.cutoff.slice(0, 4)}</small>
          </span>
          <div>
            <h2>{l(edition.personalized ? "本期变化" : "通用简报")}</h2>
            <span>
              {items.length}{" "}
              {english && items.length === 1 ? "highlight" : l("个重点")} ·{" "}
              {l("截至")} {formatContentTime(edition.cutoff, english, true)}
            </span>
          </div>
        </div>
        {items.map((item, i) => {
          const note = briefNote(item);
          const itemKey = `brief:${edition.id}:${item.id}`;
          return (
            <article className="brief-item" key={item.id}>
              <div className="brief-point" data-gesture-surface>
                <span className="point-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{l(item.title)}</h3>
                  <p>{l(item.summary)}</p>
                  <RelevanceNote
                    relevance={briefRelevance(item, choices)}
                    brief
                  />
                  {note && <p className="brief-note">{l(note.text)}</p>}
                  <details
                    className="reading-disclosure brief-evidence"
                    open={expandedSections.current[itemKey] ?? false}
                    onToggle={(event) =>
                      rememberExpanded(itemKey, event.currentTarget.open)
                    }
                  >
                    <summary>
                      {l("查看依据")}
                      <span className="disclosure-count">
                        {item.references.length}
                      </span>
                      <ChevronDown size={16} aria-hidden="true" />
                    </summary>
                    {item.references.map((ref) => {
                      const entry = resolveEntry(ref);
                      if (!entry)
                        return <p key={refKey(ref)}>{l("内容暂不可用")}</p>;
                      return (
                        <ReferenceRow
                          key={refKey(ref)}
                          title={l(entry.title)}
                          metadata={<EntryMetadata entry={entry} />}
                          attribution={<EntryAttribution entry={entry} />}
                          onClick={() => openEntry(entry)}
                        />
                      );
                    })}
                  </details>
                </div>
              </div>
            </article>
          );
        })}
        {!items.length && (
          <Empty
            text={l("本期没有符合偏好的要点")}
            hint={l("可以到探索查看其他内容。")}
          />
        )}
        <button
          className="primary wide"
          onClick={() => chat(l(`${day} 每日简报`), { briefId: edition.id })}
        >
          <Sparkles size={17} />
          {l("问问这份简报")}
          <ArrowRight size={16} />
        </button>
        <div className="end-note">
          <CheckCheck size={17} />
          <span>{l("本期到这里")}</span>
          <small>{l("后续更新可在探索中查看。")}</small>
        </div>
      </>
    );
  }
  function renderExplore() {
    const list =
      channel === "专题"
        ? collectionEntries()
            .filter(
              (entry) =>
                entry.type === "专题" &&
                (filter === "全部" || entry.topics.includes(filter)),
            )
            .sort((a, b) => Date.parse(b.progressAt) - Date.parse(a.progressAt))
        : selectFeed({ channel, choices, topic: filter });
    return (
      <>
        <div className="title-row">
          <h1>
            {l(t("探索", "Explore"))}
            <span className="title-dot">.</span>
          </h1>
          <div className="actions">
            <SearchButton />
            {iconButton("内容偏好", <SlidersHorizontal size={20} />, () =>
              push({ kind: "preferences", title: "内容偏好" }),
            )}
          </div>
        </div>
        <div className="tabs explore-tabs">
          {exploreChannels.map((s, i) => (
            <button
              key={s}
              className={channel === s ? "active" : ""}
              aria-pressed={channel === s}
              onClick={() => changeChannel(s)}
            >
              {l(
                english
                  ? ["Following", "For you", "Top stories", "Features"][i]
                  : s,
              )}
            </button>
          ))}
        </div>
        <div className="feed-toolbar">
          <span className="sort-label">{l(feedSortLabels[channel])}</span>
          <label className="topic-filter">
            <select
              aria-label={l("筛选主题")}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              {[
                "全部",
                ...new Set([
                  ...choices.interests.filter((id) => topics.includes(id)),
                  ...topics,
                ]),
              ].map((topic) => (
                <option key={topic} value={topic}>
                  {l(topic === "全部" ? "全部主题" : topic)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
        </div>
        {list.length ? (
          list.map((entry) => (
            <ContentRow
              key={refKey(entry.ref)}
              entry={entry}
              relevance={
                channel === "推荐"
                  ? recommendationReason(entry, choices)
                  : undefined
              }
            />
          ))
        ) : (
          <Empty
            text={l("暂无符合条件的内容")}
            hint={l(
              channel === "关注"
                ? "这里只显示已关注来源发布的内容，可调整主题或关注来源。"
                : channel === "热点" || channel === "专题"
                  ? "可以调整主题筛选，也可搜索其他内容。"
                  : "可以调整主题或内容偏好，也可搜索其他内容。",
            )}
            actionLabel={
              channel === "关注"
                ? "管理关注"
                : channel === "热点" || channel === "专题"
                  ? "搜索内容"
                  : "调整内容偏好"
            }
            onAction={() => {
              if (channel === "热点" || channel === "专题") {
                setQuery("");
                setSearchType("内容");
                push({ kind: "search", title: "搜索" });
              } else
                push({
                  kind: channel === "关注" ? "following" : "preferences",
                  title: channel === "关注" ? "关注来源" : "内容偏好",
                });
            }}
          />
        )}
      </>
    );
  }
  function renderMarkets() {
    const list = assets.filter((a) =>
      market === "自选"
        ? watchlist.includes(a.id)
        : market === "全部" || a.market === market,
    );
    const indicators = overview
      .map((id) => overviewOptions.find((option) => option.id === id))
      .filter((option) => !!option);
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
              chat(l("市场行情")),
            )}
          </div>
        </div>
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
            gridTemplateColumns: `repeat(${indicators.length || 1}, minmax(0, 1fr))`,
          }}
        >
          {indicators.map((option) => (
            <div key={option.id}>
              <small className="overview-name">{l(option.name)}</small>
              <b>
                {option.value}
                <small className="quote-unit">{l(option.unit)}</small>
              </b>
              <div className="overview-trend">
                <span className={option.up ? "positive" : "negative"}>
                  {option.change}
                </span>
                <Sparkline
                  values={option.points}
                  up={option.up}
                  english={english}
                />
              </div>
            </div>
          ))}
        </div>
        <details className="overview-data">
          <summary>
            <ChevronRight size={13} />
            {l("数据口径与时间")}
          </summary>
          <dl>
            {indicators.map((option) => (
              <div key={option.id}>
                <dt>{l(option.name)}</dt>
                <dd>
                  {l(option.unit)} · {l(option.changePeriod)}
                </dd>
                <dd>
                  {l(option.status)} ·{" "}
                  <time dateTime={option.asOf}>
                    {formatContentTime(option.asOf, english, true)}
                  </time>
                </dd>
              </div>
            ))}
          </dl>
        </details>
        <div className="chips market-chips">
          {marketTabs.map((s) => (
            <button
              key={s}
              className={market === s ? "selected" : ""}
              aria-pressed={market === s}
              onClick={() => changeMarket(s)}
            >
              {l(s)}
            </button>
          ))}
        </div>
        <div className="section-heading">
          <h2>{l(market === "自选" ? "我的自选" : market)}</h2>
          {market === "自选" ? (
            <button
              className="text-button"
              onClick={() => push({ kind: "watchlist", title: "我的自选" })}
            >
              {l("管理")}
            </button>
          ) : (
            <span>{l("价格 / 涨跌")}</span>
          )}
        </div>
        {list.length ? (
          list.map((a) => <AssetRow key={a.id} asset={a} />)
        ) : (
          <Empty
            text={l("还没有自选资产")}
            hint={l("搜索资产名称或代码，加入自选后可在这里查看。")}
            actionLabel="浏览资产"
            onAction={() => setMarket("全部")}
          />
        )}
        {market === "自选" && list.length > 0 && (
          <section>
            <div className="section-heading">
              <h2>{l("自选热点")}</h2>
              <span className="sort-label">{l(feedSortLabels["热点"])}</span>
            </div>
            {(() => {
              const highlights = selectFeed({
                channel: "热点",
                focusAssets: watchlist,
              }).slice(0, 2);
              return highlights.length ? (
                highlights.map((entry) => (
                  <ContentRow
                    key={refKey(entry.ref)}
                    entry={entry}
                    showCover={false}
                  />
                ))
              ) : (
                <p className="section-note">
                  {l("暂无直接相关的热点，可进入资产详情查看更多内容。")}
                </p>
              );
            })()}
          </section>
        )}
      </>
    );
  }
  function renderProfile() {
    return (
      <>
        <div className="title-row">
          <h1>
            {l("我的")}
            <span className="title-dot">.</span>
          </h1>
          {iconButton("新对话", <Sparkles size={20} />, () =>
            chat(l("通用对话")),
          )}
        </div>
        <h2 className="group-heading">{l("关注与偏好")}</h2>
        <div className="group">
          <GroupRow
            icon={<UserRound size={18} />}
            label="关注来源"
            note={String(following.length)}
            onClick={() => push({ kind: "following", title: "关注来源" })}
          />
          <GroupRow
            icon={<TrendingUp size={18} />}
            label="我的自选"
            note={String(watchlist.length)}
            onClick={() => push({ kind: "watchlist", title: "我的自选" })}
          />
          <GroupRow
            icon={<SlidersHorizontal size={18} />}
            label="内容偏好"
            onClick={() => push({ kind: "preferences", title: "内容偏好" })}
          />
        </div>
        <h2 className="group-heading">{l("阅读与对话")}</h2>
        <div className="group">
          <GroupRow
            icon={<Bookmark size={18} />}
            label="我的收藏"
            note={String(saved.length)}
            onClick={() => push({ kind: "saved", title: "我的收藏" })}
          />
          <GroupRow
            icon={<MessageCircle size={18} />}
            label="我的对话"
            note={String(conversations.length)}
            onClick={() => push({ kind: "conversations", title: "我的对话" })}
          />
          <GroupRow
            icon={<History size={18} />}
            label="浏览历史"
            note={String(read.length)}
            onClick={() => push({ kind: "reading-history", title: "浏览历史" })}
          />
        </div>
        <div className="group">
          <GroupRow
            icon={<Settings size={18} />}
            label="设置"
            note="语言 · 外观"
            onClick={() => push({ kind: "settings", title: "设置" })}
          />
        </div>
      </>
    );
  }
  function renderPanel() {
    if (!page) return null;
    const s = sourceItems.find((x) => x.id === page.id),
      a = assets.find((x) => x.id === page.id);
    switch (page.kind) {
      case "overview-settings":
        return (
          <>
            <p className="subtitle">{l("选择 1–3 项，可调整顺序。")}</p>
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
                    <small>
                      {option.id} ·{" "}
                      {l(option.id === "US10Y" ? "名义收益率" : option.unit)}
                    </small>
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
              {l(
                "已满时先取消一项。收益率变动以 bp 表示，1 bp = 0.01 个百分点。",
              )}
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

      case "collection": {
        const collection = collections.find((item) => item.id === page.id);
        const version = collection?.versions.find(
          (item) => item.version === page.version,
        );
        if (!collection || !version) return null;
        const entry = collectionEntry(collection, version);
        const labels: Record<MaterialRole, string> = {
          main: "主要材料",
          background: "背景材料",
          viewpoint: "相关观点",
        };
        return (
          <article className="reading-page">
            <div className="reading-label">
              {[
                l(entry.type),
                ...collection.topics.map((topic) => l(topic)),
              ].join(" · ")}
            </div>
            <h1 className="detail-title">{l(version.title)}</h1>
            <div className="detail-meta collection-meta">
              <span>
                {l("最近变化")} ·{" "}
                {formatContentTime(version.progressAt, english, true)}
              </span>
              <button
                className="reference-jump"
                onClick={() => jumpToReadingSection("sources")}
              >
                {l("引用材料")} · {version.materials.length}
                <ChevronDown size={14} />
              </button>
            </div>
            <UpdateNotice entry={entry} />
            <p className="reading-lead">{l(version.summary)}</p>
            <ArticleBody
              sections={
                version.body ??
                version.points.map((point) => ({
                  heading: "",
                  paragraphs: [point.text],
                  sourceIds: point.sourceIds,
                }))
              }
              materials={version.materials}
            />
            <details
              className="reading-disclosure reading-extra reading-sources"
              open={expandedSections.current[refKey(entry.ref)] ?? false}
              onToggle={(event) =>
                rememberExpanded(refKey(entry.ref), event.currentTarget.open)
              }
            >
              <summary data-reading-anchor="sources">
                {l("引用材料")}
                <span className="disclosure-count">
                  {version.materials.length}
                </span>
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <p className="reference-timing">
                <span>
                  {l("整理发布")} ·{" "}
                  {formatContentTime(version.publishedAt, english, true)}
                </span>
                <span>
                  {l("材料截至")} ·{" "}
                  {formatContentTime(version.cutoff, english, true)}
                </span>
              </p>
              {version.materials.map(({ sourceId, role }, index) => {
                const source = sourceItems.find(
                  (item) => item.id === sourceId,
                )!;
                const referenced = sourceEntry(source);
                const sourceStatus = entryUpdate(referenced)
                  ? "有新版"
                  : undefined;
                return (
                  <ReferenceRow
                    key={sourceId}
                    number={index + 1}
                    title={l(source.title)}
                    metadata={
                      <EntryMetadata
                        entry={referenced}
                        qualifier={role === "main" ? undefined : labels[role]}
                        status={sourceStatus}
                      />
                    }
                    attribution={<EntryAttribution entry={referenced} />}
                    onClick={() => openSource(source)}
                  />
                );
              })}
            </details>
            <VersionHistory
              current={entry.ref}
              change={version.change}
              versions={[...collection.versions].reverse().map((item) => ({
                entry: collectionEntry(collection, item),
                at: item.publishedAt,
              }))}
            />
            <RelatedAssets ids={entry.assets} origin={entry.ref} />
            <RelatedContent
              entries={relatedCollections(collection)}
              origin={entry}
            />
          </article>
        );
      }
      case "story":
        return (
          s && (
            <article className="reading-page">
              <div className="reading-label">
                {[l(s.type), ...s.topics.map((topic) => l(topic))].join(" · ")}
              </div>
              <h1 className="detail-title">{l(s.title)}</h1>
              <div className="detail-meta">
                <PublisherLink item={s} follow showTime />
              </div>
              <UpdateNotice entry={sourceEntry(s)} />
              <p className="reading-lead">{l(s.summary)}</p>
              <ArticleBody
                sections={
                  s.body ?? [
                    {
                      heading: "",
                      paragraphs: s.points,
                    },
                  ]
                }
              />
              {s.url && (
                <footer className="reading-extra source-note">
                  <a
                    className="source-website"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l("查看参考原文")}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </footer>
              )}
              <OtherPublications item={s} />
              <VersionHistory
                current={{ kind: "item", id: s.id }}
                change={s.change}
                versions={sourceVersions(s).map((item) => ({
                  entry: sourceEntry(item),
                  at: item.publishedAt,
                }))}
              />
              <RelatedAssets
                ids={s.assets}
                origin={{ kind: "item", id: s.id }}
              />
              <RelatedContent
                entries={collectionsForSource(s)}
                origin={sourceEntry(s)}
              />
            </article>
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
                  <WatchlistButton id={a.id} />
                </div>
                <div className="big-price">
                  {l(a.value)}
                  <small>{l(a.unit)}</small>
                </div>
                <span className={a.up ? "positive" : "negative"}>
                  {l(a.change)}{" "}
                  <span className="muted">{l(a.changePeriod)}</span>
                </span>
                <div className="quote-meta asset-quote-time">
                  {l(a.status)} ·{" "}
                  <time dateTime={a.asOf}>
                    {formatContentTime(a.asOf, english, true)}
                  </time>
                </div>
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
                  {quoteChartTimes(a, period).map((time) => (
                    <time key={time} dateTime={time}>
                      {new Intl.DateTimeFormat(
                        english ? "en-US" : "zh-CN",
                        period === "日内"
                          ? {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }
                          : { month: "2-digit", day: "2-digit" },
                      ).format(new Date(time))}
                    </time>
                  ))}
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
                onClick={() => chat(l(a.name + "行情"), { assetId: a.id })}
              >
                <Sparkles size={17} />
                {l("理解这项资产的变化")}
              </button>
              <div className="section-heading">
                <h2>{l("相关内容")}</h2>
                <span className="sort-label">{l("最新优先")}</span>
              </div>
              {browseContent("", a.id).map((entry) => (
                <ContentRow key={refKey(entry.ref)} entry={entry} />
              ))}
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
                aria-label={l("搜索内容、来源或资产")}
                placeholder={l("搜索内容、来源或资产")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query &&
                iconButton("清除搜索", <X size={16} />, () => setQuery(""))}
            </div>
            <div className="tabs">
              {["内容", "来源", "资产"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSearchType(type)}
                  className={searchType === type ? "active" : ""}
                >
                  {l(type)}
                </button>
              ))}
            </div>
            {searchType === "内容" ? (
              <>
                {browseContent(q).map((entry) => (
                  <ContentRow key={refKey(entry.ref)} entry={entry} />
                ))}
                {!browseContent(q).length && (
                  <Empty
                    text={l("未找到相关内容")}
                    hint={l("试试其他关键词。")}
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
                    text={l("未找到相关资产")}
                    hint={l("试试资产名称或代码。")}
                  />
                )}
              </>
            ) : (
              <>
                {sourceChoices
                  .filter((name) => matchesSearch(name, q))
                  .map((name) => (
                    <div className="topic-row" key={name}>
                      <button
                        className="source-link"
                        onClick={() => openPublisher(name)}
                      >
                        <span>{l(name)}</span>
                        <ChevronRight size={14} />
                      </button>
                      <Follow id={name} />
                    </div>
                  ))}
                {!sourceChoices.some((name) => matchesSearch(name, q)) && (
                  <Empty
                    text={l("未找到相关来源")}
                    hint={l("试试其他作者、机构或媒体名称。")}
                  />
                )}
              </>
            )}
          </>
        );
      }
      case "archive":
        return (
          <>
            {editions.map((edition) => (
              <button
                className="archive-row"
                key={edition.id}
                onClick={() => {
                  push({
                    kind: "brief-detail",
                    id: edition.id,
                    title: "简报详情",
                  });
                }}
              >
                <div className="date-tile">
                  <small>SEP</small>
                  <b>{edition.id.slice(-2)}</b>
                </div>
                <div>
                  <h3>{l(edition.items[0]?.title ?? "每日简报")}</h3>
                  <small>
                    {edition.items.length}{" "}
                    {english && edition.items.length === 1
                      ? "highlight"
                      : l("个重点")}{" "}
                    · {l("截至")}{" "}
                    {formatContentTime(edition.cutoff, english, true)}
                  </small>
                </div>
                <ChevronRight size={18} />
              </button>
            ))}
          </>
        );
      case "source": {
        const source = sourceProfiles.find((source) => source.id === page.id);
        if (!source) return null;
        return (
          <>
            <div className="title-row">
              <div className="profile-identity">
                <div className="avatar">{l(source.id).slice(0, 1)}</div>
                <div>
                  <h1>{l(source.id)}</h1>
                  <p>{l(source.label)}</p>
                </div>
              </div>
              <Follow id={source.id} />
            </div>
            <p className="body-copy">{l(source.bio)}</p>

            <div className="section-heading">
              <h2>{l("最新内容")}</h2>
            </div>
            {collapseSources(
              sourceItems.filter((item) => item.source === source.id),
            ).map((item) => (
              <SourceRow key={item.id} story={item} />
            ))}
          </>
        );
      }
      case "following": {
        const ids = [...new Set([...(page.followingIds ?? []), ...following])];
        return (
          <>
            {!ids.length && (
              <p className="body-copy">{l("还没有关注的来源。")}</p>
            )}
            {ids.map((id) => (
              <div className="topic-row" key={id}>
                <button
                  className="source-link"
                  onClick={() => openPublisher(id)}
                >
                  <span>{l(id)}</span>
                  <ChevronRight size={14} />
                </button>
                <Follow id={id} />
              </div>
            ))}
            <button
              className="secondary wide"
              onClick={() => {
                setQuery("");
                setSearchType("来源");
                push({ kind: "search", title: "搜索" });
              }}
            >
              <Plus size={16} />
              {l("添加关注")}
            </button>
          </>
        );
      }
      case "watchlist": {
        const ids = [...new Set([...(page.watchlistIds ?? []), ...watchlist])];
        return (
          <>
            {!ids.length && <p className="body-copy">{l("还没有自选资产")}</p>}
            {ids.map((id) => {
              const asset = assets.find((asset) => asset.id === id);
              return (
                asset && (
                  <div className="topic-row" key={id}>
                    <button
                      className="source-link"
                      onClick={() =>
                        push({ kind: "asset", id, title: "资产详情" })
                      }
                    >
                      <span>
                        {l(asset.name)}
                        <small>{id}</small>
                      </span>
                      <ChevronRight size={14} />
                    </button>
                    <WatchlistButton id={id} />
                  </div>
                )
              );
            })}
            <button
              className="secondary wide"
              onClick={() => {
                setQuery("");
                setSearchType("资产");
                push({ kind: "search", title: "搜索" });
              }}
            >
              <Plus size={16} />
              {l("添加资产")}
            </button>
          </>
        );
      }
      case "preferences":
        return (
          <Preferences
            choices={choices}
            onChange={setChoices}
            english={english}
          />
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
            <h2 className="spaced">{l("数据与存储")}</h2>
            <p className="section-note">{l("记录仅保存在当前浏览器。")}</p>
            <button
              className="secondary wide"
              onClick={() => setDataAction("reset")}
            >
              {l("重置示例数据")}
            </button>
            <button
              className="secondary wide danger"
              onClick={() => setDataAction("clear")}
            >
              {l("清空用户数据")}
            </button>
          </>
        );
      case "brief-detail":
        return renderBrief(page.id, true);
      case "saved": {
        const ids = [...new Set([...(page.savedIds ?? []), ...saved])];
        return (
          <>
            {ids.map((id) => {
              const entry = resolveEntry(parseRef(id));
              if (entry) return <ContentRow key={id} entry={entry} />;
              if (!id.startsWith("brief-")) return null;
              const edition = editions.find((item) => item.id === id.slice(6));
              return (
                <div className="saved-brief-row" key={id}>
                  <button
                    className="archive-row"
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
                        {id.slice(6)} {l("每日简报")}
                      </h3>
                      {edition && (
                        <small>
                          {edition.items.length}{" "}
                          {english && edition.items.length === 1
                            ? "highlight"
                            : l("个重点")}{" "}
                          · {l("截至")}{" "}
                          {formatContentTime(edition.cutoff, english, true)}
                        </small>
                      )}
                    </div>
                  </button>
                  <SaveButton id={id} />
                </div>
              );
            })}
            {!ids.length && (
              <Empty
                text={l("把值得回看的，留在这里")}
                hint={l("在内容详情或简报中点击收藏即可保存。")}
              />
            )}
          </>
        );
      }
      case "reading-history":
      case "conversations": {
        const historyType = page.kind === "reading-history" ? "浏览" : "对话";
        const items =
          historyType === "浏览"
            ? read
                .map((id) => resolveEntry(parseRef(id)))
                .filter((entry): entry is ContentEntry => !!entry)
                .map((entry) => ({
                  id: refKey(entry.ref),
                  title: l(entry.title),
                  entry,
                }))
            : conversations.map((c) => ({
                id: c.id,
                title: c.context,
                subtitle: `${c.messages.filter((m) => m.role === "user").length} ${l("次提问")}`,
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
              <span className="muted">
                {items.length} {l("条记录")}
              </span>
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
            {managingHistory && (
              <div className="history-meta">
                {
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
                }
              </div>
            )}
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
                    } else if ("entry" in item) openEntry(item.entry);
                    else {
                      setChatInput("");
                      push({
                        kind: "chat",
                        id: item.conversation.id,
                        title: item.conversation.context,
                        reference: item.conversation.reference,
                        briefId: item.conversation.briefId,
                        assetId: item.conversation.assetId,
                      });
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
                    {"entry" in item && <EntryMetadata entry={item.entry} />}
                    <b>{item.title}</b>
                    {"entry" in item ? (
                      <EntryAttribution entry={item.entry} />
                    ) : (
                      <small>{item.subtitle}</small>
                    )}
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
                    ? "可以到探索中发现更多内容。"
                    : "从内容、简报或资产详情追问，对话会保存在这里。",
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
      case "chat": {
        const cited = contextEntries(page, editions);
        const edition = editions.find((item) => item.id === page.briefId);
        const asset = assets.find((item) => item.id === page.assetId);
        return (
          <>
            <div className="chat-context">
              <div className="chat-context-heading">
                <Sparkles size={20} />
                <div className="chat-context-copy">
                  <small>{l("当前讨论")}</small>
                  <b>{page.title}</b>
                </div>
                {iconButton("保留上下文，新建对话", <Plus size={16} />, () =>
                  chat(page.title ?? l("通用对话"), page, true),
                )}
              </div>
              {(edition || cited.length > 0 || asset) && (
                <button
                  className="chat-reference"
                  onClick={() =>
                    edition
                      ? push({
                          kind: "brief-detail",
                          id: edition.id,
                          title: "简报详情",
                        })
                      : asset
                        ? push({
                            kind: "asset",
                            id: asset.id,
                            title: "资产详情",
                          })
                        : openEntry(cited[0])
                  }
                >
                  {asset ? <TrendingUp size={20} /> : <FileText size={20} />}
                  <span>
                    {l(
                      edition
                        ? "查看这期简报"
                        : asset
                          ? "查看资产详情"
                          : cited.some((entry) => entryUpdate(entry))
                            ? "引用已有更新，查看当时内容"
                            : "查看引用内容",
                    )}
                  </span>
                  <ChevronRight size={16} />
                </button>
              )}
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
                  "与我的自选资产有什么关系？",
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
                    SIFT
                  </span>
                )}
                <p>{m.text}</p>
              </div>
            ))}
          </>
        );
      }
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
          {l("选择感兴趣的内容，也可以直接开始阅读。")}
        </p>
        {renderInterests()}
        <section className="interest-group" aria-label={l("自选资产")}>
          <h2>{l("自选资产")}</h2>
          <div className="chip-group">
            {assets.slice(0, 4).map((a) => (
              <ChoiceChip
                key={a.id}
                selected={watchlist.includes(a.id)}
                onClick={() => toggleWatchlist(a.id)}
              >
                <span>{a.id}</span>
                <span className="chip-caption">{l(a.name)}</span>
              </ChoiceChip>
            ))}
          </div>
        </section>
        <p className="section-note">
          {l("这些选择用于推荐和下一期简报，随时可以修改。")}
        </p>
        <button className="primary wide" onClick={() => navigate("brief")}>
          {l("开始阅读")}
          <ArrowRight size={17} />
        </button>
        <button
          className="text-button wide"
          onClick={() => {
            navigate("brief");
          }}
        >
          {l("跳过设置，先看看")}
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
          SEPTEMBER {demoNow.slice(0, 4)} <b>V.01</b>
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
            {l("从关心的内容出发，")}
            <br />
            {l("以理解为目的。")}
          </p>
          <div className="sidebar-label">{l("产品场景")}</div>
          <nav>
            {sections.map((s, i) => {
              const Icon = navIcons[s.id];
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
            {!page && (
              <div className="app-top">
                <span className="mini-brand">
                  sift<span>.</span>
                </span>
                <span>{l("财经资讯助手")}</span>
                <span className="demo-label">DEMO</span>
              </div>
            )}
            {page && (
              <div className="page-header">
                {iconButton("返回", <ArrowLeft size={21} />, back)}
                <b>{l(page.kind === "chat" ? "AI 追问" : page.title)}</b>
                <span className="header-spacer" />
              </div>
            )}
            <div className="scroll-region">
              {gestures.distance > 0 && (
                <div
                  className="pull-indicator"
                  style={{ height: gestures.distance }}
                  role="status"
                >
                  <RefreshCw
                    size={17}
                    className={gestures.refreshing ? "refresh-spinner" : ""}
                    style={
                      gestures.refreshing
                        ? undefined
                        : { transform: `rotate(${gestures.distance * 3}deg)` }
                    }
                  />
                  <span>
                    {l(
                      gestures.refreshing
                        ? "正在刷新…"
                        : gestures.distance >= refreshThreshold
                          ? "松开刷新"
                          : "下拉刷新",
                    )}
                  </span>
                </div>
              )}
              <div
                className="app-scroll"
                ref={bodyRef}
                style={{
                  transform: gestures.distance
                    ? `translateY(${gestures.distance}px)`
                    : undefined,
                }}
              >
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
            </div>
            {readingEntry ? (
              <div className="reading-actions" aria-label={l("内容操作")}>
                <button
                  className="reading-save"
                  aria-pressed={saved.includes(refKey(readingEntry.ref))}
                  onClick={() => toggleSave(refKey(readingEntry.ref))}
                >
                  <Bookmark
                    size={18}
                    fill={
                      saved.includes(refKey(readingEntry.ref))
                        ? "currentColor"
                        : "none"
                    }
                  />
                  {l(
                    saved.includes(refKey(readingEntry.ref))
                      ? "已收藏"
                      : "收藏",
                  )}
                </button>
                <button
                  className="reading-question"
                  onClick={() =>
                    chat(l(readingEntry.title), { reference: readingEntry.ref })
                  }
                >
                  <Sparkles size={18} />
                  {l(
                    readingEntry.type === "专题"
                      ? "问问这个专题"
                      : readingEntry.type === "事件"
                        ? "问问这个事件"
                        : "问问这篇内容",
                  )}
                </button>
              </div>
            ) : page?.kind === "chat" ? (
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
                  {appSections.map((s, i) => {
                    const Icon = navIcons[s.id];
                    return (
                      <button
                        key={s.id}
                        className={tab === s.id ? "active" : ""}
                        aria-current={tab === s.id ? "page" : undefined}
                        onClick={() => navigate(s.id)}
                      >
                        <span className="nav-icon">
                          <Icon
                            size={21}
                            strokeWidth={tab === s.id ? 2.3 : 1.7}
                          />
                        </span>
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
            <dialog
              ref={feedbackDialog}
              className="recommendation-dialog"
              aria-labelledby="recommendation-dialog-title"
              onClose={() => setFeedbackEntry(null)}
              onCancel={() => setFeedbackEntry(null)}
            >
              <div className="section-heading">
                <h2 id="recommendation-dialog-title">{l("调整推荐")}</h2>
                {iconButton("关闭", <X size={19} />, () =>
                  setFeedbackEntry(null),
                )}
              </div>
              <p className="section-note">
                {l("用于推荐和下一期简报，关注、热点和主动查找仍可访问。")}
              </p>
              {feedbackEntry && (
                <RelevanceNote
                  relevance={recommendationReason(feedbackEntry, choices)}
                />
              )}
              {feedbackEntry &&
                [
                  ...recommendationDirections(feedbackEntry).map((id) => ({
                    id,
                    source: false,
                  })),
                  ...(feedbackEntry.ref.kind === "item"
                    ? [
                        ...new Set(
                          feedbackEntry.sourceIds.flatMap((id) => {
                            const item = sourceItems.find(
                              (item) => item.id === id,
                            );
                            return item ? [item.source] : [];
                          }),
                        ),
                      ].map((id) => ({ id, source: true }))
                    : []),
                ].map(({ id, source }) => (
                  <button
                    className="feedback-option"
                    key={id}
                    onClick={() => {
                      setChoices((current) =>
                        excludeRecommendation(current, id),
                      );
                      setFeedbackEntry(null);
                      setToast("已调整，可在内容偏好中恢复推荐");
                    }}
                  >
                    {l(source ? "不推荐此来源" : "不推荐此方向")}
                    <b>{l(choiceLabel(id))}</b>
                  </button>
                ))}
            </dialog>
            <dialog
              ref={dataDialog}
              className="recommendation-dialog"
              aria-labelledby="data-title"
              aria-describedby="data-description"
              onCancel={() => setDataAction(null)}
              onClose={() => setDataAction(null)}
            >
              <h2 id="data-title">
                {l(
                  dataAction === "clear" ? "清空用户数据？" : "重置示例数据？",
                )}
              </h2>
              <p id="data-description" className="section-note">
                {l(
                  dataAction === "clear"
                    ? "将清空当前浏览器中的关注、自选、偏好、收藏、浏览历史和对话，简报与市场概览恢复通用默认。语言与外观保留，此操作不可撤销。"
                    : "关注、自选、偏好、收藏、浏览历史、对话、简报和市场概览将替换为示例数据。语言与外观保留，此操作不可撤销。",
                )}
              </p>
              <div className="dialog-actions">
                <button
                  className="secondary"
                  onClick={() => setDataAction(null)}
                  autoFocus
                >
                  {l("取消")}
                </button>
                <button
                  className={`primary${dataAction === "clear" ? " danger" : ""}`}
                  onClick={() => {
                    if (!dataAction) return;
                    applyDemoState(
                      dataAction === "clear"
                        ? createEmptyDemoState()
                        : createDemoState(),
                    );
                    setToast(
                      dataAction === "clear"
                        ? "用户数据已清空"
                        : "示例数据已重置",
                    );
                    setDataAction(null);
                  }}
                >
                  {l(dataAction === "clear" ? "确认清空" : "确认重置")}
                </button>
              </div>
            </dialog>
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
        </aside>
      </div>
    </div>
  );
}
export default App;

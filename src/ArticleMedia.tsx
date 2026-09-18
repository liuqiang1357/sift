import { useRef, useState } from "react";
import { ChevronDown, Maximize2, Play, X, ZoomIn, ZoomOut } from "lucide-react";
import { createLocalizer } from "./i18n";
import type { ArticleMedia, VisualMedia } from "./media";

export function ContentThumbnail({
  cover,
  english,
}: {
  cover: VisualMedia;
  english: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <span className="story-thumbnail" aria-hidden="true">
      <img
        src={cover.kind === "video" ? cover.poster : cover.src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
      {cover.kind === "video" && (
        <span className="thumbnail-badge">
          <Play size={11} fill="currentColor" />
          {english ? "Video" : "视频"}
        </span>
      )}
    </span>
  );
}

export function MediaBlock({
  media,
  english,
}: {
  media: ArticleMedia;
  english: boolean;
}) {
  const l = createLocalizer(english);
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  return (
    <figure className={`article-media media-${media.kind}`}>
      {failed ? (
        <div className="media-fallback" role="status">
          <span>{l("媒体暂时无法加载，可继续阅读下方说明。")}</span>
          <a href={media.src} target="_blank" rel="noreferrer">
            {l("打开媒体文件")}
          </a>
        </div>
      ) : media.kind === "image" ? (
        <>
          <button
            className="media-image-button"
            aria-label={`${l("查看大图")}：${l(media.title)}`}
            onClick={() => {
              setZoomed(false);
              dialog.current?.showModal();
            }}
          >
            <img
              src={media.src}
              alt={l(media.alt)}
              width={media.width}
              height={media.height}
              loading="lazy"
              onError={() => setFailed(true)}
            />
            <span>
              <Maximize2 size={14} />
              {l("查看大图")}
            </span>
          </button>
          <dialog
            ref={dialog}
            className="media-dialog"
            aria-label={l(media.title)}
            onClick={(event) => {
              if (event.target === event.currentTarget) dialog.current?.close();
            }}
          >
            <div className="media-dialog-heading">
              <b>{l(media.title)}</b>
              <div>
                <button
                  onClick={() => setZoomed(!zoomed)}
                  aria-label={l(zoomed ? "适应屏幕" : "放大图片")}
                  aria-pressed={zoomed}
                >
                  {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                </button>
                <button
                  onClick={() => dialog.current?.close()}
                  aria-label={l("关闭")}
                  autoFocus
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div
              className={`media-image-viewport${zoomed ? " is-zoomed" : ""}`}
            >
              <img
                src={media.src}
                alt={l(media.alt)}
                width={media.width}
                height={media.height}
                style={
                  zoomed ? { width: `max(150%, ${media.width}px)` } : undefined
                }
              />
            </div>
            <p>{l(media.caption)}</p>
            <small>{l(media.credit)}</small>
          </dialog>
        </>
      ) : media.kind === "video" ? (
        <video
          key={english ? "en" : "zh-CN"}
          controls
          playsInline
          preload="metadata"
          src={media.src}
          poster={media.poster}
          aria-label={l(media.title)}
          onError={() => setFailed(true)}
        >
          {media.captions.map((track) => (
            <track
              key={track.language}
              kind="captions"
              src={track.src}
              srcLang={track.language}
              label={l(track.label)}
              default={track.language === (english ? "en" : "zh-CN")}
            />
          ))}
          {l("媒体暂时无法加载，可继续阅读下方说明。")}
        </video>
      ) : (
        <audio
          controls
          preload="metadata"
          src={media.src}
          aria-label={l(media.title)}
          onError={() => setFailed(true)}
        >
          {l("媒体暂时无法加载，可继续阅读下方说明。")}
        </audio>
      )}
      <figcaption>
        <span>{l(media.caption)}</span>
        <small>{l(media.credit)}</small>
      </figcaption>
      {media.kind !== "image" && (
        <details className="reading-disclosure media-transcript">
          <summary>
            {l("文字说明")}
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <p>{l(media.transcript)}</p>
        </details>
      )}
    </figure>
  );
}

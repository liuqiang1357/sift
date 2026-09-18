import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Check, ChevronDown } from "lucide-react";
import { ChoiceChip } from "./ChoiceChip";
import { createLocalizer } from "./i18n";
import { topics } from "./data";
import {
  choiceLabel,
  toggleInterest,
  restoreRecommendation,
} from "./reading-choices";
import type { ReadingChoices } from "./reading-choices";
import { applyPreferenceText, interpretPreference } from "./preferences";

export function Preferences({
  choices,
  onChange,
  english,
}: {
  choices: ReadingChoices;
  onChange: Dispatch<SetStateAction<ReadingChoices>>;
  english: boolean;
}) {
  const l = createLocalizer(english);
  const [text, setText] = useState(
    choices.preferenceText ?? choices.legacyText ?? "",
  );
  const [saved, setSaved] = useState(false);
  const interpreted = interpretPreference(text);
  const dirty = text !== (choices.preferenceText ?? "");
  return (
    <>
      <label className="preference-label" htmlFor="preference-description">
        {l("描述你的偏好")}
      </label>
      <textarea
        id="preference-description"
        className="preference-input"
        value={text}
        placeholder={l(
          "例如：关注 AI 的产业变化，少看加密资产，不看市场数据的内容。",
        )}
        onChange={(event) => {
          setText(event.target.value);
          setSaved(false);
        }}
      />
      {dirty && (
        <div className="preference-preview" aria-live="polite">
          {(
            [
              ["more", "多推荐"],
              ["less", "少推荐"],
              ["hide", "不推荐"],
            ] as const
          ).map(
            ([kind, label]) =>
              interpreted[kind].length > 0 && (
                <p key={kind}>
                  <b>{l(label)}</b>
                  {interpreted[kind]
                    .map((id) => l(choiceLabel(id)))
                    .join(" · ")}
                </p>
              ),
          )}
          {text.trim() &&
            !interpreted.more.length &&
            !interpreted.less.length &&
            !interpreted.hide.length && (
              <small>{l("未识别到可调整的偏好，仍可保存原文。")}</small>
            )}
        </div>
      )}
      <div className="preference-save">
        <span role="status">
          {saved && (
            <>
              <Check size={14} />
              {l("已保存")}
            </>
          )}
        </span>
        <button
          className="primary"
          disabled={!dirty}
          onClick={() => {
            onChange((current) => applyPreferenceText(current, text));
            setSaved(true);
          }}
        >
          {l("保存偏好")}
        </button>
      </div>
      <section className="interest-group" aria-label={l("感兴趣的主题")}>
        <h2>{l("感兴趣的主题")}</h2>
        <div className="chip-group">
          {topics.map((id) => (
            <ChoiceChip
              key={id}
              selected={choices.interests.includes(id)}
              onClick={() => onChange((current) => toggleInterest(current, id))}
            >
              {l(choiceLabel(id))}
            </ChoiceChip>
          ))}
        </div>
      </section>
      {(choices.deemphasized?.length ?? 0) > 0 && (
        <div className="preference-reduced">
          <h2>{l("少推荐")}</h2>
          {choices.deemphasized!.map((id) => (
            <div className="topic-row" key={id}>
              <span>{l(choiceLabel(id))}</span>
              <button
                className="text-button"
                aria-label={`${l("恢复推荐")} ${l(choiceLabel(id))}`}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    deemphasized: current.deemphasized?.filter(
                      (value) => value !== id,
                    ),
                  }))
                }
              >
                {l("恢复推荐")}
              </button>
            </div>
          ))}
        </div>
      )}
      {choices.excluded.length > 0 && (
        <details className="preference-exclusions">
          <summary>
            {l("不推荐")}
            <span>{choices.excluded.length}</span>
            <ChevronDown size={16} />
          </summary>
          {choices.excluded.map((id) => (
            <div className="topic-row" key={id}>
              <span>{l(choiceLabel(id))}</span>
              <button
                className="text-button"
                aria-label={`${l("恢复推荐")} ${l(choiceLabel(id))}`}
                onClick={() =>
                  onChange((current) => restoreRecommendation(current, id))
                }
              >
                {l("恢复推荐")}
              </button>
            </div>
          ))}
        </details>
      )}
    </>
  );
}

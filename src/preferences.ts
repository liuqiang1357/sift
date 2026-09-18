import { topicAliases } from "./data.ts";
import { choiceLabel, preferenceTargets } from "./reading-choices.ts";
import type { ReadingChoices } from "./reading-choices.ts";
import { translate } from "./i18n.ts";

export type PreferenceInterpretation = {
  more: string[];
  less: string[];
  hide: string[];
};

// A bounded demo interpreter. Production can replace this with a model on save.
export function interpretPreference(text: string): PreferenceInterpretation {
  const result: PreferenceInterpretation = { more: [], less: [], hide: [] };
  const found = new Map<string, keyof PreferenceInterpretation>();
  const conflicting = new Set<string>();
  for (const clause of text.split(/[，,。.!?！？;；\n]/).filter(Boolean)) {
    // Do not turn questions or double negatives into lasting preferences.
    if (
      /要不要|是不是|不要排除|不想屏蔽|not\s+(?:avoid|hide|exclude)|不要少看/i.test(
        clause,
      )
    )
      continue;
    const cues = [
      ...clause.matchAll(
        /不感兴趣|不想关注|不想看|不推荐|不看|不要|屏蔽|排除|not interested|少看|少推荐|减少|多看|多推荐|关注|感兴趣|avoid|exclude|hide|less|fewer|more|interested/gi,
      ),
    ];
    const mentions = preferenceTargets.flatMap((id) => {
      const names = [
        ...new Set([
          id,
          choiceLabel(id),
          translate(choiceLabel(id), true),
          ...(topicAliases[id] ?? []),
        ]),
      ];
      return names.flatMap((name) => {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = /^[a-z\s]+$/i.test(name) ? `\\b${escaped}\\b` : escaped;
        return [...clause.matchAll(new RegExp(pattern, "gi"))].map((match) => ({
          id,
          start: match.index,
          end: match.index + match[0].length,
        }));
      });
    });
    // A complete source name wins over author/media names contained inside it.
    const explicit = mentions.filter(
      (mention) =>
        !mentions.some(
          (other) =>
            other.id !== mention.id &&
            other.start <= mention.start &&
            other.end >= mention.end &&
            other.end - other.start > mention.end - mention.start,
        ),
    );
    for (const id of preferenceTargets) {
      const positions = explicit
        .filter((mention) => mention.id === id)
        .map((mention) => mention.start);
      if (!positions.length) continue;
      const position = Math.min(...positions);
      const preceding = cues.filter((cue) => cue.index <= position).at(-1);
      const cue = preceding?.[0] ?? (cues.length === 1 ? cues[0][0] : "");
      const kind = /少看|少推荐|减少|less|fewer/i.test(cue)
        ? "less"
        : /不感兴趣|不想关注|不想看|不推荐|不看|不要|屏蔽|排除|not interested|avoid|exclude|hide/i.test(
              cue,
            )
          ? "hide"
          : "more";
      if (found.has(id) && found.get(id) !== kind) conflicting.add(id);
      found.set(id, kind);
    }
  }
  for (const [id, kind] of found)
    if (!conflicting.has(id)) result[kind].push(id);
  return result;
}

export function applyPreferenceText(
  choices: ReadingChoices,
  text: string,
): ReadingChoices {
  const previous = interpretPreference(
    choices.preferenceText ?? choices.legacyText ?? "",
  );
  const next = interpretPreference(text);
  const all = [...next.more, ...next.less, ...next.hide];
  return {
    ...choices,
    preferenceText: text,
    interests: [
      ...new Set([
        ...choices.interests.filter(
          (id) => !previous.more.includes(id) && !all.includes(id),
        ),
        ...next.more,
      ]),
    ],
    deemphasized: [
      ...new Set([
        ...(choices.deemphasized ?? []).filter(
          (id) => !previous.less.includes(id) && !all.includes(id),
        ),
        ...next.less,
      ]),
    ],
    excluded: [
      ...new Set([
        ...choices.excluded.filter(
          (id) => !previous.hide.includes(id) && !all.includes(id),
        ),
        ...next.hide,
      ]),
    ],
  };
}

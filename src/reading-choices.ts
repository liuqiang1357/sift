import { assets, sourceProfiles, topics } from "./data.ts";
import { translate } from "./i18n.ts";

export type ReadingChoices = {
  sources: string[];
  watchlist: string[];
  interests: string[];
  excluded: string[];
  legacyText?: string;
  preferenceText?: string;
  deemphasized?: string[];
};

export const markets = [...new Set(assets.map((asset) => asset.market))];
export const sourceChoices = sourceProfiles.map((source) => source.id);
export const preferenceTargets = [
  ...topics,
  ...sourceChoices,
  ...assets.map((asset) => asset.id),
];
export const emptyChoices: ReadingChoices = {
  sources: [],
  watchlist: [],
  interests: [],
  excluded: [],
};
export const defaultChoices: ReadingChoices = {
  ...emptyChoices,
  sources: ["林序", "产业观察"],
  watchlist: ["NVDA", "BTC", "XAU"],
  interests: ["宏观经济", "AI 与科技"],
  preferenceText: "关注宏观经济和 AI 的产业变化，少看加密资产相关内容。",
  deemphasized: ["加密资产"],
};

export const choiceLabel = (id: string) =>
  assets.find((asset) => asset.id === id)?.name ?? id;
const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string"))]
    : [];

// Preserve supported preferences and raw wording without inferring replacements.
export function migrateReadingChoices(
  value: unknown,
  legacyText?: unknown,
): ReadingChoices {
  const object =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  if (object && Array.isArray(object.interests)) {
    const supported = (value: unknown) =>
      strings(value).filter((id) => preferenceTargets.includes(id));
    return {
      ...(object as ReadingChoices),
      interests: supported(object.interests),
      excluded: supported(object.excluded),
      ...(Array.isArray(object.deemphasized)
        ? { deemphasized: supported(object.deemphasized) }
        : {}),
    };
  }
  let choices = structuredClone(defaultChoices);
  if (object) {
    choices = {
      ...emptyChoices,
      excluded: [],
      sources: strings(object.sources).filter((id) =>
        sourceChoices.includes(id),
      ),
      watchlist: strings(object.watchlist).filter((id) =>
        assets.some((asset) => asset.id === id),
      ),
      interests: strings(object.topics).filter((id) => topics.includes(id)),
    };
  } else if (Array.isArray(value)) {
    const ids = strings(value);
    choices = {
      ...emptyChoices,
      excluded: [],
      sources: ids.filter((id) => sourceChoices.includes(id)),
      watchlist: ids.filter((id) => assets.some((asset) => asset.id === id)),
      interests: ids.filter((id) => topics.includes(id)),
    };
  }
  if (typeof legacyText !== "string" || !legacyText.trim()) return choices;
  choices.legacyText = legacyText;
  const groups = new Map<string, string[]>();
  for (const line of legacyText
    .split(/[\n;；]/)
    .map((line) => line.trim())
    .filter(Boolean)) {
    const match = line.match(
      /^(多看|少看|不看|more\s+|less\s+|hide\s+)\s*(.+)$/i,
    );
    const id =
      match &&
      preferenceTargets.find((id) =>
        [id, choiceLabel(id), translate(choiceLabel(id), true)].some(
          (name) => name.toLowerCase() === match[2].trim().toLowerCase(),
        ),
      );
    if (!match || !id) continue;
    groups.set(id, [...(groups.get(id) ?? []), match[1].trim().toLowerCase()]);
  }
  for (const [id, actions] of groups) {
    // Repeated/conflicting old rules were inactive; do not invent a resolution now.
    if (actions.length !== 1) continue;
    if (["多看", "more"].includes(actions[0])) choices.interests.push(id);
    else choices.excluded.push(id);
  }
  choices.interests = [...new Set(choices.interests)].filter(
    (id) => !choices.excluded.includes(id),
  );
  choices.excluded = [...new Set(choices.excluded)];
  return choices;
}

export function toggleChoice(
  choices: ReadingChoices,
  kind: "sources" | "watchlist",
  id: string,
): ReadingChoices {
  const values = choices[kind];
  return {
    ...choices,
    [kind]: values.includes(id)
      ? values.filter((value) => value !== id)
      : [...values, id],
  };
}
export function toggleInterest(
  choices: ReadingChoices,
  id: string,
): ReadingChoices {
  if (!topics.includes(id)) return choices;
  return {
    ...choices,
    interests: choices.interests.includes(id)
      ? choices.interests.filter((value) => value !== id)
      : [...choices.interests, id],
    excluded: choices.excluded.filter((value) => value !== id),
    deemphasized: (choices.deemphasized ?? []).filter((value) => value !== id),
  };
}
export function excludeRecommendation(
  choices: ReadingChoices,
  id: string,
): ReadingChoices {
  return {
    ...choices,
    interests: choices.interests.filter((value) => value !== id),
    excluded: [...new Set([...choices.excluded, id])],
    deemphasized: (choices.deemphasized ?? []).filter((value) => value !== id),
  };
}
export function restoreRecommendation(
  choices: ReadingChoices,
  id: string,
): ReadingChoices {
  return {
    ...choices,
    excluded: choices.excluded.filter((value) => value !== id),
  };
}

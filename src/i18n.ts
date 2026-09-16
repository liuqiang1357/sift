import translations from "./translations.json" with { type: "json" };

const dictionary: Record<string, string> = translations;
const escapePattern = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Longest phrases win so a full sentence is translated before individual labels.
const phrasePattern = new RegExp(
  Object.keys(dictionary)
    .sort((a, b) => b.length - a.length)
    .map((key) => escapePattern(key).replace(/\s+/g, "\\s+"))
    .join("|"),
  "g",
);

export function translate(text: string, english: boolean): string {
  if (!english) return text;
  return text.replace(
    phrasePattern,
    (match) => dictionary[match.replace(/\s+/g, " ")] ?? match,
  );
}

// Translate display values only; stored identifiers and event handlers stay stable.
export function createLocalizer(english: boolean) {
  return function localize<T>(value: T): T {
    if (typeof value === "string") return translate(value, english) as T;
    if (Array.isArray(value)) return value.map(localize) as T;
    return value;
  };
}

export function matchesSearch(text: string, query: string) {
  return `${text} ${translate(text, true)}`
    .toLowerCase()
    .includes(query.toLowerCase());
}

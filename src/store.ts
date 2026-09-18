import { useEffect, useState } from "react";
export function useStored<T>(
  key: string,
  initial: T | (() => T),
  migrate?: (value: unknown) => T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw
        ? migrate
          ? migrate(JSON.parse(raw))
          : (JSON.parse(raw) as T)
        : typeof initial === "function"
          ? (initial as () => T)()
          : initial;
    } catch {
      return typeof initial === "function" ? (initial as () => T)() : initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Storage is optional in private browsing. */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

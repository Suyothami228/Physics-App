import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { B, C, type Attempt, type Language } from "./model";
import { API_ENABLED, type Account } from "./api";
const get = (key: string, fallback: unknown) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};
export function useAppState(initialHistory?: Attempt[], account?: Account) {
  const [language, setLanguage] = useState<Language>(() =>
    get("iyal-language", "ta") === "en" ? "en" : "ta",
  );
  const [history, setHistory] = useState<Attempt[]>(
    () =>
      initialHistory ??
      (API_ENABLED ? [] : B.clean(get("iyal-practice-v1", []))),
  );
  const [saved, setSaved] = useState<string[]>(() => {
    const value = get("iyal-saved", []);
    return Array.isArray(value)
      ? value.filter(
          (id: unknown) =>
            typeof id === "string" &&
            C.chapters.some((c) => c.lessons.some((l) => l.id === id)),
        )
      : [];
  });
  const [last, setLast] = useState<string>(() => {
    const id = get("iyal-last-lesson", "02/projectile");
    return typeof id === "string" &&
      C.getLesson(id.split("/")[0], id.split("/")[1])
      ? id
      : "02/projectile";
  });
  const [storageOK, setStorageOK] = useState(true);
  useEffect(() => {
    try {
      localStorage.setItem("iyal-language", JSON.stringify(language));
      if (!API_ENABLED)
        localStorage.setItem("iyal-practice-v1", JSON.stringify(history));
      localStorage.setItem("iyal-saved", JSON.stringify(saved));
      localStorage.setItem("iyal-last-lesson", JSON.stringify(last));
    } catch {
      setStorageOK(false);
    }
  }, [language, history, saved, last]);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (!API_ENABLED && e.key === "iyal-practice-v1")
        setHistory(B.clean(get(e.key, [])));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return {
    account,
    language,
    setLanguage,
    history,
    setHistory,
    saved,
    setSaved,
    last,
    setLast,
    storageOK,
    T: (en: string, ta: string) => (language === "ta" ? ta : en),
    score: B.evaluate(history),
  };
}
type State = ReturnType<typeof useAppState>;
const Context = createContext<State | null>(null);
export function AppProvider({
  children,
  initialHistory,
  account,
}: {
  children: ReactNode;
  initialHistory?: Attempt[];
  account?: Account;
}) {
  const state = useAppState(initialHistory, account);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw Error("Missing AppProvider");
  return value;
}

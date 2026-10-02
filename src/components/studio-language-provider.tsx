"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_LANG,
  isLang,
  translate,
  type Lang,
  type MessageKey,
} from "~/lib/i18n";

export const LANGUAGE_STORAGE_KEY = "gnu.in.labs.language";

interface StudioLanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey) => string;
}

// Components rendered outside the provider (isolated tests, server previews)
// fall back to English rather than throwing.
const StudioLanguageContext = createContext<StudioLanguageContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => undefined,
  t: (key) => translate(DEFAULT_LANG, key),
});

function applyLangToDocument(lang: Lang) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
}

export function StudioLanguageProvider({
  children,
  defaultLang = DEFAULT_LANG,
}: {
  children: React.ReactNode;
  defaultLang?: Lang;
}) {
  // The server renders the default language; the stored choice is restored
  // after hydration so the first paint never mismatches the server HTML.
  const [lang, setLangState] = useState<Lang>(defaultLang);

  useEffect(() => {
    let restored: Lang | null = null;
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isLang(stored)) restored = stored;
    } catch {
      // Storage can be unavailable (private mode, packaged file:// origin).
    }
    if (restored) setLangState(restored);
    applyLangToDocument(restored ?? defaultLang);
  }, [defaultLang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    applyLangToDocument(next);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Ignore: the choice still applies for this session.
    }
    // Persisted to .env.local so the packaged app keeps the language across
    // restarts. A failure here is not worth interrupting the user for.
    fetch("/api/settings/lang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: next }),
    }).catch(() => undefined);
  }, []);

  const t = useCallback((key: MessageKey) => translate(lang, key), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <StudioLanguageContext.Provider value={value}>
      {children}
    </StudioLanguageContext.Provider>
  );
}

export function useStudioLanguage() {
  return useContext(StudioLanguageContext);
}

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", label: "Assamese", native: "অসমীয়া" },
  { code: "ur", label: "Urdu", native: "اردو" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "loomlive.language";

const setGoogleCookie = (lang: LanguageCode) => {
  const value = lang === "en" ? "/en/en" : `/en/${lang}`;
  const host = window.location.hostname;
  const expire = "; path=/; max-age=" + 60 * 60 * 24 * 365;
  document.cookie = `googtrans=${value}${expire}`;
  document.cookie = `googtrans=${value}${expire}; domain=${host}`;
  if (host.includes(".")) {
    const root = "." + host.split(".").slice(-2).join(".");
    document.cookie = `googtrans=${value}${expire}; domain=${root}`;
    document.cookie = `googtrans=${value}${expire}; domain=.${host}`;
  }
};

const triggerSelect = (lang: LanguageCode): boolean => {
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!select) return false;
  select.value = lang;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
};

let widgetLoaded = false;
const loadGoogleWidget = (onReady?: () => void) => {
  if (widgetLoaded) {
    onReady?.();
    return;
  }
  widgetLoaded = true;

  if (!document.getElementById("google_translate_element")) {
    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden;";
    document.body.appendChild(div);
  }

  const style = document.createElement("style");
  style.innerHTML = `
    .goog-te-banner-frame.skiptranslate,
    .goog-logo-link,
    .goog-te-gadget span,
    iframe.goog-te-banner-frame { display: none !important; }
    body { top: 0 !important; position: static !important; }
    .goog-tooltip, .goog-tooltip:hover { display: none !important; }
    .goog-text-highlight { background: transparent !important; box-shadow: none !important; }
    #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
    .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
  `;
  document.head.appendChild(style);

  (window as any).googleTranslateElementInit = () => {
    const G = (window as any).google;
    if (!G?.translate?.TranslateElement) return;
    try {
      new G.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: LANGUAGES.map((l) => l.code).join(","),
          autoDisplay: false,
        },
        "google_translate_element"
      );
      onReady?.();
    } catch (e) {
      console.error("[i18n] init error", e);
    }
  };

  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.defer = true;
  script.onerror = () => console.warn("[i18n] Google Translate failed to load");
  document.body.appendChild(script);
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem(STORAGE_KEY) as LanguageCode) || "en";
  });
  const [isReady, setIsReady] = useState(false);
  const initialized = useRef(false);

  // Only load Google Translate widget if a non-English language is persisted.
  // This avoids slowing down every page load for English users (the default).
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const stored = (localStorage.getItem(STORAGE_KEY) as LanguageCode) || "en";
    if (stored === "en") {
      setIsReady(true);
      return;
    }

    // Defer to idle so it never blocks initial render
    const start = () => {
      setGoogleCookie(stored);
      loadGoogleWidget();
      let attempts = 0;
      const poll = setInterval(() => {
        if (triggerSelect(stored)) {
          clearInterval(poll);
          setIsReady(true);
        } else if (++attempts > 60) {
          clearInterval(poll);
        }
      }, 250);
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(start, { timeout: 1500 });
    } else {
      setTimeout(start, 200);
    }
  }, []);

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);
    setGoogleCookie(code);

    if (code === "en") {
      // Clean restore of original DOM
      setTimeout(() => window.location.reload(), 50);
      return;
    }

    // Lazy-load widget on first non-English selection
    loadGoogleWidget(() => {
      if (!triggerSelect(code)) {
        let attempts = 0;
        const poll = setInterval(() => {
          if (triggerSelect(code) || ++attempts > 40) clearInterval(poll);
        }, 200);
      }
    });

    // If already loaded, just trigger
    if (!triggerSelect(code)) {
      let attempts = 0;
      const poll = setInterval(() => {
        if (triggerSelect(code) || ++attempts > 40) clearInterval(poll);
      }, 200);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

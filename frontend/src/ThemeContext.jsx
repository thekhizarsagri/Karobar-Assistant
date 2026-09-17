import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ dark: false, toggle: () => {} });

const STORAGE_KEY = "karobar-theme";
const EXPLICIT_KEY = "karobar-theme-explicit";

const isOsDark = () => {
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  } catch {
    return false;
  }
};

/** Explicit user choice ("dark"/"light"), or null when following the OS. */
function getExplicitChoice() {
  try {
    if (localStorage.getItem(EXPLICIT_KEY) !== "true") return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

const getInitialDark = () => {
  const choice = getExplicitChoice();
  return choice ? choice === "dark" : isOsDark();
};

function applyTheme(dark) {
  const root = document.documentElement;
  if (dark) root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
  root.style.colorScheme = dark ? "dark" : "light";
}

/** Persist explicit choice; clear it when it matches the OS so the app follows the system. */
function persistChoice(nextDark) {
  try {
    if (nextDark === isOsDark()) {
      localStorage.removeItem(EXPLICIT_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light");
      localStorage.setItem(EXPLICIT_KEY, "true");
    }
  } catch {
    /* ignore */
  }
}

/** Drop stale/orphan storage so a fresh launch falls back to the OS theme. */
function cleanupStorage() {
  try {
    const os = isOsDark() ? "dark" : "light";
    const choice = getExplicitChoice();
    if (!choice) localStorage.removeItem(STORAGE_KEY);
    else if (choice === os) {
      localStorage.removeItem(EXPLICIT_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }) {
  const [dark, setDarkState] = useState(getInitialDark);

  useEffect(() => {
    applyTheme(dark);
  }, [dark]);

  useEffect(() => {
    applyTheme(getInitialDark());
    cleanupStorage();
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return undefined;
    const handler = (e) => {
      if (!getExplicitChoice()) setDarkState(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((next) => {
    setDarkState((prev) => {
      if (prev === next) return prev;
      persistChoice(next);
      return next;
    });
  }, []);

  const toggle = useCallback(() => {
    setDarkState((v) => {
      persistChoice(!v);
      return !v;
    });
  }, []);

  const setTheme = useCallback(
    (mode) => {
      if (mode === "toggle") toggle();
      else if (mode === "dark" || mode === "light") update(mode === "dark");
    },
    [toggle, update]
  );

  return (
    <ThemeContext.Provider value={{ dark, toggle, setDark: update, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ dark: false, toggle: () => {} });

function getInitialDark() {
  const osDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  try {
    const explicit = localStorage.getItem("karobar-theme-explicit");
    if (explicit === "true") {
      const stored = localStorage.getItem("karobar-theme");
      const osTheme = osDark ? "dark" : "light";
      if (stored === osTheme) {
        localStorage.removeItem("karobar-theme-explicit");
        return osDark;
      }
      return stored === "dark";
    }
  } catch {
    /* ignore */
  }
  return osDark;
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(getInitialDark);

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("karobar-theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = (e) => {
      try {
        const explicit = localStorage.getItem("karobar-theme-explicit");
        if (explicit === "true") {
          const stored = localStorage.getItem("karobar-theme");
          const osTheme = e.matches ? "dark" : "light";
          if (stored === osTheme) {
            localStorage.removeItem("karobar-theme-explicit");
          } else {
            return;
          }
        }
      } catch {
        /* ignore */
      }
      setDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = useCallback(() => {
    setDark((v) => {
      const next = !v;
      try {
        localStorage.setItem("karobar-theme", next ? "dark" : "light");
        const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
        const osIsDark = mq?.matches ?? false;
        const matchesOs = (next && osIsDark) || (!next && !osIsDark);
        if (matchesOs) {
          localStorage.removeItem("karobar-theme-explicit");
        } else {
          localStorage.setItem("karobar-theme-explicit", "true");
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

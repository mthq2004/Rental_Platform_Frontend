import { ConfigProvider, theme as antdTheme } from "antd";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  isSwitching: boolean;
  setTheme: (next: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";

  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [isSwitching, setIsSwitching] = useState(false);
  const fallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current !== null) {
        window.clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      if (next === theme || isSwitching) {
        return;
      }

      const root = document.documentElement;
      setIsSwitching(true);
      root.classList.add("theme-switching");

      const applyTheme = () => {
        setThemeState(next);
        root.setAttribute("data-theme", next);
      };

      type ViewTransitionDocument = Document & {
        startViewTransition?: (callback: () => void) => { finished: Promise<void> };
      };

      const transitionDoc = document as ViewTransitionDocument;

      if (typeof transitionDoc.startViewTransition === "function") {
        transitionDoc
          .startViewTransition(applyTheme)
          .finished.finally(() => {
            root.classList.remove("theme-switching");
            setIsSwitching(false);
          });
        return;
      }

      applyTheme();
      fallbackTimerRef.current = window.setTimeout(() => {
        root.classList.remove("theme-switching");
        setIsSwitching(false);
      }, 240);
    },
    [theme, isSwitching],
  );

  const value = useMemo(
    () => ({
      theme,
      isSwitching,
      setTheme,
      toggle: () => setTheme(theme === "light" ? "dark" : "light"),
    }),
    [theme, isSwitching, setTheme],
  );

  const antdConfig = useMemo(
    () => {
      const isDark = theme === "dark";

      return {
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#1d4ed8",
          colorLink: "#1d4ed8",
          colorInfo: "#1d4ed8",
          borderRadius: 12,
          colorBgBase: isDark ? "#0c1422" : "#f4f8ff",
          colorBgContainer: isDark ? "#131f33" : "#ffffff",
          colorTextBase: isDark ? "#edf4ff" : "#10213d",
          colorBorder: isDark ? "#27406d" : "#d3e2ff",
        },
        components: {
          Layout: {
            headerBg: isDark ? "#0f1a2c" : "#ffffff",
            siderBg: isDark ? "#0f1a2c" : "#ffffff",
            bodyBg: isDark ? "#0c1422" : "#f4f8ff",
            triggerBg: isDark ? "#182842" : "#eff5ff",
          },
          Menu: {
            itemSelectedBg: isDark ? "#1f3f7a" : "#dbeafe",
            itemSelectedColor: isDark ? "#e8f1ff" : "#1e3a8a",
            itemColor: isDark ? "#b6c8e6" : "#274774",
            itemHoverColor: isDark ? "#ffffff" : "#1d4ed8",
          },
        },
      };
    },
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={antdConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
};

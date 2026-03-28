"use client";

import { Provider } from "react-redux";
import { useEffect, useRef } from "react";
import { store } from "./store";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { getProfileUser, logout } from "./slices/auth.slice";
import Cookies from "js-cookie";

// Component to handle auto-fetching profile on app init
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const hasFetched = useRef(false);
  const isCheckingSession = useRef(false);
  const lastSessionCheckAt = useRef(0);

  useEffect(() => {
    // Only run once on mount
    if (hasFetched.current) return;
    
    const state = store.getState().auth;
    const tokenFromCookie = Cookies.get("accessToken");
    
    // If we have a token but no user data, fetch the profile
    if (tokenFromCookie && !state.user && !state.loading) {
      hasFetched.current = true;
      store.dispatch(getProfileUser());
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const now = Date.now();
      const SESSION_CHECK_COOLDOWN_MS = 60 * 1000;
      const tokenFromCookie = Cookies.get("accessToken");

      if (
        !tokenFromCookie ||
        isCheckingSession.current ||
        now - lastSessionCheckAt.current < SESSION_CHECK_COOLDOWN_MS
      ) {
        return;
      }

      isCheckingSession.current = true;
      lastSessionCheckAt.current = now;

      try {
        await store.dispatch(getProfileUser()).unwrap();
      } catch {
        store.dispatch(logout());
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          window.location.href = "/";
        }
      } finally {
        isCheckingSession.current = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkSession();
      }
    };

    const onWindowFocus = () => {
      void checkSession();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, []);

  return <>{children}</>;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <Provider store={store}>
        <AuthInitializer>{children}</AuthInitializer>
      </Provider>
    </AntdRegistry>
  );
}

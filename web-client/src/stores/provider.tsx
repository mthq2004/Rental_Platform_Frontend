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
      const tokenFromCookie = Cookies.get("accessToken");

      if (!tokenFromCookie || isCheckingSession.current) {
        return;
      }

      isCheckingSession.current = true;

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

    const intervalId = window.setInterval(checkSession, 15000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkSession();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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

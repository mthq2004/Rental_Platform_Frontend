"use client";

import { Provider } from "react-redux";
import { useEffect, useRef } from "react";
import { store } from "./store";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { getProfileUser } from "./slices/auth.slice";
import Cookies from "js-cookie";

// Component to handle auto-fetching profile on app init
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const hasFetched = useRef(false);

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

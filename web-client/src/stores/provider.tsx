"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import { AntdRegistry } from "@ant-design/nextjs-registry";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <Provider store={store}>{children}</Provider>
    </AntdRegistry>
  );
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import router from "./routes/RouterApp.tsx";
import { Provider } from "react-redux";
import { store } from "./stores/store.ts";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import ClickEffect from "./components/ClickEffect.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ClickEffect />
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </ThemeProvider>
  </StrictMode>
);

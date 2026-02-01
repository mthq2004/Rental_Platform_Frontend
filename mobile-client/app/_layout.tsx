import { Stack } from "expo-router";
import './global.css'
import { Provider } from "react-redux";
import { store } from "@/store";
import { SocketProvider } from "@/contexts/SocketContext";
import { useEffect } from "react";
import { getProfile } from "@/store/slices/auth.slice";
import { useAppDispatch } from "@/store/hook";
import AppInitializer from "@/components/AppInitializer";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppInitializer>
        <SocketProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
          </Stack>
        </SocketProvider>
      </AppInitializer>
    </Provider>
  );
}
import { Stack } from "expo-router";
import './global.css'
import { Provider } from "react-redux";
import { store } from "@/store";
import { SocketProvider } from "@/contexts/SocketContext";
import { useEffect } from "react";
import { getProfile } from "@/store/slices/auth.slice";
import { useAppDispatch } from "@/store/hook";
import AppInitializer from "@/components/AppInitializer";
import { ChatSocketProvider } from "@/contexts/ChatSocketContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppInitializer>
        <SocketProvider>
          <ChatSocketProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
              </Stack></GestureHandlerRootView>
          </ChatSocketProvider>
        </SocketProvider>
      </AppInitializer>
    </Provider>
  );
}
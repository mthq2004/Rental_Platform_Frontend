import { Stack } from "expo-router";
import './global.css'
import { Provider } from "react-redux";
import { store } from "@/store";
import { SocketProvider } from "@/contexts/SocketContext";
import AppInitializer from "@/components/AppInitializer";
import { ChatSocketProvider } from "@/contexts/ChatSocketContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CallProvider } from "@/contexts/CallContext";
import CallOverlay from "@/components/chat/CallOverlay";
import { GlobalToast } from '@/components/Notification';
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppInitializer>
          <SocketProvider>
            <ChatSocketProvider>
              <CallProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tab)" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(rental)" />
                  </Stack>
                  <CallOverlay />
                  <GlobalToast />
                </GestureHandlerRootView>
              </CallProvider>
            </ChatSocketProvider>
          </SocketProvider>
        </AppInitializer>
      </SafeAreaProvider>
    </Provider>
  );
}
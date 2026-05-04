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
import ClickEffect from "@/components/common/ClickEffect";
import FloatingKeyboardBar from "@/components/common/FloatingKeyboardBar";
import { FloatingKeyboardProvider } from "@/contexts/FloatingKeyboardContext";
import AuthToastListener from "@/components/AuthToastListener";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppInitializer>
        <SocketProvider>
          <ChatSocketProvider>
            <CallProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <FloatingKeyboardProvider>
                  <ClickEffect>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="(tab)" />
                      <Stack.Screen name="(auth)" />
                      <Stack.Screen name="(chat)/AIChat" />
                      <Stack.Screen name="(chat)/ChatDetail" />
                      <Stack.Screen name="(chat)/category-management" />
                      <Stack.Screen name="(notification)/index" />
                      <Stack.Screen name="(post)/book-schedule" />
                      <Stack.Screen name="(post)/choose-property-type" />
                      <Stack.Screen name="(post)/create-post" />
                      <Stack.Screen name="(post)/filter-search" />
                      <Stack.Screen name="(post)/property-detail" />
                      <Stack.Screen name="(profile)/edit" />
                      <Stack.Screen name="(profile)/favorites" />
                      <Stack.Screen name="(profile)/notification-settings" />
                      <Stack.Screen name="(profile)/ekyc" />
                      <Stack.Screen name="(rental)/contract-builder" />
                      <Stack.Screen name="(rental)/contract-detail" />
                      <Stack.Screen name="(rental)/create-request" />
                      <Stack.Screen name="(rental)/pay-deposit" />
                      <Stack.Screen name="(rental)/requests" />
                    </Stack>
                    <CallOverlay />
                    <GlobalToast />
                    <AuthToastListener />
                    <FloatingKeyboardBar />
                  </ClickEffect>
                </FloatingKeyboardProvider>
              </GestureHandlerRootView>
            </CallProvider>
          </ChatSocketProvider>
        </SocketProvider>
      </AppInitializer>
    </Provider>
  );
}
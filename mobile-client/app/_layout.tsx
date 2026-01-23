import { Stack } from "expo-router";
import './global.css'
import { Provider } from "react-redux";
import { store } from "@/store";
import { SocketProvider } from "@/contexts/SocketContext";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SocketProvider>
        <Stack
          screenOptions={{
            headerShown: false
          }}
        />
      </SocketProvider>

    </Provider>
  );
}
"use client";
import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { ReactNode, useEffect } from "react";

interface AntdConfigProviderProps {
    children: ReactNode;
}

export default function AntdConfigProvider({ children }: AntdConfigProviderProps) {
    return (
        <ConfigProvider
            locale={viVN}
            theme={{
                token: {
                    colorPrimary: "#5750F1",
                    borderRadius: 8,
                },
            }}
        >
            <App
                message={{
                    top: undefined,
                    duration: 3,
                    maxCount: 3,
                }}
                notification={{
                    placement: "bottomLeft",
                    duration: 4,
                }}
            >
                <MessageConfig />
                {children}
            </App>
        </ConfigProvider>
    );
}

// Component to configure message position
function MessageConfig() {
    const { message } = App.useApp();

    useEffect(() => {
        // Store the message instance globally for use in non-component code
        if (typeof window !== "undefined") {
            (window as any).__antdMessage = message;
        }
    }, [message]);

    return null;
}

// Export a hook to get the configured message instance
export function useMessage() {
    const { message, notification } = App.useApp();
    return { message, notification };
}

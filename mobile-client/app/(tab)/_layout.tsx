import { Tabs, router } from 'expo-router';
import { useThemeColors } from '@/utils/colors';
import { useColorScheme } from 'nativewind';
import CustomTabBar from '@/components/CustomTabBar';
import { useState } from 'react';
import { Toast } from '@/components/Notification';
import { useAppSelector } from '@/store/hook';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const colors = useThemeColors();
  const { isAuth } = useAppSelector(state => state.auth);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showAuthError = (redirectTo?: string) => {
    setToast({ visible: true, message: 'Vui lòng đăng nhập để sử dụng tính năng này', type: 'error' });
    setTimeout(() => {
      router.push({
        pathname: '/(auth)/login',
        params: redirectTo ? { redirect_to: redirectTo } : undefined,
      });
    }, 1500);
  };

  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} onAuthFail={showAuthError} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            backgroundColor: colors.current.background,
          },
          tabBarShowLabel: false,
          tabBarStyle: { position: 'absolute' },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="(protected)/my-post" />
        <Tabs.Screen name="(protected)/create-post" />
        <Tabs.Screen name="(protected)/chat" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={3000}
        onHide={hideToast}
      />
    </>
  );
}

import { useEffect, useState, useRef } from 'react';
import { useAppDispatch } from '@/store/hook';
import { getProfile, logout } from '@/store/slices/auth.slice';
import { getAccessToken } from '@/utils/secureStorage';
import { getSavedThemePreference, setTheme } from '@/utils/theme';
import { useColorScheme } from 'nativewind';
import contractSocket from '@/services/contract.socket'
import { store } from '@/store'

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const [isReady, setIsReady] = useState(false);
  const { setColorScheme } = useColorScheme();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initAuth = async () => {
      try {
        const savedTheme = await getSavedThemePreference();
        if (savedTheme) {
          setColorScheme(savedTheme);
          setTheme(savedTheme);
        }

        const token = await getAccessToken();

        if (!token) {
          setIsReady(true);
          return;
        }

        try {
          await dispatch(getProfile()).unwrap();
          // after profile loaded, init socket listeners to sync contract state
          try {
            contractSocket.init(store.dispatch as any)
          } catch (e) {
            console.warn('contract socket init error', e)
          }
        } catch {
          // Only logout if the 401 interceptor cleared the token
          // (i.e. the token was invalid). On network errors the token
          // is preserved and we simply continue as guest.
          const tokenAfterError = await getAccessToken();
          if (!tokenAfterError) {
            dispatch(logout());
          }
        }
      } catch (error) {
        // theme init failed – ignore
      } finally {
        setIsReady(true);
      }
    };

    initAuth();
  }, [dispatch, setColorScheme]);

  if (!isReady) return null;
  // cleanup on unmount
  // ensure socket disconnect when initializer unmounts
  // (rare in single-page app but safe)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  // useEffect not needed here as init runs once; add cleanup via return function above if needed

  return <>{children}</>;
};

export default AppInitializer;
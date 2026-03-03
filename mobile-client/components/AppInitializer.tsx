import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hook';
import { getProfile, logout } from '@/store/slices/auth.slice';
import { getAccessToken } from '@/utils/secureStorage';

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await getAccessToken();

        if (!token) {
          setIsReady(true);
          return;
        }

        await dispatch(getProfile()).unwrap();
      } catch (error) {
        dispatch(logout());
      } finally {
        setIsReady(true);
      }
    };

    initAuth();
  }, []);

  if (!isReady) return null;

  return <>{children}</>;
};

export default AppInitializer;
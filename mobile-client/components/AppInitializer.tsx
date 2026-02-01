import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hook';
import { getProfile } from '@/store/slices/auth.slice';
import { getAccessToken } from '@/utils/secureStorage';

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initAuth = async () => {
      const token = await getAccessToken();

      if (token) {
        dispatch(getProfile());
      }
    };

    initAuth();
  }, []);

  return <>{children}</>;
};

export default AppInitializer;

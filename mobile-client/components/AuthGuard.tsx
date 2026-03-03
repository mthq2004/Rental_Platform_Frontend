import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/store/hook';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAppSelector(state => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuth) {
      router.replace('/(auth)/login');
    }
  }, [isAuth, router]);

  if (!isAuth) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
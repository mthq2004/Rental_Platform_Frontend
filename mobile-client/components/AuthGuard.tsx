import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/store/hook';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAppSelector(state => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuth) {
      // Dùng replace - thay thế tab bị chặn bằng màn login
      // Khi back sẽ quay về màn hình trước tab bị chặn
      router.replace('/(auth)/login');
    }
  }, [isAuth]);

  if (!isAuth) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
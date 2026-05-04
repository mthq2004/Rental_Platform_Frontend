import { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hook';
import { resetMessage } from '@/store/slices/auth.slice';
import { showToast } from '@/components/Notification';

/**
 * AuthToastListener
 *
 * Component ẩn (không render UI) — lắng nghe auth.message
 * và hiện GlobalToast cho đăng nhập / đăng xuất thành công/thất bại.
 *
 * Đặt trong _layout.tsx để hoạt động toàn cục trên mọi screen.
 */
const AuthToastListener = () => {
  const dispatch = useAppDispatch();
  const { message } = useAppSelector((state) => state.auth);
  const lastMessageRef = useRef<any>(null);

  useEffect(() => {
    if (!message || message === lastMessageRef.current) return;
    lastMessageRef.current = message;

    switch (message.type) {
      case 'success_login':
        showToast(message.message || 'Đăng nhập thành công!', 'success', 2500);
        break;
      case 'error_login':
        showToast(message.message || 'Đăng nhập thất bại!', 'error', 3000);
        break;
      case 'success_logout':
        showToast(message.message || 'Đã đăng xuất', 'info', 2000);
        break;
      case 'success_update':
        showToast(message.message || 'Cập nhật thành công', 'success', 2000);
        break;
      // Không handle các message khác ở đây
      // vì các trang riêng (login, register) đã tự handle
    }

    // Reset message sau khi đã xử lý
    const timer = setTimeout(() => {
      dispatch(resetMessage());
    }, 300);

    return () => clearTimeout(timer);
  }, [message, dispatch]);

  return null; // Không render gì
};

export default AuthToastListener;

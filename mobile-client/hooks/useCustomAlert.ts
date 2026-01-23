import { useState } from 'react';

interface AlertState {
  visible: boolean;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const useCustomAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showAlert = (
    message: string,
    title?: string,
    type: 'success' | 'error' | 'info' | 'warning' | 'confirm' = 'info',
    options?: {
      onConfirm?: () => void;
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    setAlert({
      visible: true,
      message,
      title,
      type,
      onConfirm: options?.onConfirm,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
    });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  return {
    alert,
    showAlert,
    hideAlert,
  };
};
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface FloatingKeyboardContextType {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  // State from focused input
  currentText: string;
  setCurrentText: (v: string) => void;
  fieldLabel: string;
  setFieldLabel: (v: string) => void;
  isSecure: boolean;
  setIsSecure: (v: boolean) => void;
  // Ref to the actual input for focusing/blurring if needed
  focusedInputRef: React.MutableRefObject<any>;
}

const FloatingKeyboardContext = createContext<FloatingKeyboardContextType>({
  enabled: false,
  setEnabled: () => {},
  currentText: '',
  setCurrentText: () => {},
  fieldLabel: '',
  setFieldLabel: () => {},
  isSecure: false,
  setIsSecure: () => {},
  focusedInputRef: { current: null },
});

export const FloatingKeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [isSecure, setIsSecure] = useState(false);
  const focusedInputRef = useRef<any>(null);

  return (
    <FloatingKeyboardContext.Provider value={{ 
      enabled, setEnabled,
      currentText, setCurrentText,
      fieldLabel, setFieldLabel,
      isSecure, setIsSecure,
      focusedInputRef
    }}>
      {children}
    </FloatingKeyboardContext.Provider>
  );
};

/** Hook để page bật/tắt floating keyboard bar */
export const useFloatingKeyboard = () => useContext(FloatingKeyboardContext);

/**
 * Hook tiện ích — drop vào page, tự bật khi mount, tắt khi unmount
 * 
 * Usage:
 *   useEnableFloatingKeyboard();
 */
export const useEnableFloatingKeyboard = () => {
  const { setEnabled } = useFloatingKeyboard();

  React.useEffect(() => {
    setEnabled(true);
    return () => setEnabled(false);
  }, [setEnabled]);
};

import React, { forwardRef, useRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useFloatingKeyboard } from '@/contexts/FloatingKeyboardContext';

/**
 * SyncTextInput
 * 
 * Là một wrapper của TextInput gốc. Nó hoạt động giống hệt TextInput,
 * nhưng tự động đồng bộ giá trị, placeholder và trạng thái focus
 * lên FloatingKeyboardContext để FloatingKeyboardBar có thể đọc được
 * một cách tức thì và chính xác (không cần polling).
 */
const SyncTextInput = forwardRef<TextInput, TextInputProps>((props, ref) => {
  const { 
    setCurrentText, 
    setFieldLabel, 
    setIsSecure, 
    focusedInputRef,
    enabled
  } = useFloatingKeyboard();
  
  const internalRef = useRef<TextInput>(null);

  return (
    <TextInput
      {...props}
      ref={(node) => {
        // Sync ref cho cả ref truyền từ ngoài vào và internal ref
        (internalRef as any).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as any).current = node;
      }}
      onFocus={(e) => {
        if (enabled) {
          focusedInputRef.current = internalRef.current;
          setCurrentText(props.value || '');
          setFieldLabel(props.placeholder || '');
          setIsSecure(!!props.secureTextEntry);
        }
        if (props.onFocus) props.onFocus(e);
      }}
      onChangeText={(text) => {
        if (enabled && focusedInputRef.current === internalRef.current) {
          setCurrentText(text);
        }
        if (props.onChangeText) props.onChangeText(text);
      }}
      onBlur={(e) => {
        if (enabled && focusedInputRef.current === internalRef.current) {
          focusedInputRef.current = null;
          setCurrentText('');
          setFieldLabel('');
        }
        if (props.onBlur) props.onBlur(e);
      }}
    />
  );
});

export default SyncTextInput;

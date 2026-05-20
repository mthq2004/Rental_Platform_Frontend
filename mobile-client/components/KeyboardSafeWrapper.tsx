import React from 'react';
import {
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface KeyboardSafeWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  dismissKeyboardOnTap?: boolean;
}

/**
 * KeyboardSafeWrapper
 *
 * KHÔNG tự scroll đến input khi keyboard mở.
 * FloatingKeyboardBar ở _layout.tsx sẽ hiển thị text đang nhập
 * ngay trên bàn phím để user luôn thấy nội dung đang gõ.
 *
 * Chỉ còn nhiệm vụ:
 * - Bọc nội dung trong ScrollView (nếu scrollable)
 * - Tap outside → dismiss keyboard
 */
const KeyboardSafeWrapper: React.FC<KeyboardSafeWrapperProps> = ({
  children,
  className = '',
  style,
  contentContainerStyle,
  scrollable = true,
  keyboardShouldPersistTaps = 'handled',
  dismissKeyboardOnTap = true,
}) => {
  const content = scrollable ? (
    <ScrollView
      className={`flex-1 ${className}`}
      style={style}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode="interactive"
      contentContainerStyle={contentContainerStyle}
      // Tắt tự scroll khi keyboard mở
      automaticallyAdjustKeyboardInsets={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 ${className}`} style={style}>
      {children}
    </View>
  );

  if (!dismissKeyboardOnTap) return content;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  );
};

export default KeyboardSafeWrapper;

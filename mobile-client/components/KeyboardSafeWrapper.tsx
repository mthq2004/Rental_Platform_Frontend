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
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
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
  contentContainerStyle,
  scrollable = true,
  keyboardShouldPersistTaps = 'handled',
}) => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {scrollable ? (
        <ScrollView
          className={`flex-1 ${className}`}
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
        <View className={`flex-1 ${className}`}>{children}</View>
      )}
    </TouchableWithoutFeedback>
  );
};

export default KeyboardSafeWrapper;

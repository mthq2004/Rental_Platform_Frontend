import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Keyboard,
  Platform,
  StyleSheet,
  Dimensions,
  type KeyboardEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFloatingKeyboard } from '@/contexts/FloatingKeyboardContext';

/**
 * FloatingKeyboardBar
 *
 * Chỉ hiện khi:
 * 1. Page hiện tại đã bật (useEnableFloatingKeyboard())
 * 2. Keyboard đang mở
 * 3. Input đang focus BỊ CHE bởi keyboard (input bottom > keyboard top)
 *
 * Hiển thị:
 * - Label: tên trường đang nhập (từ placeholder)
 * - Text: nội dung đang gõ real-time
 * - Cursor nhấp nháy
 */
const FloatingKeyboardBar = () => {
  const { 
    enabled,
    currentText,
    fieldLabel,
    isSecure: isSecureField,
    focusedInputRef
  } = useFloatingKeyboard();

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  const keyboardVisibleRef = useRef(false);

  // Animations
  const slideY = useSharedValue(80);
  const barOpacity = useSharedValue(0);
  const cursorOpacity = useSharedValue(1);

  // Blinking cursor
  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 530 }),
        withTiming(1, { duration: 530 }),
      ),
      -1,
      false,
    );
  }, []);

  // Update shouldShow when currentText/focusedInput changes
  useEffect(() => {
    if (!enabled || !keyboardVisibleRef.current || !focusedInputRef.current) {
      setShouldShow(false);
      return;
    }

    // Check if the focused input is hidden by the keyboard
    if (typeof focusedInputRef.current.measureInWindow === 'function') {
      focusedInputRef.current.measureInWindow((_x: number, y: number, _w: number, h: number) => {
        const inputBottom = y + h;
        const GAP = 8;
        if (inputBottom + GAP > Dimensions.get('window').height - keyboardHeight) {
          setShouldShow(true);
        } else {
          setShouldShow(false);
        }
      });
    } else {
      setShouldShow(true);
    }
  }, [enabled, keyboardHeight, currentText, focusedInputRef.current]);

  useEffect(() => {
    if (!enabled) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
      keyboardVisibleRef.current = true;
    };

    const onHide = () => {
      keyboardVisibleRef.current = false;
      setShouldShow(false);
      slideY.value = withTiming(80, { duration: 150 });
      barOpacity.value = withTiming(0, { duration: 100 });
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [enabled]);

  // Show/hide animation
  useEffect(() => {
    if (shouldShow && enabled) {
      slideY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
      barOpacity.value = withTiming(1, { duration: 180 });
    } else {
      slideY.value = withTiming(80, { duration: 150 });
      barOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [shouldShow, enabled]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: barOpacity.value,
  }));

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  // Không render gì nếu page chưa bật hoặc không cần show
  if (!enabled || !shouldShow) return null;

  const hasText = currentText.length > 0;
  const displayText = isSecureField && hasText
    ? '•'.repeat(Math.min(currentText.length, 30))
    : currentText;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: keyboardHeight },
        containerStyle,
      ]}
      pointerEvents="none"
    >
      <View style={styles.card}>
        {/* Label — trường đang nhập */}
        {fieldLabel ? (
          <View style={styles.labelRow}>
            <Ionicons name="create-outline" size={13} color="#0077b6" />
            <Text style={styles.labelText} numberOfLines={1}>
              {fieldLabel}
            </Text>
          </View>
        ) : null}

        {/* Input ảo — giống TextInput thật */}
        <View style={styles.inputContainer}>
          {hasText ? (
            <Text style={styles.inputText} numberOfLines={1}>
              {displayText}
            </Text>
          ) : (
            <Text style={styles.placeholderText} numberOfLines={1}>
              {fieldLabel || 'Nhập nội dung...'}
            </Text>
          )}

          {/* Cursor nhấp nháy */}
          <Animated.View style={[styles.cursor, cursorStyle]} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99998,
    paddingHorizontal: 12,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1.2,
    borderColor: '#0077b6',
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 5,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0077b6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 42,
  },
  inputText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '400',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '400',
    flex: 1,
    fontStyle: 'italic',
  },

  cursor: {
    width: 2,
    height: 20,
    backgroundColor: '#0077b6',
    borderRadius: 1,
    marginLeft: 1,
  },
});

export default FloatingKeyboardBar;

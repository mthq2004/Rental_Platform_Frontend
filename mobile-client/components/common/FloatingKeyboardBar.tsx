import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Keyboard,
  Platform,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
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
import { useFloatingKeyboard } from '@/contexts/FloatingKeyboardContext';

/**
 * FloatingKeyboardBar
 * 
 * A professional, enterprise-grade input overlay that appears when the native keyboard
 * obscures the focused input field.
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

    if (typeof focusedInputRef.current.measureInWindow === 'function') {
      focusedInputRef.current.measureInWindow((_x: number, y: number, _w: number, h: number) => {
        const inputBottom = y + h;
        const GAP = 20; // Increased gap for comfort
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

  useEffect(() => {
    if (shouldShow && enabled) {
      slideY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.back(0.5)) });
      barOpacity.value = withTiming(1, { duration: 200 });
    } else {
      slideY.value = withTiming(80, { duration: 150 });
      barOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [shouldShow, enabled]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: barOpacity.value,
  }));

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  if (!enabled || !shouldShow) return null;

  const hasText = currentText.length > 0;
  const displayText = isSecureField && hasText
    ? '•'.repeat(Math.min(currentText.length, 30))
    : currentText;

  const handleDone = () => {
    Keyboard.dismiss();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: keyboardHeight },
        containerStyle,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.labelText} numberOfLines={1}>
            {fieldLabel || 'Đang nhập...'}
          </Text>
          <TouchableOpacity 
            onPress={handleDone} 
            activeOpacity={0.7}
            style={styles.doneButton}
          >
            <Text style={styles.doneText}>Xong</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputArea}>
          <View style={styles.textWrapper}>
            {hasText ? (
              <Text style={styles.inputText} numberOfLines={1}>
                {displayText}
              </Text>
            ) : (
              <Text style={styles.placeholderText} numberOfLines={1}>
                Bắt đầu nhập...
              </Text>
            )}
            <Animated.View style={[styles.cursor, cursorStyle]} />
          </View>
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
    zIndex: 99999,
    paddingHorizontal: 0, // Edge-to-edge for cleaner look
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
    marginRight: 10,
  },
  doneButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  doneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb', // Professional enterprise blue
  },
  inputArea: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    flexShrink: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '400',
    flexShrink: 1,
  },
  cursor: {
    width: 2,
    height: 20,
    backgroundColor: '#2563eb',
    borderRadius: 1,
    marginLeft: 2,
  },
});

export default FloatingKeyboardBar;

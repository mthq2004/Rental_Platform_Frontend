import React, { useCallback, useEffect, useRef } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  View,
  type KeyboardEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardSafeWrapperProps {
  children: React.ReactNode;
  className?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  keyboardVerticalOffset?: number;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  smartScroll?: boolean;
}

const KeyboardSafeWrapper: React.FC<KeyboardSafeWrapperProps> = ({
  children,
  className = '',
  contentContainerStyle,
  scrollable = true,
  keyboardVerticalOffset,
  keyboardShouldPersistTaps = 'handled',
  smartScroll = true,
}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const currentScrollY = useRef(0);
  const keyboardTopRef = useRef<number>(Dimensions.get('window').height);
  const keyboardVisibleRef = useRef(false);
  const lastFocusedRef = useRef<any>(null);

  const offset =
    keyboardVerticalOffset ?? (Platform.OS === 'ios' ? insets.top + 8 : 0);

  const maybeScrollToFocusedInput = useCallback(
    (keyboardTop: number) => {
      if (!scrollable || !smartScroll) return;

      const focusedInput = TextInput.State.currentlyFocusedInput?.() as {
        measureInWindow?: (
          callback: (x: number, y: number, width: number, height: number) => void
        ) => void;
      } | null;

      if (!focusedInput?.measureInWindow) return;

      focusedInput.measureInWindow((_, y, __, height) => {
        const inputBottom = y + height;
        const safeGap = 12;
        const overlap = inputBottom + safeGap - keyboardTop;

        if (overlap <= 0) return;

        scrollRef.current?.scrollTo({
          y: Math.max(currentScrollY.current + overlap, 0),
          animated: true,
        });
      });
    },
    [scrollable, smartScroll]
  );

  useEffect(() => {
    if (!scrollable || !smartScroll) return;

    const onKeyboardShow = (event: KeyboardEvent) => {
      keyboardVisibleRef.current = true;
      keyboardTopRef.current =
        event.endCoordinates?.screenY ??
        Dimensions.get('window').height - (event.endCoordinates?.height ?? 0);
      requestAnimationFrame(() => maybeScrollToFocusedInput(keyboardTopRef.current));
    };

    const onKeyboardHide = () => {
      keyboardVisibleRef.current = false;
      keyboardTopRef.current = Dimensions.get('window').height;
      lastFocusedRef.current = null;
    };

    const showSub = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    const frameSub = Keyboard.addListener('keyboardDidChangeFrame', onKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onKeyboardHide);

    const focusWatcher = setInterval(() => {
      if (!keyboardVisibleRef.current) return;

      const focusedInput = TextInput.State.currentlyFocusedInput?.();
      if (!focusedInput || focusedInput === lastFocusedRef.current) return;

      lastFocusedRef.current = focusedInput;
      requestAnimationFrame(() => maybeScrollToFocusedInput(keyboardTopRef.current));
    }, 120);

    return () => {
      showSub.remove();
      frameSub.remove();
      hideSub.remove();
      clearInterval(focusWatcher);
    };
  }, [maybeScrollToFocusedInput, scrollable, smartScroll]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    currentScrollY.current = event.nativeEvent.contentOffset.y;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
      className={`flex-1 ${className}`}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {scrollable ? (
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            keyboardDismissMode="interactive"
            contentContainerStyle={contentContainerStyle}
            scrollEventThrottle={16}
            onScroll={handleScroll}
          >
            {children}
          </ScrollView>
        ) : (
          <View className="flex-1">{children}</View>
        )}
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default KeyboardSafeWrapper;

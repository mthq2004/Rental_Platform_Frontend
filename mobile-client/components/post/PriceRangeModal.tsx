import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  LayoutChangeEvent,
  Animated,
} from "react-native";
import { X } from "lucide-react-native";

interface PriceRangeModalProps {
  visible: boolean;
  minPrice?: number;
  maxPrice?: number;
  onClose: () => void;
  onApply: (min: number, max: number) => void;
}

const MAX_PRICE = 100000000;
const STEP = 50000;
const THUMB = 24;

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));

const PriceRangeModal: React.FC<PriceRangeModalProps> = ({
  visible,
  minPrice = 0,
  maxPrice = MAX_PRICE,
  onClose,
  onApply,
}) => {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  const [width, setWidth] = useState(0);

  const startMinX = useRef(0);
  const startMaxX = useRef(0);
  const minScale = useRef(new Animated.Value(1)).current;
  const maxScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setMin(minPrice);
      setMax(maxPrice);
    }
  }, [visible]);

  const priceToX = (price: number) => (price / MAX_PRICE) * width;
  const xToPrice = (x: number) => (x / width) * MAX_PRICE;

  const minX = priceToX(min);
  const maxX = priceToX(max);

  const minResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        startMinX.current = priceToX(min);
        Animated.timing(minScale, {
          toValue: 1.15,
          duration: 120,
          useNativeDriver: true,
        }).start();
      },

      onPanResponderMove: (_, g) => {
        let newX = startMinX.current + g.dx;

        newX = clamp(newX, 0, priceToX(max));

        const price = xToPrice(newX);

        if (price <= max) setMin(clamp(Math.round(price), 0, max));
      },

      onPanResponderRelease: () => {
        setMin((prev) => Math.round(prev / STEP) * STEP);
        Animated.timing(minScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      },

      onPanResponderTerminate: () => {
        Animated.timing(minScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const maxResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        startMaxX.current = priceToX(max);
        Animated.timing(maxScale, {
          toValue: 1.15,
          duration: 120,
          useNativeDriver: true,
        }).start();
      },

      onPanResponderMove: (_, g) => {
        let newX = startMaxX.current + g.dx;

        newX = clamp(newX, priceToX(min), width);

        const price = xToPrice(newX);

        if (price >= min) setMax(clamp(Math.round(price), min, MAX_PRICE));
      },

      onPanResponderRelease: () => {
        setMax((prev) => Math.round(prev / STEP) * STEP);
        Animated.timing(maxScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      },

      onPanResponderTerminate: () => {
        Animated.timing(maxScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const handleTrackPress = (x: number) => {
    if (width <= 0) return;

    const clampedX = clamp(x, 0, width);
    const price = clamp(Math.round(xToPrice(clampedX)), 0, MAX_PRICE);

    if (Math.abs(clampedX - minX) <= Math.abs(clampedX - maxX)) {
      setMin(clamp(price, 0, max));
      return;
    }

    setMax(clamp(price, min, MAX_PRICE));
  };

  const handleApply = () => {
    onApply(min, max);
    onClose();
  };

  const handleReset = () => {
    setMin(0);
    setMax(MAX_PRICE);
  };

  const format = (v: number) => {
    if (v >= 1000000) return `${v / 1000000} triệu`;
    return `${v / 1000}k`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <Pressable className="bg-white dark:bg-secondary-dark rounded-t-3xl p-6">

            {/* HEADER */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900 dark:text-foreground-dark">Chọn khoảng giá</Text>

              <TouchableOpacity onPress={onClose}>
                <X size={26} />
              </TouchableOpacity>
            </View>

            {/* SLIDER */}
            <View className="flex-row items-center gap-3 mb-8">

              <Text className="text-xs w-14 text-gray-700 dark:text-gray-300">0đ</Text>

              <Pressable
                className="flex-1 h-10 justify-center"
                onLayout={onLayout}
                onPress={(event) => handleTrackPress(event.nativeEvent.locationX)}
              >

                <View className="absolute h-2 bg-gray-200 dark:bg-gray-700 w-full rounded-full" />

                <View
                  className="absolute h-2 bg-amber-500 rounded-full"
                  style={{
                    left: minX,
                    width: maxX - minX,
                  }}
                />

                {/* MIN THUMB */}
                <Animated.View
                  {...minResponder.panHandlers}
                  style={{
                    position: "absolute",
                    left: minX - THUMB / 2,
                    transform: [{ scale: minScale }],
                  }}
                >
                  <View
                    style={{
                      width: THUMB,
                      height: THUMB,
                      borderRadius: 20,
                      backgroundColor: "#F59E0B",
                      borderWidth: 3,
                      borderColor: "#fff",
                      elevation: 4,
                    }}
                  />
                </Animated.View>

                {/* MAX THUMB */}
                <Animated.View
                  {...maxResponder.panHandlers}
                  style={{
                    position: "absolute",
                    left: maxX - THUMB / 2,
                    transform: [{ scale: maxScale }],
                  }}
                >
                  <View
                    style={{
                      width: THUMB,
                      height: THUMB,
                      borderRadius: 20,
                      backgroundColor: "#F59E0B",
                      borderWidth: 3,
                      borderColor: "#fff",
                      elevation: 4,
                    }}
                  />
                </Animated.View>
              </Pressable>

              <Text className="text-xs w-16 text-right text-gray-700 dark:text-gray-300">
                {format(MAX_PRICE)}
              </Text>
            </View>

            {/* INPUTS */}
            <View className="flex-row gap-3 mb-6">

              <View className="flex-1">
                <Text className="text-gray-500 dark:text-gray-400 mb-1">Tối thiểu</Text>

                <TextInput
                  value={min.toString()}
                  keyboardType="numeric"
                  onChangeText={(t) => {
                    const v = Number(t) || 0;
                    setMin(clamp(v, 0, max));
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100"
                />
              </View>

              <View className="flex-1">
                <Text className="text-gray-500 dark:text-gray-400 mb-1">Tối đa</Text>

                <TextInput
                  value={max.toString()}
                  keyboardType="numeric"
                  onChangeText={(t) => {
                    const v = Number(t) || 0;
                    setMax(clamp(v, min, MAX_PRICE));
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100"
                />
              </View>
            </View>

            {/* BUTTONS */}
            <View className="flex-row gap-3">

              <TouchableOpacity
                onPress={handleReset}
                className="flex-1 border border-gray-300 dark:border-gray-600 py-3 rounded-xl items-center"
              >
                <Text className="text-gray-700 dark:text-gray-200">Xóa lọc</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApply}
                className="flex-1 bg-amber-500 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">
                  Áp dụng
                </Text>
              </TouchableOpacity>

            </View>

          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

export default PriceRangeModal;
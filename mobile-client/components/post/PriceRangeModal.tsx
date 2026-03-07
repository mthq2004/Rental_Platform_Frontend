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
const STEP = 100000;
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

  useEffect(() => {
    if (visible) {
      setMin(minPrice);
      setMax(maxPrice);
    }
  }, [visible]);

  const priceToX = (price: number) => (price / MAX_PRICE) * width;
  const xToPrice = (x: number) =>
    Math.round((x / width) * MAX_PRICE / STEP) * STEP;

  const minX = priceToX(min);
  const maxX = priceToX(max);

  const minResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        startMinX.current = priceToX(min);
      },

      onPanResponderMove: (_, g) => {
        let newX = startMinX.current + g.dx;

        newX = clamp(newX, 0, priceToX(max));

        const price = xToPrice(newX);

        if (price <= max) setMin(price);
      },
    })
  ).current;

  const maxResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        startMaxX.current = priceToX(max);
      },

      onPanResponderMove: (_, g) => {
        let newX = startMaxX.current + g.dx;

        newX = clamp(newX, priceToX(min), width);

        const price = xToPrice(newX);

        if (price >= min) setMax(price);
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
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
          <Pressable className="bg-white rounded-t-3xl p-6">

            {/* HEADER */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold">Chọn khoảng giá</Text>

              <TouchableOpacity onPress={onClose}>
                <X size={26} />
              </TouchableOpacity>
            </View>

            {/* SLIDER */}
            <View className="flex-row items-center gap-3 mb-8">

              <Text className="text-xs w-14">0đ</Text>

              <View className="flex-1 h-10 justify-center" onLayout={onLayout}>

                <View className="absolute h-2 bg-gray-200 w-full rounded-full" />

                <View
                  className="absolute h-2 bg-amber-500 rounded-full"
                  style={{
                    left: minX,
                    width: maxX - minX,
                  }}
                />

                {/* MIN THUMB */}
                <View
                  {...minResponder.panHandlers}
                  style={{
                    position: "absolute",
                    left: minX - THUMB / 2,
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
                </View>

                {/* MAX THUMB */}
                <View
                  {...maxResponder.panHandlers}
                  style={{
                    position: "absolute",
                    left: maxX - THUMB / 2,
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
                </View>
              </View>

              <Text className="text-xs w-16 text-right">
                {format(MAX_PRICE)}
              </Text>
            </View>

            {/* INPUTS */}
            <View className="flex-row gap-3 mb-6">

              <View className="flex-1">
                <Text className="text-gray-500 mb-1">Tối thiểu</Text>

                <TextInput
                  value={min.toString()}
                  keyboardType="numeric"
                  onChangeText={(t) => {
                    const v = Number(t) || 0;
                    setMin(clamp(v, 0, max));
                  }}
                  className="border rounded-xl px-4 py-3"
                />
              </View>

              <View className="flex-1">
                <Text className="text-gray-500 mb-1">Tối đa</Text>

                <TextInput
                  value={max.toString()}
                  keyboardType="numeric"
                  onChangeText={(t) => {
                    const v = Number(t) || 0;
                    setMax(clamp(v, min, MAX_PRICE));
                  }}
                  className="border rounded-xl px-4 py-3"
                />
              </View>
            </View>

            {/* BUTTONS */}
            <View className="flex-row gap-3">

              <TouchableOpacity
                onPress={handleReset}
                className="flex-1 border border-gray-300 py-3 rounded-xl items-center"
              >
                <Text>Xóa lọc</Text>
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
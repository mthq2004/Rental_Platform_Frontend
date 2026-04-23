import React, { useState, useEffect, useRef, useMemo } from "react";
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
const THUMB = 28;

const formatWithCommas = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parseFromCommas = (s: string) => Number(s.replace(/,/g, "")) || 0;

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

  // Animated values để điều khiển vị trí nút
  const minAnim = useRef(new Animated.Value(0)).current;
  const maxAnim = useRef(new Animated.Value(0)).current;
  
  const minScale = useRef(new Animated.Value(1)).current;
  const maxScale = useRef(new Animated.Value(1)).current;

  // Refs để theo dõi giá trị thực tế mà không gây re-render
  const minRef = useRef(minPrice);
  const maxRef = useRef(maxPrice);
  const widthRef = useRef(0);

  // Cập nhật vị trí nút khi width hoặc giá trị đầu vào thay đổi
  useEffect(() => {
    if (width > 0) {
      minAnim.setValue((min / MAX_PRICE) * width);
      maxAnim.setValue((max / MAX_PRICE) * width);
      minRef.current = min;
      maxRef.current = max;
    }
  }, [min, max, width]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    widthRef.current = w;
  };

  // RESPONDER CHO NÚT MIN
  const minResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      minScale.setValue(1.2);
    },
    onPanResponderMove: (_, gesture) => {
      if (widthRef.current === 0) return;
      
      // Tính toán vị trí X mới dựa trên vị trí cũ + độ dời dx
      const startX = (minRef.current / MAX_PRICE) * widthRef.current;
      let newX = startX + gesture.dx;
      
      // Giới hạn trong khoảng [0, vị trí nút Max]
      const maxXPos = (maxRef.current / MAX_PRICE) * widthRef.current;
      newX = Math.max(0, Math.min(newX, maxXPos - 10));

      const newPrice = Math.round(((newX / widthRef.current) * MAX_PRICE) / STEP) * STEP;
      setMin(newPrice);
      minAnim.setValue(newX);
    },
    onPanResponderRelease: () => {
      minRef.current = min;
      minScale.setValue(1);
    },
  }), [min, max, width]);

  // RESPONDER CHO NÚT MAX
  const maxResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      maxScale.setValue(1.2);
    },
    onPanResponderMove: (_, gesture) => {
      if (widthRef.current === 0) return;

      const startX = (maxRef.current / MAX_PRICE) * widthRef.current;
      let newX = startX + gesture.dx;
      
      const minXPos = (minRef.current / MAX_PRICE) * widthRef.current;
      newX = Math.max(minXPos + 10, Math.min(newX, widthRef.current));

      const newPrice = Math.round(((newX / widthRef.current) * MAX_PRICE) / STEP) * STEP;
      setMax(newPrice);
      maxAnim.setValue(newX);
    },
    onPanResponderRelease: () => {
      maxRef.current = max;
      maxScale.setValue(1);
    },
  }), [min, max, width]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 pb-10">
            
            <View className="flex-row justify-between items-center mb-10">
              <Text className="text-xl font-bold dark:text-white">Khoảng giá</Text>
              <TouchableOpacity onPress={onClose} hitSlop={20}>
                <X size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {/* AREA SLIDER */}
            <View className="px-4 mb-12 h-10 justify-center">
              {/* Thanh nền (Track) */}
              <View 
                onLayout={onLayout} 
                className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full w-full relative"
              >
                
                {/* Dải màu cam nối giữa 2 nút */}
                <Animated.View
                  style={{
                    position: "absolute",
                    height: "100%", 
                    backgroundColor: "#f59e0b", // amber-500
                    borderRadius: 999,
                    left: minAnim,
                    width: Animated.subtract(maxAnim, minAnim),
                  }}
                />

                {/* NÚT MIN */}
                <Animated.View
                  {...minResponder.panHandlers}
                  style={{
                    position: "absolute",
                    // Căn giữa nút theo chiều dọc của thanh
                    top: -THUMB / 2 + 3, // 3 là nửa độ cao của thanh track (1.5 * 2)
                    left: -THUMB / 2, 
                    transform: [{ translateX: minAnim }, { scale: minScale }],
                    zIndex: 30,
                  }}
                >
                  <View 
                    style={{ 
                      width: THUMB, 
                      height: THUMB,
                      borderRadius: THUMB / 2,
                      backgroundColor: 'white',
                      borderWidth: 3,
                      borderColor: '#f59e0b',
                      // Đổ bóng cho nút nổi lên
                      ...Platform.select({
                        ios: {
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                        },
                        android: { elevation: 3 }
                      })
                    }}
                  />
                </Animated.View>

                {/* NÚT MAX */}
                <Animated.View
                  {...maxResponder.panHandlers}
                  style={{
                    position: "absolute",
                    top: -THUMB / 2 + 3,
                    left: -THUMB / 2,
                    transform: [{ translateX: maxAnim }, { scale: maxScale }],
                    zIndex: 30,
                  }}
                >
                  <View 
                    style={{ 
                      width: THUMB, 
                      height: THUMB,
                      borderRadius: THUMB / 2,
                      backgroundColor: 'white',
                      borderWidth: 3,
                      borderColor: '#f59e0b',
                      ...Platform.select({
                        ios: {
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                        },
                        android: { elevation: 3 }
                      })
                    }}
                  />
                </Animated.View>
              </View>
            </View>

            {/* Ô NHẬP LIỆU */}
            <View className="flex-row gap-4 mb-8">
              <View className="flex-1">
                <Text className="text-[11px] font-medium text-gray-400 uppercase mb-2 ml-1">Giá thấp nhất</Text>
                <View className="bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl px-4 py-1 flex-row items-center">
                  <TextInput
                    value={formatWithCommas(min)}
                    keyboardType="numeric"
                    onChangeText={(t) => setMin(parseFromCommas(t))}
                    className="flex-1 h-11 font-bold text-gray-900 dark:text-white text-lg"
                  />
                  <Text className="text-gray-400 font-bold ml-1">đ</Text>
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-[11px] font-medium text-gray-400 uppercase mb-2 ml-1">Giá cao nhất</Text>
                <View className="bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl px-4 py-1 flex-row items-center">
                  <TextInput
                    value={formatWithCommas(max)}
                    keyboardType="numeric"
                    onChangeText={(t) => setMax(parseFromCommas(t))}
                    className="flex-1 h-11 font-bold text-gray-900 dark:text-white text-lg"
                  />
                  <Text className="text-gray-400 font-bold ml-1">đ</Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => { setMin(0); setMax(MAX_PRICE); }}
                className="flex-1 py-4 rounded-2xl border border-gray-200 dark:border-zinc-700 items-center"
              >
                <Text className="text-gray-600 dark:text-gray-300 font-semibold">Xóa lọc</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { onApply(min, max); onClose(); }}
                className="flex-1 py-4 rounded-2xl bg-amber-500 items-center shadow-lg shadow-amber-500/30"
              >
                <Text className="text-white font-bold text-base">Áp dụng</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default PriceRangeModal;
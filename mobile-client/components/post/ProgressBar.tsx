import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Animated, Text, View } from "react-native";

const STEP_INFO = [
    { icon: 'home-outline', label: 'Cơ bản' },
    { icon: 'location-outline', label: 'Vị trí' },
    { icon: 'grid-outline', label: 'Chi tiết' },
    { icon: 'image-outline', label: 'Hình ảnh' },
    { icon: 'star-outline', label: 'Tiện ích' },
];

const ProgressBar = ({ step, progressAnim }: { step: number, progressAnim: Animated.Value }) => {
    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View className="bg-white px-4 py-4">
            <View className="flex-row items-center justify-between mb-3">
                {STEP_INFO.map((info, idx) => {
                    const stepNum = idx + 1;
                    const isActive = stepNum === step;
                    const isCompleted = stepNum < step;

                    return (
                        <View key={idx} className="items-center flex-1">
                            <View
                                className={`w-10 h-10 rounded-full items-center justify-center mb-1 ${isCompleted
                                        ? 'bg-green-500'
                                        : isActive
                                            ? 'bg-blue-500'
                                            : 'bg-gray-200'
                                    }`}
                            >
                                {isCompleted ? (
                                    <Ionicons name="checkmark" size={20} color="#fff" />
                                ) : (
                                    <Ionicons
                                        name={info.icon as any}
                                        size={20}
                                        color={isActive ? '#fff' : '#9CA3AF'}
                                    />
                                )}
                            </View>
                            <Text
                                className={`text-xs font-medium ${isActive ? 'text-blue-500' : 'text-gray-400'
                                    }`}
                            >
                                {info.label}
                            </Text>
                        </View>
                    );
                })}
            </View>
            <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <Animated.View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: progressWidth }}
                />
            </View>
        </View>
    );
};


export default ProgressBar;
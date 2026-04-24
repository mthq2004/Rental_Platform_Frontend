import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Images } from "@/assets/images";
import { router } from "expo-router";
import { useAppSelector } from "@/store/hook";
import { selectUnreadCount } from "@/store/slices/notification.slice";

const HeaderBanner: React.FC = () => {
    const unreadCount = useAppSelector(selectUnreadCount);
    const user = useAppSelector((state) => state.auth.user);
    const userName = user?.fullName || "Bạn";
    const handleFavorite = () => {
        console.log('Danh sách yêu thích');
    };

    const handleNotification = () => {
        router.push("/(notification)")
    };

    return (
        <View className="bg-primary pt-16 rounded-b-3xl">
            <View className="px-5 pb-20 flex-row justify-between items-start">
                <View className="flex-1">
                    <Text className="text-3xl font-bold text-white mb-1">
                        Bất động sản
                    </Text>
                    <Text className="text-sm text-white opacity-90 mb-4">
                        Mua thì hời, bán thì lời
                    </Text>
                    <Text className="text-lg text-white opacity-90 mb-4">
                        Xin chào, <Text className="font-semibold">{userName}</Text>
                    </Text>
                </View>
                <View className="w-32 items-end justify-end">
                    <View className="flex-row justify-end items-center px-4">
                        <View className="flex-row gap-1">
                            <TouchableOpacity onPress={handleFavorite} className="p-2">
                                <Ionicons
                                    name="heart-outline"
                                    size={24}
                                    color="#ffffff"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleNotification} className="p-2 relative">
                                <Ionicons
                                    name="notifications-outline"
                                    size={24}
                                    color="#ffffff"
                                />
                                {unreadCount > 0 && (
                                    <View className="absolute top-1 right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                                        <Text className="text-white text-xs font-bold">
                                            {unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Image
                        source={Images.home}
                        resizeMode="contain"
                        className="w-28 h-28"
                    />
                </View>
            </View>
        </View>
    );
};

export default HeaderBanner;
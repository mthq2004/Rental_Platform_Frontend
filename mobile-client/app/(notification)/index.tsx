import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getNotification, markAsRead, selectUnreadCount } from '@/store/slices/notification.slice';

const NotificationScreen = () => {
  const router = useRouter();
  const unreadCount = useAppSelector(selectUnreadCount);
  const { notifications } = useAppSelector(
    state => state.notification
  );
  const dispatch = useAppDispatch()

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');

  // Format thời gian
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const min = Math.floor(diff / 60000);
    const hour = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);

    if (min < 1) return 'Vừa xong';
    if (min < 60) return `${min} phút trước`;
    if (hour < 24) return `${hour} giờ trước`;
    if (day < 7) return `${day} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  };

  const getStyle = (type: string) => {
    switch (type) {
      case 'PROPERTY_UPDATE':
        return {
          icon: 'home-outline',
          color: '#2563EB',
          bg: 'bg-blue-100',
        };
      case 'PROMOTION':
        return {
          icon: 'pricetag-outline',
          color: '#10B981',
          bg: 'bg-green-100',
        };
      case 'SYSTEM':
        return {
          icon: 'settings-outline',
          color: '#6B7280',
          bg: 'bg-gray-200',
        };
      default:
        return {
          icon: 'notifications-outline',
          color: '#8B5CF6',
          bg: 'bg-purple-100',
        };
    }
  };

  if (!notifications || notifications.length === 0) {
    return (
      <View className="flex-1 bg-gray-100 items-center justify-center px-6">
        <View className="bg-white w-full rounded-3xl p-10 items-center shadow-md">
          <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-6">
            <Ionicons
              name="notifications-outline"
              size={42}
              color="#2563EB"
            />
          </View>

          <Text className="text-xl font-bold text-gray-900 mb-2">
            Chưa có thông báo
          </Text>

          <Text className="text-gray-500 text-center mb-8">
            Mọi cập nhật mới sẽ được hiển thị tại đây
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-500 px-8 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">
              Quay về
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleClickNotification = (id: string, isRead: boolean) => {
    if (isRead) return;
    dispatch(markAsRead(id));
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(getNotification())
    }, [])
  );


  const filteredNotification =
    activeTab === 'ALL'
      ? notifications
      : notifications.filter((n: any) => !n.isRead);

  const renderItem = ({ item }: any) => {
    const style = getStyle(item.type)

    return (
      <TouchableOpacity
        onPress={() => handleClickNotification(item.id, item.isRead)}
        activeOpacity={0.85}
        className={`bg-white mx-4 mb-3 rounded-2xl p-4 shadow-sm ${!item.isRead ? 'border-l-4 border-blue-500' : ''
          }`}
      >
        <View className="flex-row">
          <View
            className={`w-12 h-12 rounded-full ${style.bg} items-center justify-center mr-4`}
          >
            <Ionicons
              name={style.icon as any}
              size={22}
              color={style.color}
            />
          </View>

          <View className="flex-1">
            <View className="flex-row justify-between mb-1">
              <Text className="text-base font-semibold text-gray-900">
                {item.title}
              </Text>
              {!item.isRead && (
                <View className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </View>

            <Text className="text-gray-600 text-sm mb-2">
              {item.body}
            </Text>

            <View className="flex-row items-center">
              <Ionicons
                name="time-outline"
                size={14}
                color="#9CA3AF"
              />
              <Text className="text-xs text-gray-400 ml-1">
                {formatTime(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      <View className="bg-white px-4 pt-14 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} />
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900">
            Thông báo
          </Text>

          {unreadCount > 0 ? (
            <View className="bg-blue-500 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-semibold">
                {unreadCount} mới
              </Text>
            </View>
          ) : (
            <View className="w-10" />
          )}
        </View>
      </View>

      <View className="flex-row px-4 py-3">
        <TouchableOpacity
          onPress={() => setActiveTab('ALL')}
          className={`flex-1 mr-2 py-3 rounded-xl items-center ${activeTab === 'ALL'
            ? 'bg-blue-500'
            : 'bg-white'
            }`}
        >
          <Text
            className={`font-semibold ${activeTab === 'ALL'
              ? 'text-white'
              : 'text-gray-700'
              }`}
          >
            Tất cả
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('UNREAD')}
          className={`flex-1 ml-2 py-3 rounded-xl items-center ${activeTab === 'UNREAD'
            ? 'bg-blue-500'
            : 'bg-white'
            }`}
        >
          <Text
            className={`font-semibold ${activeTab === 'UNREAD'
              ? 'text-white'
              : 'text-gray-700'
              }`}
          >
            Chưa đọc {unreadCount > 0 ? `(${unreadCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotification}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default NotificationScreen;

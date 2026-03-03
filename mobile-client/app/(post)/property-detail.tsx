import { View, ScrollView, StatusBar, Alert, RefreshControl, Text, Linking } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import { useThemeColors } from '@/utils/colors'
import AuthGuard from '@/components/AuthGuard'
import { router } from 'expo-router'
import { MediaGallery, MediaItem } from '@/components/detail/MediaGallery'
import { TabBar, TabKey } from '@/components/detail/TabBar'
import { VideoPlayerModal } from '@/components/detail/VideoPlayerModal'
import { PropertyInfoTab } from '@/components/detail/PropertyInfoTab'
import { MediaManagementTab } from '@/components/detail/MediaManagementTab'
import { PropertyActions } from '@/components/detail/PropertyActions'
import { Schedule, ScheduleTab } from '@/components/detail/ScheduleTab'
import { useLocalSearchParams } from 'expo-router'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { getPropertyDetail } from '@/store/slices/property.slice'
import {
  getMyBookings,
  getOwnerBookings,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  clearMessage,
} from '@/store/slices/booking.slice'
import Toast from 'react-native-toast-message'
import { createConversation } from '@/store/slices/conversation.slice'

const PropertyDetail = () => {
  const colorScheme = useColorScheme()
  const colors = useThemeColors()
  const isDark = colorScheme === 'dark'
  const { id: propertyId } = useLocalSearchParams()

  const dispatch = useAppDispatch()
  const { loading: propertyLoading, propertyDetail } = useAppSelector(state => state.property)
  const { myBookings, ownerBookings, loading: bookingLoading, message } = useAppSelector(state => state.booking)
  const { user } = useAppSelector(state => state.auth)

  const isOwner = propertyDetail?.landlordId === user?.id

  const [activeTab, setActiveTab] = useState<TabKey>('info')

  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  const mediaGallery: MediaItem[] = [
    { id: 1, type: 'image', uri: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200', title: 'Phòng khách' },
    { id: 2, type: 'image', uri: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200', title: 'Phòng ngủ' },
    {
      id: 3,
      type: 'video',
      uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200',
      duration: '2:34',
      title: 'Video tour căn hộ'
    },
    { id: 4, type: 'image', uri: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1200', title: 'Nhà bếp' },
    {
      id: 5,
      type: 'video',
      uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200',
      duration: '1:45',
      title: 'Video tổng quan'
    }
  ]

  const propertyInfo = {
    title: 'Phòng trọ Quận 7 – Gần Lotte',
    price: '4.500.000 đ / tháng',
    location: 'Quận 7, TP.HCM',
    description: 'Phòng sạch sẽ, giờ giấc tự do, gần trung tâm thương mại. An ninh tốt, khu vực yên tĩnh, thuận tiện di chuyển.',
    amenities: [
      { icon: 'bed-outline', label: '2 Phòng ngủ' },
      { icon: 'water-outline', label: 'WC riêng' },
      { icon: 'wifi', label: 'Wifi' },
      { icon: 'snow-outline', label: 'Điều hòa' },
    ],
    owner: {
      name: 'Nguyễn Văn B',
      phone: '0901234567',
      avatar: 'https://via.placeholder.com/50',
      rating: 4.8,
      reviewCount: 24
    },
    stats: {
      views: 124,
      bookings: 8,
      interests: 3
    },
    similarProperties: [
      { id: 1, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', title: 'Phòng trọ Quận 1', price: '3.500.000 đ' },
      { id: 2, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', title: 'Phòng trọ Quận 3', price: '4.000.000 đ' },
      { id: 3, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', title: 'Phòng trọ Bình Thạnh', price: '3.800.000 đ' },
    ]
  }

  const transformBookingToSchedule = (booking: any): Schedule => {
    const visitDate = new Date(booking.visitDate)
    const startTime = booking.visitTimeStart
    const endTime = booking.visitTimeEnd

    const formattedDate = visitDate.toLocaleDateString('vi-VN')
    const formattedTime = endTime ? `${startTime} - ${endTime}` : startTime

    return {
      id: booking.bookingId,
      status: booking.status,
      name: isOwner
        ? booking.tenant?.fullName || 'Khách hàng'
        : booking.landlord?.fullName || 'Chủ nhà',
      date: formattedDate,
      time: formattedTime,
      phone: isOwner ? booking.tenantPhone : undefined,
      propertyTitle: booking.property?.title,
      propertyAddress: booking.property?.address,
      tenantNote: booking.tenantNote,
      landlordNote: booking.landlordNote,
    }
  }

  const schedules: Schedule[] = React.useMemo(() => {
    const bookings = isOwner ? ownerBookings : myBookings
    return bookings
      .filter((b: any) => b.propertyId === propertyId)
      .map(transformBookingToSchedule)
  }, [isOwner, ownerBookings, myBookings, propertyId])

  const mockImages = [
    { id: 1, uri: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', type: 'image' as const },
    { id: 2, uri: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400', type: 'image' as const },
    { id: 3, uri: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400', type: 'image' as const },
    { id: 4, uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', type: 'image' as const },
  ]

  const mockVideos = [
    {
      id: 1,
      uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=400',
      type: 'video' as const,
      duration: '2:34'
    },
    {
      id: 2,
      uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
      type: 'video' as const,
      duration: '1:45'
    },
  ]

  const tabs = [
    { key: 'info' as TabKey, label: 'Thông tin' },
    { key: 'schedule' as TabKey, label: 'Lịch xem' },
    ...(isOwner ? [{ key: 'media' as TabKey, label: 'Media' }] : [])
  ]

  useEffect(() => {
    if (propertyId) {
      dispatch(getPropertyDetail(propertyId as string))
    }
  }, [propertyId, dispatch])

  useEffect(() => {
    if (propertyId) {
      loadBookings()
    }
  }, [isOwner, propertyId])

  // Handle booking messages
  useEffect(() => {
    if (message) {
      Toast.show({
        type: message.type,
        text1: message.type === 'success' ? 'Thành công' : 'Lỗi',
        text2: message.message,
        position: 'top',
        visibilityTime: 3000,
      })
      dispatch(clearMessage())

      // Reload bookings after successful action
      if (message.type === 'success') {
        setTimeout(() => {
          loadBookings()
        }, 500)
      }
    }
  }, [message])

  const loadBookings = () => {
    if (isOwner) {
      dispatch(getOwnerBookings(propertyId as string))
    } else {
      dispatch(getMyBookings())
    }
  }

  const handlePlayVideo = (video: MediaItem) => {
    setSelectedVideo(video)
    setShowVideoModal(true)
  }

  const handleCloseVideo = () => {
    setShowVideoModal(false)
    setSelectedVideo(null)
  }

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsFavorite(!isFavorite)
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật yêu thích')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        dispatch(getPropertyDetail(propertyId as string)).unwrap(),
        loadBookings()
      ])
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải lại dữ liệu')
    } finally {
      setRefreshing(false)
    }
  }

  const handleShare = async () => {
    try {
      // TODO: Implement share functionality
      Alert.alert('Chia sẻ', `Link: https://yourapp.com/property/${propertyId}`)
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleEdit = () => {
    // router.push(`/(post)/edit/${propertyId}`)
  }

  const handleConfirmSchedule = (bookingId: string) => {
    Alert.alert(
      'Xác nhận lịch hẹn',
      'Bạn có chắc muốn xác nhận lịch hẹn này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => {
            dispatch(confirmBooking({ bookingId }))
          },
        },
      ]
    )
  }

  const handleRejectSchedule = (bookingId: string) => {
    Alert.prompt(
      'Từ chối lịch hẹn',
      'Vui lòng nhập lý do từ chối (không bắt buộc)',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: (reason: any) => {
            dispatch(rejectBooking({ bookingId, reason }))
          },
        },
      ],
      'plain-text'
    )
  }

  const handleCancelSchedule = (bookingId: string) => {
    Alert.prompt(
      'Hủy lịch hẹn',
      'Vui lòng nhập lý do hủy (không bắt buộc)',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: (reason: any) => {
            dispatch(cancelBooking({ bookingId, reason }))
          },
        },
      ],
      'plain-text'
    )
  }

  const handleMessageSchedule = (bookingId: string) => {
    const booking = isOwner
      ? ownerBookings.find((b: any) => b.bookingId === bookingId)
      : myBookings.find((b: any) => b.bookingId === bookingId)

    if (booking) {
      router.push({
        pathname: '/(tab)/(protected)/chat',
        params: {
          bookingId,
          userId: isOwner ? booking.tenantId : booking.landlordId
        },
      })
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin lịch hẹn')
    }
  }

  const handleGetDirections = (bookingId: string) => {
    const latitude = propertyDetail?.latitude
    const longitude = propertyDetail?.longitude

    if (!latitude || !longitude) {
      Alert.alert('Lỗi', 'Không có thông tin vị trí')
      return
    }

    Alert.alert(
      'Chỉ đường',
      'Chọn ứng dụng bản đồ',
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
            Linking.openURL(url)
          },
        },
        {
          text: 'Apple Maps',
          onPress: () => {
            const url = `maps://app?daddr=${latitude},${longitude}`
            Linking.openURL(url)
          },
        },
        { text: 'Hủy', style: 'cancel' },
      ]
    )
  }

  const handleAddImage = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    Alert.alert('Thành công', 'Đã thêm hình ảnh')
  }

  const handleAddVideo = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    Alert.alert('Thành công', 'Đã thêm video')
  }

  const handleDeleteImage = (id: number) => {
    Alert.alert(
      'Xóa hình ảnh',
      'Bạn có chắc muốn xóa hình ảnh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            console.log('Delete image:', id)
          },
        },
      ]
    )
  }

  const handleDeleteVideo = (id: number) => {
    Alert.alert(
      'Xóa video',
      'Bạn có chắc muốn xóa video này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            console.log('Delete video:', id)
          },
        },
      ]
    )
  }

  const handleConversation = async () => {
  if (!propertyDetail?.landlordId) {
    Alert.alert("Lỗi", "Không tìm thấy chủ nhà");
    return;
  }

  try {
    const conversation = await dispatch(
      createConversation(propertyDetail.landlordId)
    ).unwrap();

    router.push({
      pathname: "/(tab)/(protected)/chat",
      params: {
        conversationId: conversation.id,
      },
    });
  } catch (error: any) {
    Alert.alert("Lỗi", error || "Không thể tạo cuộc trò chuyện");
  }
};

  if (propertyLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-950">
        <Text className="text-gray-600 dark:text-gray-400">Đang tải...</Text>
      </View>
    )
  }

  return (
    <AuthGuard>
      <View className="flex-1 bg-white dark:bg-gray-950">
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <MediaGallery
            media={mediaGallery}
            onPlayVideo={handlePlayVideo}
            onBack={() => router.back()}
            onShare={handleShare}
            onToggleFavorite={!isOwner ? handleToggleFavorite : undefined}
            onEdit={isOwner ? handleEdit : undefined}
            isFavorite={isFavorite}
            favoriteLoading={favoriteLoading}
            isOwner={isOwner}
            showStatus={isOwner}
            statusText="Đang hiển thị"
          />

          <VideoPlayerModal
            visible={showVideoModal}
            video={selectedVideo}
            onClose={handleCloseVideo}
          />

          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {activeTab === 'info' && (
            <PropertyInfoTab
              isOwner={isOwner}
              title={propertyInfo.title}
              price={propertyInfo.price}
              location={propertyInfo.location}
              amenities={propertyInfo.amenities}
              description={propertyInfo.description}
              owner={!isOwner ? propertyInfo.owner : undefined}
              similarProperties={!isOwner ? propertyInfo.similarProperties : undefined}
              stats={isOwner ? propertyInfo.stats : undefined}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleTab
              isOwner={isOwner}
              schedules={schedules}
              onConfirm={isOwner ? handleConfirmSchedule : undefined}
              onReject={isOwner ? handleRejectSchedule : undefined}
              onCancel={!isOwner ? handleCancelSchedule : undefined}
              onMessage={handleMessageSchedule}
              onGetDirections={!isOwner ? handleGetDirections : undefined}
            />
          )}

          {activeTab === 'media' && isOwner && (
            <MediaManagementTab
              images={mockImages}
              videos={mockVideos}
              onAddImage={handleAddImage}
              onAddVideo={handleAddVideo}
              onDeleteImage={handleDeleteImage}
              onDeleteVideo={handleDeleteVideo}
            />
          )}
        </ScrollView>

        <PropertyActions
          isOwner={isOwner}
          propertyId={propertyId.toString()}
          onContact={handleConversation}
        />

        <Toast />
      </View>
    </AuthGuard>
  )
}

export default PropertyDetail
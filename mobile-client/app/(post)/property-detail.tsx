import GooeyRefreshScrollView from '@/components/common/GooeyRefreshScrollView'
import { MediaGallery, MediaItem } from '@/components/detail/MediaGallery'
import { MediaManagementTab } from '@/components/detail/MediaManagementTab'
import { PropertyActions } from '@/components/detail/PropertyActions'
import { PropertyInfoTab } from '@/components/detail/PropertyInfoTab'
import { Schedule, ScheduleTab } from '@/components/detail/ScheduleTab'
import { TabBar, TabKey } from '@/components/detail/TabBar'
import { VideoPlayerModal } from '@/components/detail/VideoPlayerModal'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import {
  cancelBooking,
  clearMessage,
  confirmBooking,
  getMyBookings,
  getOwnerBookings,
  rejectBooking,
} from '@/store/slices/booking.slice'
import { createConversation } from '@/store/slices/conversation.slice'
import { addFavoriteThunk, fetchSimilarPropertiesThunk, getFavoriteStatusThunk, getPropertyDetailThunk, removeFavoriteThunk } from '@/store/slices/estate.slice'
import { getPropertyDetail } from '@/store/slices/property.slice'
import { PropertyDetailApiData } from '@/types/property.type'
import { useThemeColors } from '@/utils/colors'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, Linking, StatusBar, Text, useColorScheme, View } from 'react-native'
import Toast from 'react-native-toast-message'

const PropertyDetail = () => {
  const colorScheme = useColorScheme()
  const colors = useThemeColors()
  const isDark = colorScheme === 'dark'
  const { id: propertyId } = useLocalSearchParams()

  const dispatch = useAppDispatch()
  const { data: propertyDetail, loading: propertyLoading } = useAppSelector(state => state.estate.detail)
  const { myBookings, ownerBookings, loading: bookingLoading, message } = useAppSelector(state => state.booking)
  const { data: propertySimilar } = useAppSelector(state => state.estate.similar)
  const { user } = useAppSelector(state => state.auth)
  const favoriteStatusMap = useAppSelector(state => state.estate.favoriteStatusMap)
  const favoriteActionLoading = useAppSelector(state => state.estate.favoriteActionLoading)

  const isOwner = propertyDetail?.user.id === user?.id


  const [activeTab, setActiveTab] = useState<TabKey>('info')

  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const isFavorite = !!favoriteStatusMap[propertyId as string]
  const favoriteLoading = favoriteActionLoading

  const mockImages = propertyDetail?.images?.map((img, index) => ({
    id: index + 1,
    uri: img.uri,
    type: "image" as const
  })) ?? []

  const mockVideos = propertyDetail?.videos?.map((video, index) => ({
    id: index + 1,
    uri: video.uri,
    thumbnail: video.uri,
    type: "video" as const,
    duration: "0:00"
  })) ?? []

  const buildMediaGallery = (data: PropertyDetailApiData): MediaItem[] => {
    const sortedImages = [...data.images].sort(
      (a, b) => Number(b.isPrimary) - Number(a.isPrimary)
    )

    const images: MediaItem[] = sortedImages.map((img, index) => ({
      id: index + 1,
      type: "image",
      uri: img.uri
    }))

    const videos: MediaItem[] = data.videos.map((video, index) => ({
      id: images.length + index + 1,
      type: "video",
      uri: video.uri
    }))

    return [...images, ...videos]
  }

  const mediaGallery = propertyDetail
    ? buildMediaGallery(propertyDetail)
    : []

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

  const tabs = [
    { key: 'info' as TabKey, label: 'Thông tin' },
    { key: 'schedule' as TabKey, label: 'Lịch xem' },
    ...(isOwner ? [{ key: 'media' as TabKey, label: 'Media' }] : [])
  ]

  useEffect(() => {
    if (propertyId) {
      console.log("jk");

      dispatch(getPropertyDetailThunk(propertyId as string))
      dispatch(getFavoriteStatusThunk(propertyId as string))
    }
  }, [propertyId, dispatch])

  useEffect(() => {
    dispatch(fetchSimilarPropertiesThunk({}))
  }, [dispatch])

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
    if (isFavorite) {
      dispatch(removeFavoriteThunk(propertyId as string))
    } else {
      dispatch(addFavoriteThunk(propertyId as string))
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
    if (!propertyDetail?.user.id) {
      Alert.alert("Lỗi", "Không tìm thấy chủ nhà");
      return;
    }

    try {
      const conversation = await dispatch(
        createConversation(propertyDetail.user.id)
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
    // <AuthGuard>
    <View className="flex-1 bg-white dark:bg-gray-950">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <GooeyRefreshScrollView
        refreshing={refreshing}
        onRefresh={onRefresh}
        className="flex-1"
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

        {activeTab === 'info' && propertyDetail && (
          <PropertyInfoTab
            isOwner={isOwner}
            property={propertyDetail}
            similarProperties={propertySimilar}
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
      </GooeyRefreshScrollView>

      <PropertyActions
        isOwner={isOwner}
        propertyId={propertyId.toString()}
        ownerId={propertyDetail?.user.id}
        // pricePerMonth={propertyDetail?.price ?? undefined}
        onContact={handleConversation}
      />

      <Toast />
    </View>
    // </AuthGuard>
  )
}

export default PropertyDetail
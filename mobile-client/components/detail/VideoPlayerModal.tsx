import { View, Text, TouchableOpacity, Modal, StatusBar, ActivityIndicator, Dimensions } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av'
import { MediaItem } from './MediaGallery'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

type VideoPlayerModalProps = {
  visible: boolean
  video: MediaItem | null
  onClose: () => void
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  visible,
  video,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<Video>(null)

  useEffect(() => {
    if (visible) {
      setIsLoading(true)
      setHasError(false)
    }
  }, [visible])

  const handleClose = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.pauseAsync()
        await videoRef.current.unloadAsync()
      } catch (error) {
        console.log('Error unloading video:', error)
      }
    }
    setIsLoading(true)
    setHasError(false)
    onClose()
  }

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false)
      // Auto close when video ends
      if (status.didJustFinish) {
        handleClose()
      }
    }
  }

  const handleError = (error: string) => {
    console.error('Video Error:', error)
    setHasError(true)
    setIsLoading(false)
  }

  if (!video) return null

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />

        {/* Header Bar */}
        <View className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent pt-12 pb-4 px-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              {/* Video Title */}
              <Text className="text-white font-semibold text-base" numberOfLines={1}>
                {video.title || 'Video Tour'}
              </Text>
              {video.duration && (
                <Text className="text-white/70 text-sm mt-1">
                  {video.duration}
                </Text>
              )}
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={handleClose}
              className="bg-white/20 p-2 rounded-full"
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Player */}
        <Video
          ref={videoRef}
          source={{ uri: video.uri }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onError={handleError}
        />

        {/* Loading Indicator */}
        {isLoading && !hasError && (
          <View className="absolute inset-0 items-center justify-center bg-black/50">
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white mt-4 text-base">Đang tải video...</Text>
          </View>
        )}

        {/* Error State */}
        {hasError && (
          <View className="absolute inset-0 items-center justify-center bg-black/90">
            <Ionicons name="alert-circle" size={64} color="#ef4444" />
            <Text className="text-white text-lg font-semibold mt-4">
              Không thể phát video
            </Text>
            <Text className="text-white/70 text-sm mt-2 mb-6">
              Vui lòng kiểm tra kết nối mạng và thử lại
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              className="bg-blue-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Đóng</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Instructions */}
        <View className="absolute bottom-8 left-0 right-0 items-center">
          <View className="bg-black/70 px-4 py-2 rounded-full">
            <Text className="text-white/90 text-sm">
              Nhấn ✕ để đóng
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  )
}
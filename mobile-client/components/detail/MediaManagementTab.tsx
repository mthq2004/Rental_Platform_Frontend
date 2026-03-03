import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

type MediaItemType = {
  id: number
  uri: string
  type: 'image' | 'video'
  thumbnail?: string
  duration?: string
}

type MediaManagementTabProps = {
  images: MediaItemType[]
  videos: MediaItemType[]
  onAddImage: () => Promise<void>
  onAddVideo: () => Promise<void>
  onDeleteImage: (id: number) => void
  onDeleteVideo: (id: number) => void
  maxImages?: number
  maxVideos?: number
}

export const MediaManagementTab: React.FC<MediaManagementTabProps> = ({
  images: initialImages,
  videos: initialVideos,
  onAddImage,
  onAddVideo,
  onDeleteImage,
  onDeleteVideo,
  maxImages = 12,
  maxVideos = 2
}) => {
  const [images, setImages] = useState(initialImages)
  const [videos, setVideos] = useState(initialVideos)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const handleAddImage = async () => {
    if (images.length >= maxImages) return
    
    setUploadingImage(true)
    try {
      await onAddImage()
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải ảnh lên')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAddVideo = async () => {
    if (videos.length >= maxVideos) return
    
    setUploadingVideo(true)
    try {
      await onAddVideo()
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải video lên')
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleDeleteImage = (id: number) => {
    Alert.alert('Xóa ảnh', 'Bạn có chắc muốn xóa ảnh này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive', 
        onPress: () => {
          setImages(images.filter(img => img.id !== id))
          onDeleteImage(id)
        }
      }
    ])
  }

  const handleDeleteVideo = (id: number) => {
    Alert.alert('Xóa video', 'Bạn có chắc muốn xóa video này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive', 
        onPress: () => {
          setVideos(videos.filter(vid => vid.id !== id))
          onDeleteVideo(id)
        }
      }
    ])
  }

  return (
    <ScrollView className="flex-1 p-4">
      {/* Images Section */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Hình ảnh
            <Text className="text-gray-500 dark:text-gray-400 text-sm font-normal">
              {' '}{images.length}/{maxImages}
            </Text>
          </Text>
          
          <TouchableOpacity
            onPress={handleAddImage}
            disabled={images.length >= maxImages || uploadingImage}
            className={`flex-row items-center px-4 py-2 rounded-lg ${
              images.length >= maxImages 
                ? 'bg-gray-200 dark:bg-gray-700' 
                : 'bg-blue-50 dark:bg-blue-900/20'
            }`}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <>
                <Ionicons 
                  name="add" 
                  size={20} 
                  color={images.length >= maxImages ? '#9ca3af' : '#3b82f6'} 
                />
                <Text 
                  className={`ml-1 font-semibold ${
                    images.length >= maxImages 
                      ? 'text-gray-400' 
                      : 'text-blue-600'
                  }`}
                >
                  Thêm ảnh
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {images.length < maxImages && (
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Còn lại: {maxImages - images.length} ảnh
          </Text>
        )}

        {images.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {images.map((image, index) => (
              <View key={image.id} className="relative" style={{ width: '31%' }}>
                <Image
                  source={{ uri: image.uri }}
                  className="w-full h-24 rounded-lg"
                  resizeMode="cover"
                />
                
                {index === 0 && (
                  <View className="absolute top-1 left-1 bg-blue-600 px-2 py-0.5 rounded">
                    <Text className="text-white text-xs font-semibold">Ảnh đại diện</Text>
                  </View>
                )}
                
                <TouchableOpacity
                  onPress={() => handleDeleteImage(image.id)}
                  className="absolute top-1 right-1 bg-red-600 p-1 rounded-full"
                >
                  <Ionicons name="trash" size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState 
            icon="images-outline" 
            text="Chưa có hình ảnh nào" 
          />
        )}
      </View>

      {/* Videos Section */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Video
            <Text className="text-gray-500 dark:text-gray-400 text-sm font-normal">
              {' '}{videos.length}/{maxVideos}
            </Text>
          </Text>
          
          <TouchableOpacity
            onPress={handleAddVideo}
            disabled={videos.length >= maxVideos || uploadingVideo}
            className={`flex-row items-center px-4 py-2 rounded-lg ${
              videos.length >= maxVideos 
                ? 'bg-gray-200 dark:bg-gray-700' 
                : 'bg-blue-50 dark:bg-blue-900/20'
            }`}
          >
            {uploadingVideo ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <>
                <Ionicons 
                  name="add" 
                  size={20} 
                  color={videos.length >= maxVideos ? '#9ca3af' : '#3b82f6'} 
                />
                <Text 
                  className={`ml-1 font-semibold ${
                    videos.length >= maxVideos 
                      ? 'text-gray-400' 
                      : 'text-blue-600'
                  }`}
                >
                  Thêm video
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {videos.length >= maxVideos ? `Đã đủ ${maxVideos} video` : `Còn lại: ${maxVideos - videos.length} video`}
        </Text>

        {videos.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {videos.map((video) => (
              <View key={video.id} className="relative" style={{ width: '48%' }}>
                <Image
                  source={{ uri: video.thumbnail || video.uri }}
                  className="w-full h-32 rounded-lg"
                  resizeMode="cover"
                />
                
                <View className="absolute inset-0 bg-black/40 items-center justify-center rounded-lg">
                  <Ionicons name="play-circle" size={40} color="white" />
                </View>
                
                {video.duration && (
                  <View className="absolute bottom-1 right-1 bg-black/70 px-2 py-0.5 rounded">
                    <Text className="text-white text-xs font-semibold">
                      {video.duration}
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity
                  onPress={() => handleDeleteVideo(video.id)}
                  className="absolute top-1 right-1 bg-red-600 p-1 rounded-full"
                >
                  <Ionicons name="trash" size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState 
            icon="videocam-outline" 
            text="Chưa có video nào" 
          />
        )}
      </View>

      {/* Tips */}
      <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
        <Text className="text-blue-900 dark:text-blue-100 font-semibold mb-2">
          Mẹo tăng hiệu quả
        </Text>
        <Text className="text-blue-800 dark:text-blue-200 text-sm leading-6">
          • Ảnh đầu tiên sẽ là ảnh đại diện{'\n'}
          • Chụp ảnh sáng, rõ nét{'\n'}
          • Video nên dưới 3 phút{'\n'}
          • Hiển thị đầy đủ tiện ích phòng
        </Text>
      </View>
    </ScrollView>
  )
}

const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <View className="items-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
    <Ionicons name={icon as any} size={48} color="#9ca3af" />
    <Text className="text-gray-500 dark:text-gray-400 mt-2">
      {text}
    </Text>
  </View>
)
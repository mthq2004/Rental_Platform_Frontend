import { View, Text, Image, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native'
import React, { useRef, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export type MediaItem = {
  id: number
  type: 'image' | 'video'
  uri: string
  thumbnail?: string
  duration?: string
  title?: string
}

type MediaGalleryProps = {
  media: MediaItem[]
  onPlayVideo: (video: MediaItem) => void
  onBack: () => void
  onShare: () => void
  onToggleFavorite?: () => void
  onEdit?: () => void
  isFavorite?: boolean
  favoriteLoading?: boolean
  isOwner?: boolean
  showStatus?: boolean
  statusText?: string
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  media,
  onPlayVideo,
  onBack,
  onShare,
  onToggleFavorite,
  onEdit,
  isFavorite = false,
  favoriteLoading = false,
  isOwner = false,
  showStatus = false,
  statusText = 'Đang hiển thị'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0)
    }
  }).current

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current

  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <View style={{ width: SCREEN_WIDTH }} className="relative">
      {item.type === 'image' ? (
        <Image
          source={{ uri: item.uri }}
          style={{ width: SCREEN_WIDTH, height: 400 }}
          className="bg-gray-200 dark:bg-gray-800"
          resizeMode="cover"
        />
      ) : (
        <TouchableOpacity
          onPress={() => onPlayVideo(item)}
          activeOpacity={0.9}
          style={{ width: SCREEN_WIDTH, height: 400 }}
        >
          <Image
            source={{ uri: item.thumbnail || item.uri }}
            style={{ width: SCREEN_WIDTH, height: 400 }}
            className="bg-gray-200 dark:bg-gray-800"
            resizeMode="cover"
          />

          {/* Video Play Overlay */}
          <View className="absolute inset-0 bg-black/30 items-center justify-center">
            <View className="bg-black/70 rounded-full p-5 mb-2">
              <Ionicons name="play" size={40} color="white" />
            </View>
            <Text className="text-white text-sm font-semibold bg-black/60 px-3 py-1.5 rounded-full">
              Nhấn để xem video
            </Text>
          </View>

          {/* Video Label */}
          <View className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-md flex-row items-center">
            <Ionicons name="videocam" size={16} color="white" />
            <Text className="text-white font-bold text-xs ml-1">VIDEO</Text>
          </View>

          {/* Duration Badge */}
          {item.duration && (
            <View className="absolute bottom-4 right-4 bg-black/70 px-2 py-1 rounded">
              <Text className="text-white text-xs font-semibold">{item.duration}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <View className="relative">
      <FlatList
        ref={flatListRef}
        data={media}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMediaItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Back Button */}
      <TouchableOpacity
        onPress={onBack}
        className="absolute top-12 left-4 bg-black/50 p-2 rounded-full z-10"
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Action Buttons */}
      <View className="absolute top-12 right-4 flex-row gap-2 z-10">
        {/* Share Button */}
        <TouchableOpacity
          onPress={onShare}
          className="bg-black/50 p-2 rounded-full"
        >
          <Ionicons name="share-outline" size={24} color="white" />
        </TouchableOpacity>

        {/* Favorite Button (người thuê) */}
        {!isOwner && onToggleFavorite && (
          <TouchableOpacity
            onPress={onToggleFavorite}
            disabled={favoriteLoading}
            className="bg-black/50 p-2 rounded-full"
          >
            {favoriteLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#ef4444" : "white"} 
              />
            )}
          </TouchableOpacity>
        )}

        {/* Edit Button (chủ nhà) */}
        {isOwner && onEdit && (
          <TouchableOpacity
            onPress={onEdit}
            className="bg-black/50 p-2 rounded-full"
          >
            <Ionicons name="create-outline" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Image Counter */}
      <View className="absolute top-12 left-1/2 -ml-10 bg-black/50 px-3 py-1.5 rounded-full">
        <Text className="text-white font-semibold text-sm">
          {currentIndex + 1} / {media.length}
        </Text>
      </View>

      {/* Status Badge (chủ nhà) */}
      {isOwner && showStatus && (
        <View className="absolute top-24 right-4 bg-green-600 px-3 py-1.5 rounded-full flex-row items-center">
          <View className="w-2 h-2 bg-white rounded-full mr-2" />
          <Text className="text-white font-semibold text-xs">{statusText}</Text>
        </View>
      )}

      {/* Pagination Dots */}
      <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
        {media.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index, animated: true })
            }}
            className={`h-2 rounded-full ${
              index === currentIndex 
                ? 'bg-white w-8' 
                : 'bg-white/50 w-2'
            }`}
          />
        ))}
      </View>

      {/* Media Type Indicator */}
      {media[currentIndex]?.type === 'video' && (
        <View className="absolute bottom-16 left-0 right-0 items-center">
          <View className="bg-black/70 px-4 py-2 rounded-full flex-row items-center">
            <Ionicons name="play-circle" size={20} color="white" />
            <Text className="text-white ml-2 font-medium">Nhấn để phát</Text>
          </View>
        </View>
      )}
    </View>
  )
}
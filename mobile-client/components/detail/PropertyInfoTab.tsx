import { View, Text, Image, TouchableOpacity, ScrollView, Alert, TextInput, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { useAppSelector } from '@/store/hook'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { User } from 'lucide-react-native'
import { PropertyListItem } from '@/types/property.type';

export interface PropertyReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: {
    id: string;
    fullName: string;
    avatarUrl: string;
  };
}

export interface PropertyApiOwner {
  id: string;
  fullName: string;
  avatarUrl: string;
  phone: string;
  phoneRaw: string;
  totalListings: number;
  joinedYears: number;
  userType: "personal" | "broker" | "agency";
}

export interface PropertyImage {
  id: string;
  uri: string;
  isPrimary: boolean;
}

export interface PropertyDetailApiData {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  pricePerMonth: number;
  depositAmount: number;
  depositMonths: number;
  address: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  areaSqm: number;
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  kitchens: number;
  balconies: number;
  floorNumber: number;
  totalFloors: number;
  furnitureStatus: string;
  parkingFee: number;
  managementFee: number;
  electricityCostPerKwh: number;
  waterCostPerM3: number;
  minimumLeaseMonths: number;
  maximumLeaseMonths: number | null;
  availableFrom: string | null;
  hasFireCertificate: boolean;
  status: string;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  images: PropertyImage[];
  videos: { id: string; uri: string }[];
  amenities: string[];
  rules: { text: string; order: number }[];
  reviews: PropertyReview[];
  user: PropertyApiOwner;
}

type PropertyInfoTabProps = {
  property: PropertyDetailApiData
  isOwner: boolean
  onContactOwner?: (owner: PropertyApiOwner) => void
  onNavigateToChat?: (owner: PropertyApiOwner) => void
  similarProperties?: PropertyListItem[]
  onSaveProperty?: () => void
}

// ==================== THEME COLORS ====================

const useThemeColors = () => {
  const isDark = useColorScheme() === 'dark'

  return {
    isDark,
    // Background colors
    bg: {
      primary: isDark ? '#0F172A' : '#FFFFFF',
      secondary: isDark ? '#1E293B' : '#F9FAFB',
      tertiary: isDark ? '#334155' : '#F3F4F6',
    },
    // Text colors
    text: {
      primary: isDark ? '#F1F5F9' : '#111827',
      secondary: isDark ? '#CBD5E1' : '#6B7280',
      tertiary: isDark ? '#94A3B8' : '#9CA3AF',
      muted: isDark ? '#64748B' : '#D1D5DB',
    },
    // Border colors
    border: {
      light: isDark ? '#334155' : '#E5E7EB',
      medium: isDark ? '#475569' : '#D1D5DB',
      dark: isDark ? '#1E293B' : '#F3F4F6',
    },
    // Accent colors
    accent: {
      red: '#DC2626',
      yellow: '#FBBF24',
      blue: '#2563EB',
      green: '#16A34A',
    },
    // Status colors
    status: {
      info: isDark ? '#0EA5E9' : '#0284C7',
      success: isDark ? '#10B981' : '#059669',
      warning: isDark ? '#F59E0B' : '#D97706',
      error: isDark ? '#EF4444' : '#DC2626',
    },
  }
}

// ==================== HELPERS ====================

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

const formatAddress = (property: PropertyListItem): string => {
  const parts = [property.address, property.ward, property.district, property.city]
  return parts.filter(Boolean).join(', ')
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

const amenityIconMap: Record<string, string> = {
  'wifi': 'wifi',
  'air conditioner': 'snowflake',
  'ac': 'snowflake',
  'washing machine': 'washing-machine',
  'parking': 'parking',
  'gym': 'dumbbell',
  'pool': 'pool',
  'kitchen': 'chef-hat',
  'balcony': 'window-closed',
  'garden': 'leaf',
  'security': 'shield-check',
  'cctv': 'camera',
  'camera': 'camera',
  'elevator': 'elevator',
  'furniture': 'home',
  'pets allowed': 'paw',
  'pets': 'paw',
  'smoking allowed': 'cigarette',
  'smoking': 'cigarette',
  'shared space': 'account-multiple',
  'common area': 'account-multiple',
  'hot water': 'water-boiler',
  'natural light': 'white-balance-sunny',
  'soundproof': 'volume-mute',
}

const getAmenityIcon = (amenity: string): string => {
  const normalized = amenity.toLowerCase().trim()
  return amenityIconMap[normalized] || 'check-circle'
}

// ==================== HEADER SECTION ====================

const HeaderSection = ({ property, onSave }: { property: PropertyDetailApiData; onSave?: () => void }) => {
  const [isSaved, setIsSaved] = useState(false)
  const colors = useThemeColors()

  const handleSave = () => {
    setIsSaved(!isSaved)
    onSave?.()
  }

  return (
    <View
      className="px-5 py-4 border-b"
      style={{
        backgroundColor: colors.bg.primary,
        borderBottomColor: colors.border.light,
      }}
    >
      <View className="flex-row justify-between items-start gap-3 mb-2">
        <View className="flex-1">
          <Text
            className="text-2xl font-bold"
            numberOfLines={3}
            style={{ color: colors.text.primary }}
          >
            {property.title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          className="w-12 h-12 rounded-full items-center justify-center border-2"
          style={{
            borderColor: isSaved ? colors.accent.red : colors.border.light,
            backgroundColor: isSaved ? (colors.isDark ? '#7F1D1D' : '#FEF2F2') : colors.bg.primary,
          }}
        >
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={24}
            color={isSaved ? colors.accent.red : colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-3 mt-2">
        <Text className="text-sm font-medium" style={{ color: colors.text.secondary }}>
          Văn phòng
        </Text>
        <Text className="text-sm font-medium" style={{ color: colors.text.secondary }}>
          Hoàn thiện cơ bản
        </Text>
      </View>
    </View>
  )
}

// ==================== PRICE & STATS SECTION ====================

const PriceStatsSection = ({ property }: { property: PropertyDetailApiData }) => {
  const colors = useThemeColors()

  return (
    <View
      className="px-5 py-5 border-b"
      style={{
        backgroundColor: colors.bg.primary,
        borderBottomColor: colors.border.light,
      }}
    >
      <View className="flex-row items-baseline gap-6 mb-5">
        <View>
          <Text className="font-bold text-3xl" style={{ color: colors.accent.red }}>
            {formatPrice(property.pricePerMonth).split(' ')[0]}
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            triệu/m²
          </Text>
        </View>
        <Text className="text-sm" style={{ color: colors.text.tertiary }}>
          {property.areaSqm} m²
        </Text>
        <Text className="text-sm" style={{ color: colors.text.tertiary }}>
          {property.areaSqm} m²
        </Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-xs mb-1" style={{ color: colors.text.tertiary }}>
            Loại hình
          </Text>
          <Text className="font-semibold text-sm" style={{ color: colors.text.primary }}>
            Văn phòng
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs mb-1" style={{ color: colors.text.tertiary }}>
            Hoàn thiện
          </Text>
          <Text className="font-semibold text-sm" style={{ color: colors.text.primary }}>
            Cơ bản
          </Text>
        </View>
      </View>
    </View>
  )
}

// ==================== ADDRESS & TIME SECTION ====================

const AddressTimeSection = ({ property }: { property: PropertyDetailApiData }) => {
  const colors = useThemeColors()

  return (
    <View
      className="px-5 py-4 border-b"
      style={{
        backgroundColor: colors.bg.primary,
        borderBottomColor: colors.border.light,
      }}
    >
      <View className="flex-row items-start gap-3 mb-4">
        <Ionicons name="location-sharp" size={18} color={colors.accent.red} />
        <View className="flex-1">
          <Text className="font-medium leading-6" style={{ color: colors.text.primary }}>
            {formatAddress(property)}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
            {property.district}, TP {property.city} mới
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <Ionicons name="time" size={18} color={colors.text.secondary} />
        <Text className="text-sm font-medium" style={{ color: colors.text.secondary }}>
          Cập nhật 2 tháng trước
        </Text>
      </View>
    </View>
  )
}

// ==================== OWNER CARD SECTION ====================

const OwnerCardSection = ({
  owner,
  isOwner,
  onNavigateToChat,
  onContact,
}: {
  owner: PropertyApiOwner
  isOwner: boolean
  onNavigateToChat?: (owner: PropertyApiOwner) => void
  onContact?: (owner: PropertyApiOwner) => void
}) => {
  const colors = useThemeColors()

  if (isOwner) return null

  const handleChat = () => {
    if (onNavigateToChat) {
      onNavigateToChat(owner)
    } else {
      Alert.alert('Thông báo', 'Tính năng chat sẽ sớm được kích hoạt')
    }
  }

  const handleCall = () => {
    if (onContact) {
      onContact(owner)
    }
  }

  const userTypeLabel = {
    personal: 'Chủ nhà cá nhân',
    broker: 'Môi giới bất động sản',
    agency: 'Đại lý bất động sản',
  }[owner.userType]

  return (
    <View
      className="px-5 py-5 border-b"
      style={{
        backgroundColor: colors.bg.primary,
        borderBottomColor: colors.border.light,
      }}
    >
      <View className="flex-row items-start gap-4 mb-4">
        <View
          className="w-16 h-16 rounded-full items-center justify-center overflow-hidden"
          style={{
            backgroundColor: owner.avatarUrl && owner.avatarUrl !== "https://i.pravatar.cc/300" ? 'transparent' : colors.accent.yellow,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          {owner.avatarUrl && owner.avatarUrl !== "https://i.pravatar.cc/300" ? (
            <Image source={{ uri: owner.avatarUrl }} className="w-16 h-16" />
          ) : (
            <User size={32} color="#FFF" />
          )}
        </View>

        <View className="flex-1">
          <Text className="font-bold text-base" style={{ color: colors.text.primary }}>
            {owner.fullName}
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: colors.text.secondary }}>
            {userTypeLabel}
          </Text>
          <View className="flex-row gap-4 mt-2">
            <View>
              <Text className="font-bold text-sm" style={{ color: colors.text.primary }}>
                ---
              </Text>
              <Text className="text-xs" style={{ color: colors.text.tertiary }}>
                Phân hội
              </Text>
            </View>
            <View>
              <Text className="font-bold text-sm" style={{ color: colors.text.primary }}>
                {owner.joinedYears} năm
              </Text>
              <Text className="text-xs" style={{ color: colors.text.tertiary }}>
                Hoạt động
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* <View className="flex-row gap-2 pt-3 border-t" style={{ borderTopColor: colors.border.light }}> */}
      {/* <TouchableOpacity
          onPress={handleChat}
          className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg"
          style={{ backgroundColor: colors.bg.secondary }}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.text.secondary} />
          <Text className="font-medium text-sm" style={{ color: colors.text.secondary }}>
            Chat nhanh
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCall}
          className="flex-1 py-2.5 rounded-lg border"
          style={{
            borderColor: colors.border.light,
            backgroundColor: colors.bg.primary,
          }}
        >
          <Text className="text-center font-medium text-sm" style={{ color: colors.text.secondary }}>
            Gọi điện
          </Text>
        </TouchableOpacity> */}
      {/* </View> */}
    </View>
  )
}

// ==================== FEATURES SECTION ====================

const FeaturesSection = ({ property }: { property: PropertyDetailApiData }) => {
  const colors = useThemeColors()

  return (
    <View
      className="px-5 py-4 border-b"
      style={{
        backgroundColor: colors.bg.primary,
        borderBottomColor: colors.border.light,
      }}
    >
      <Text className="text-base font-bold mb-4" style={{ color: colors.text.primary }}>
        Đặc điểm bất động sản
      </Text>

      <View className="space-y-3">
        <View className="flex-row items-center justify-between py-2.5 border-b" style={{ borderBottomColor: colors.border.light }}>
          <View className="flex-row items-center gap-3">
            <MaterialCommunityIcons name="home-outline" size={20} color={colors.text.secondary} />
            <Text className="text-sm" style={{ color: colors.text.secondary }}>
              Loại hình
            </Text>
          </View>
          <Text className="font-medium text-sm" style={{ color: colors.text.primary }}>
            {property.propertyType}
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2.5 border-b" style={{ borderBottomColor: colors.border.light }}>
          <View className="flex-row items-center gap-3">
            <MaterialCommunityIcons name="ruler-square" size={20} color={colors.text.secondary} />
            <Text className="text-sm" style={{ color: colors.text.secondary }}>
              Diện tích
            </Text>
          </View>
          <Text className="font-medium text-sm" style={{ color: colors.text.primary }}>
            {property.areaSqm} m²
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2.5 border-b" style={{ borderBottomColor: colors.border.light }}>
          <View className="flex-row items-center gap-3">
            <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.text.secondary} />
            <Text className="text-sm" style={{ color: colors.text.secondary }}>
              Giấy tờ pháp lý
            </Text>
          </View>
          <Text className="font-medium text-sm" style={{ color: colors.text.primary }}>
            Giấy tờ khác
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2.5 border-b" style={{ borderBottomColor: colors.border.light }}>
          <View className="flex-row items-center gap-3">
            <MaterialCommunityIcons name="sofa" size={20} color={colors.text.secondary} />
            <Text className="text-sm" style={{ color: colors.text.secondary }}>
              Tính trạng nội thất
            </Text>
          </View>
          <Text className="font-medium text-sm" style={{ color: colors.text.primary }}>
            {property.furnitureStatus}
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2.5">
          <View className="flex-row items-center gap-3">
            <MaterialCommunityIcons name="door" size={20} color={colors.text.secondary} />
            <Text className="text-sm" style={{ color: colors.text.secondary }}>
              Hướng cửa chính
            </Text>
          </View>
          <Text className="font-medium text-sm" style={{ color: colors.text.primary }}>
            Bắc
          </Text>
        </View>
      </View>
    </View>
  )
}

// ==================== AMENITIES SECTION ====================

const AmenitiesSection = ({ amenities }: { amenities: string[] }) => {
  const colors = useThemeColors()

  if (amenities.length === 0) return null

  return (
    <View
      className="px-5 py-4 border-b"
      style={{
        backgroundColor: colors.bg.primary,
        borderBottomColor: colors.border.light,
      }}
    >
      <Text className="text-base font-bold mb-4" style={{ color: colors.text.primary }}>
        Tiện ích
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {amenities.map((amenity, index) => (
          <View
            key={index}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
            style={{ backgroundColor: colors.bg.secondary }}
          >
            <MaterialCommunityIcons
              name={getAmenityIcon(amenity) as any}
              size={14}
              color={colors.text.secondary}
            />
            <Text className="text-xs font-medium" style={{ color: colors.text.secondary }}>
              {amenity}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ==================== DESCRIPTION SECTION ====================

const DescriptionSection = ({ property }: { property: PropertyDetailApiData }) => {
  const colors = useThemeColors()

  return (
    <View
      className="px-5 py-4 border-b"
      style={{
        backgroundColor: colors.bg.primary,
        borderBottomColor: colors.border.light,
      }}
    >
      <Text className="text-base font-bold mb-3" style={{ color: colors.text.primary }}>
        Mô tả
      </Text>
      <Text className="text-sm leading-6 font-normal" style={{ color: colors.text.secondary }}>
        {property.description}
      </Text>
    </View>
  )
}

// ==================== RULES SECTION ====================

const RulesSection = ({ rules }: { rules: { text: string; order: number }[] }) => {
  const colors = useThemeColors()

  if (rules.length === 0) return null

  const sortedRules = [...rules].sort((a, b) => a.order - b.order)

  return (
    <View
      className="px-5 py-4 border-b"
      style={{
        backgroundColor: colors.bg.primary,
        borderBottomColor: colors.border.light,
      }}
    >
      <Text className="text-base font-bold mb-3" style={{ color: colors.text.primary }}>
        Quy tắc
      </Text>
      <View className="space-y-2">
        {sortedRules.map((rule, index) => (
          <View key={index} className="flex-row items-start gap-2">
            <Text style={{ color: colors.accent.yellow }} className="mt-0.5">
              •
            </Text>
            <Text className="text-sm flex-1 leading-5" style={{ color: colors.text.secondary }}>
              {rule.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ==================== COMMENTS SECTION ====================

const CommentsSection = ({ reviews, isOwner }: { reviews: PropertyReview[]; isOwner: boolean }) => {
  const [comment, setComment] = useState('')
  const colors = useThemeColors()
  const { user } = useAppSelector(state => state.auth)

  if (isOwner) return null

  const handleSubmit = () => {
    if (comment.trim()) {
      Alert.alert('Thành công', 'Bình luận của bạn đã được gửi')
      setComment('')
    }
  }

  return (
    <View
      className="px-5 py-4 border-b"
      style={{
        backgroundColor: colors.bg.primary,
        borderBottomColor: colors.border.light,
      }}
    >
      <Text className="text-base font-bold mb-4" style={{ color: colors.text.primary }}>
        Bình luận
      </Text>

      {reviews.length === 0 ? (
        <View className="items-center py-8">
          <View className="w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: colors.bg.secondary }}>
            <Ionicons name="chatbubbles-outline" size={24} color={colors.text.muted} />
          </View>
          <Text className="text-sm text-center mb-1" style={{ color: colors.text.secondary }}>
            Chưa có bình luận nào.
          </Text>
          <Text className="text-xs text-center" style={{ color: colors.text.tertiary }}>
            Hãy để lại bình luận cho người bán.
          </Text>
        </View>
      ) : (
        <View className="space-y-3 mb-4">
          {reviews.slice(0, 3).map((review) => (
            <View
              key={review.id}
              className="flex-row gap-2 pb-3 border-b last:border-0"
              style={{ borderBottomColor: colors.border.light }}
            >
              {review.reviewer.avatarUrl && review.reviewer.avatarUrl !== "https://i.pravatar.cc/300" ? (
                <Image
                  source={{ uri: review.reviewer.avatarUrl }}
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: colors.bg.secondary }}
                />
              ) : (
                <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: colors.bg.secondary }}>
                  <User size={16} color={colors.text.tertiary} />
                </View>
              )}
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                    {review.reviewer.fullName}
                  </Text>
                  <View className="flex-row gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Ionicons key={i} name="star" size={12} color={colors.status.warning} />
                    ))}
                  </View>
                </View>
                <Text className="text-xs mt-1 leading-4" style={{ color: colors.text.secondary }}>
                  {review.comment}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View
        className="flex-row items-center gap-2 px-3 py-2.5 rounded-full border"
        style={{
          borderColor: colors.border.light,
          backgroundColor: colors.bg.secondary,
        }}
      >
        {user?.avatarUrl && user?.avatarUrl !== "https://i.pravatar.cc/300" ? (
          <Image
            source={{ uri: user.avatarUrl }}
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: colors.bg.tertiary }}
          />
        ) : (
          <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: colors.bg.tertiary }}>
            <User size={12} color={colors.text.tertiary} />
          </View>
        )}
        <TextInput
          placeholder="Bình luận..."
          placeholderTextColor={colors.text.tertiary}
          value={comment}
          onChangeText={setComment}
          className="flex-1 text-sm bg-transparent"
          style={{ color: colors.text.primary }}
        />
        {comment.trim() && (
          <TouchableOpacity onPress={handleSubmit}>
            <Ionicons name="send" size={18} color={colors.accent.blue} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ==================== MAP SECTION ====================

const MapSection = ({ property }: { property: PropertyDetailApiData }) => {
  const colors = useThemeColors()

  return (
    <View
      className="px-5 py-4 border-b"
      style={{
        backgroundColor: colors.bg.primary,
        borderBottomColor: colors.border.light,
      }}
    >
      <Text className="text-base font-bold mb-4" style={{ color: colors.text.primary }}>
        Xem trên bản độ
      </Text>

      <View
        className="w-full h-40 rounded-xl overflow-hidden border"
        style={{
          borderColor: colors.border.light,
          backgroundColor: colors.bg.secondary,
        }}
      >
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm" style={{ color: colors.text.tertiary }}>
            Map Placeholder
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.text.muted }}>
            {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
          </Text>
        </View>
      </View>
    </View>
  )
}

// ==================== SIMILAR PROPERTIES SECTION ====================

const SimilarPropertiesSection = ({ properties }: { properties: PropertyListItem[] }) => {
  const colors = useThemeColors()

  if (properties.length === 0) return null

  return (
    <View className="px-5 py-4" style={{ backgroundColor: colors.bg.primary }}>
      <Text className="text-base font-bold mb-4" style={{ color: colors.text.primary }}>
        Tin đăng tương tự
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
        {properties.map((prop, index) => {
          const image = prop.images.find((img) => img.isPrimary) || prop.images[0]
          return (
            <View
              key={prop.id}
              className="w-48 rounded-lg overflow-hidden border mr-3"
              style={{
                borderColor: colors.border.light,
                backgroundColor: colors.bg.primary,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: colors.isDark ? 0.3 : 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              {image && (
                <View className="w-full h-32 items-center justify-center relative" style={{ backgroundColor: colors.bg.secondary }}>
                  <Image
                    source={{ uri: image.uri }}
                    className="w-full h-full"
                  />
                  <TouchableOpacity
                    className="absolute top-2 right-2 w-7 h-7 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: colors.bg.primary,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <Ionicons name="heart-outline" size={16} color={colors.text.muted} />
                  </TouchableOpacity>
                </View>
              )}

              <View className="p-3">
                <Text
                  className="text-sm font-semibold leading-4"
                  numberOfLines={2}
                  style={{ color: colors.text.primary }}
                >
                  {prop.title}
                </Text>

                <View className="flex-row items-baseline gap-1 mt-2">
                  <Text className="font-bold text-sm" style={{ color: colors.accent.red }}>
                    {formatPrice(prop.pricePerMonth).split(' ')[0]}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.text.secondary }}>
                    {prop.areaSqm}m²
                  </Text>
                </View>

                <View className="flex-row items-center gap-1 mt-1.5">
                  <Ionicons name="location-sharp" size={12} color={colors.accent.red} />
                  <Text className="text-xs flex-1" numberOfLines={1} style={{ color: colors.text.secondary }}>
                    {formatAddress(prop)}
                  </Text>
                </View>
              </View>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

// ==================== MAIN COMPONENT ====================

export const PropertyInfoTab: React.FC<PropertyInfoTabProps> = ({
  property,
  isOwner,
  onContactOwner,
  onNavigateToChat,
  similarProperties = [],
  onSaveProperty,
}) => {
  const colors = useThemeColors()

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: colors.bg.primary }}
    >
      {/* Header */}
      <HeaderSection property={property} onSave={onSaveProperty} />

      {/* Price & Stats */}
      <PriceStatsSection property={property} />

      {/* Address & Time */}
      <AddressTimeSection property={property} />

      {/* Owner Card */}
      <OwnerCardSection
        owner={property.user}
        isOwner={isOwner}
        onNavigateToChat={onNavigateToChat}
        onContact={onContactOwner}
      />

      {/* Features */}
      <FeaturesSection property={property} />

      {/* Amenities */}
      <AmenitiesSection amenities={property.amenities} />

      {/* Description */}
      <DescriptionSection property={property} />

      {/* Rules */}
      <RulesSection rules={property.rules} />

      {/* Comments */}
      <CommentsSection reviews={property.reviews} isOwner={isOwner} />

      {/* Map */}
      <MapSection property={property} />

      {/* Similar Properties */}
      {!isOwner && <SimilarPropertiesSection properties={similarProperties} />}
    </ScrollView>
  )
}

export default PropertyInfoTab
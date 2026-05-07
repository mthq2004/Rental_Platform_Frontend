import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { Heart, MapPin, Bed, Maximize } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import {
  getFavoritePropertiesThunk,
  removeFavoriteThunk,
  selectFavoritesState,
} from '@/store/slices/estate.slice';
import { COLORS } from '@/utils/colors';
import ScreenHeader from '@/components/common/ScreenHeader';

const FavoritesScreen = () => {
  const dispatch = useAppDispatch();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { items, loading, error } = useAppSelector(selectFavoritesState);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    dispatch(getFavoritePropertiesThunk({}));
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getFavoritePropertiesThunk({}));
    setRefreshing(false);
  }, [dispatch]);

  const handleRemoveFavorite = (propertyId: string) => {
    dispatch(removeFavoriteThunk(propertyId));
  };

  const handlePropertyPress = (propertyId: string) => {
    router.push({
      pathname: '/(post)/property-detail',
      params: { id: propertyId },
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}tr/tháng`;
    if (price >= 1000) return `${(price / 1000).toFixed(0)}k/tháng`;
    return `${price}đ/tháng`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const imageUri = item.images?.[0]?.uri || item.thumbnailUrl || 'https://via.placeholder.com/300x200';
    const address = item.address || [item.ward, item.district, item.city].filter(Boolean).join(', ') || 'Chưa có địa chỉ';

    return (
      <TouchableOpacity
        onPress={() => handlePropertyPress(item.id)}
        style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#fff' }]}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          {/* Remove favorite button */}
          <TouchableOpacity
            onPress={() => handleRemoveFavorite(item.id)}
            style={styles.heartButton}
            activeOpacity={0.7}
          >
            <Heart size={18} color="#ef4444" fill="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <Text
            className="text-foreground dark:text-foreground-dark font-bold text-base"
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View style={styles.locationRow}>
            <MapPin size={14} color="#9CA3AF" />
            <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1 flex-1" numberOfLines={1}>
              {address}
            </Text>
          </View>

          <View style={styles.infoRow}>
            {item.bedrooms > 0 && (
              <View style={styles.infoItem}>
                <Bed size={14} color="#6B7280" />
                <Text className="text-gray-500 text-xs ml-1">{item.bedrooms} PN</Text>
              </View>
            )}
            {(item.areaSqm || item.area) && (
              <View style={styles.infoItem}>
                <Maximize size={14} color="#6B7280" />
                <Text className="text-gray-500 text-xs ml-1">{item.areaSqm || item.area}m²</Text>
              </View>
            )}
          </View>

          <Text style={[styles.price, { color: COLORS.primary }]}>
            {item.pricePerMonth ? formatPrice(item.pricePerMonth) : item.price ? formatPrice(item.price) : 'Liên hệ'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Heart size={64} color="#d1d5db" />
      <Text className="text-gray-400 text-lg font-bold mt-4">Chưa có tin đăng yêu thích</Text>
      <Text className="text-gray-400 text-sm mt-2 text-center px-8">
        Nhấn vào biểu tượng ❤️ trên các tin đăng để lưu lại những bất động sản bạn quan tâm.
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(tab)')}
        style={[styles.browseButton, { backgroundColor: COLORS.primary }]}
        activeOpacity={0.8}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Khám phá ngay</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScreenHeader title="Tin đăng đã lưu" />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, items.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  browseButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FavoritesScreen;

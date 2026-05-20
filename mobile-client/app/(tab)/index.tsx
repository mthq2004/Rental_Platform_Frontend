import Categories from '@/components/home/Categories';
import CategoryItem from '@/components/home/CategoryItem';
import HeaderBanner from '@/components/home/Header';
import SearchFilter from '@/components/home/SearchFilter';
import PropertyCard from '@/components/PropertyCard';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getFeaturedPropertiesThunk, getListProperty } from '@/store/slices/estate.slice';
import { getProvinces } from '@/store/slices/location.slice';
import { getAllproperty, getNumberPropertyByCity } from '@/store/slices/property.slice';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import NebulaLoader from '@/components/NebulaLoader';

const Home = () => {
  const [selectedPropertyTypeId, setSelectedPropertyTypeId] = useState<string>(
    "apartment"
  );
  const screenWidth = Dimensions.get('window').width;
  const areaCardWidth = screenWidth * 0.75;
  const { data, nextCursor, hasMore, total, error, loading } = useAppSelector(state => state.estate.featured)
  const { propertyCountByCity } = useAppSelector(state => state.property)
  const { isAuth } = useAppSelector(state => state.auth)
  const dispatch = useAppDispatch()
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isInitialLoading = loading
  const [refreshing, setRefreshing] = useState(false);

  const properties = data

  const propertyType = [
    {
      id: "apartment",
      label: "Chung cư / Căn hộ"
    },
    {
      id: "house",
      label: "Nhà ở"
    },
    {
      id: "room",
      label: "Phòng trọ"
    },
    {
      id: "office",
      label: "Văn phòng"
    },
    {
      id: "land",
      label: "Đất"
    }
  ]


  const handlePropertyPress = (id: string) => {
    router.push({
      pathname: "/(post)/property-detail",
      params: { id, },
    });
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      if (isAuth) {
        await dispatch(getListProperty()).unwrap();
      } else {
        await dispatch(getFeaturedPropertiesThunk(10)).unwrap();
      }

      await dispatch(getNumberPropertyByCity(selectedPropertyTypeId)).unwrap();
      await dispatch(getProvinces()).unwrap();

    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  };



  useEffect(() => {
    if (isAuth) {
      dispatch(getListProperty());
    } else {
      dispatch(getFeaturedPropertiesThunk(10));
    }
  }, [dispatch, isAuth]);

  useEffect(() => {
    dispatch(getProvinces());
  }, []);

  useEffect(() => {
    dispatch(getNumberPropertyByCity(selectedPropertyTypeId)).unwrap();
  }, [dispatch, selectedPropertyTypeId]);

  const handleLoadMore = async () => {
    router.push("/(post)/filter-search")
  }

  const handlePropertyTypePress = (id: string) => {
    setSelectedPropertyTypeId(id);
  }


  if (isInitialLoading) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 items-center justify-center">
        <NebulaLoader size={40}/>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      className="flex-1 bg-gray-50 dark:bg-background-dark"
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#19191a' : '#f9fafb'} />
      <ScrollView
        className="flex-1 bg-gray-50 dark:bg-background-dark"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#fff" : "#000"}
            colors={["#2563eb"]}
            progressBackgroundColor={isDark ? "#111827" : "#ffffff"}
          />
        }
      >
        <HeaderBanner />
        <SearchFilter />
        {/* <Categories /> */}
        <View className="mb-6 mt-6 py-4">
          <Text className="text-xl font-bold text-gray-900 dark:text-foreground-dark mb-4 px-4">
            Nhà cho thuê mới nhất
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            directionalLockEnabled
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {properties?.map((item) => (
              <PropertyCard
                key={item.id}
                property={item}
                onPress={() => handlePropertyPress(item.id)}
              />
            ))}
          </ScrollView>
          {
            hasMore && (
              <TouchableOpacity className='mt-2 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pt-4 pb-4 px-4 rounded-3xl mx-4 justify-center items-center' onPress={() => handleLoadMore()}>
                <Text className="text-center text-gray-700 dark:text-gray-200 font-bold">Xem thêm</Text>
              </TouchableOpacity>
            )
          }

          <Text className="text-xl font-bold text-gray-900 dark:text-foreground-dark mt-4 mb-3 px-4">
            Bất động sản theo khu vực
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            directionalLockEnabled
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {propertyType.map((item) => {
              const isActive = selectedPropertyTypeId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handlePropertyTypePress(item.id)}
                  activeOpacity={0.85}
                  className={`mr-3 px-4 py-2 rounded-full border ${isActive
                    ? "border-blue-600 bg-blue-600"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    }`}
                >
                  <Text
                    className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-900 dark:text-gray-200"
                      }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            directionalLockEnabled
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, marginTop: 16, gap: 10 }}
          >
            {propertyCountByCity && propertyCountByCity.length > 0 ? (
              propertyCountByCity.map((item) => (
                <View
                  key={item.city}
                  className="mr-3 rounded-2xl overflow-hidden shadow-lg"
                  style={{ width: areaCardWidth, height: 180 }}
                >
                  <Image
                    source={{
                      uri: `https://picsum.photos/seed/${encodeURIComponent(
                        item.city
                      )}/300/200`,
                    }}
                    className="w-full h-full"
                  />
                  <View className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Chữ */}
                  <View className="absolute bottom-3 left-3 right-3">
                    <Text className="text-white text-lg font-bold">
                      {item.city}
                    </Text>
                    <Text className="text-white text-sm mt-1">
                      {item.numberProperty.toLocaleString()} bất động sản
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="justify-center">
                <Text className="text-gray-500 dark:text-gray-300 text-center py-4">
                  Chưa có dữ liệu
                </Text>
              </View>
            )}
          </ScrollView>

          {/* <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: 21.0285, // trung tâm Việt Nam
              longitude: 105.8542,
              latitudeDelta: 10,
              longitudeDelta: 10,
            }}
          >
            { propertyCountByCity && propertyCountByCity.length > 0 ? propertyCountByCity.map((item, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: 21.0285,
                  longitude: 105.8542,
                }}
                title={item.city}
                description={`${item.numberProperty} bất động sản`}
              />
            )): <Text>Khong ton tại</Text>}
          </MapView> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default Home;
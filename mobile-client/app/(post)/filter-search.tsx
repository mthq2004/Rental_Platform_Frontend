import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { useLocalSearchParams, router } from 'expo-router';
import { searchPropertiesThunk } from '@/store/slices/estate.slice';
import LocationFilterModal, { Item } from '@/components/post/LocationFilterModal';
import PropertyTypeModal, { PropertyType } from '@/components/post/Propertytypemodal';
import PriceRangeModal from '@/components/post/PriceRangeModal';
import FilterBar from '@/components/post/filters/FilterBar';
import PropertyCard from '@/components/post/filters/PropertyCard';
import SearchHeader from '@/components/post/filters/SearchHeader';
import FeaturedSection from '@/components/post/filters/FeaturedSection';
import { MAX_PRICE } from '@/constants/property.constant';
import SortModal from '@/components/post/SortModal';
import TabsAndSort from '@/components/post/filters/TabsAndSort';
import {
  clearDistrictsAndWards,
  clearWards,
  getDistricts,
  getProvinces,
  getWards,
} from '@/store/slices/location.slice';
import AdvancedFilterModal from '@/components/post/filters/AdvancedFilterModal';
import GooeyRefreshScrollView from '@/components/common/GooeyRefreshScrollView';
import { useEnableFloatingKeyboard } from '@/contexts/FloatingKeyboardContext';

/** Generate page number array with ellipsis, e.g. [1, 2, 3, '...', 10] */
function generatePageNumbers(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  // Always show first page
  pages.push(1);

  if (current <= 4) {
    // Show first 5 pages + ellipsis + last
    for (let i = 2; i <= 5; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
  } else if (current >= totalPages - 3) {
    // Show first + ellipsis + last 5 pages
    pages.push("...");
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
  } else {
    // Show first + ellipsis + current-1, current, current+1 + ellipsis + last
    pages.push("...");
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push("...");
    pages.push(totalPages);
  }

  return pages;
}

interface LocationParams {
  provinces?: Item[];
  districts?: Item[];
  wards?: Item[];
}

type TabType = 'all' | 'personal' | 'broker';

const parseLocationParams = (
  location: string | string[] | undefined
): LocationParams | null => {
  if (!location) return null;

  try {
    const locationStr = Array.isArray(location) ? location[0] : location;
    return JSON.parse(locationStr);
  } catch {
    return null;
  }
};

const formatLocationText = (location: LocationParams | null): string => {
  if (!location) return 'Toàn quốc';

  const provinces = location.provinces?.map((p) => p.name) ?? [];
  const districts = location.districts?.map((d) => d.name) ?? [];
  const wards = location.wards?.map((w) => w.name) ?? [];

  const allLocations = [...wards, ...districts, ...provinces];
  return allLocations.length > 0 ? allLocations.join(', ') : 'Toàn quốc';
};

const toRelativeLocationName = (value: string): string =>
  value
    .replace(/^(thanh pho|thành phố|tp\.?|tinh|tỉnh)\s+/i, '')
    .replace(/^(quan|quận|huyen|huyện|thi xa|thị xã)\s+/i, '')
    .trim();

const buildKeyword = (parts: Array<string | undefined>): string => {
  const unique = Array.from(
    new Set(parts.map((item) => (item ?? '').trim()).filter(Boolean))
  );

  return unique.join(' ');
};

const FilterSearch: React.FC = () => {
  useEnableFloatingKeyboard();
  const {
    keyword,
    propertyType,
    location,
    areaMin,
    areaMax,
    city,
    district,
    sortBy,
    priceMin,
    priceMax,
    bedrooms,
  } = useLocalSearchParams<{
    keyword?: string;
    propertyType?: PropertyType;
    location?: string;
    areaMin?: string;
    areaMax?: string;
    city?: string;
    district?: string;
    sortBy?: string;
    priceMin?: string;
    priceMax?: string;
    bedrooms?: string;
  }>();

  const dispatch = useAppDispatch();
  const { provinces, districts, wards } = useAppSelector((state) => state.location);
  const { data = [], loading, nextCursor, hasMore, total } = useAppSelector(
    (state) => state.estate.search
  );

  const [searchText, setSearchText] = useState(keyword ?? '');

  const parsedLocation = useMemo(() => parseLocationParams(location), [location]);

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [advancedModalVisible, setAdvancedModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<PropertyType | null>(
    (propertyType as PropertyType) ?? null
  );
  const [selectedLocation, setSelectedLocation] = useState<LocationParams | null>(parsedLocation);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState({
    min: priceMin ? Number(priceMin) : 0,
    max: priceMax ? Number(priceMax) : MAX_PRICE,
  });
  const [sortModal, setSortModal] = useState(false);
  const [sort, setSort] = useState(sortBy ?? 'newest');
  const [selectedArea, setSelectedArea] = useState({
    min: areaMin ? Number(areaMin) : 0,
    max: areaMax ? Number(areaMax) : 0,
  });
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(
    bedrooms ? Number(bedrooms) : null
  );
  const [addressKeyword, setAddressKeyword] = useState('');

  const scrollRef = useRef<ScrollView>(null);
  const [pageIndex, setPageIndex] = useState(1);

  useEffect(() => {
    dispatch(getProvinces());
  }, [dispatch]);

  const locationText = useMemo(
    () => formatLocationText(selectedLocation),
    [selectedLocation]
  );

  const rawCityParam = useMemo(() => {
    return selectedLocation?.provinces?.[0]?.name ?? city ?? '';
  }, [city, selectedLocation]);

  const cityParam = useMemo(() => {
    if (!rawCityParam) return '';
    return toRelativeLocationName(rawCityParam);
  }, [rawCityParam]);

  const rawDistrictParam = useMemo(() => {
    return selectedLocation?.districts?.[0]?.name ?? district ?? '';
  }, [district, selectedLocation]);

  const districtParam = useMemo(() => {
    if (!rawDistrictParam) return '';
    return toRelativeLocationName(rawDistrictParam);
  }, [rawDistrictParam]);

  const wardParam = useMemo(() => {
    const rawWard = selectedLocation?.wards?.[0]?.name ?? '';
    if (!rawWard) return '';
    return toRelativeLocationName(rawWard);
  }, [selectedLocation]);

  const locationKeyword = useMemo(() => {
    return wardParam || districtParam || cityParam;
  }, [wardParam, districtParam, cityParam]);

  const combinedKeyword = useMemo(() => {
    return buildKeyword([
      searchText,
      addressKeyword,
      locationKeyword,
    ]);
  }, [searchText, addressKeyword, locationKeyword]);

  const cityQueryParam = '';
  const districtQueryParam = '';

  const resetPaging = useCallback(() => {
    setPageIndex(1);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      dispatch(
        searchPropertiesThunk({
          keyword: combinedKeyword,
          propertyType: selectedType ?? '',
          priceMin: selectedPrice.min,
          priceMax: selectedPrice.max,
          areaMin: selectedArea.min > 0 ? selectedArea.min : null,
          areaMax: selectedArea.max > 0 ? selectedArea.max : null,
          city: cityQueryParam,
          district: districtQueryParam,
          bedrooms: selectedBedrooms,
          sortBy: sort,
          page: pageIndex,
          limit: 10,
        })
      );
    }, 350);

    return () => clearTimeout(debounce);
  }, [
    dispatch,
    combinedKeyword,
    selectedType,
    selectedPrice.min,
    selectedPrice.max,
    selectedArea.min,
    selectedArea.max,
    cityQueryParam,
    districtQueryParam,
    selectedBedrooms,
    sort,
    pageIndex,
  ]);

  const handleRefresh = () => {
    setRefreshing(true);
    resetPaging();

    dispatch(
      searchPropertiesThunk({
        keyword: combinedKeyword,
        propertyType: selectedType ?? '',
        priceMin: selectedPrice.min,
        priceMax: selectedPrice.max,
        areaMin: selectedArea.min > 0 ? selectedArea.min : null,
        areaMax: selectedArea.max > 0 ? selectedArea.max : null,
        city: cityQueryParam,
        district: districtQueryParam,
        bedrooms: selectedBedrooms,
        sortBy: sort,
        page: 1,
        limit: 10,
      })
    ).finally(() => setRefreshing(false));
  };



  const handleMessage = useCallback(
    (id: string) => {
      const property = data?.find((p) => p.id === id);
      if (property) {
        Alert.alert(
          'Liên hệ',
          `Liên hệ với ${property.user.fullName}?\nSĐT: ${property.user.phone}`
        );
      }
    },
    [data]
  );

  const handlePropertyPress = useCallback((id: string) => {
    router.push({ pathname: '/(post)/property-detail', params: { id } });
  }, []);

  const handleClearFilter = useCallback(() => {
    setSearchText('');
    setAddressKeyword('');
    setSelectedType(null);
    setSelectedPrice({ min: 0, max: MAX_PRICE });
    setSelectedArea({ min: 0, max: 0 });
    setSelectedBedrooms(null);
    setSelectedLocation(null);
    setSort('newest');
    resetPaging();
    dispatch(clearDistrictsAndWards());
  }, [dispatch, resetPaging]);

  const handleFilterPress = useCallback(() => {
    setAdvancedModalVisible(true);
  }, []);

  const handleLocationPress = () => {
    setAreaModalVisible(true);
  };

  const handleSearchLocation = (loc: LocationParams) => {
    setSelectedLocation(loc);
    setAreaModalVisible(false);
    resetPaging();
  };

  const handleApplyType = (type: PropertyType) => {
    setSelectedType(type);
    resetPaging();
  };

  const handleOpenTypeFilter = (key: string) => {
    switch (key) {
      case 'type':
        setModalVisible(true);
        break;
      case 'price':
        setShowPriceModal(true);
        break;
      case 'project':
        Alert.alert('Dự án', 'Tính năng đang phát triển.');
        break;
      case 'poster':
        Alert.alert('Người đăng', 'Tính năng đang phát triển.');
        break;
    }
  };

  const handleClearPrice = () => {
    setSelectedPrice({ min: 0, max: MAX_PRICE });
    resetPaging();
  };

  const goToPage = (page: number) => {
    setPageIndex(page);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const visibleData = useMemo(() => {
    if (activeTab === 'all') return data;

    return data.filter((property: any) => {
      const userType = property?.user?.userType;
      if (activeTab === 'personal') return userType === 'personal';
      if (activeTab === 'broker') return userType === 'broker' || userType === 'agency';
      return true;
    });
  }, [data, activeTab]);

  const handleSelectProvince = (item: Item | null) => {
    if (!item) {
      setSelectedLocation(null);
      dispatch(clearDistrictsAndWards());
      return;
    }

    setSelectedLocation({ provinces: [item], districts: [], wards: [] });
    dispatch(getDistricts(item.code));
    dispatch(clearWards());
  };

  const handleSelectDistrict = (item: Item | null) => {
    if (!selectedLocation?.provinces?.[0]) return;

    if (!item) {
      setSelectedLocation({
        provinces: selectedLocation.provinces,
        districts: [],
        wards: [],
      });
      dispatch(clearWards());
      return;
    }

    setSelectedLocation({
      provinces: selectedLocation.provinces,
      districts: [item],
      wards: [],
    });
    dispatch(getWards(item.code));
  };

  const handleSelectWard = (item: Item | null) => {
    if (!selectedLocation?.provinces?.[0]) return;

    if (!item) {
      setSelectedLocation({
        provinces: selectedLocation.provinces,
        districts: selectedLocation.districts,
        wards: [],
      });
      return;
    }

    setSelectedLocation({
      provinces: selectedLocation.provinces,
      districts: selectedLocation.districts,
      wards: [item],
    });
  };

  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pages = generatePageNumbers(pageIndex, totalPages);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-background-dark">
      <SearchHeader
        searchText={searchText}
        onSearchChange={(text) => {
          setSearchText(text);
          resetPaging();
        }}
        locationText={locationText}
        onLocationPress={handleLocationPress}
        onClearFilter={handleClearFilter}
      />

      <FilterBar
        onFilterPress={handleFilterPress}
        onFilterSelect={handleOpenTypeFilter}
        selectedType={selectedType}
        selectedPrice={selectedPrice}
        onClearType={() => {
          setSelectedType(null);
          resetPaging();
        }}
        onClearPrice={handleClearPrice}
      />

      <GooeyRefreshScrollView
        ref={scrollRef}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        stickyHeaderIndices={[0, 1]}
      >
        <FeaturedSection />

        <TabsAndSort
          activeTab={activeTab}
          onTabChange={setActiveTab}
          sortBy={sort}
          onOpenSort={() => setSortModal(true)}
        />

        {loading && (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        )}

        {!loading && visibleData?.length === 0 ? (
          <View className="py-12 items-center px-4">
            <Text className="text-lg font-semibold text-gray-900 dark:text-foreground-dark mb-2">
              Không tìm thấy bất động sản
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Hãy thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc
            </Text>
          </View>
        ) : (
          <View className="px-0 pb-4">
            {visibleData?.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onMessage={handleMessage}
                onPress={handlePropertyPress}
              />
            ))}

            <View className="px-4 pt-2 pb-6">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center">
                Trang {pageIndex} • Tổng {total} kết quả
              </Text>

              <View className="flex-row justify-center gap-2">
                <TouchableOpacity
                  disabled={pageIndex <= 1}
                  onPress={() => goToPage(pageIndex - 1)}
                  className={`w-10 h-10 items-center justify-center rounded-xl ${pageIndex <= 1 ? 'bg-gray-200' : 'bg-white border border-gray-200'}`}
                >
                  <Text className={pageIndex <= 1 ? 'text-gray-400' : 'text-gray-700'}>{"<"}</Text>
                </TouchableOpacity>

                {pages.map((page, idx) => {
                  if (page === "...") {
                    return (
                      <View key={`ellipsis-${idx}`} className="w-10 h-10 items-center justify-center">
                        <Text className="text-gray-400">···</Text>
                      </View>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={page}
                      onPress={() => goToPage(page as number)}
                      className={`w-10 h-10 items-center justify-center rounded-xl ${page === pageIndex
                          ? 'bg-blue-600'
                          : 'bg-white border border-gray-200'
                        }`}
                    >
                      <Text className={`font-semibold ${page === pageIndex ? 'text-white' : 'text-gray-700'}`}>
                        {page}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  disabled={pageIndex >= totalPages}
                  onPress={() => goToPage(pageIndex + 1)}
                  className={`w-10 h-10 items-center justify-center rounded-xl ${pageIndex >= totalPages ? 'bg-gray-200' : 'bg-white border border-gray-200'}`}
                >
                  <Text className={pageIndex >= totalPages ? 'text-gray-400' : 'text-gray-700'}>{">"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </GooeyRefreshScrollView>

      <LocationFilterModal
        visible={areaModalVisible}
        onClose={() => setAreaModalVisible(false)}
        provinces={provinces}
        districts={districts}
        wards={wards}
        onApply={handleSearchLocation}
      />

      <AdvancedFilterModal
        visible={advancedModalVisible}
        onClose={() => setAdvancedModalVisible(false)}
        provinces={provinces}
        districts={districts}
        wards={wards}
        initialLocation={selectedLocation}
        initialArea={selectedArea}
        initialBedrooms={selectedBedrooms}
        initialAddressKeyword={addressKeyword}
        onPickProvince={handleSelectProvince}
        onPickDistrict={handleSelectDistrict}
        onPickWard={handleSelectWard}
        onApply={(payload) => {
          setSelectedLocation(payload.location);
          setSelectedArea(payload.area);
          setSelectedBedrooms(payload.bedrooms);
          setAddressKeyword(payload.addressKeyword);
          resetPaging();
        }}
        onReset={() => {
          setSelectedLocation(null);
          setSelectedArea({ min: 0, max: 0 });
          setSelectedBedrooms(null);
          setAddressKeyword('');
          dispatch(clearDistrictsAndWards());
          resetPaging();
        }}
      />

      <PropertyTypeModal
        visible={modalVisible}
        title="Chọn loại bất động sản"
        selectedId={selectedType}
        onClose={() => setModalVisible(false)}
        onApply={handleApplyType}
      />

      <PriceRangeModal
        visible={showPriceModal}
        minPrice={selectedPrice.min}
        maxPrice={selectedPrice.max}
        onClose={() => setShowPriceModal(false)}
        onApply={(min, max) => {
          setSelectedPrice({ min, max });
          resetPaging();
        }}
      />

      <SortModal
        visible={sortModal}
        value={sort}
        onClose={() => setSortModal(false)}
        onApply={(value) => {
          setSort(value);
          resetPaging();
        }}
      />
    </View>
  );
};

export default FilterSearch;

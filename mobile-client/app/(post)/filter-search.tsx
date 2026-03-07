import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { useLocalSearchParams } from 'expo-router';
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

const FilterSearch: React.FC = () => {
    const { keyword, propertyType, location } = useLocalSearchParams<{
        keyword?: string;
        propertyType?: PropertyType;
        location?: string;
    }>();

    const dispatch = useAppDispatch();
    const { provinces, districts, wards } = useAppSelector(state => state.location);
    const { data = [], loading } = useAppSelector(state => state.estate.search);

    const [searchText, setSearchText] = useState(keyword ?? '');
    const [savedProperties, setSavedProperties] = useState<Set<string>>(
        new Set()
    );


    const parsedLocation = useMemo(
        () => parseLocationParams(location),
        [location]
    );

    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [areaModalVisible, setAreaModalVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<LocationParams | null>(parsedLocation);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [selectedPrice, setSelectedPrice] = useState({
        min: 0,
        max: MAX_PRICE
    });
    const [sortModal, setSortModal] = useState(false);
    const [sort, setSort] = useState("newest");

    const locationText = useMemo(
        () => formatLocationText(selectedLocation),
        [selectedLocation]
    );

    useEffect(() => {
        if (keyword) {
            setSearchText(keyword);
        }

        if (propertyType) {
            setSelectedType(propertyType)
        }
    }, [keyword, propertyType]);

    useEffect(() => {
        dispatch(
            searchPropertiesThunk({
                keyword: keyword ?? "",
                propertyType: selectedType ?? "",
                priceMin: selectedPrice.min,
                priceMax: selectedPrice.max,
                sortBy: sort
            })
        );
    }, [dispatch, keyword, selectedType, selectedPrice, sort]);

    const handleRefresh = () => {
        setRefreshing(true);

        dispatch(
            searchPropertiesThunk({
                keyword: keyword ?? "",
                propertyType: propertyType ?? "",
            })
        ).finally(() => setRefreshing(false));
    };

    const handleSaveProperty = useCallback((id: string) => {
        setSavedProperties((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

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
        Alert.alert('Chi tiết', `Xem chi tiết bất động sản ${id}`);
    }, []);

    const handleClearFilter = useCallback(() => {
        setSearchText('');
    }, []);

    const handleFilterPress = useCallback(() => {
        Alert.alert('Lọc', 'Mở bộ lọc');
    }, []);

    const handleLocationPress = () => {
        setAreaModalVisible(true)
    }

    const handleSeachLocation = (data: LocationParams) => {
        setSelectedLocation(data);
        setAreaModalVisible(false);

        const cities = data.provinces?.map(p => p.name) ?? [];
        const districts = data.districts?.map(d => d.name) ?? [];

        console.log("cities:", cities);
        console.log("districts:", districts);
        console.log("selectedType: ", selectedType);


        dispatch(
            searchPropertiesThunk({
                keyword: searchText ?? "",
                propertyType: selectedType ?? "",
                city: cities[0]?.toString() ?? "",
                district: districts[0]?.toString() ?? ""
            })
        );
    };

    const handleApply = (type: PropertyType) => {
        setSelectedType(type);
    };

    const handleOpenTypeFilter = (key: string) => {
        switch (key) {
            case 'type':
                setModalVisible(true);
                break;

            case 'price':
                setShowPriceModal(true)
                break;

            case 'project':
                Alert.alert('Dự án');
                break;

            case 'poster':
                Alert.alert('Đăng bởi');
                break;
        }
    }

    const handleClearPrice = () => {
        setSelectedPrice({
            min: 0,
            max: MAX_PRICE
        });
    };

    return (
        <View className="flex-1 bg-gray-50">
            <SearchHeader
                searchText={searchText}
                onSearchChange={setSearchText}
                locationText={locationText}
                onLocationPress={handleLocationPress}
                onClearFilter={handleClearFilter}
            />

            <FilterBar
                onFilterPress={handleFilterPress}
                onFilterSelect={handleOpenTypeFilter}
                selectedType={selectedType}
                selectedPrice={selectedPrice}
                onClearType={() => setSelectedType(null)}
                onClearPrice={handleClearPrice}
            />

            <ScrollView
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
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

                {!loading && data?.length === 0 ? (
                    <View className="py-12 items-center px-4">
                        <Text className="text-lg font-semibold text-gray-900 mb-2">
                            Không tìm thấy bất động sản
                        </Text>
                        <Text className="text-sm text-gray-500 text-center">
                            Hãy thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc
                        </Text>
                    </View>
                ) : (
                    <View className="px-0 pb-4">
                        {data?.map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                onSave={handleSaveProperty}
                                onMessage={handleMessage}
                                onPress={handlePropertyPress}
                                isSaved={savedProperties.has(property.id)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            <LocationFilterModal
                visible={areaModalVisible}
                onClose={() => setAreaModalVisible(false)}
                provinces={provinces}
                districts={districts}
                wards={wards}
                onApply={handleSeachLocation}
            />
            <PropertyTypeModal
                visible={modalVisible}
                title="Chọn loại bất động sản"
                selectedId={selectedType}
                onClose={() => setModalVisible(false)}
                onApply={handleApply}
            />

            <PriceRangeModal
                visible={showPriceModal}
                minPrice={selectedPrice.min}
                maxPrice={selectedPrice.max}
                onClose={() => setShowPriceModal(false)}
                onApply={(min, max) => {
                    setSelectedPrice({ min, max });
                }}
            />

            <SortModal
                visible={sortModal}
                value={sort}
                onClose={() => setSortModal(false)}
                onApply={(value) => setSort(value)}
            />
        </View>
    );
};

export default FilterSearch;
import { MAX_PRICE, PROPERTY_TYPE } from "@/constants/property.constant";
import { ChevronDown, Filter } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type FilterKey = 'type' | 'price' | 'project' | 'poster';

interface FilterBarProps {
    onFilterPress: () => void;
    onFilterSelect: (key: FilterKey) => void;
    selectedType?: string | null;
    selectedPrice?: { min: number, max: number }
    onClearType: () => void;
    onClearPrice: () => void;
}

const filters: { key: FilterKey; label: string }[] = [
    { key: 'type', label: 'Loại BDS' },
    { key: 'price', label: 'Giá bán' },
];

const formatPriceShort = (price: number) => {
    if (price >= 1000000) {
        const value = price / 1000000;
        return Number.isInteger(value)
            ? `${value} triệu`
            : `${value.toFixed(1)} triệu`;
    }

    return `${Math.round(price / 1000)}k`;
};

const FilterBar: React.FC<FilterBarProps> = ({
    onFilterPress,
    onFilterSelect,
    selectedType,
    selectedPrice,
    onClearType,
    onClearPrice
}) => (
    <View className="bg-white dark:bg-secondary-dark border-b border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center px-4 py-2">
            <TouchableOpacity
                onPress={onFilterPress}
                className="px-4 h-10 border border-gray-200 dark:border-gray-600 rounded-full flex-row items-center gap-2 bg-white dark:bg-gray-700"
                activeOpacity={0.7}
            >
                <Filter size={16} color="#1F2937" />
                <Text className="font-semibold text-sm text-gray-900 dark:text-gray-200">Lọc</Text>
            </TouchableOpacity>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingLeft: 12,
                    paddingRight: 16,
                    paddingVertical: 8,
                    gap: 8,
                }}
            >
                {filters.map((filter) => {
                    let label = filter.label;
                    let isActive = false;

                    if (filter.key === "type" && selectedType) {
                        const property = PROPERTY_TYPE.find(p => p.id === selectedType);
                        label = property?.label ?? filter.label;
                        isActive = true;
                    }

                    if (filter.key === "price" && selectedPrice) {
                        const { min, max } = selectedPrice;

                        if (min !== 0 || max !== MAX_PRICE) {

                            if (min === 0) {
                                label = `< ${formatPriceShort(max)}`;
                            }
                            else if (max === MAX_PRICE) {
                                label = `> ${formatPriceShort(min)}`;
                            }
                            else {
                                label = `${formatPriceShort(min)} - ${formatPriceShort(max)}`;
                            }

                            isActive = true;
                        }
                    }

                    return (
                        <TouchableOpacity
                            key={filter.key}
                            onPress={() => onFilterSelect(filter.key)}
                            className={`px-4 py-2 border rounded-full flex-row items-center gap-1 
            ${isActive
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                                }`}
                            activeOpacity={0.7}
                        >
                            <Text
                                className={`font-semibold text-sm 
                ${isActive ? "text-blue-600" : "text-gray-900 dark:text-gray-200"}`}
                            >
                                {label}
                            </Text>

                            {isActive ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        if (filter.key === "type") onClearType();
                                        if (filter.key === "price") onClearPrice();
                                    }}
                                >
                                    <Text className="text-blue-600 font-bold ml-1">✕</Text>
                                </TouchableOpacity>
                            ) : (
                                <ChevronDown size={16} color="#6B7280" />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    </View>
);

export default FilterBar
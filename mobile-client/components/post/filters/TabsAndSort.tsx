import { SORT_OPTIONS } from "@/constants/property.constant";
import { ChevronDown } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

type TabType = 'all' | 'personal' | 'broker';

const TABS: Record<TabType, string> = {
    all: 'Tất cả',
    personal: 'Cá nhân',
    broker: 'Môi giới',
};

const TabsAndSort: React.FC<{
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    sortBy: string;
    onOpenSort: () => void;
}> = ({ activeTab, onTabChange, sortBy, onOpenSort }) => (
    <View className="bg-white border-b border-gray-100 px-4 py-3">
        <View className="flex-row items-center justify-between">
            {/* Tabs */}
            <View className="flex-row gap-6">
                {(Object.entries(TABS) as Array<[TabType, string]>).map(
                    ([tabKey, tabLabel]) => (
                        <TouchableOpacity
                            key={tabKey}
                            onPress={() => onTabChange(tabKey)}
                            className={`py-2 border-b-2 ${activeTab === tabKey
                                ? 'border-blue-600'
                                : 'border-transparent'
                                }`}
                        >
                            <Text
                                className={`text-sm font-semibold ${activeTab === tabKey ? 'text-blue-600' : 'text-gray-600'
                                    }`}
                            >
                                {tabLabel}
                            </Text>
                        </TouchableOpacity>
                    )
                )}
            </View>

            <TouchableOpacity className="flex-row items-center gap-1" activeOpacity={0.7} onPress={onOpenSort}>
                <Text className="text-xs font-semibold text-gray-900">
                    {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label ||
                        'Tin mới trước'}
                </Text>
                <ChevronDown size={16} color="#6B7280" />
            </TouchableOpacity>
        </View>
    </View>
);

export default TabsAndSort
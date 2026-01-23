import { ChevronRight } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface MenuItemProps {
    icon: React.ComponentType<any>;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showBadge?: boolean;
    rightElement?: React.ReactNode;
    iconBgColor?: string;
    iconColor?: string;
}

const MenuItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    showBadge = false,
    rightElement,
    iconBgColor = 'bg-gray-100',
    iconColor = '#666',
}: MenuItemProps) => (
    <TouchableOpacity
        onPress={onPress}
        className="bg-secondary dark:bg-secondary-dark mx-4 mb-2 rounded-xl"
        activeOpacity={0.7}
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
    >
        <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center flex-1">
                <View className={`${iconBgColor} rounded-xl p-2.5 mr-3`}>
                    <Icon size={20} color={iconColor} />
                </View>
                <View className="flex-1">
                    <Text className="text-gray-900 dark:text-foreground-dark text-base font-medium">{title}</Text>
                    {subtitle && (
                        <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
                    )}
                </View>
            </View>
            <View className="flex-row items-center gap-2">
                {showBadge && (
                    <View className="bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                        <Text className="text-white text-xs font-bold">3</Text>
                    </View>
                )}
                {rightElement || <ChevronRight size={20} color="#999" />}
            </View>
        </View>
    </TouchableOpacity>
);

export default MenuItem;
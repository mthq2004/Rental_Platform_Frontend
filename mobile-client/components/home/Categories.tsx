import { View } from "react-native";
import CategoryItem from "./CategoryItem";

const Categories: React.FC = () => {
  const handleCategoryPress = (category: string) => {
    console.log('Category pressed:', category);
  };

  return (
    <View className="px-4 py-6">
      <View className="flex-row gap-3 mb-6">
        <CategoryItem
          iconName="home-outline"
          iconColor="#0040d1"
          label="Mua bán"
          onPress={() => handleCategoryPress('buy')}
        />
        <CategoryItem
          iconName="bed-outline"
          iconColor="#7c3aed"
          label="Cho Thuê"
          onPress={() => handleCategoryPress('rent')}
        />
        <CategoryItem
          iconName="business-outline"
          iconColor="#0891b2"
          label="Dự án"
          onPress={() => handleCategoryPress('project')}
        />
        <CategoryItem
          iconName="person-outline"
          iconColor="#059669"
          label="Môi giới"
          onPress={() => handleCategoryPress('agent')}
        />
      </View>
      <View className="flex-row gap-3">
        <CategoryItem
          iconName="bar-chart-outline"
          iconColor="#d97706"
          label="Biểu đồ giá"
          onPress={() => handleCategoryPress('chart')}
        />
        <CategoryItem
          iconName="cash-outline"
          iconColor="#dc2626"
          label="Vay mua nhà"
          onPress={() => handleCategoryPress('loan')}
        />
        <CategoryItem
          iconName="book-outline"
          iconColor="#2563eb"
          label="Kinh nghiệm"
          onPress={() => handleCategoryPress('experience')}
        />
        <CategoryItem
          iconName="trophy-outline"
          iconColor="#ea580c"
          label="Gói Hội Viên"
          onPress={() => handleCategoryPress('membership')}
        />
      </View>
    </View>
  );
};

export default Categories;
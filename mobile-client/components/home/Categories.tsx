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
          icon="🏠"
          label="Mua bán"
          onPress={() => handleCategoryPress('buy')}
        />
        <CategoryItem
          icon="🛏️"
          label="Cho Thuê"
          onPress={() => handleCategoryPress('rent')}
        />
        <CategoryItem
          icon="🏢"
          label="Dự án"
          onPress={() => handleCategoryPress('project')}
        />
        <CategoryItem
          icon="👩‍💼"
          label="Môi giới"
          onPress={() => handleCategoryPress('agent')}
        />
      </View>
      <View className="flex-row gap-3">
        <CategoryItem
          icon="📊"
          label="Biểu đồ giá"
          onPress={() => handleCategoryPress('chart')}
        />
        <CategoryItem
          icon="🤝"
          label="Vay mua nhà"
          onPress={() => handleCategoryPress('loan')}
        />
        <CategoryItem
          icon="📖"
          label="Kinh nghiệm"
          onPress={() => handleCategoryPress('experience')}
        />
        <CategoryItem
          icon="🏆"
          label="Gói Hội Viên"
          onPress={() => handleCategoryPress('membership')}
        />
      </View>
    </View>
  );
};

export default Categories;
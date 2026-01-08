import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
    title: 'Khám Phá',
    highlight: 'Không Gian Hoàn Hảo',
    subtitle: 'Duyệt qua hàng nghìn tin đăng hoặc quản lý danh mục tài sản của bạn dễ dàng',
    price: '₫8.5 tỷ',
    name: 'Vinhomes Central Park',
    beds: '3 phòng ngủ',
    area: '120 m²',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    title: 'Tìm Kiếm',
    highlight: 'Ngôi Nhà Mơ Ước',
    subtitle: 'Khám phá các bất động sản đã xác minh từ các môi giới uy tín trong khu vực',
    price: '₫12.3 tỷ',
    name: 'Masteri Thảo Điền',
    beds: '4 phòng ngủ',
    area: '150 m²',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
    title: 'Quản Lý',
    highlight: 'Đầy Tự Tin',
    subtitle: 'Theo dõi tài sản và kết nối với người mua một cách liền mạch',
    price: '₫6.8 tỷ',
    name: 'The Sun Avenue',
    beds: '2 phòng ngủ',
    area: '95 m²',
  },
];

export default function OnboardingScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveSlide(slideIndex);
  };

  const handleCreateAccount = () => {
    router.push('/(auth)/register');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };


  const handleSkip = () => {
    router.push('/(tab)');
  }

  const currentSlide = SLIDES[activeSlide];

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      
      <View className="pt-14 px-6 pb-3 flex-row justify-end">
        <TouchableOpacity 
          onPress={handleSkip}
          className="px-5 py-2"
          activeOpacity={0.7}
        >
          <Text className="text-primary text-sm font-bold">Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-center mb-6">
        <View className="relative w-10 h-10 mr-3">
          <View className="absolute top-0 left-0 w-6 h-6 bg-primary rounded-lg" 
                style={{ transform: [{ rotate: '6deg' }] }} />
          <View className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-lg" 
                style={{ transform: [{ rotate: '-6deg' }] }} />
        </View>
        <Text className="text-3xl font-black text-slate-900">Bất động sản</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="flex-grow-0"
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} className="items-center px-5" style={{ width }}>
            <View className="bg-white rounded-3xl overflow-hidden shadow-2xl" 
                  style={{ 
                    width: width - 40, 
                    height: height * 0.45,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.2,
                    shadowRadius: 20,
                    elevation: 15,
                  }}>

              <View className='w-full h-full'>
                <Image
                source={{ uri: slide.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
              </View>
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                className="absolute inset-0"
              />
              
              <View className="absolute top-6 right-6 flex-row items-center bg-white/95 px-4 py-2.5 rounded-full"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: 5,
                    }}>
                <View className="w-5 h-5 bg-primary rounded-full items-center justify-center mr-2">
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
                <Text className="text-slate-900 text-xs font-bold">Đã Xác Minh</Text>
              </View>

              {/* <View className="absolute bottom-6 left-6 right-6 bg-white/95 rounded-2xl p-4"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 12,
                      elevation: 8,
                    }}>
              </View> */}
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row items-center justify-center my-5">
        {SLIDES.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              scrollViewRef.current?.scrollTo({ x: width * index, animated: true });
              setActiveSlide(index);
            }}
            activeOpacity={0.8}
          >
            <View 
              className={`rounded-full mx-1 ${
                index === activeSlide 
                  ? 'w-8 h-2 bg-primary' 
                  : 'w-2 h-2 bg-slate-300'
              }`}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View className="items-center px-6 mb-6">
        <Text className="text-4xl font-black text-slate-900 text-center leading-tight mb-1">
          {currentSlide.title}
        </Text>
        <Text className="text-4xl font-black text-primary text-center leading-tight mb-3">
          {currentSlide.highlight}
        </Text>
        <Text className="text-slate-600 text-base text-center leading-6 font-medium">
          {currentSlide.subtitle}
        </Text>
      </View>

      <View className="px-5 pb-8">
        <TouchableOpacity 
          onPress={handleCreateAccount}
          activeOpacity={0.8}
          className="bg-primary rounded-2xl py-4 items-center mb-4"
          style={{
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text className="text-white text-base font-bold tracking-wide">
            Tạo Tài Khoản
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center justify-center">
          <Text className="text-slate-600 text-sm font-medium">Đã có tài khoản? </Text>
          <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
            <Text className="text-blue-600 text-sm font-bold">Đăng Nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
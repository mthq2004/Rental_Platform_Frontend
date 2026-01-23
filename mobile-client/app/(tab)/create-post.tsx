import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import HeaderPost from '@/components/post/HeaderPost';
import ProgressBar from '@/components/post/ProgressBar';
import StepBasic from '@/components/post/steps/StepBasic';
import StepLocation from '@/components/post/steps/StepLocation';
import StepDetail from '@/components/post/steps/StepDetail';
import StepImages from '@/components/post/steps/StepImages';
import { PropertyFormData, PropertyType } from '@/types/property.type';
import StepAmenities from '@/components/post/steps/StepAmenities';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { createProperty, getPropertyById, resetMessage } from '@/store/slices/property.slice';
import { router, useLocalSearchParams } from 'expo-router';
import { Toast } from '@/components/Notification';

interface PropertyImage {
  id: string;
  uri: string;
  isPrimary: boolean;
}

const COMMON_AMENITIES: Record<PropertyType, string[]> = {
  apartment: ['Hồ bơi', 'Phòng gym', 'Sân chơi trẻ em', 'BBQ', 'An ninh 24/7', 'Thang máy', 'Chỗ đỗ xe'],
  house: ['Sân vườn', 'Gara ô tô', 'Sân thượng', 'An ninh'],
  villa: ['Hồ bơi riêng', 'Sân vườn', 'Gara ô tô', 'Phòng giúp việc', 'An ninh 24/7'],
  room: ['Máy lạnh', 'Nóng lạnh', 'WiFi', 'Giường', 'Tủ lạnh', 'Máy giặt chung'],
  office: ['WiFi tốc độ cao', 'Điều hòa', 'Thang máy', 'Bảo vệ 24/7', 'Chỗ đỗ xe'],
  shop: ['Vị trí mặt tiền', 'WiFi', 'Điều hòa', 'Chỗ đỗ xe'],
  warehouse: ['Cầu nâng', 'Khu để xe tải', 'An ninh', 'Chứng chỉ PCCC'],
  land: ['Vị trí đẹp', 'Gần trường học', 'Gần chợ', 'Đường rộng'],
};

const CreatePost = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAmenityModal, setShowAmenityModal] = useState(false);
   const { type, id } = useLocalSearchParams<{ type: string; id?: string }>();


  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const dispatch = useAppDispatch()
  const { loading, property, message, loadingProperty } = useAppSelector(state => state.property)

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    propertyType: (type?.toString() || "apartment") as PropertyType,
    listingType: 'rent',
    pricePerMonth: 0,
    depositAmount: '',
    depositMonths: 10,
    address: '',
    ward: '',
    district: '',
    city: '',
    country: 'Việt Nam',
    latitude: 1,
    longitude: 1,
    availableFrom: "",
    maximumLeaseMonths: "",
    minimumLeaseMonths: "1",
    areaSqm: 0,
    bedrooms: '',
    bathrooms: '',
    livingRooms: '',
    kitchens: '',
    balconies: '',
    floorNumber: '',
    totalFloors: '',
    furnitureStatus: 'empty',
    ownershipType: 'redBook',
    parkingFee: '',
    managementFee: '',
    electricityCostPerKwh: '',
    waterCostPerM3: '',
    hasFireCertificate: false,
    images: [],
    videos: [],
    amenities: [],
    rules: [],
    status: "pending_approval",
    approvalStatus: "pending"
  });

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề';
      if (!formData.description.trim()) newErrors.description = 'Vui lòng nhập mô tả';
      if (!formData.pricePerMonth) newErrors.pricePerMonth = 'Vui lòng nhập giá';
    }

    if (currentStep === 2) {
      if (!formData.city.trim()) newErrors.city = 'Vui lòng chọn tỉnh / thành phố';
      if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ';
      if (!formData.ward.trim()) newErrors.ward = 'Vui lòng chọn phường';
      if (!formData.district.trim()) newErrors.district = 'Vui lòng chọn quận';
      if (!formData.availableFrom) {
        newErrors.availableFrom = 'Vui lòng chọn ngày';
      } else {
        const selectedDate = new Date(formData.availableFrom);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
          newErrors.availableFrom = 'Ngày xem phải lớn hơn ngày hiện tại';
        }
      }
    }

    if (currentStep === 3) {
      if (!formData.areaSqm) newErrors.areaSqm = 'Vui lòng nhập diện tích';
    }

    if (currentStep === 4) {
      if (formData.images.length === 0) newErrors.images = 'Vui lòng tải lên ít nhất 1 hình ảnh';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      const nextStep = Math.min(step + 1, 5);
      setStep(nextStep);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });

      Animated.timing(progressAnim, {
        toValue: (nextStep - 1) / 4,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePrevious = () => {
    const prevStep = Math.max(step - 1, 1);
    setStep(prevStep);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });

    Animated.timing(progressAnim, {
      toValue: (prevStep - 1) / 4,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const toggleAmenity = (amenity: string) => {
    if (formData.amenities.includes(amenity)) {
      updateFormData({
        amenities: formData.amenities.filter(a => a !== amenity),
      });
    } else {
      updateFormData({
        amenities: [...formData.amenities, amenity],
      });
    }
  };

  const handleSubmit = () => {
    if (validateStep(step)) {
      console.log('dataa: ', formData);

      dispatch(createProperty(formData))
    }
  };


  useEffect(() => {
    if (!message) return;

    if (message.type === "success") {
      showToast('Lưu nháp thành công!', 'success')

      setTimeout(() => {
        router.replace('/(tab)/my-post')
      }, 100);
    }

    if (message.type === "error") {
      showToast('Lưu nháp thất bại!', 'error')
    }

    dispatch(resetMessage())
  }, [message]);

  useEffect(() => {
    if (id) {
      dispatch(getPropertyById(id));
    }
    }, [id]);


  useEffect(() => {
    if (!loadingProperty && property) {
      setFormData(property);
    }
  }, [loadingProperty, property]);


  const renderAmenityModal = () => (
    <Modal
      visible={showAmenityModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAmenityModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Chọn tiện ích</Text>
            <TouchableOpacity onPress={() => setShowAmenityModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap -m-1">
              {COMMON_AMENITIES[formData.propertyType]?.map((amenity, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => toggleAmenity(amenity)}
                  className={`m-1 px-4 py-2 rounded-xl ${formData.amenities.includes(amenity)
                    ? 'bg-blue-500'
                    : 'bg-gray-100'
                    }`}
                >
                  <Text
                    className={`text-sm font-medium ${formData.amenities.includes(amenity)
                      ? 'text-white'
                      : 'text-gray-700'
                      }`}
                  >
                    {amenity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={() => setShowAmenityModal(false)}
            className="bg-blue-500 rounded-xl py-4 mt-4"
          >
            <Text className="text-center text-white font-bold">Xong</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderNavigationButtons = () => (
    <View className="bg-white border-t border-gray-200 px-4 py-3">
      <View className="flex-row space-x-3 gap-3">
        {step > 1 && (
          <TouchableOpacity
            onPress={handlePrevious}
            className="flex-1 bg-gray-100 rounded-xl py-4 items-center"
          >
            <Text className="font-semibold text-gray-700">Quay lại</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          disabled={loading}
          onPress={step === 5 ? handleSubmit : handleNext}
          className={`flex-1 rounded-xl py-4 items-center ${loading ? "bg-gray-400" : "bg-blue-500"
            }`}
        >
          <Text className="font-bold text-white">
            {loading
              ? formData.status === "draft"
                ? "Đang lưu nháp..."
                : "Đang đăng..."
              : step === 5
                ? "Đăng tin"
                : "Tiếp tục"}
          </Text>

        </TouchableOpacity>

      </View>
    </View>
  );

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: any, type = 'success') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };


  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <HeaderPost formData={formData} showToast={showToast} />
        <ProgressBar step={step} progressAnim={progressAnim} />

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          {step === 1 && <StepBasic updateFormData={updateFormData} errors={errors} formData={formData} />}
          {step === 2 && <StepLocation updateFormData={updateFormData} errors={errors} formData={formData} />}
          {step === 3 && <StepDetail updateFormData={updateFormData} errors={errors} formData={formData} />}
          {step === 4 && <StepImages updateFormData={updateFormData} errors={errors} formData={formData} />}
          {step === 5 && <StepAmenities updateFormData={updateFormData} errors={errors} formData={formData} setShowAmenityModal={setShowAmenityModal} />}
        </ScrollView>

        {renderNavigationButtons()}
        {renderAmenityModal()}

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={3000}
          onHide={hideToast}
        />


      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePost;
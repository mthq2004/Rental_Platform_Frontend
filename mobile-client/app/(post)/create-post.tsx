import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { createProperty, getPropertyById, resetMessage, updateProperty } from '@/store/slices/property.slice';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Toast } from '@/components/Notification';
import { PROPERTY_META } from '@/constants/property.constant';

interface PropertyImage {
  id: string;
  uri: string;
  isPrimary: boolean;
}

const CreatePost = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAmenityModal, setShowAmenityModal] = useState(false);

  const { type, id, mode } = useLocalSearchParams<{ type: PropertyType; id?: string, mode?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dispatch = useAppDispatch()

  const { loading, property, message, loadingProperty } = useAppSelector(state => state.property)

  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';
  const amenities = PROPERTY_META[type]?.amenities;


  const initialFormData: PropertyFormData = {
    title: '',
    description: '',
    propertyType: (isCreate ? type : property?.propertyType || "apartment") as PropertyType,
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
    maximumLeaseMonths: 1,
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
  };
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);


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
      if (formData.areaSqm<=0) newErrors.areaSqm = 'Diện tích phải >0';
      if(formData.maximumLeaseMonths <=0 ) {
        newErrors.maximumLeaseMonths = 'Số tháng thuê tối đa phải >0';
      }
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

      if(mode === "edit" && id) {
        dispatch(updateProperty({ id, data: formData }))
      } else {
        dispatch(createProperty(formData))
      }
    }
  };

  useEffect(() => {
    if (!message) return;

    if (message.type === "success") {
      showToast(message.message, 'success')

      setFormData(initialFormData);
      setStep(1);
      setErrors({});
      progressAnim.setValue(0);
      setTimeout(() => {
        router.replace('/(tab)/(protected)/my-post')
      }, 500);
    }

    if (message.type === "error") {
      showToast(message.message, 'error')
    }

    dispatch(resetMessage())
  }, [message]);

  useFocusEffect(
    useCallback(() => {
      if (isCreate) {
        setFormData(initialFormData);
        setStep(1);
        setErrors({});
        progressAnim.setValue(0);
      }
    }, [isCreate])
  );

  useEffect(() => {
    if (isEdit && id) {
      dispatch(getPropertyById(id));
    }
  }, [isEdit, id]);

  useEffect(() => {
    if (isEdit && !loadingProperty && property) {
      setFormData(property);
    }
  }, [isEdit, loadingProperty, property]);

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
              {amenities?.map((amenity, idx) => (
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
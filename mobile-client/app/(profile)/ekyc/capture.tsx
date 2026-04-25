import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';
import { COLORS } from '@/utils/colors';
import {
  CreditCard,
  Camera,
  User,
  Zap,
  ImageIcon,
  ChevronRight,
  Check,
  Shield,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { verifyKyc, saveForAdmin } from '@/store/slices/kyc.slice';
import { getProfile } from '@/store/slices/auth.slice';
import { Toast } from '@/components/Notification';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Step = 1 | 2 | 3;

const STEP_CONFIG: Record<Step, { title: string; subtitle: string; instruction: string; icon: any }> = {
  1: {
    title: 'Chụp mặt trước CCCD',
    subtitle: 'STEP 1 OF 3',
    instruction: 'Đặt thẻ CCCD vào trong khung hình. Đảm bảo ảnh rõ nét, không bị lóa sáng.',
    icon: CreditCard,
  },
  2: {
    title: 'Chụp mặt sau CCCD',
    subtitle: 'STEP 2 OF 3',
    instruction: 'Vui lòng đặt mặt sau của thẻ vào trong khung hình. Đảm bảo hình ảnh rõ nét, không bị lóa sáng.',
    icon: CreditCard,
  },
  3: {
    title: 'Chụp ảnh khuôn mặt',
    subtitle: 'STEP 3 OF 3',
    instruction: 'Vui lòng đưa khuôn mặt vào khung hình. Giữ camera ngang tầm mắt.',
    icon: User,
  },
};

const EkycCaptureScreen = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.kyc);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [images, setImages] = useState<{ front: string | null; back: string | null; selfie: string | null }>({
    front: null,
    back: null,
    selfie: null,
  });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message: string, type = 'success') => {
    setToast({ visible: true, message, type });
  };
  const hideToast = () => setToast((prev) => ({ ...prev, visible: false }));

  const config = STEP_CONFIG[currentStep];
  const imageKey = currentStep === 1 ? 'front' : currentStep === 2 ? 'back' : 'selfie';
  const currentImage = images[imageKey];

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Thông báo', 'Bạn cần cấp quyền camera để chụp ảnh.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      // Selfie: portrait 3:4 for full face; CCCD: landscape 86:54 (standard ID card ratio)
      aspect: currentStep === 3 ? [3, 4] : [86, 54],
      quality: 0.9,
      cameraType: currentStep === 3 ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
    });

    if (!result.canceled) {
      setImages((prev) => ({ ...prev, [imageKey]: result.assets[0].uri }));
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      // Same ratios as camera: Selfie 3:4, CCCD 86:54
      aspect: currentStep === 3 ? [3, 4] : [86, 54],
      quality: 0.9,
    });

    if (!result.canceled) {
      setImages((prev) => ({ ...prev, [imageKey]: result.assets[0].uri }));
    }
  };

  const handleNext = () => {
    if (!currentImage) {
      showToast('Vui lòng chụp ảnh trước khi tiếp tục', 'error');
      return;
    }

    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    } else {
      handleSubmit();
    }
  };

  const handleRetake = () => {
    setImages((prev) => ({ ...prev, [imageKey]: null }));
  };

  const handleSubmit = async () => {
    if (!images.front || !images.back || !images.selfie) {
      showToast('Vui lòng hoàn tất tất cả các bước', 'error');
      return;
    }

    try {
      const formData = new FormData();

      formData.append('frontImage', {
        uri: images.front,
        name: `kyc_front_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      formData.append('backImage', {
        uri: images.back,
        name: `kyc_back_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      formData.append('selfieImage', {
        uri: images.selfie,
        name: `kyc_selfie_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      await dispatch(verifyKyc(formData)).unwrap();
      await dispatch(saveForAdmin(formData)).unwrap();
      await dispatch(getProfile()).unwrap();

      showToast('Xác thực eKYC thành công! Đang chờ phê duyệt.', 'success');

      setTimeout(() => {
        router.back();
        router.back(); // Go back past the intro screen too
      }, 2000);
    } catch (error: any) {
      showToast(typeof error === 'string' ? error : 'Xác thực eKYC thất bại', 'error');
    }
  };

  // Progress bar
  const progress = (currentStep / 3) * 100;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#111827' }}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (currentStep > 1) {
              setCurrentStep((prev) => (prev - 1) as Step);
            } else {
              router.back();
            }
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Identity Verification</Text>
          <Text style={[styles.headerSubtitle, { color: '#0d9488' }]}>{config.subtitle}</Text>
        </View>
        <Shield size={22} color="#0d9488" />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Step Badge */}
      <View style={styles.stepBadge}>
        <View style={[styles.stepBadgeInner, { backgroundColor: isDark ? '#1e3a5f' : '#1e293b' }]}>
          <config.icon size={16} color="#0d9488" />
          <Text style={styles.stepBadgeText}>{config.title}</Text>
        </View>
      </View>

      {/* Instruction */}
      <Text style={styles.instruction}>{config.instruction}</Text>

      {/* Capture Area */}
      <View style={styles.captureArea}>
        {currentImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: currentImage }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.previewOverlay}>
              <Check size={48} color="#0d9488" />
              <Text style={styles.previewText}>Ảnh đã chụp</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderFrame}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <config.icon size={48} color="rgba(13,148,136,0.3)" />
            <Text style={styles.placeholderText}>
              {currentStep === 3 ? 'Đặt khuôn mặt vào đây' : 'Đặt thẻ vào đây'}
            </Text>
          </View>
        )}
      </View>

      {/* Auto brightness indicator */}
      <View style={styles.brightnessBar}>
        <Zap size={14} color="#f59e0b" />
        <Text style={styles.brightnessText}>Tự động điều chỉnh độ sáng</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionArea}>
        {currentImage ? (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handleRetake} style={styles.retakeBtn}>
              <Camera size={22} color="#fff" />
              <Text style={styles.retakeBtnText}>Chụp lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              disabled={loading}
              style={[styles.nextBtn, { backgroundColor: '#0d9488', opacity: loading ? 0.7 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>
                    {currentStep === 3 ? 'Hoàn tất' : 'Tiếp tục'}
                  </Text>
                  <ChevronRight size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.captureRow}>
            <TouchableOpacity onPress={handlePickFromGallery} style={styles.galleryBtn}>
              <ImageIcon size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleTakePhoto} style={styles.shutterBtn}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleTakePhoto} style={styles.flashBtn}>
              <Zap size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Security footer */}
      <View style={styles.securityFooter}>
        <Shield size={12} color="#6b7280" />
        <Text style={styles.securityText}>END-TO-END ENCRYPTED SECURITY</Text>
      </View>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} duration={3000} onHide={hideToast} />
    </SafeAreaView>
  );
};

const FRAME_W = SCREEN_WIDTH - 80;
const FRAME_H = FRAME_W * 0.65;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: 2,
  },
  stepBadge: {
    alignItems: 'center',
    marginTop: 24,
  },
  stepBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  stepBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  instruction: {
    color: '#d1d5db',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 16,
    lineHeight: 20,
  },
  captureArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderFrame: {
    width: FRAME_W,
    height: FRAME_H,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(13,148,136,0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(13,148,136,0.05)',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 8,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#0d9488',
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  previewContainer: {
    width: FRAME_W,
    height: FRAME_H,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0d9488',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 8,
  },
  brightnessBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  brightnessText: {
    color: '#f59e0b',
    fontSize: 12,
    marginLeft: 6,
  },
  actionArea: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  galleryBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  flashBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  retakeBtnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 4,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  securityText: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 6,
  },
});

export default EkycCaptureScreen;

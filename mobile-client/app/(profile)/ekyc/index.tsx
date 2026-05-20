import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { COLORS } from '@/utils/colors';
import { useAppSelector } from '@/store/hook';
import {
  Shield,
  CreditCard,
  Camera,
  User,
  AlertTriangle,
  Lock,
  ChevronRight,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const EkycIntroScreen = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAppSelector((state) => state.auth);

  const steps = [
    {
      number: 1,
      title: 'Chụp mặt trước CMND/CCCD',
      desc: 'Đảm bảo thẻ nằm trong khung hình và đủ ánh sáng.',
      icon: CreditCard,
      color: '#0d9488',
    },
    {
      number: 2,
      title: 'Chụp mặt sau CMND/CCCD',
      desc: 'Kiểm tra thông tin mã vạch và các ký tự rõ nét.',
      icon: CreditCard,
      color: '#3b82f6',
    },
    {
      number: 3,
      title: 'Chụp ảnh khuôn mặt (Selfie)',
      desc: 'Giữ điện thoại ngang tầm mắt và thực hiện theo yêu cầu chuyển động (nếu có).',
      icon: User,
      color: '#8b5cf6',
    },
  ];

  const tips = [
    { icon: Eye, title: 'Không lóa sáng', desc: 'Tránh ánh sáng trực tiếp chiếu vào thẻ' },
    { icon: Camera, title: 'Ảnh rõ nét', desc: 'Ảnh chụp rõ nét, không bị rung tay' },
    { icon: EyeOff, title: 'Không che khuất', desc: 'Không dùng ngón tay hay vật phẩm che thông tin' },
  ];

  // 1. STATE: VERIFIED / APPROVED
  if (user?.kycStatus === 'verified' || user?.kycStatus === 'approved') {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark justify-center items-center">
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.centerCard}>
          <View style={[styles.iconOuter, { backgroundColor: isDark ? '#042f2e' : '#e6f4ea' }]}>
            <CheckCircle2 size={64} color="#10b981" />
          </View>
          <Text className="text-foreground dark:text-foreground-dark text-2xl font-bold mt-6 text-center">
            Tài khoản đã xác minh!
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-3 text-center px-6 leading-5">
            Chúc mừng! Hồ sơ KYC của bạn đã được xác thực thành công. Bạn hiện có quyền truy cập đầy đủ vào tất cả các tính năng của nền tảng.
          </Text>
          
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backCta, { backgroundColor: '#0d9488' }]}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. STATE: PENDING REVIEW / IN_REVIEW
  if (user?.kycStatus === 'in_review') {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark justify-center items-center">
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.centerCard}>
          <View style={[styles.iconOuter, { backgroundColor: isDark ? '#1a1005' : '#fff7ed' }]}>
            <Clock size={64} color="#f97316" />
          </View>
          <Text className="text-foreground dark:text-foreground-dark text-2xl font-bold mt-6 text-center">
            Đang chờ duyệt hồ sơ
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-3 text-center px-6 leading-5">
            Hồ sơ eKYC của bạn đang được quản trị viên thẩm định thủ công. Vui lòng chờ phản hồi trong thời gian sớm nhất.
          </Text>
          
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backCta, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}
            activeOpacity={0.85}
          >
            <Text className="text-foreground dark:text-foreground-dark font-bold text-base">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 3. STATE: UNVERIFIED OR REJECTED (SHOW INTRO)
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 60,
        backgroundColor: isDark ? '#111827' : '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#1F2937' : '#F3F4F6',
        zIndex: 1000
      }}>
        <View style={{ zIndex: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#374151'} />
          </TouchableOpacity>
        </View>

        <View style={{
          position: 'absolute',
          left: 0, right: 0, top: 0, bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 5,
          pointerEvents: 'none'
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#FFF' : '#111827',
            letterSpacing: -0.3
          }}>
            Identity Verification
          </Text>
        </View>

        <View style={{ zIndex: 10 }}>
          <Shield size={22} color="#0d9488" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Rejection Card Alert */}
        {user?.kycStatus === 'rejected' && (
          <View style={[styles.rejectionCard, { backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderColor: isDark ? '#7f1d1d' : '#fecaca' }]}>
            <AlertTriangle size={22} color="#ef4444" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 14 }}>Hồ sơ KYC bị từ chối</Text>
              <Text className="text-gray-500 dark:text-gray-300 text-xs mt-1 leading-4 font-medium">
                Lý do từ chối: {user?.kycRejectionReason || 'Ảnh có thể bị mờ, lóa hoặc không khớp. Vui lòng thử lại.'}
              </Text>
            </View>
          </View>
        )}

        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={[styles.secureBadge, { backgroundColor: isDark ? '#042f2e' : '#ccfbf1' }]}>
            <Lock size={14} color="#0d9488" />
            <Text style={{ color: '#0d9488', fontWeight: '600', fontSize: 12, marginLeft: 6 }}>
              SECURE ACCESS
            </Text>
          </View>

          <Text className="text-foreground dark:text-foreground-dark text-2xl font-bold mt-4 leading-8">
            Xác minh danh tính để{'\n'}đảm bảo an toàn
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-5">
            Chúng tôi yêu cầu xác minh eKYC để xây dựng một cộng đồng thuê nhà tin cậy, minh bạch và bảo mật cho tất cả mọi người.
          </Text>
        </View>

        {/* Security Notice */}
        <View style={[styles.securityCard, { backgroundColor: isDark ? '#0f172a' : '#f0fdfa' }]}>
          <View style={[styles.securityIcon, { backgroundColor: isDark ? '#065f46' : '#ccfbf1' }]}>
            <Lock size={20} color="#0d9488" />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-foreground dark:text-foreground-dark font-bold text-sm">
              Thông tin của bạn được bảo mật
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-4">
              Dữ liệu được mã hóa chuẩn ngân hàng và chỉ sử dụng cho mục đích xác thực danh tính thuê nhà.
            </Text>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsSection}>
          <Text className="text-foreground dark:text-foreground-dark text-base font-bold mb-4">
            Các bước thực hiện
          </Text>

          {steps.map((step) => (
            <View
              key={step.number}
              style={[styles.stepCard, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#f3f4f6' }]}
            >
              <View style={[styles.stepNumber, { backgroundColor: step.color + '20' }]}>
                <Text style={{ color: step.color, fontWeight: '800', fontSize: 16 }}>{step.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-foreground dark:text-foreground-dark font-bold text-sm">
                  {step.title}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-4">
                  {step.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
            LƯU Ý KHI CHỤP ẢNH
          </Text>

          <View style={[styles.tipsContainer, { backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
            {tips.map((tip, idx) => (
              <View
                key={idx}
                style={[
                  styles.tipItem,
                  idx < tips.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#e5e7eb' },
                ]}
              >
                <View style={[styles.tipIcon, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
                  <tip.icon size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="text-foreground dark:text-foreground-dark font-bold text-sm">{tip.title}</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{tip.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            onPress={() => router.push('/(profile)/ekyc/capture')}
            style={[styles.ctaButton, { backgroundColor: '#0d9488' }]}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Bắt đầu ngay</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>

          <Text className="text-gray-400 text-xs text-center mt-3">
            Quá trình này mất khoảng 2 phút
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerCard: {
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backCta: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  rejectionCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  securityCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  tipsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ctaSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
});

export default EkycIntroScreen;

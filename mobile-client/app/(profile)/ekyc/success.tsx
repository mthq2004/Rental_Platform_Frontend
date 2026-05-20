import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useAppSelector } from '@/store/hook';

const { width } = Dimensions.get('window');

export default function EkycSuccessScreen() {
  const isDark = useColorScheme().colorScheme === 'dark';
  const { user } = useAppSelector((state) => state.auth);

  const isInstantVerified = user?.kycStatus === 'verified' || user?.kycStatus === 'approved';
  const isInReview = user?.kycStatus === 'in_review';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : (isInstantVerified ? '#f0fdfa' : '#fff7ed'), justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={[styles.pulse, { backgroundColor: isDark ? (isInstantVerified ? '#115e59' : '#7c2d12') : (isInstantVerified ? '#ccfbf1' : '#ffedd5') }]} />
          <View style={[styles.iconInner, { backgroundColor: isInstantVerified ? '#0d9488' : '#f97316' }]}>
            {isInstantVerified ? (
              <CheckCircle2 size={48} color="#fff" />
            ) : (
              <Clock size={48} color="#fff" />
            )}
          </View>
        </View>

        <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
          {isInstantVerified ? 'Xác thực thành công!' : 'Đang chờ phê duyệt'}
        </Text>
        
        <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#475569' }]}>
          {isInstantVerified 
            ? 'Hồ sơ eKYC của bạn đã được hệ thống AI xác minh hoàn tất. Bạn hiện có thể đăng tin cho thuê và sử dụng đầy đủ dịch vụ.'
            : 'Hồ sơ của bạn đã được gửi thành công đến quản trị viên để thẩm định thủ công. Chúng tôi sẽ thông báo cho bạn ngay khi có kết quả.'
          }
        </Text>

        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <ShieldCheck size={20} color={isInstantVerified ? '#0d9488' : '#f97316'} />
          <Text style={[styles.infoText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            Thông tin của bạn được bảo mật an toàn.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: isInstantVerified ? '#0d9488' : '#f97316' }]}
          onPress={() => {
            router.navigate('/(tab)');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Quay về trang cá nhân</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    width: 120,
    height: 120,
  },
  pulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.5,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');

export default function EkycSuccessScreen() {
  const isDark = useColorScheme().colorScheme === 'dark';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f0fdfa', justifyContent: 'center', alignItems: 'center' }}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={[styles.pulse, { backgroundColor: isDark ? '#115e59' : '#ccfbf1' }]} />
          <View style={[styles.iconInner, { backgroundColor: '#0d9488' }]}>
            <CheckCircle2 size={48} color="#fff" />
          </View>
        </View>

        <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
          Xác thực thành công!
        </Text>
        
        <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#475569' }]}>
          Hồ sơ eKYC của bạn đã được gửi thành công và đang được hệ thống chờ xử lý. Chúng tôi sẽ thông báo cho bạn ngay khi có kết quả.
        </Text>

        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <ShieldCheck size={20} color="#0d9488" />
          <Text style={[styles.infoText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            Thông tin của bạn được bảo mật an toàn.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.button}
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
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
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
    backgroundColor: '#0d9488',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0d9488',
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

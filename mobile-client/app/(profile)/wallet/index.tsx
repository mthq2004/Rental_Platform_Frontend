import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, ActivityIndicator, Image, Dimensions, Modal, TextInput, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { router, useFocusEffect } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getWalletOverview, getWalletTransactions, initiateWalletTopup } from '@/store/slices/wallet.slice';
import { useColorScheme } from 'nativewind';
import {
  ArrowLeft,
  HelpCircle,
  PlusCircle,
  CreditCard,
  Home,
  MoreHorizontal,
  AlertCircle,
  History,
  ChevronRight,
  X
} from 'lucide-react-native';
import { COLORS } from '@/utils/colors';

const { width } = Dimensions.get('window');

const WALLET_TYPE_MAP: Record<string, string> = {
  withdraw: 'Rút tiền về ngân hàng',
  refund: 'Hoàn tiền',
  pay_rent: 'Thanh toán thuê nhà',
  receive_rent: 'Nhận tiền thuê nhà',
  deposit: 'Nạp tiền',
  hold_deposit: 'Đặt cọc',
  security_deposit: 'Ký quỹ',
  fee: 'Phí',
};

const WALLET_STATUS_MAP: Record<string, string> = {
  pending: 'ĐANG XỬ LÝ',
  success: 'THÀNH CÔNG',
  failed: 'THẤT BẠI',
};

const WALLET_STATUS_THEME: Record<string, { color: string; bg: string }> = {
  pending: { color: '#d97706', bg: '#fef3c7' }, // Amber
  success: { color: '#059669', bg: '#d1fae5' }, // Emerald
  failed: { color: '#dc2626', bg: '#fee2e2' },  // Red
};

export default function WalletScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dispatch = useAppDispatch();

  const { overview, transactions, overviewLoading, transactionsLoading, topupLoading } = useAppSelector(state => state.wallet);
  const [refreshing, setRefreshing] = useState(false);

  const [topupModalVisible, setTopupModalVisible] = useState(false);
  const [topupMethod, setTopupMethod] = useState<'momo' | 'vnpay'>('vnpay');
  const [topupAmount, setTopupAmount] = useState('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    dispatch(getWalletOverview());
    dispatch(getWalletTransactions({ page: 1, limit: 10 }));
  }, [dispatch]);

  const handleTopupSubmit = async () => {
    const amount = Number(topupAmount.replace(/[^0-9]/g, ''));
    if (!amount || amount < 10000) {
      Alert.alert('Lỗi', 'Số tiền nạp tối thiểu là 10.000đ');
      return;
    }

    try {
      const resultAction = await dispatch(initiateWalletTopup({ amount, method: topupMethod }));
      if (initiateWalletTopup.fulfilled.match(resultAction)) {
        setTopupModalVisible(false);
        setTopupAmount('');
        const data: any = resultAction.payload;
        console.log("kiem tra url payemtn data:", JSON.stringify(data, null, 2));

        // Deep search for payment URL since different gateways/interceptors wrap it differently
        let url = null;
        if (data?.paymentUrl) url = data.paymentUrl;
        else if (data?.data?.paymentUrl) url = data.data.paymentUrl;
        else if (data?.payUrl) url = data.payUrl;
        else if (data?.data?.payUrl) url = data.data.payUrl;
        else if (data?.redirectUrl) url = data.redirectUrl;
        else if (data?.data?.redirectUrl) url = data.data.redirectUrl;
        else if (typeof data === 'string' && /^https?:\/\//i.test(data)) url = data;

        console.log("kiem tra url payemtn extracted:", url);

        if (url && /^https?:\/\//i.test(String(url))) {
          setPaymentUrl(url);
        } else {
          Alert.alert('Thành công', 'Đã tạo lệnh nạp tiền. Vui lòng kiểm tra trạng thái trong ít phút.');
        }
      } else {
        Alert.alert('Lỗi', resultAction.payload as string || 'Khởi tạo nạp tiền thất bại');
      }
    } catch (e: any) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo lệnh nạp tiền');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Helper render Icon dựa theo loại giao dịch
  const renderTxIcon = (type: string, status: string) => {
    if (status === 'failed') {
      return (
        <View style={[styles.txIconWrap, { backgroundColor: '#fee2e2' }]}>
          <AlertCircle size={22} color="#dc2626" />
        </View>
      );
    }
    if (type === 'rental_payment' || type === 'payment') {
      return (
        <View style={[styles.txIconWrap, { backgroundColor: '#e0e7ff' }]}>
          <Home size={22} color="#4f46e5" />
        </View>
      );
    }
    if (type === 'withdraw') {
      return (
        <View style={[styles.txIconWrap, { backgroundColor: '#fef3c7' }]}>
          <MoreHorizontal size={22} color="#d97706" />
        </View>
      );
    }
    // Default topup/success
    return (
      <View style={[styles.txIconWrap, { backgroundColor: '#d1fae5' }]}>
        <PlusCircle size={22} color="#059669" />
      </View>
    );
  };

  const renderTransaction = (item: any) => {
    const isPositive = ['topup', 'refund', 'commission'].includes(item.type);
    const theme = WALLET_STATUS_THEME[item.status] || WALLET_STATUS_THEME.pending;

    return (
      <View key={item.id} style={[styles.txCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
        <View style={styles.txLeft}>
          {renderTxIcon(item.type, item.status)}
          <View style={styles.txInfo}>
            <Text style={[styles.txTitle, { color: isDark ? '#f9fafb' : '#111827' }]} numberOfLines={1}>
              {WALLET_TYPE_MAP[item.type] || item.type}
            </Text>
            <Text style={styles.txDate}>
              {new Date(item.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isDark ? '#f9fafb' : '#111827' }]}>
            {isPositive ? '+' : ''}{item.amount?.toLocaleString('vi-VN')}đ
          </Text>
          <View style={[styles.statusPill, { backgroundColor: theme.bg }]}>
            <Text style={[styles.statusText, { color: theme.color }]}>
              {WALLET_STATUS_MAP[item.status] || item.status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (paymentUrl) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#fff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#1F2937' : '#eee', backgroundColor: isDark ? '#111827' : '#fff' }}>
          <TouchableOpacity onPress={() => setPaymentUrl(null)} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color={isDark ? '#fff' : '#111827'} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: isDark ? '#fff' : '#111827' }}>Cổng thanh toán</Text>
        </View>
        <WebView
          source={{ uri: paymentUrl }}
          onNavigationStateChange={(navState) => {
            if (navState.url.includes('/payment/vnpay_return') || navState.url.includes('returnUrl') || navState.url.includes('vnpay_return')) {
              setPaymentUrl(null)
              Alert.alert('Thông báo', 'Giao dịch của bạn đang được xử lý. Vui lòng kiểm tra lại trạng thái trong ít phút.', [
                { text: 'OK', onPress: () => loadData() },
              ])
            }
          }}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f8fafc' }}>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
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
            Ví cá nhân
          </Text>
        </View>

        <View style={{ zIndex: 10 }}>
          <TouchableOpacity style={styles.iconBtn}>
            <HelpCircle size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCircleDecoration} />
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <View style={styles.balanceAmountWrap}>
            <Text style={styles.balanceValue}>
              {overviewLoading && !overview ? '---' : overview?.availableBalance?.toLocaleString('vi-VN') || '15.420.000'}
            </Text>
            <Text style={styles.balanceCurrency}> VND</Text>
          </View>

          <View style={styles.mainActions}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              activeOpacity={0.8}
              onPress={() => {
                setTopupMethod('vnpay');
                setTopupModalVisible(true);
              }}
            >
              <PlusCircle size={20} color="#2563eb" />
              <Text style={styles.primaryActionText}>Nạp tiền</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryActionBtn} activeOpacity={0.8}>
              <CreditCard size={20} color="#ffffff" />
              <Text style={styles.secondaryActionText}>Rút tiền</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#f9fafb' : '#334155' }]}>Phương thức nạp tiền</Text>
          <View style={styles.paymentMethodsRow}>
            <TouchableOpacity
              style={[styles.methodCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
              activeOpacity={0.7}
              onPress={() => {
                setTopupMethod('momo');
                setTopupModalVisible(true);
              }}
            >
              <Image
                source={{ uri: 'https://developers.momo.vn/v3/assets/images/square-8c08a00f550e40a2efafea4a005b1232.png' }}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={[styles.methodName, { color: isDark ? '#d1d5db' : '#334155' }]}>MoMo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
              activeOpacity={0.7}
              onPress={() => {
                setTopupMethod('vnpay');
                setTopupModalVisible(true);
              }}
            >
              <Image
                source={{ uri: 'https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg' }}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={[styles.methodName, { color: isDark ? '#d1d5db' : '#334155' }]}>VNPay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#f9fafb' : '#334155' }]}>Lịch sử giao dịch</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.txList}>
            {transactionsLoading && transactions.length === 0 ? (
              <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
            ) : transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <History size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
              </View>
            ) : (
              transactions.map(renderTransaction)
            )}
          </View>
        </View>

        {/* Promo Banner */}
        <TouchableOpacity activeOpacity={0.9} style={[styles.promoBanner, { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Tích lũy điểm thưởng</Text>
            <Text style={styles.promoDesc}>Thanh toán tiền nhà qua ví để nhận ngay 2% hoàn tiền vào tài khoản.</Text>
            <TouchableOpacity style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>Tìm hiểu thêm</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoImageWrap}>
            {/* Giả lập ảnh minh họa điện thoại/thẻ */}
            <View style={styles.mockPhone}>
              <View style={styles.mockScreen} />
            </View>
            <View style={styles.mockCard} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Topup Modal */}
      <Modal
        visible={topupModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTopupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>
                Nạp tiền ({topupMethod === 'momo' ? 'MoMo' : 'VNPay'})
              </Text>
              <TouchableOpacity onPress={() => setTopupModalVisible(false)} style={{ padding: 4 }}>
                <X size={24} color={isDark ? "#d1d5db" : "#6b7280"} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: isDark ? '#d1d5db' : '#4b5563' }]}>Số tiền cần nạp (VND)</Text>
              <TextInput
                style={[styles.amountInput, {
                  backgroundColor: isDark ? '#374151' : '#f3f4f6',
                  color: isDark ? '#f9fafb' : '#111827',
                  borderColor: isDark ? '#4b5563' : '#e5e7eb'
                }]}
                keyboardType="numeric"
                placeholder="VD: 50000"
                placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                value={topupAmount}
                onChangeText={(text) => {
                  const num = text.replace(/[^0-9]/g, '');
                  if (num) {
                    setTopupAmount(Number(num).toLocaleString('vi-VN'));
                  } else {
                    setTopupAmount('');
                  }
                }}
              />
              <Text style={styles.inputHint}>Tối thiểu 10.000đ</Text>

              <TouchableOpacity
                style={[styles.submitTopupBtn, topupLoading && { opacity: 0.7 }]}
                activeOpacity={0.8}
                onPress={handleTopupSubmit}
                disabled={topupLoading}
              >
                {topupLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitTopupText}>Xác nhận nạp tiền</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Balance Card
  balanceCard: {
    backgroundColor: '#2563eb', // Blue theme
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  balanceCircleDecoration: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    marginBottom: 8,
  },
  balanceAmountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 28,
  },
  balanceValue: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  balanceCurrency: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 4,
  },
  mainActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  secondaryActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  // Payment Methods
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  methodCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginBottom: 12,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Transactions
  txList: {
    gap: 12,
  },
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  txDate: {
    fontSize: 13,
    color: '#64748b',
  },
  txRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  // Promo Banner
  promoBanner: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
    overflow: 'hidden',
  },
  promoContent: {
    flex: 1,
    paddingRight: 16,
  },
  promoTitle: {
    color: '#1e40af',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  promoDesc: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  promoBtn: {
    backgroundColor: '#005baa',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  promoBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  promoImageWrap: {
    width: 80,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  // Khối giả lập hình ảnh bên phải Banner cho giống hình
  mockPhone: {
    width: 60,
    height: 100,
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 3,
    transform: [{ rotate: '-5deg' }],
  },
  mockScreen: {
    flex: 1,
    backgroundColor: '#38bdf8',
    borderRadius: 5,
  },
  mockCard: {
    position: 'absolute',
    bottom: 10,
    right: -10,
    width: 45,
    height: 30,
    backgroundColor: '#0284c7',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    transform: [{ rotate: '15deg' }],
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    marginBottom: 20,
  },
  submitTopupBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitTopupText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  }
});
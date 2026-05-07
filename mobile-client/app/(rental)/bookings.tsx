import React, { useCallback, useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl, TextInput, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AuthGuard from '@/components/AuthGuard'
import BackButton from '@/components/BackButton'
import { useThemeColors } from '@/utils/colors'
import { Ionicons } from '@expo/vector-icons'
import { Calendar, User, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native'
import contractService from '@/services/contract.service'
import { useRouter } from 'expo-router'
import { useColorScheme } from 'react-native'
import { StyleSheet } from 'react-native'
import ScreenHeader from '@/components/common/ScreenHeader'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Chờ xác nhận', color: '#B45309', bg: '#FFFBEB', icon: 'time-outline' },
  confirmed: { label: 'Đã xác nhận', color: '#166534', bg: '#F0FDF4', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Đã từ chối', color: '#B91C1C', bg: '#FEF2F2', icon: 'close-circle-outline' },
  cancelled: { label: 'Đã hủy', color: '#6B7280', bg: '#F9FAFB', icon: 'ban-outline' },
  completed: { label: 'Hoàn thành', color: '#0369A1', bg: '#EFF6FF', icon: 'checkmark-done-outline' },
}

const fmtDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('vi-VN')
}

const fmtTime = (v?: string) => {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export default function BookingsScreen() {
  const theme = useThemeColors() as any
  const current = theme.current
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'my' | 'owner'>('my')
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [ownerBookings, setOwnerBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [detailItem, setDetailItem] = useState<any | null>(null)
  const [noteModal, setNoteModal] = useState<string | null>(null)
  const [landlordNote, setLandlordNote] = useState('')
  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const unwrap = (res: any) => res?.data?.data ?? res?.data ?? res

  const loadBookings = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    try {
      const [myRes, ownerRes] = await Promise.all([
        contractService.getMyBookings().catch(() => null),
        contractService.getOwnerBookings().catch(() => null),
      ])
      const myData = unwrap(myRes)
      const ownerData = unwrap(ownerRes)
      setMyBookings(Array.isArray(myData) ? myData : myData?.items || myData?.data || [])
      setOwnerBookings(Array.isArray(ownerData) ? ownerData : ownerData?.items || ownerData?.data || [])
    } catch { /* silent */ }
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadBookings() }, [loadBookings])

  const handleConfirm = async (bookingId: string) => {
    if (noteModal === bookingId && landlordNote.trim()) {
      setActionLoading(true)
      try {
        await contractService.confirmBooking(bookingId, landlordNote)
        Alert.alert('Thành công', 'Đã xác nhận lịch xem')
        setNoteModal(null)
        setLandlordNote('')
        loadBookings(false)
      } catch (e: any) {
        Alert.alert('Lỗi', e?.message || 'Xác nhận thất bại')
      } finally { setActionLoading(false) }
    } else {
      setNoteModal(bookingId)
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(true)
    try {
      await contractService.rejectBooking(rejectModal, rejectReason)
      Alert.alert('Thành công', 'Đã từ chối lịch xem')
      setRejectModal(null)
      setRejectReason('')
      loadBookings(false)
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Từ chối thất bại')
    } finally { setActionLoading(false) }
  }

  const handleCancel = (bookingId: string) => {
    Alert.alert('Hủy lịch xem', 'Bạn có chắc chắn muốn hủy lịch xem này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy lịch', style: 'destructive', onPress: async () => {
          setActionLoading(true)
          try {
            await contractService.cancelBooking(bookingId)
            Alert.alert('Thành công', 'Đã hủy lịch xem')
            loadBookings(false)
          } catch (e: any) {
            Alert.alert('Lỗi', e?.message || 'Hủy thất bại')
          } finally { setActionLoading(false) }
        }
      }
    ])
  }

  const bookings = activeTab === 'my' ? myBookings : ownerBookings

  const renderBookingCard = (item: any, isOwner: boolean) => {
    const st = STATUS_MAP[item.status] || STATUS_MAP.pending
    return (
      <View key={item.bookingId} style={{
        backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border,
        marginBottom: 10, overflow: 'hidden',
      }}>
        <View style={{ padding: 14, gap: 8 }}>


          {/* Date & Time */}
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={14} color={theme.textInactive} />
              <Text style={{ fontSize: 12, color: theme.textInactive }}>{fmtDate(item.visitDate)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={14} color={theme.textInactive} />
              <Text style={{ fontSize: 12, color: theme.textInactive }}>
                {fmtTime(item.visitTimeStart)}{item.visitTimeEnd ? ` - ${fmtTime(item.visitTimeEnd)}` : ''}
              </Text>
            </View>
          </View>

          {/* Tenant info (for owner view) */}
          {isOwner && item.tenant && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <User size={14} color={theme.textInactive} />
              <Text style={{ fontSize: 12, color: current.text, fontWeight: '600' }}>
                {item.tenant?.fullName || 'Khách hàng'}
              </Text>
              {item.tenantPhone && (
                <Text style={{ fontSize: 11, color: theme.textInactive }}> · {item.tenantPhone}</Text>
              )}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={{ borderTopWidth: 1, borderTopColor: current.border, flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => setDetailItem(item)}
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: current.border }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B82F6' }}>Chi tiết</Text>
          </TouchableOpacity>

          {!isOwner && item.status === 'pending' && (
            <TouchableOpacity
              onPress={() => handleCancel(item.bookingId)}
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#DC2626' }}>Hủy</Text>
            </TouchableOpacity>
          )}

          {isOwner && item.status === 'pending' && (
            <>
              <TouchableOpacity
                onPress={() => handleConfirm(item.bookingId)}
                style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: current.border }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#16A34A' }}>Xác nhận</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRejectModal(item.bookingId)}
                style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#DC2626' }}>Từ chối</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    )
  }

  return (
    <AuthGuard>
      <SafeAreaView style={{ flex: 1, backgroundColor: current.background }} edges={['top']}>
        <ScreenHeader title="Quản lý lịch xem nhà" />

        {/* Tab bar */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 12, backgroundColor: current.card, borderRadius: 14, borderWidth: 1, borderColor: current.border, overflow: 'hidden' }}>
          {(['my', 'owner'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1, paddingVertical: 12, alignItems: 'center',
                backgroundColor: activeTab === tab ? '#3B82F6' : 'transparent',
                borderRadius: activeTab === tab ? 12 : 0,
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: '700',
                color: activeTab === tab ? '#FFF' : theme.textInactive,
              }}>
                {tab === 'my' ? `Lịch của tôi (${myBookings.length})` : `Yêu cầu nhận (${ownerBookings.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1, padding: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookings(false) }} />}
          >
            {bookings.length === 0 ? (
              <View style={{ paddingTop: 60, alignItems: 'center' }}>
                <Calendar size={48} color={theme.textInactive} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: current.text, marginTop: 16 }}>
                  {activeTab === 'my' ? 'Bạn chưa có lịch xem nào' : 'Chưa có yêu cầu xem nhà'}
                </Text>
                <Text style={{ fontSize: 13, color: theme.textInactive, marginTop: 6, textAlign: 'center' }}>
                  {activeTab === 'my' ? 'Đặt lịch xem nhà trên trang chi tiết bất động sản.' : 'Lịch xem nhà từ người thuê sẽ hiển thị tại đây.'}
                </Text>
              </View>
            ) : (
              bookings.map(item => renderBookingCard(item, activeTab === 'owner'))
            )}
            <View style={{ height: 30 }} />
          </ScrollView>
        )}

        {/* Detail Modal */}
        <Modal visible={!!detailItem} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: current.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
              <View style={{ width: 40, height: 4, backgroundColor: current.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: current.text, marginBottom: 16 }}>Chi tiết lịch xem</Text>

              {detailItem && (
                <View style={{ gap: 10 }}>
                  <InfoRow label="Bất động sản" value={detailItem.property?.title || detailItem.propertyId} />
                  <InfoRow label="Ngày xem" value={fmtDate(detailItem.visitDate)} />
                  <InfoRow label="Thời gian" value={`${fmtTime(detailItem.visitTimeStart)}${detailItem.visitTimeEnd ? ` - ${fmtTime(detailItem.visitTimeEnd)}` : ''}`} />
                  <InfoRow label="Trạng thái" value={STATUS_MAP[detailItem.status]?.label || detailItem.status} />
                  {detailItem.tenant && <InfoRow label="Khách hàng" value={detailItem.tenant.fullName || 'N/A'} />}
                  {detailItem.tenantPhone && <InfoRow label="SĐT" value={detailItem.tenantPhone} />}
                  {detailItem.numberOfVisitors && <InfoRow label="Số người" value={String(detailItem.numberOfVisitors)} />}
                  {detailItem.tenantNote && (
                    <View>
                      <Text style={{ fontSize: 12, color: theme.textInactive, marginBottom: 4 }}>Ghi chú khách:</Text>
                      <Text style={{ fontSize: 13, color: current.text, backgroundColor: current.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: current.border }}>{detailItem.tenantNote}</Text>
                    </View>
                  )}
                  {detailItem.landlordNote && (
                    <View>
                      <Text style={{ fontSize: 12, color: theme.textInactive, marginBottom: 4 }}>Ghi chú chủ nhà:</Text>
                      <Text style={{ fontSize: 13, color: current.text, backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE' }}>{detailItem.landlordNote}</Text>
                    </View>
                  )}
                  {detailItem.cancellationReason && (
                    <View>
                      <Text style={{ fontSize: 12, color: theme.textInactive, marginBottom: 4 }}>Lý do hủy:</Text>
                      <Text style={{ fontSize: 13, color: '#B91C1C', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' }}>{detailItem.cancellationReason}</Text>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity onPress={() => setDetailItem(null)} style={{ marginTop: 20, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#3B82F6' }}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Confirm Note Modal */}
        <Modal visible={!!noteModal} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
            <View style={{ backgroundColor: current.background, borderRadius: 20, padding: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: current.text, marginBottom: 12 }}>Xác nhận lịch xem</Text>
              <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 8 }}>Thêm ghi chú cho khách (tùy chọn):</Text>
              <TextInput
                value={landlordNote}
                onChangeText={setLandlordNote}
                placeholder="VD: Vui lòng đến đúng giờ..."
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1, borderColor: current.border, borderRadius: 12, padding: 12,
                  fontSize: 13, color: current.text, backgroundColor: current.card, textAlignVertical: 'top', minHeight: 80,
                }}
                placeholderTextColor={theme.textInactive}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => { setNoteModal(null); setLandlordNote('') }}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: current.border }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textInactive }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => noteModal && handleConfirm(noteModal)}
                  disabled={actionLoading}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#16A34A' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>
                    {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Reject Modal */}
        <Modal visible={!!rejectModal} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
            <View style={{ backgroundColor: current.background, borderRadius: 20, padding: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#DC2626', marginBottom: 12 }}>Từ chối lịch xem</Text>
              <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 8 }}>Lý do từ chối:</Text>
              <TextInput
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Nhập lý do từ chối..."
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1, borderColor: current.border, borderRadius: 12, padding: 12,
                  fontSize: 13, color: current.text, backgroundColor: current.card, textAlignVertical: 'top', minHeight: 80,
                }}
                placeholderTextColor={theme.textInactive}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => { setRejectModal(null); setRejectReason('') }}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: current.border }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textInactive }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleReject}
                  disabled={actionLoading}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#DC2626' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>
                    {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </AuthGuard>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useThemeColors() as any
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontSize: 13, color: theme.textInactive }}>{label}:</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.current.text }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
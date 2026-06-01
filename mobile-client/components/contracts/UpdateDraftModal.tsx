import React, { useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import SyncTextInput from '@/components/common/SyncTextInput'
import { useThemeColors } from '@/utils/colors'

type Props = {
  visible: boolean
  loading?: boolean
  onClose: () => void
  onSubmit: (values: { expiresInHours: number; updateNote?: string }) => void
}

export default function UpdateDraftModal({ visible, loading, onClose, onSubmit }: Props) {
  const theme = useThemeColors() as any
  const current = theme.current
  const [expiresInHours, setExpiresInHours] = useState('72')
  const [updateNote, setUpdateNote] = useState('')

  const handleSubmit = () => {
    const hours = parseInt(expiresInHours, 10)
    if (!hours || hours < 1 || hours > 720) return
    onSubmit({
      expiresInHours: hours,
      updateNote: updateNote.trim() || undefined,
    })
  }

  const handleClose = () => {
    if (loading) return
    setExpiresInHours('72')
    setUpdateNote('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: current.background,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: '88%',
            }}
          >
            <View style={{ width: 40, height: 4, backgroundColor: current.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 24, paddingBottom: 32 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#EFF6FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="create-outline" size={22} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: current.text }}>
                    Chỉnh sửa hợp đồng
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textInactive, marginTop: 2 }}>
                    Tạo bản nháp từ hợp đồng đang hiệu lực
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 14,
                  padding: 14,
                  borderLeftWidth: 3,
                  borderLeftColor: '#3B82F6',
                  marginBottom: 20,
                  marginTop: 12,
                }}
              >
                <Text style={{ fontSize: 13, lineHeight: 20, color: '#475569' }}>
                  Hệ thống tạo bản nháp chỉnh sửa. Sau khi hoàn tất và gửi, cả hai bên ký số xác nhận.
                  Bản chỉnh sửa chỉ có hiệu lực khi cả hai bên đồng thuận.
                </Text>
              </View>

              <Text style={{ fontSize: 13, fontWeight: '600', color: current.text, marginBottom: 8 }}>
                Thời hạn xác nhận (giờ) <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <SyncTextInput
                value={expiresInHours}
                onChangeText={setExpiresInHours}
                keyboardType="number-pad"
                placeholder="72"
                placeholderTextColor={theme.textInactive}
                style={{
                  borderWidth: 1,
                  borderColor: current.border,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 15,
                  color: current.text,
                  backgroundColor: current.card,
                  marginBottom: 6,
                }}
              />
              <Text style={{ fontSize: 11, color: theme.textInactive, marginBottom: 18 }}>
                Quá thời hạn mà chưa ký, bản chỉnh sửa sẽ bị hủy tự động (1–720 giờ).
              </Text>

              <Text style={{ fontSize: 13, fontWeight: '600', color: current.text, marginBottom: 8 }}>
                Ghi chú / Lý do chỉnh sửa
              </Text>
              <SyncTextInput
                value={updateNote}
                onChangeText={setUpdateNote}
                multiline
                numberOfLines={3}
                placeholder="Ví dụ: Điều chỉnh giá thuê, gia hạn thời hạn..."
                placeholderTextColor={theme.textInactive}
                style={{
                  borderWidth: 1,
                  borderColor: current.border,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 14,
                  color: current.text,
                  backgroundColor: current.card,
                  minHeight: 88,
                  textAlignVertical: 'top',
                }}
              />

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 28 }}>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={loading}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: current.border,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: current.text }}>Đóng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  style={{
                    flex: 2,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: '#4F46E5',
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={18} color="#FFF" />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>
                        Tạo bản nháp
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

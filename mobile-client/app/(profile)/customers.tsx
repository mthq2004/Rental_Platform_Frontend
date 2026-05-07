import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Modal, Image } from 'react-native'
import { User } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { getMyContracts, getOwnerRequests } from '@/store/slices/contract.slice'
import { createConversation } from '@/store/slices/conversation.slice'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'

const formatMoney = (val: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0) + ' VNĐ';

const CustomerManagementScreen = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { contracts, ownerRequests, loading } = useAppSelector(state => state.contract)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  useEffect(() => {
    dispatch(getMyContracts({ limit: 1000 }))
    dispatch(getOwnerRequests())
  }, [dispatch])

  const customersData = useMemo(() => {
    const map = new Map<string, any>()
    const safeContracts = Array.isArray(contracts) ? contracts : []
    const safeRequests = Array.isArray(ownerRequests) ? ownerRequests : []

    const extractProfile = (source: any) => ({
      name: source?.name || source?.fullName || source?.displayName || null,
      email: source?.email || null,
      phone: source?.phone || source?.phoneNumber || source?.phoneRaw || null,
      avatarUrl: source?.avatarUrl || source?.avatar || null,
    })

    const upsert = (tenantId: string, profileSource: any) => {
      if (!tenantId) return null
      if (!map.has(tenantId)) {
        map.set(tenantId, {
          id: tenantId,
          ...extractProfile(profileSource),
          status: "PROSPECT",
          activeContracts: 0,
          totalContracts: 0,
          totalRent: 0,
          rentingProperties: new Set<string>(),
          contractsList: [],
          requestsList: [],
          joinDate: new Date().toISOString(),
        })
      }
      const entry = map.get(tenantId)!
      const profile = extractProfile(profileSource)
      if (profile.name && !entry.name) entry.name = profile.name
      if (profile.email && !entry.email) entry.email = profile.email
      if (profile.phone && !entry.phone) entry.phone = profile.phone
      if (profile.avatarUrl && !entry.avatarUrl) entry.avatarUrl = profile.avatarUrl
      return entry
    }

    safeRequests.forEach((req: any) => {
      const tenantId = req.tenantId
      if (!tenantId) return
      const entry = upsert(tenantId, req.tenant || {})
      if (!entry) return
      entry.requestsList.push(req)
      if (req.createdAt && req.createdAt < entry.joinDate) entry.joinDate = req.createdAt
      const propName = req.property?.title || req.propertyId
      if (propName) entry.rentingProperties.add(propName)
    })

    safeContracts.forEach((c: any) => {
      const tenantId = c.tenant?.id || c.tenantId
      if (!tenantId) return
      const entry = upsert(tenantId, c.tenant || {})
      if (!entry) return
      entry.totalContracts += 1
      entry.totalRent += Number(c.monthlyRent || 0)
      entry.contractsList.push(c)
      if (c.createdAt && c.createdAt < entry.joinDate) entry.joinDate = c.createdAt
      if (c.status === "active") {
        entry.activeContracts += 1
        entry.status = "ACTIVE"
      } else if (entry.status !== "ACTIVE") {
        entry.status = "INACTIVE"
      }
      const propName = c.property?.title || c.propertyName
      if (propName) entry.rentingProperties.add(propName)
    })

    return Array.from(map.values()).map((t) => ({
      ...t,
      displayName: t.name || (t.email ? t.email.split("@")[0] : null) || `KH #${t.id.substring(0, 6).toUpperCase()}`,
      rentingProperties: Array.from(t.rentingProperties),
      contractsList: [...t.contractsList].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      requestsList: [...t.requestsList].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }))
  }, [contracts, ownerRequests])

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return customersData
    return customersData.filter((c) =>
      c.displayName.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term)
    )
  }, [customersData, searchTerm])
  
  const handleMessageCustomer = async (customer: any) => {
    try {
      const conv = await dispatch(createConversation(customer.id)).unwrap();
      setSelectedCustomer(null);
      router.push({
        pathname: "/(tab)/(protected)/chat",
        params: { conversationId: conv.id }
      });
    } catch (err: any) {
      Alert.alert("Lỗi", typeof err === 'string' ? err : "Không thể tạo cuộc trò chuyện");
    }
  }

  const renderCustomer = ({ item }: { item: any }) => {
    const isProspect = item.status === 'PROSPECT'
    const isActive = item.status === 'ACTIVE'
    
    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#FFF',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#F3F4F6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
        onPress={() => setSelectedCustomer(item)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isActive ? '#10B981' : isProspect ? '#3B82F6' : '#9CA3AF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            {item.avatarUrl && item.avatarUrl !== "https://i.pravatar.cc/300" ? (
              <Image source={{ uri: item.avatarUrl }} style={{ width: 48, height: 48 }} />
            ) : (
              <User size={24} color="#FFF" />
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{item.displayName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{ backgroundColor: isActive ? '#D1FAE5' : isProspect ? '#DBEAFE' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: isActive ? '#065F46' : isProspect ? '#1E40AF' : '#4B5563' }}>
                  {isActive ? 'ĐANG THUÊ' : isProspect ? 'TIỀM NĂNG' : 'KHÁCH CŨ'}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>Từ {format(new Date(item.joinDate), 'MM/yyyy')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>

        <View style={{ flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>{isProspect ? 'Yêu cầu thuê' : 'Hợp đồng'}</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>
              {isProspect ? `${item.requestsList.length} yêu cầu` : `${item.activeContracts}/${item.totalContracts} hiệu lực`}
            </Text>
          </View>
          {!isProspect && (
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Doanh thu dự kiến</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#10B981' }}>{formatMoney(item.totalRent)}/tháng</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', zIndex: 1000
      }}>
        <View style={{ zIndex: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={24} color={'#111827'} />
          </TouchableOpacity>
        </View>

        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 5, pointerEvents: 'none' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', letterSpacing: -0.3 }}>Quản lý khách hàng</Text>
        </View>
        <View style={{ width: 40, zIndex: 10 }} />
      </View>

      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5E7EB', height: 48 }}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Tìm kiếm khách hàng..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={{ flex: 1, marginLeft: 8, fontSize: 15, color: '#111827' }}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={item => item.id}
          renderItem={renderCustomer}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={{ marginTop: 12, fontSize: 16, color: '#6B7280', fontWeight: '500' }}>Không tìm thấy khách hàng</Text>
            </View>
          }
        />
      )}

      {/* Customer Detail Modal */}
      <Modal visible={!!selectedCustomer} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedCustomer(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Chi tiết hồ sơ</Text>
            <TouchableOpacity onPress={() => setSelectedCustomer(null)} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {selectedCustomer && (
            <FlatList
              data={[]}
              renderItem={() => null}
              ListHeaderComponent={
                <View style={{ padding: 16 }}>
                  {/* Profile Header */}
                  <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: selectedCustomer.status === 'ACTIVE' ? '#10B981' : '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' }}>
                      {selectedCustomer.avatarUrl && selectedCustomer.avatarUrl !== "https://i.pravatar.cc/300" ? (
                        <Image source={{ uri: selectedCustomer.avatarUrl }} style={{ width: 80, height: 80 }} />
                      ) : (
                        <User size={40} color="#FFF" />
                      )}
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>{selectedCustomer.displayName}</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>ID: {selectedCustomer.id.substring(0, 8)}</Text>
                  </View>

                  {/* Contact Info */}
                  <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase' }}>Liên hệ</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Ionicons name="mail" size={20} color="#3B82F6" />
                      <Text style={{ marginLeft: 12, fontSize: 15, color: '#111827' }}>{selectedCustomer.email || 'Không có email'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="call" size={20} color="#10B981" />
                      <Text style={{ marginLeft: 12, fontSize: 15, color: '#111827' }}>{selectedCustomer.phone || 'Không có sđt'}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => handleMessageCustomer(selectedCustomer)}
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#4F46E5', 
                        paddingVertical: 12, 
                        borderRadius: 12, 
                        marginTop: 16,
                        gap: 8
                      }}
                    >
                      <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Nhắn tin cho khách</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Requests */}
                  {selectedCustomer.requestsList.length > 0 && (
                    <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase' }}>Yêu cầu thuê ({selectedCustomer.requestsList.length})</Text>
                      {selectedCustomer.requestsList.map((req: any, index: number) => (
                        <View key={index} style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: '#F3F4F6', paddingTop: index === 0 ? 0 : 12, marginTop: index === 0 ? 0 : 12 }}>
                          <Text style={{ fontWeight: '600', color: '#111827' }}>{req.property?.title || 'BĐS'}</Text>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={{ color: '#6B7280', fontSize: 13 }}>Giá đề xuất: {formatMoney(req.proposedRent)}</Text>
                            <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>{req.status}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Contracts */}
                  {selectedCustomer.contractsList.length > 0 && (
                    <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase' }}>Hợp đồng ({selectedCustomer.contractsList.length})</Text>
                      {selectedCustomer.contractsList.map((req: any, index: number) => (
                        <View key={index} style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: '#F3F4F6', paddingTop: index === 0 ? 0 : 12, marginTop: index === 0 ? 0 : 12 }}>
                          <Text style={{ fontWeight: '600', color: '#111827' }}>{req.property?.title || 'BĐS'}</Text>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={{ color: '#6B7280', fontSize: 13 }}>Giá thuê: {formatMoney(req.monthlyRent)}</Text>
                            <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>{req.status}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

export default CustomerManagementScreen

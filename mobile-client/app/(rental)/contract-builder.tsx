import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Alert, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { createContract, getRequestTemplateData, getTemplateDetail } from '@/store/slices/contract.slice'
import contractService from '@/services/contract.service'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from '@/components/BackButton'
import { Ionicons } from '@expo/vector-icons'
import WebView from 'react-native-webview'
import { format } from 'date-fns'
import { FIELD_STANDARD } from '@/constants/fieldDefinitions'
import ScreenHeader from '@/components/common/ScreenHeader'

function nameToLabel(name: string) {
  const part = name.includes('.') ? name.split('.').pop()! : name
  return part
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

function generateContractCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'HD-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const TERM_VARIABLES = [
  { name: "custom.generalTerms", type: "string", label: "Điều khoản chung", readonly: false },
  { name: "custom.specialTerms", type: "string", label: "Điều khoản riêng", readonly: false },
];

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  let res: Record<string, any> = {}
  for (const key in obj) {
    const value = obj[key]
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(res, flattenObject(value, newKey))
    } else {
      res[newKey] = value
    }
  }
  return res
}

function renderTemplate(html: string, formData: Record<string, any>) {
  const map: Record<string, string> = {}
  for (const [k, v] of Object.entries(formData)) {
    // Convert newlines to <br> for HTML rendering
    const val = v != null ? String(v).replace(/\n/g, '<br>') : ''
    map[k] = val
    const parts = k.split('.')
    if (parts.length > 1) {
      const short = parts.slice(1).join('.')
      if (!(short in map)) map[short] = map[k]
    }
  }
  let result = html.replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
    const key = rawKey.trim()
    const raw = map[key]
    if (raw !== undefined && raw !== '') {
      const lk = key.toLowerCase()
      // Skip date/money formatting if it contains HTML (like <br>) or is a multi-line string
      const isMultiline = raw.includes('<br>')
      if (!isMultiline) {
        if (lk.includes('date') || lk.includes('day')) return formatDate(raw)
        if (lk.includes('amount') || lk.includes('rent') || lk.includes('price') || lk.includes('fee') || lk.includes('deposit') || lk.includes('cost') || lk.includes('money')) return formatMoney(raw)
      }
      return String(raw)
    }
    // Field not filled → return empty string to hide it
    return ''
  })

  // Remove table rows where all cells are empty
  result = result.replace(/<tr[^>]*>(?:(?!<tr).)*<\/tr>/gi, (row) => {
    const cellContents = row.match(/<td[^>]*>(.*?)<\/td>/gi) || []
    const allEmpty = cellContents.length > 0 && cellContents.every(cell => {
      const content = cell.replace(/<[^>]+>/g, '').trim()
      return content === '' || content === '0' || content === 'null'
    })
    if (allEmpty) return ''
    return row
  })

  return result
}

function formatDate(val: any): string {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return String(val)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function formatMoney(val: any): string {
  if (val == null || val === '') return ''
  const num = Number(val)
  if (isNaN(num)) return String(val)
  return new Intl.NumberFormat('vi-VN').format(num) + ' VNĐ'
}

function normalizeTemplateDocumentHtml(html: string) {
  return String(html || '')
    .replace(/overflow-y\s*:\s*auto\s*;?/gi, '')
    .replace(/overflow-x\s*:\s*auto\s*;?/gi, '')
    .replace(/overflow\s*:\s*auto\s*;?/gi, '')
    .replace(/max-height\s*:\s*[^;\"]+;?/gi, '')
    .replace(/height\s*:\s*(?:\d+(?:\.\d+)?vh|calc\([^)]*\))\s*;?/gi, '')
}

const ContractBuilderScreen = () => {
  const { templateId, requestId } = useLocalSearchParams<{ templateId: string, requestId: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.contract);

  const [template, setTemplate] = useState<any>(null);
  const [requestData, setRequestData] = useState<any>(null);
  const [contractHtml, setContractHtml] = useState('');
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('edit');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const templateVariables = useMemo(() => {
    if (!template) return [] as { name: string; type?: string; label: string; readonly?: boolean }[]
    const raw = template.templateVariables || template.templateVariables || []
    
    let keys: string[] = []
    if (Array.isArray(raw)) {
      keys = raw.map((v: any) => v.name)
    } else {
      keys = Object.keys(raw || {})
    }

    const vars = keys.map((key) => {
      const standard = FIELD_STANDARD.find((f) => f.name === key)
      return {
        name: key,
        type: standard?.type || 'string',
        label: standard?.label || nameToLabel(key),
        readonly: standard?.readonly || false,
      }
    });

    for (const termField of TERM_VARIABLES) {
      if (!vars.some((v) => v.name === termField.name)) {
        vars.push(termField);
      }
    }

    return vars;
  }, [template])

  const loadData = useCallback(async () => {
    if (!templateId || !requestId) {
      Alert.alert('Lỗi', 'Thiếu thông tin mẫu hoặc yêu cầu.', [{ text: 'OK', onPress: () => router.back() }]);
      return
    }
    try {
      const [templateDetailResponse, reqDataResponse] = await Promise.all([
        dispatch(getTemplateDetail(templateId)).unwrap(),
        dispatch(getRequestTemplateData(requestId)).unwrap(),
      ]);
      const templateDetail = (templateDetailResponse as any)?.data ?? templateDetailResponse
      const reqData = (reqDataResponse as any)?.data ?? reqDataResponse

      setTemplate(templateDetail);
      setRequestData(reqData);

      const rawVars = templateDetail?.templateVariables || {}
      const variableList: { name: string; type?: string }[] = Array.isArray(rawVars)
        ? (rawVars as any[]).map((v: any) => ({ name: v.name, type: v.type }))
        : Object.keys(rawVars || {}).map((k) => ({ name: k, type: rawVars[k] }));

      const allowedKeys = variableList.map((v) => v.name)
      const flat = flattenObject(reqData || {})
      const initialFormValues: Record<string, any> = {}
      
      for (const key of allowedKeys) {
        if (flat[key] != null) initialFormValues[key] = flat[key]
      }

      // Property type localization
      if (initialFormValues["property.type"]) {
        const typeMap: Record<string, string> = {
          apartment: "Căn hộ chung cư",
          house: "Nhà nguyên căn",
          room: "Phòng trọ",
          office: "Văn phòng",
          shop: "Mặt bằng kinh doanh",
        };
        const propertyTypeValue = String(initialFormValues["property.type"]);
        initialFormValues["property.type"] = typeMap[propertyTypeValue] || propertyTypeValue;
      }

      // Smart mapping
      const propertyToContractMap: Record<string, string> = {
        "property.monthlyRent": "contract.monthlyRent",
        "property.depositAmount": "contract.depositAmount",
        "property.electricityCostPerKwh": "contract.electricityCostPerKwh",
        "property.waterCostPerM3": "contract.waterCostPerM3",
        "property.parkingFee": "contract.parkingFee",
        "property.managementFee": "contract.managementFee",
        "property.internetFee": "contract.internetFee",
        "property.area": "contract.usableArea",
      };

      for (const [propKey, constKey] of Object.entries(propertyToContractMap)) {
        if (flat[propKey] != null && (initialFormValues[constKey] == null || initialFormValues[constKey] === "")) {
          if (allowedKeys.includes(constKey)) {
            initialFormValues[constKey] = flat[propKey];
          }
        }
      }

      // 🏠 Default signing location: use owner's address if not provided
      const signingLocationKeys = ["contract.signingLocation", "contract.location"];
      for (const locKey of signingLocationKeys) {
        if (allowedKeys.includes(locKey) && !initialFormValues[locKey]) {
          const ownerAddress = flat["owner.address"];
          if (ownerAddress) {
            initialFormValues[locKey] = ownerAddress;
          }
        }
      }

      if (initialFormValues['contract.startDate'] && initialFormValues['contract.endDate'] && !initialFormValues['contract.durationMonths']) {
        const start = new Date(String(initialFormValues['contract.startDate']));
        const end = new Date(String(initialFormValues['contract.endDate']));
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
          if (months < 1) months = 1;
          initialFormValues['contract.durationMonths'] = months;
        }
      }

      const defaultTerms = templateDetail.defaultTerms || {};
      const defaultTermKeyMap: Record<string, string> = {
        paymentDueDay: "contract.paymentDueDay",
        gracePeriodDays: "contract.gracePeriodDays",
        lateFeePerDay: "contract.lateFeePerDay",
        autoRenewal: "contract.autoRenewal",
        renewalNoticeDays: "contract.renewalNoticeDays",
        earlyTerminationFee: "contract.earlyTerminationFee",
      };

      Object.entries(defaultTerms).forEach(([key, val]) => {
        const mappedKey = defaultTermKeyMap[key] ?? key;
        if (allowedKeys.includes(mappedKey) && (initialFormValues[mappedKey] == null || initialFormValues[mappedKey] === "")) {
          if (typeof val === "string") {
            // Convert <br> or literal \n to real newlines for editing
            initialFormValues[mappedKey] = val.replace(/\\n/g, "\n").replace(/<br\s*\/?>/gi, "\n");
          } else {
            initialFormValues[mappedKey] = val;
          }
        }
      });

      for (const termField of TERM_VARIABLES) {
        if (allowedKeys.includes(termField.name) && initialFormValues[termField.name] == null) {
          initialFormValues[termField.name] = "";
        }
      }

      if (!initialFormValues['contract.contractNumber']) {
        initialFormValues['contract.contractNumber'] = generateContractCode();
      }
      if (!initialFormValues['contract.contractDate']) {
        initialFormValues['contract.contractDate'] = new Date().toISOString().split('T')[0];
      }

      if (!initialFormValues['contract.startDate'] && reqData?.startDate) initialFormValues['contract.startDate'] = format(new Date(reqData.startDate), 'yyyy-MM-dd')
      if (!initialFormValues['contract.endDate'] && reqData?.endDate) initialFormValues['contract.endDate'] = format(new Date(reqData.endDate), 'yyyy-MM-dd')
      if (!initialFormValues['contract.monthlyRent'] && reqData?.proposedRent) initialFormValues['contract.monthlyRent'] = reqData.proposedRent
      if (!initialFormValues['contract.depositAmount'] && reqData?.property?.depositAmount) initialFormValues['contract.depositAmount'] = reqData.property.depositAmount
      if (!initialFormValues['property.name'] && reqData?.property?.title) initialFormValues['property.name'] = reqData.property.title
      if (!initialFormValues['property.address'] && reqData?.property?.address) initialFormValues['property.address'] = reqData.property.address

      setFormValues(initialFormValues)

      const tplHtml = templateDetail.templateContent || templateDetail.content || ''
      setContractHtml(renderTemplate(normalizeTemplateDocumentHtml(tplHtml), initialFormValues))

    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải dữ liệu hợp đồng.');
    }
  }, [dispatch, templateId, requestId, router]);

  useEffect(() => {
    loadData()
  }, [loadData]);

  const handleSaveDraft = async () => {
    if (!template || !requestData) return
    try {
      if (!requestData?.property?.id || !requestData?.owner?.id || !requestData?.tenant?.id) {
        throw new Error('Thiếu thông tin bất động sản hoặc người dùng để tạo hợp đồng')
      }

      const savedContractId = requestData?.contract?.id || requestData?.draftContract?.id || requestId
      const payload = {
        templateId: template.templateId,
        propertyId: requestData.property.id,
        ownerId: requestData.owner.id,
        tenantId: requestData.tenant.id,
        fromRequestId: savedContractId,
        startDate: new Date(requestData.contract?.startDate || requestData.startDate).toISOString(),
        endDate: new Date(requestData.contract?.endDate || requestData.endDate).toISOString(),
        monthlyRent: Number(
          formValues['property.monthlyRent'] ?? formValues['contract.monthlyRent'] ?? requestData.proposedRent
        ),
        depositAmount: Number(
          formValues['property.depositAmount'] ?? formValues['contract.depositAmount'] ?? requestData?.property?.depositAmount
        ),
        contractData: Object.fromEntries(
          Object.entries(formValues).map(([k, v]) => [
            k, 
            typeof v === 'string' ? v.replace(/\n/g, '<br>') : v
          ])
        ),
        contractHtml,
      }
      const result = await dispatch(createContract(payload)).unwrap()
      const createdContract = (result as any)?.data ?? result
      Alert.alert('Thành công', `Đã tạo hợp đồng nháp #${createdContract?.contractCode || createdContract?.rentalCode || ''}.`, [
        { text: 'OK', onPress: () => router.replace('/(rental)/contracts') }
      ])
    } catch (e: any) {
      Alert.alert('Vui lòng thử lại', e || 'Không thể lưu hợp đồng nháp.');
    }
  }

  const handleSend = async () => {
    if (!template || !requestData) return
    try {
      if (!requestData?.property?.id || !requestData?.owner?.id || !requestData?.tenant?.id) {
        throw new Error('Thiếu thông tin bất động sản hoặc người dùng để tạo hợp đồng')
      }

      const savedContractId = requestData?.contract?.id || requestData?.draftContract?.id || requestId
      const payload = {
        templateId: template.templateId,
        propertyId: requestData.property.id,
        ownerId: requestData.owner.id,
        tenantId: requestData.tenant.id,
        fromRequestId: savedContractId,
        startDate: new Date(requestData.contract?.startDate || requestData.startDate).toISOString(),
        endDate: new Date(requestData.contract?.endDate || requestData.endDate).toISOString(),
        monthlyRent: Number(
          formValues['contract.monthlyRent'] ?? formValues['property.monthlyRent'] ?? requestData.proposedRent
        ),
        depositAmount: Number(
          formValues['contract.depositAmount'] ?? formValues['property.depositAmount'] ?? requestData?.property?.depositAmount
        ),
        contractData: Object.fromEntries(
          Object.entries(formValues).map(([k, v]) => [
            k, 
            typeof v === 'string' ? v.replace(/\n/g, '<br>') : v
          ])
        ),
        contractHtml,
      }
      const result = await dispatch(createContract(payload)).unwrap()
      const createdContract = (result as any)?.data ?? result
      const contractId = createdContract?.contractId || createdContract?.id || createdContract?.rentalId
      if (contractId) {
        await contractService.sendContractToTenant(contractId)
      }
      Alert.alert('Thành công', 'Đã gửi hợp đồng tới người thuê.', [ { text: 'OK', onPress: () => router.replace('/(rental)/contracts') } ])
    } catch (e: any) {
      Alert.alert('Vui lòng thử lại', e?.message || 'Không thể gửi hợp đồng.')
    }
  }

  if (!template || !requestData) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 16, color: '#6B7280', fontSize: 14 }}>Đang thiết lập trình soạn thảo...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Soạn hợp đồng" subtitle={template.name} />

      {/* Tabs */}
      <View style={{ flexDirection: 'row', padding: 4, backgroundColor: '#F3F4F6', marginHorizontal: 16, marginVertical: 8, borderRadius: 12 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('edit')}
          style={{
            flex: 1,
            flexDirection: 'row',
            paddingVertical: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: activeTab === 'edit' ? '#FFF' : 'transparent',
            borderRadius: 10,
            shadowColor: activeTab === 'edit' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: activeTab === 'edit' ? 2 : 0,
          }}
        >
          <Ionicons name="create-outline" size={18} color={activeTab === 'edit' ? '#4F46E5' : '#6B7280'} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: activeTab === 'edit' ? '#4F46E5' : '#6B7280' }}>
            Thông tin
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('preview')}
          style={{
            flex: 1,
            flexDirection: 'row',
            paddingVertical: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: activeTab === 'preview' ? '#FFF' : 'transparent',
            borderRadius: 10,
            shadowColor: activeTab === 'preview' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: activeTab === 'preview' ? 2 : 0,
          }}
        >
          <Ionicons name="eye-outline" size={18} color={activeTab === 'preview' ? '#4F46E5' : '#6B7280'} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: activeTab === 'preview' ? '#4F46E5' : '#6B7280' }}>
            Xem trước
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {activeTab === 'preview' ? (
          <View style={{ flex: 1, backgroundColor: '#E5E7EB', padding: 16 }}>
            <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, overflow: 'hidden' }}>
              <WebView
                originWhitelist={['*']}
                source={{ html: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" /><style>body{font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Times New Roman', Times, serif; color: #111827; background: #FFF; margin:0; padding:20px; line-height: 1.6;} img{max-width:100%;height:auto} table { width: 100%; border-collapse: collapse; } td, th { border: 1px solid #d1d5db; padding: 8px; }</style></head><body>${contractHtml}</body></html>` }}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
            <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Biến số hợp đồng</Text>
              
              {templateVariables.map((v) => {
                const key = v.name
                const val = formValues[key] ?? ''
                const isLong = key.toLowerCase().includes('terms') || key.toLowerCase().includes('address') || key.toLowerCase().includes('description') || key.toLowerCase().includes('content')
                const isFocused = focusedField === key

                return (
                  <View key={key} style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: '#374151', fontSize: 14, fontWeight: '600' }}>
                          {v.label}
                        </Text>
                        {!v.readonly && <Text style={{ color: '#EF4444', marginLeft: 4 }}>*</Text>}
                      </View>
                      {v.readonly && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Ionicons name="lock-closed" size={10} color="#9CA3AF" />
                          <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginLeft: 4, textTransform: 'uppercase' }}>Hệ thống</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={{
                      flexDirection: 'row',
                      alignItems: isLong ? 'flex-start' : 'center',
                      backgroundColor: v.readonly ? '#F9FAFB' : (isFocused ? '#FFF' : '#FFF'),
                      borderWidth: 1.5,
                      borderColor: v.readonly ? '#F3F4F6' : (isFocused ? '#4F46E5' : '#E5E7EB'),
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      shadowColor: isFocused && !v.readonly ? '#4F46E5' : 'transparent',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: isFocused && !v.readonly ? 2 : 0,
                    }}>
                      <TextInput
                        value={val != null ? String(val) : ''}
                        editable={!v.readonly}
                        onFocus={() => !v.readonly && setFocusedField(key)}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={(text) => {
                          if (v.readonly) return;
                          const newValues = { ...formValues, [key]: text }
                          setFormValues(newValues)
                          const tplHtml = template.templateContent || template.content || ''
                          setContractHtml(renderTemplate(tplHtml, newValues))
                        }}
                        multiline={isLong}
                        placeholder={v.readonly ? '' : `Nhập ${v.label.toLowerCase()}...`}
                        placeholderTextColor="#9CA3AF"
                        style={{
                          flex: 1,
                          paddingVertical: isLong ? 12 : 14,
                          minHeight: isLong ? 120 : 52,
                          color: v.readonly ? '#9CA3AF' : '#111827',
                          fontSize: 15,
                          fontWeight: '500',
                          textAlignVertical: isLong ? 'top' : 'center',
                        }}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Bottom Actions */}
      <View style={{ padding: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={handleSaveDraft}
          disabled={loading}
          style={{
            flex: 1,
            flexDirection: 'row',
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: '#EEF2FF',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#C7D2FE',
          }}
        >
          {loading ? (
            <ActivityIndicator color="#4F46E5" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
              <Text style={{ color: '#4F46E5', fontWeight: '700', fontSize: 15 }}>Lưu nháp</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleSend}
          disabled={loading}
          style={{
            flex: 1,
            flexDirection: 'row',
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: '#4F46E5',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Gửi hợp đồng</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default ContractBuilderScreen

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import {
  createContract,
  getRequestTemplateData,
  getTemplateDetail,
  sendContractToTenant,
  updateContract,
} from '@/store/slices/contract.slice'
import contractService from '@/services/contract.service'
import { SafeAreaView } from 'react-native-safe-area-context'
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
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'HD-'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const TERM_VARIABLES = [
  { name: 'custom.generalTerms', type: 'string', label: 'Điều khoản chung', readonly: false },
  { name: 'custom.specialTerms', type: 'string', label: 'Điều khoản riêng', readonly: false },
]

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const res: Record<string, any> = {}
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

function unwrap(res: any) {
  return res?.data?.data ?? res?.data ?? res
}

function parseSafeNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0
  const clean = String(val).replace(/[.,]/g, '')
  const num = Number(clean)
  return Number.isNaN(num) ? 0 : num
}

function brToNewlines(val: unknown): string {
  if (val == null) return ''
  return String(val).replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n')
}

function newlinesToBr(val: unknown): unknown {
  if (typeof val === 'string') return val.replace(/\n/g, '<br>')
  return val
}

function renderTemplate(html: string, formData: Record<string, any>) {
  const map: Record<string, string> = {}
  for (const [k, v] of Object.entries(formData)) {
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
      const isMultiline = raw.includes('<br>')
      if (!isMultiline) {
        if (lk.includes('date') || lk.includes('day')) return formatDate(raw)
        if (
          lk.includes('amount') ||
          lk.includes('rent') ||
          lk.includes('price') ||
          lk.includes('fee') ||
          lk.includes('deposit') ||
          lk.includes('cost') ||
          lk.includes('money')
        ) {
          return formatMoney(raw)
        }
      }
      return String(raw)
    }
    return ''
  })

  result = result.replace(/<tr[^>]*>(?:(?!<tr).)*<\/tr>/gi, (row) => {
    const cellContents = row.match(/<td[^>]*>(.*?)<\/td>/gi) || []
    const allEmpty =
      cellContents.length > 0 &&
      cellContents.every((cell) => {
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

/** Pure helper — must not read React state (avoids reload loops when template is set). */
function applyTemplateDefaults(
  templateDetail: { defaultTerms?: Record<string, unknown> } | null,
  initialFormValues: Record<string, any>,
  allowedKeys: string[],
  flat: Record<string, any>
) {
  const propertyToContractMap: Record<string, string> = {
    'property.monthlyRent': 'contract.monthlyRent',
    'property.depositAmount': 'contract.depositAmount',
    'property.electricityCostPerKwh': 'contract.electricityCostPerKwh',
    'property.waterCostPerM3': 'contract.waterCostPerM3',
    'property.parkingFee': 'contract.parkingFee',
    'property.managementFee': 'contract.managementFee',
    'property.internetFee': 'contract.internetFee',
    'property.area': 'contract.usableArea',
  }

  for (const [propKey, constKey] of Object.entries(propertyToContractMap)) {
    if (
      flat[propKey] != null &&
      (initialFormValues[constKey] == null || initialFormValues[constKey] === '') &&
      allowedKeys.includes(constKey)
    ) {
      initialFormValues[constKey] = flat[propKey]
    }
  }

  const signingLocationKeys = ['contract.signingLocation', 'contract.location']
  for (const locKey of signingLocationKeys) {
    if (allowedKeys.includes(locKey) && !initialFormValues[locKey]) {
      const ownerAddress = flat['owner.address']
      if (ownerAddress) initialFormValues[locKey] = ownerAddress
    }
  }

  const defaultTerms = templateDetail?.defaultTerms || {}
  const defaultTermKeyMap: Record<string, string> = {
    paymentDueDay: 'contract.paymentDueDay',
    gracePeriodDays: 'contract.gracePeriodDays',
    lateFeePerDay: 'contract.lateFeePerDay',
    autoRenewal: 'contract.autoRenewal',
    renewalNoticeDays: 'contract.renewalNoticeDays',
    earlyTerminationFee: 'contract.earlyTerminationFee',
  }

  Object.entries(defaultTerms).forEach(([key, val]) => {
    const mappedKey = defaultTermKeyMap[key] ?? key
    if (
      allowedKeys.includes(mappedKey) &&
      (initialFormValues[mappedKey] == null || initialFormValues[mappedKey] === '')
    ) {
      if (typeof val === 'string') {
        initialFormValues[mappedKey] = brToNewlines(val)
      } else {
        initialFormValues[mappedKey] = val
      }
    }
  })

  for (const termField of TERM_VARIABLES) {
    if (allowedKeys.includes(termField.name) && initialFormValues[termField.name] == null) {
      initialFormValues[termField.name] = ''
    }
  }
}

function initFromContractRecord(contract: any, initialFormValues: Record<string, any>) {
  if (contract.contractData && typeof contract.contractData === 'object') {
    for (const [k, v] of Object.entries(contract.contractData as Record<string, unknown>)) {
      initialFormValues[k] = typeof v === 'string' ? brToNewlines(v) : v
    }
  }
  return contract.contractHtml as string | undefined
}

function buildUpdatePayload(formValues: Record<string, any>, contractHtml: string) {
  return {
    startDate: String(formValues['contract.startDate'] || ''),
    endDate: String(formValues['contract.endDate'] || ''),
    monthlyRent: parseSafeNumber(
      formValues['property.monthlyRent'] ?? formValues['contract.monthlyRent']
    ),
    depositAmount: parseSafeNumber(
      formValues['property.depositAmount'] ?? formValues['contract.depositAmount']
    ),
    electricityCostPerKwh: parseSafeNumber(formValues['contract.electricityCostPerKwh']),
    waterCostPerM3: parseSafeNumber(formValues['contract.waterCostPerM3']),
    managementFee: parseSafeNumber(formValues['contract.managementFee']),
    parkingFee: parseSafeNumber(formValues['contract.parkingFee']),
    internetFee: parseSafeNumber(formValues['contract.internetFee']),
    paymentDueDay: parseSafeNumber(formValues['contract.paymentDueDay'] || 5),
    lateFeePerDay: parseSafeNumber(formValues['contract.lateFeePerDay']),
    gracePeriodDays: parseSafeNumber(formValues['contract.gracePeriodDays']),
    earlyTerminationFee: parseSafeNumber(formValues['contract.earlyTerminationFee']),
    autoRenewal:
      formValues['contract.autoRenewal'] === 'true' || formValues['contract.autoRenewal'] === true,
    renewalNoticeDays: parseSafeNumber(formValues['contract.renewalNoticeDays'] || 30),
    notes: String(formValues['contract.notes'] || ''),
    contractData: Object.fromEntries(
      Object.entries(formValues).map(([k, v]) => [k, newlinesToBr(v)])
    ),
    contractHtml,
  }
}

const ContractBuilderScreen = () => {
  const { templateId, requestId, contractId } = useLocalSearchParams<{
    templateId?: string
    requestId?: string
    contractId?: string
  }>()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { actionLoading } = useSelector((state: RootState) => state.contract)

  const [initialLoading, setInitialLoading] = useState(true)
  const loadKeyRef = useRef('')

  const isUpdateDraftMode = Boolean(contractId) && !requestId
  const isEditExistingDraft = Boolean(contractId) && Boolean(requestId)

  const [template, setTemplate] = useState<any>(null)
  const [requestData, setRequestData] = useState<any>(null)
  const [existingContract, setExistingContract] = useState<any>(null)
  const [contractHtml, setContractHtml] = useState('')
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('edit')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const busy = isSaving || actionLoading

  const templateVariables = useMemo(() => {
    if (!template) return [] as { name: string; type?: string; label: string; readonly?: boolean; required?: boolean }[]
    const raw = template.templateVariables || {}
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
        required: standard?.required ?? false,
      }
    })

    for (const termField of TERM_VARIABLES) {
      if (!vars.some((v) => v.name === termField.name)) {
        vars.push({ ...termField, required: false })
      }
    }
    return vars
  }, [template])

  const requiredFields = useMemo(
    () => templateVariables.filter((v) => v.required && !v.readonly),
    [templateVariables]
  )

  const filledRequiredCount = useMemo(
    () =>
      requiredFields.filter((f) => {
        const v = formValues[f.name]
        return v != null && String(v).trim() !== ''
      }).length,
    [requiredFields, formValues]
  )

  const progressPercent =
    requiredFields.length > 0
      ? Math.round((filledRequiredCount / requiredFields.length) * 100)
      : 100

  useEffect(() => {
    const loadKey = `${templateId ?? ''}|${requestId ?? ''}|${contractId ?? ''}`
    if (!templateId || (!requestId && !contractId)) return

    let cancelled = false

    const load = async () => {
      setInitialLoading(true)
      loadKeyRef.current = loadKey

      try {
        const templateDetailResponse = await dispatch(getTemplateDetail(templateId)).unwrap()
        if (cancelled || loadKeyRef.current !== loadKey) return

        const templateDetail = unwrap(templateDetailResponse)
        setTemplate(templateDetail)

        const rawVars = templateDetail?.templateVariables || {}
        const variableList: { name: string }[] = Array.isArray(rawVars)
          ? (rawVars as any[]).map((v: any) => ({ name: v.name }))
          : Object.keys(rawVars || {}).map((k) => ({ name: k }))
        const allowedKeys = variableList.map((v) => v.name)

        let initialFormValues: Record<string, any> = {}
        let reqData: any = null
        let contractRecord: any = null
        let savedHtml: string | undefined

        const updateDraftMode = Boolean(contractId) && !requestId

        if (updateDraftMode && contractId) {
          const contractRes = await contractService.getContractDetail(contractId)
          if (cancelled || loadKeyRef.current !== loadKey) return
          contractRecord = unwrap(contractRes)
          setExistingContract(contractRecord)
          savedHtml = initFromContractRecord(contractRecord, initialFormValues)
        } else if (requestId) {
          const reqDataResponse = await dispatch(getRequestTemplateData(requestId)).unwrap()
          if (cancelled || loadKeyRef.current !== loadKey) return
          reqData = unwrap(reqDataResponse)
          setRequestData(reqData)

          const flat = flattenObject(reqData || {})
          for (const key of allowedKeys) {
            if (flat[key] != null) initialFormValues[key] = flat[key]
          }

          if (initialFormValues['property.type']) {
            const typeMap: Record<string, string> = {
              apartment: 'Căn hộ chung cư',
              house: 'Nhà nguyên căn',
              room: 'Phòng trọ',
              office: 'Văn phòng',
              shop: 'Mặt bằng kinh doanh',
            }
            const propertyTypeValue = String(initialFormValues['property.type'])
            initialFormValues['property.type'] = typeMap[propertyTypeValue] || propertyTypeValue
          }

          applyTemplateDefaults(templateDetail, initialFormValues, allowedKeys, flat)

          if (contractId) {
            const contractRes = await contractService.getContractDetail(contractId)
            if (cancelled || loadKeyRef.current !== loadKey) return
            contractRecord = unwrap(contractRes)
            setExistingContract(contractRecord)
            const htmlFromContract = initFromContractRecord(contractRecord, initialFormValues)
            if (htmlFromContract) savedHtml = htmlFromContract
          } else {
            const nested = (reqData?.contract as any)?.contract || reqData?.draftContract
            if (nested) {
              contractRecord = nested
              setExistingContract(nested)
              const htmlFromContract = initFromContractRecord(nested, initialFormValues)
              if (htmlFromContract) savedHtml = htmlFromContract
            }
          }

          if (!initialFormValues['contract.startDate'] && reqData?.startDate) {
            initialFormValues['contract.startDate'] = format(new Date(reqData.startDate), 'yyyy-MM-dd')
          }
          if (!initialFormValues['contract.endDate'] && reqData?.endDate) {
            initialFormValues['contract.endDate'] = format(new Date(reqData.endDate), 'yyyy-MM-dd')
          }
          if (!initialFormValues['contract.monthlyRent'] && reqData?.proposedRent) {
            initialFormValues['contract.monthlyRent'] = reqData.proposedRent
          }
          if (!initialFormValues['contract.depositAmount'] && reqData?.property?.depositAmount) {
            initialFormValues['contract.depositAmount'] = reqData.property.depositAmount
          }
          if (!initialFormValues['property.name'] && reqData?.property?.title) {
            initialFormValues['property.name'] = reqData.property.title
          }
          if (!initialFormValues['property.address'] && reqData?.property?.address) {
            initialFormValues['property.address'] = reqData.property.address
          }
        }

        if (!initialFormValues['contract.contractNumber']) {
          initialFormValues['contract.contractNumber'] =
            contractRecord?.contractCode || generateContractCode()
        }
        if (!initialFormValues['contract.contractDate']) {
          initialFormValues['contract.contractDate'] = new Date().toISOString().split('T')[0]
        }

        setFormValues(initialFormValues)

        const tplHtml = normalizeTemplateDocumentHtml(
          templateDetail.templateContent || templateDetail.content || ''
        )
        setContractHtml(savedHtml || renderTemplate(tplHtml, initialFormValues))
      } catch (e: any) {
        if (!cancelled) {
          Alert.alert('Lỗi', e?.message || e || 'Không thể tải dữ liệu hợp đồng.')
        }
      } finally {
        if (!cancelled && loadKeyRef.current === loadKey) {
          setInitialLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [templateId, requestId, contractId, dispatch])

  const refreshHtml = useCallback(
    (newValues: Record<string, any>) => {
      const tplHtml = normalizeTemplateDocumentHtml(
        template?.templateContent || template?.content || ''
      )
      setContractHtml(renderTemplate(tplHtml, newValues))
    },
    [template]
  )

  const handleSaveDraft = async () => {
    if (!template) return
    setIsSaving(true)
    try {
      if (isUpdateDraftMode && contractId) {
        const payload = buildUpdatePayload(formValues, contractHtml)
        await dispatch(updateContract({ contractId, data: payload })).unwrap()
        Alert.alert(
          'Đã lưu',
          'Bản chỉnh sửa đã được lưu thành công.',
          [{ text: 'OK' }]
        )
        return
      }

      if (!requestData) {
        throw new Error('Thiếu dữ liệu yêu cầu thuê')
      }
      if (!requestData?.property?.id || !requestData?.owner?.id || !requestData?.tenant?.id) {
        throw new Error('Thiếu thông tin bất động sản hoặc người dùng để tạo hợp đồng')
      }

      const savedContractId =
        existingContract?.rentalId ||
        requestData?.contract?.id ||
        requestData?.draftContract?.id ||
        contractId

      if (isEditExistingDraft && savedContractId) {
        const payload = buildUpdatePayload(formValues, contractHtml)
        await dispatch(updateContract({ contractId: savedContractId, data: payload })).unwrap()
        Alert.alert('Đã lưu', 'Hợp đồng nháp đã được cập nhật.', [
          { text: 'OK', onPress: () => router.replace('/(rental)/contracts') },
        ])
        return
      }

      const payload = {
        templateId: template.templateId,
        propertyId: requestData.property.id,
        ownerId: requestData.owner.id,
        tenantId: requestData.tenant.id,
        fromRequestId: savedContractId,
        startDate: new Date(requestData.contract?.startDate || requestData.startDate).toISOString(),
        endDate: new Date(requestData.contract?.endDate || requestData.endDate).toISOString(),
        monthlyRent: Number(
          formValues['property.monthlyRent'] ??
            formValues['contract.monthlyRent'] ??
            requestData.proposedRent
        ),
        depositAmount: Number(
          formValues['property.depositAmount'] ??
            formValues['contract.depositAmount'] ??
            requestData?.property?.depositAmount
        ),
        contractData: Object.fromEntries(
          Object.entries(formValues).map(([k, v]) => [k, newlinesToBr(v)])
        ),
        contractHtml,
      }
      const result = await dispatch(createContract(payload)).unwrap()
      const createdContract = unwrap(result)
      Alert.alert(
        'Thành công',
        `Đã tạo hợp đồng nháp #${createdContract?.contractCode || createdContract?.rentalCode || ''}.`,
        [{ text: 'OK', onPress: () => router.replace('/(rental)/contracts') }]
      )
    } catch (e: any) {
      Alert.alert('Vui lòng thử lại', String(e?.message || e || 'Không thể lưu hợp đồng.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSend = async () => {
    if (!template) return
    setIsSaving(true)
    try {
      if (isUpdateDraftMode && contractId) {
        const payload = buildUpdatePayload(formValues, contractHtml)
        await dispatch(updateContract({ contractId, data: payload })).unwrap()
        await dispatch(sendContractToTenant(contractId)).unwrap()
        Alert.alert('Thành công', 'Đã gửi bản chỉnh sửa cho người thuê ký xác nhận.', [
          { text: 'OK', onPress: () => router.replace('/(rental)/contracts') },
        ])
        return
      }

      if (!requestData) {
        throw new Error('Thiếu dữ liệu yêu cầu thuê')
      }
      if (!requestData?.property?.id || !requestData?.owner?.id || !requestData?.tenant?.id) {
        throw new Error('Thiếu thông tin bất động sản hoặc người dùng')
      }

      const savedContractId =
        existingContract?.rentalId ||
        requestData?.contract?.id ||
        requestData?.draftContract?.id ||
        contractId

      if (isEditExistingDraft && savedContractId) {
        const payload = buildUpdatePayload(formValues, contractHtml)
        await dispatch(updateContract({ contractId: savedContractId, data: payload })).unwrap()
        await dispatch(sendContractToTenant(savedContractId)).unwrap()
        Alert.alert('Thành công', 'Đã gửi hợp đồng tới người thuê.', [
          { text: 'OK', onPress: () => router.replace('/(rental)/contracts') },
        ])
        return
      }

      const payload = {
        templateId: template.templateId,
        propertyId: requestData.property.id,
        ownerId: requestData.owner.id,
        tenantId: requestData.tenant.id,
        fromRequestId: savedContractId,
        startDate: new Date(requestData.contract?.startDate || requestData.startDate).toISOString(),
        endDate: new Date(requestData.contract?.endDate || requestData.endDate).toISOString(),
        monthlyRent: Number(
          formValues['contract.monthlyRent'] ??
            formValues['property.monthlyRent'] ??
            requestData.proposedRent
        ),
        depositAmount: Number(
          formValues['contract.depositAmount'] ??
            formValues['property.depositAmount'] ??
            requestData?.property?.depositAmount
        ),
        contractData: Object.fromEntries(
          Object.entries(formValues).map(([k, v]) => [k, newlinesToBr(v)])
        ),
        contractHtml,
      }
      const result = await dispatch(createContract(payload)).unwrap()
      const createdContract = unwrap(result)
      const newContractId =
        createdContract?.contractId || createdContract?.rentalId || createdContract?.id
      if (newContractId) {
        await dispatch(sendContractToTenant(newContractId)).unwrap()
      }
      Alert.alert('Thành công', 'Đã gửi hợp đồng tới người thuê.', [
        { text: 'OK', onPress: () => router.replace('/(rental)/contracts') },
      ])
    } catch (e: any) {
      Alert.alert('Vui lòng thử lại', e?.message || 'Không thể gửi hợp đồng.')
    } finally {
      setIsSaving(false)
    }
  }

  const screenTitle = isUpdateDraftMode
    ? 'Chỉnh sửa hợp đồng'
    : isEditExistingDraft
      ? 'Chỉnh sửa nháp'
      : 'Soạn hợp đồng'

  const screenSubtitle = isUpdateDraftMode
    ? `Bản nháp · ${existingContract?.contractCode || contractId || ''}`
    : template?.templateName || template?.name || ''

  const saveLabel = isUpdateDraftMode ? 'Lưu chỉnh sửa' : 'Lưu nháp'
  const sendLabel = isUpdateDraftMode ? 'Gửi chỉnh sửa' : 'Gửi hợp đồng'

  if (initialLoading || !template || (requestId ? !requestData : isUpdateDraftMode ? !existingContract : true)) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}
      >
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 16, color: '#64748B', fontSize: 14 }}>
          Đang tải trình soạn thảo...
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={screenTitle}
        subtitle={screenSubtitle}
        rightComponent={
          <View
            style={{
              backgroundColor: progressPercent === 100 ? '#DCFCE7' : '#EFF6FF',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: progressPercent === 100 ? '#15803D' : '#2563EB',
              }}
            >
              {progressPercent === 100
                ? 'Hoàn tất'
                : `${filledRequiredCount}/${requiredFields.length}`}
            </Text>
          </View>
        }
      />

      {isUpdateDraftMode && (
        <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderLeftWidth: 3,
              borderLeftColor: '#3B82F6',
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#EFF6FF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 4 }}>
                Chế độ chỉnh sửa hợp đồng
              </Text>
              <Text style={{ fontSize: 12, lineHeight: 18, color: '#64748B' }}>
                Bạn đang chỉnh sửa bản nháp của hợp đồng đang hiệu lực. Sau khi gửi, cả hai bên cần
                ký số. Bản chỉnh sửa chỉ có hiệu lực khi cả hai bên đồng thuận.
              </Text>
            </View>
          </View>
          {existingContract?.parentContractId && (
            <View
              style={{
                alignSelf: 'flex-start',
                marginTop: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#FFF7ED',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#FED7AA',
              }}
            >
              <Ionicons name="git-branch-outline" size={12} color="#C2410C" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#C2410C' }}>
                Phiên bản v{existingContract?.version ?? '—'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Progress bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
        <View
          style={{
            height: 4,
            backgroundColor: '#E2E8F0',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: progressPercent === 100 ? '#22C55E' : '#3B82F6',
              borderRadius: 999,
            }}
          />
        </View>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          padding: 4,
          backgroundColor: '#E2E8F0',
          marginHorizontal: 16,
          marginVertical: 8,
          borderRadius: 12,
        }}
      >
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
            elevation: activeTab === 'edit' ? 2 : 0,
          }}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={activeTab === 'edit' ? '#4F46E5' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: activeTab === 'edit' ? '#4F46E5' : '#64748B',
            }}
          >
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
            elevation: activeTab === 'preview' ? 2 : 0,
          }}
        >
          <Ionicons
            name="eye-outline"
            size={18}
            color={activeTab === 'preview' ? '#4F46E5' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: activeTab === 'preview' ? '#4F46E5' : '#64748B',
            }}
          >
            Xem trước
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {activeTab === 'preview' ? (
          <View style={{ flex: 1, backgroundColor: '#CBD5E1', padding: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: '#FFF',
                borderRadius: 8,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <WebView
                originWhitelist={['*']}
                source={{
                  html: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>body{font-family:Georgia,'Times New Roman',serif;color:#111827;margin:0;padding:20px;line-height:1.65}table{width:100%;border-collapse:collapse}td,th{border:1px solid #d1d5db;padding:8px}</style></head><body>${contractHtml}</body></html>`,
                }}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                backgroundColor: '#FFF',
                borderRadius: 16,
                padding: 16,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
                Biến số hợp đồng
              </Text>

              {templateVariables.map((v) => {
                const key = v.name
                const val = formValues[key] ?? ''
                const isLong =
                  key.toLowerCase().includes('terms') ||
                  key.toLowerCase().includes('address') ||
                  key.toLowerCase().includes('description') ||
                  key.toLowerCase().includes('content')
                const isFocused = focusedField === key

                return (
                  <View key={key} style={{ marginBottom: 20 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={{ color: '#374151', fontSize: 14, fontWeight: '600' }}>
                          {v.label}
                        </Text>
                        {v.required && !v.readonly && (
                          <Text style={{ color: '#EF4444', marginLeft: 4 }}>*</Text>
                        )}
                      </View>
                      {v.readonly && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F3F4F6',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Ionicons name="lock-closed" size={10} color="#9CA3AF" />
                          <Text
                            style={{
                              fontSize: 10,
                              color: '#9CA3AF',
                              fontWeight: '700',
                              marginLeft: 4,
                            }}
                          >
                            HỆ THỐNG
                          </Text>
                        </View>
                      )}
                    </View>

                    <View
                      style={{
                        borderWidth: 1.5,
                        borderColor: v.readonly ? '#F3F4F6' : isFocused ? '#4F46E5' : '#E5E7EB',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        backgroundColor: v.readonly ? '#F9FAFB' : '#FFF',
                      }}
                    >
                      <TextInput
                        value={val != null ? String(val) : ''}
                        editable={!v.readonly}
                        onFocus={() => !v.readonly && setFocusedField(key)}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={(text) => {
                          if (v.readonly) return
                          const newValues = { ...formValues, [key]: text }
                          setFormValues(newValues)
                          refreshHtml(newValues)
                        }}
                        multiline={isLong}
                        placeholder={v.readonly ? '' : `Nhập ${v.label.toLowerCase()}...`}
                        placeholderTextColor="#9CA3AF"
                        style={{
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

      <View
        style={{
          padding: 16,
          paddingBottom: Platform.OS === 'ios' ? 30 : 16,
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={handleSaveDraft}
          disabled={busy}
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
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator color="#4F46E5" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
              <Text style={{ color: '#4F46E5', fontWeight: '700', fontSize: 15 }}>{saveLabel}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSend}
          disabled={busy}
          style={{
            flex: 1,
            flexDirection: 'row',
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: '#4F46E5',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{sendLabel}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default ContractBuilderScreen

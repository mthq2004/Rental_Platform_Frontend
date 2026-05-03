import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import AuthGuard from '@/components/AuthGuard'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'
import BackButton from '@/components/BackButton'
import CustomInput from '@/components/CustomInput'
import PrimaryButton from '@/components/PrimaryButton'
import contractService from '@/services/contract.service'

type TemplateVariable = {
  name: string
  type: 'string' | 'number' | 'date'
  label: string
  required: boolean
}

type TemplateItem = {
  templateId: string
  templateName: string
  description?: string
  isDefault?: boolean
}

const formatDate = (value?: string) => {
  if (!value) return ''
  const ddmmyyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (ddmmyyyy) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const toApiDate = (value?: string) => {
  if (!value) return ''
  const ddmmyyyy = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy
    return `${year}-${month}-${day}`
  }
  const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return value.trim()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
  const res: Record<string, any> = {}
  Object.entries(obj || {}).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(res, flattenObject(value, nextKey))
    } else {
      res[nextKey] = value
    }
  })
  return res
}

const buildHtml = (templateContent: string, values: Record<string, string>) => {
  return templateContent.replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
    const key = rawKey.trim()
    const value = values[key]
    if (value == null || value === '') return `{{${key}}}`
    return key.toLowerCase().includes('date') ? formatDate(value) : value
  })
}

const ContractBuilderScreen = () => {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [requestData, setRequestData] = useState<any>(null)
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [templateDetail, setTemplateDetail] = useState<any>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [contractId, setContractId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})

  const flattenedRequest = useMemo(() => flattenObject(requestData), [requestData])
  const templateVariables: TemplateVariable[] = templateDetail?.templateVariables || []

  const preload = async () => {
    if (!requestId) return
    setLoading(true)
    try {
      const reqRes = await contractService.getRequestTemplateData(String(requestId))
      const req = reqRes?.data ?? reqRes
      setRequestData(req)

      const propertyType = req?.property?.type || req?.property?.propertyType || 'room'
      const templateRes = await contractService.getTemplates(String(propertyType))
      const list = Array.isArray(templateRes?.data) ? templateRes.data : Array.isArray(templateRes) ? templateRes : []
      setTemplates(list)

      const defaultTemplate = list.find((item: TemplateItem) => item.isDefault) || list[0]
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.templateId)
        const detailRes = await contractService.getTemplateDetail(defaultTemplate.templateId)
        const detail = detailRes?.data ?? detailRes
        setTemplateDetail(detail)
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không tải được dữ liệu hợp đồng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    preload()
  }, [requestId])

  useEffect(() => {
    if (!templateDetail || !requestData) return
    const nextValues: Record<string, string> = {}
    const flat = flattenedRequest

    templateVariables.forEach((variable) => {
      const current = flat[variable.name]
      if (current != null && current !== '') {
        nextValues[variable.name] = variable.type === 'date' ? formatDate(String(current)) : String(current)
      } else if (variable.name === 'contract.startDate' && flat['contract.startDate']) {
        nextValues[variable.name] = formatDate(String(flat['contract.startDate']))
      } else if (variable.name === 'contract.endDate' && flat['contract.endDate']) {
        nextValues[variable.name] = formatDate(String(flat['contract.endDate']))
      } else if (variable.name === 'contract.monthlyRent' && flat['property.monthlyRent']) {
        nextValues[variable.name] = String(flat['property.monthlyRent'])
      } else if (variable.name === 'contract.depositAmount' && flat['property.depositAmount']) {
        nextValues[variable.name] = String(flat['property.depositAmount'])
      } else {
        nextValues[variable.name] = ''
      }
    })

    setValues((prev) => ({ ...nextValues, ...prev }))
  }, [templateDetail, requestData])

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId)
    setLoading(true)
    try {
      const detailRes = await contractService.getTemplateDetail(templateId)
      setTemplateDetail(detailRes?.data ?? detailRes)
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không tải được template')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async (): Promise<string | null> => {
    if (!requestData || !templateDetail) return
    setSaving(true)
    try {
      const payload = {
        templateId: selectedTemplateId,
        fromRequestId: String(requestId),
        propertyId: requestData.property?.id,
        ownerId: requestData.owner?.id,
        tenantId: requestData.tenant?.id,
        startDate: values['contract.startDate'] ? toApiDate(values['contract.startDate']) : requestData.contract?.startDate,
        endDate: values['contract.endDate'] ? toApiDate(values['contract.endDate']) : requestData.contract?.endDate,
        monthlyRent: Number(values['contract.monthlyRent'] || requestData.property?.monthlyRent || 0),
        depositAmount: Number(values['contract.depositAmount'] || requestData.property?.depositAmount || 0),
        contractData: values,
        contractHtml: buildHtml(templateDetail.templateContent || '', values),
        status: 'draft',
      }

      const res = await contractService.createContract(payload)
      const created = res?.data ?? res
      const nextContractId = created?.rentalId || created?.id || contractId
      setContractId(nextContractId)
      Alert.alert('Thành công', 'Đã lưu nháp hợp đồng')
      return nextContractId || null
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Lưu nháp thất bại')
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async () => {
    try {
      setSending(true)
      const finalId = contractId || (await handleSaveDraft())
      if (!finalId) {
        Alert.alert('Lỗi', 'Không tạo được hợp đồng nháp')
        return
      }
      await contractService.sendContractToTenant(finalId)
      Alert.alert('Thành công', 'Đã gửi hợp đồng cho khách ký')
      router.replace({ pathname: '/(rental)/contract-detail', params: { contractId: finalId } })
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Gửi hợp đồng thất bại')
    } finally {
      setSending(false)
    }
  }

  if (loading && !requestData) {
    return (
      <AuthGuard>
        <KeyboardSafeWrapper className="bg-white dark:bg-gray-950 pt-10">
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator />
          </View>
        </KeyboardSafeWrapper>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <KeyboardSafeWrapper className="bg-white dark:bg-gray-950 pt-10">
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          <View className="flex-row items-center mb-4">
            <BackButton onPress={() => router.back()} />
            <View className="flex-1 ml-3">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">Tạo hợp đồng</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chọn template, lưu nháp rồi gửi cho khách ký</Text>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">Thông tin yêu cầu</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Bất động sản: {requestData?.property?.title || 'N/A'}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Khách thuê: {requestData?.tenant?.name || 'N/A'}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chủ nhà: {requestData?.owner?.name || 'N/A'}</Text>
          </View>

          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-4 mb-4">
            <Text className="text-blue-700 dark:text-blue-200 font-semibold">Bước 1: Chọn template hợp đồng</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
              {templates.map((template) => {
                const active = template.templateId === selectedTemplateId
                return (
                  <TouchableOpacity
                    key={template.templateId}
                    onPress={() => handleTemplateChange(template.templateId)}
                    className={`mr-3 w-64 rounded-2xl border p-4 ${active ? 'bg-white border-blue-500' : 'bg-white/60 border-blue-100'}`}
                  >
                    <Text className="font-bold text-gray-900">{template.templateName}</Text>
                    <Text className="text-xs text-gray-500 mt-1">{template.description || 'Mẫu hợp đồng tiêu chuẩn'}</Text>
                    {template.isDefault ? <Text className="text-xs text-blue-600 mt-2 font-semibold">Mặc định</Text> : null}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">Bước 2: Điền thông tin hợp đồng</Text>
            {templateVariables.map((variable) => (
              <View key={variable.name} className="mb-4">
                <CustomInput
                  label={variable.label}
                  placeholder={variable.type === 'date' ? 'dd-mm-yyyy' : variable.label}
                  value={values[variable.name] || ''}
                  onChangeText={(text) => setValues((prev) => ({ ...prev, [variable.name]: text }))}
                />
              </View>
            ))}
          </View>

          <View className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">Xem trước</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300 leading-6">
              {buildHtml(templateDetail?.templateContent || '', values).slice(0, 800) || 'Chưa có nội dung template'}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton title="Lưu nháp" onPress={handleSaveDraft} disabled={saving || sending} />
            </View>
            <View className="flex-1">
              <PrimaryButton title="Gửi ký" onPress={handleSend} disabled={saving || sending} />
            </View>
          </View>

          <View className="h-8" />
        </ScrollView>
      </KeyboardSafeWrapper>
    </AuthGuard>
  )
}

export default ContractBuilderScreen

import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { createContract, getRequestTemplateData, getTemplateDetail } from '@/store/slices/contract.slice'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from '@/components/BackButton'
import { useThemeColors } from '@/utils/colors'
import PrimaryButton from '@/components/PrimaryButton'
import WebView from 'react-native-webview'
import { format } from 'date-fns'

const ContractBuilderScreen = () => {
  const { templateId, requestId } = useLocalSearchParams<{ templateId: string, requestId: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useThemeColors() as any;
  const current = theme.current;
  const primary = theme.primary;
  const { loading } = useSelector((state: RootState) => state.contract);

  const [template, setTemplate] = useState<any>(null);
  const [requestData, setRequestData] = useState<any>(null);
  const [contractHtml, setContractHtml] = useState('');
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const loadData = useCallback(async () => {
    if (!templateId || !requestId) {
      Alert.alert('Lỗi', 'Thiếu thông tin mẫu hoặc yêu cầu.', [{ text: 'OK', onPress: () => router.back() }]);
      return
    }
    try {
      const [templateDetail, reqData] = await Promise.all([
        dispatch(getTemplateDetail(templateId)).unwrap(),
        dispatch(getRequestTemplateData(requestId)).unwrap(),
      ]);
      setTemplate(templateDetail);
      setRequestData(reqData);

      const initialFormValues = {
        'contract.startDate': format(new Date(reqData.startDate), 'dd/MM/yyyy'),
        'contract.endDate': format(new Date(reqData.endDate), 'dd/MM/yyyy'),
        'contract.monthlyRent': reqData.proposedRent,
        'contract.depositAmount': reqData.property.depositAmount,
        'property.name': reqData.property.title,
        'property.address': reqData.property.address,
        'owner.fullName': reqData.owner.profile.fullName,
        'owner.phone': reqData.owner.profile.phone,
        'owner.email': reqData.owner.email,
        'tenant.fullName': reqData.tenant.profile.fullName,
        'tenant.phone': reqData.tenant.profile.phone,
        'tenant.email': reqData.tenant.email,
      }
      setFormValues(initialFormValues);

      let html = templateDetail.content
      for (const key of Object.keys(initialFormValues) as Array<keyof typeof initialFormValues>) {
        html = html.replace(new RegExp(`{{${String(key)}}}`, 'g'), String(initialFormValues[key]))
      }
      setContractHtml(html)

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
      const payload = {
        templateId: template.templateId,
        propertyId: requestData.propertyId,
        ownerId: requestData.ownerId,
        tenantId: requestData.tenantId,
        fromRequestId: requestId,
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        monthlyRent: formValues['contract.monthlyRent'],
        depositAmount: formValues['contract.depositAmount'],
        contractData: formValues,
        contractHtml,
      }
      const result = await dispatch(createContract(payload)).unwrap()
      Alert.alert('Thành công', `Đã tạo hợp đồng nháp #${result.contractCode}.`, [
        { text: 'OK', onPress: () => router.replace('/(rental)/requests') }
      ])
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể lưu hợp đồng nháp.');
    }
  }

  if (!template || !requestData) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: current.background }}>
        <ActivityIndicator size="large" color={primary} />
        <Text style={{ marginTop: 16, color: current.text }}>Đang tải dữ liệu hợp đồng...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: current.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: current.border }}>
        <BackButton onPress={() => router.back()} />
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: current.text }} numberOfLines={1}>{template.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ height: 400, margin: 16, borderWidth: 1, borderColor: current.border, borderRadius: 8, overflow: 'hidden' }}>
          <WebView
            originWhitelist={['*']}
            source={{ html: `<style>body{font-family:sans-serif;padding:10px;color:${current.text};background-color:${current.card}}</style>${contractHtml}` }}
            style={{ flex: 1 }}
          />
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: current.text }}>Chỉnh sửa thông tin</Text>
          {Object.keys(formValues).map(key => (
            <View key={key}>
              <Text style={{ color: current.textInactive, marginBottom: 4, fontSize: 12 }}>{key}</Text>
              <TextInput
                value={String(formValues[key])}
                onChangeText={text => {
                  const newValues = { ...formValues, [key]: text }
                  setFormValues(newValues)
                  let html = template.content
                  for (const k in newValues) {
                    html = html.replace(new RegExp(`{{${k}}}`, 'g'), newValues[k])
                  }
                  setContractHtml(html)
                }}
                style={{
                  backgroundColor: current.card,
                  borderColor: current.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  color: current.text
                }}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: current.border }}>
        <PrimaryButton onPress={handleSaveDraft} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : 'Lưu hợp đồng nháp'}
        </PrimaryButton>
      </View>
    </SafeAreaView>
  )
}

export default ContractBuilderScreen

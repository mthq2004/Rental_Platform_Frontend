import apiClient from '@/utils/api'

// Helper unwrap backend response: { data: T } hoặc T trực tiếp
const unwrap = (res: any) => res?.data?.data ?? res?.data ?? res

const smartcaService = {
  /** Khởi tạo phiên ký SmartCA → trả { transactionId, expiredIn, resumed? } */
  signContract: async (contractId: string) => {
    const res = await apiClient.post(`/contract/smartca/contracts/${contractId}/sign`)
    return unwrap(res)
  },

  /** Kiểm tra kết quả ký từ VNPT → trả { status: 'SIGNED'|'PENDING'|'REJECTED'|... } */
  handleSignResult: async (transactionId: string) => {
    const res = await apiClient.post(`/contract/smartca/sign/${transactionId}`)
    return unwrap(res)
  },

  /** Lấy trạng thái ký từ backend contract → trả { status: 'SIGNED'|'PROCESSING'|'PENDING' } */
  getContractSignStatus: async (contractId: string) => {
    const res = await apiClient.get(`/contract/smartca/contracts/${contractId}/status`)
    return unwrap(res)
  },

  /** Xác minh hợp đồng trên blockchain với file PDF */
  verifyBlockchain: async (contractId: string, fileUri: string, fileName?: string) => {
    const formData = new FormData()
    formData.append('file', {
      uri: fileUri,
      name: fileName || 'contract.pdf',
      type: 'application/pdf',
    } as any)
    const res = await apiClient.post(
      `/contract/smartca/verify/blockchain/${contractId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return unwrap(res)
  },
}

export default smartcaService

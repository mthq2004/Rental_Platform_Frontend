import apiClient from '@/utils/api'

export const createRentalRequest = async (data: {
  propertyId: string
  ownerId: string
  startDate: string
  endDate: string
  proposedRent: number
  message?: string
}) => {
  const res = await apiClient.post('/contract/rental-requests', data)
  return res.data
}

export const openHoldingDeposit = async (data: { requestIds: string[]; expireMinutes?: number }) => {
  const res = await apiClient.post('/contract/holding-deposits/open', data)
  return res.data
}

export const getOwnerRequests = async (status?: string) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  const res = await apiClient.get(`/contract/rental-requests/owner${query}`)
  return res.data
}

export const getRequestDetail = async (requestId: string) => {
  const res = await apiClient.get(`/contract/rental-requests/${requestId}`)
  return res.data
}

export const reviewRequest = async (data: {
  requestId: string
  status: 'under_review' | 'rejected'
  rejectionReason?: string
  landlordNotes?: string
}) => {
  const { requestId, ...body } = data
  const res = await apiClient.put(`/contract/rental-requests/${requestId}/review`, body)
  return res.data
}

export const payHoldingDeposit = async (data: { requestId: string; method: string }) => {
  const res = await apiClient.post('/contract/holding-deposits/pay', data)
  return res.data
}

export const getMyRentalRequests = async () => {
  const res = await apiClient.get('/contract/rental-requests/my')
  return res.data
}

export const cancelRequest = async (requestId: string) => {
  const res = await apiClient.put(`/contract/rental-requests/${requestId}/cancel`)
  return res.data
}

export const getMyContracts = async (params?: { status?: string; page?: number; limit?: number }) => {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  const res = await apiClient.get(`/contract/rental-contracts/my${qs ? `?${qs}` : ''}`)
  const result = res.data
  return result?.data || result?.items || result
}

export const getContractStatusCounts = async () => {
  const res = await apiClient.get('/contract/rental-contracts/status-count')
  return res.data
}

export const getTemplates = async (propertyType: string) => {
  const res = await apiClient.get(`/contract/contract-templates/property-type/${encodeURIComponent(propertyType)}`)
  return res.data
}

export const getTemplateDetail = async (templateId: string) => {
  const res = await apiClient.get(`/contract/contract-templates/${templateId}`)
  return res.data
}

export const getRequestTemplateData = async (requestId: string) => {
  const res = await apiClient.get(`/contract/contract-templates/request/${requestId}`)
  return res.data
}

export const createContract = async (data: Record<string, unknown>) => {
  try {
    const res = await apiClient.post('/contract/rental-contracts/createContract', data)
    return res.data
  } catch (err: any) {
    // Surface backend validation / message when possible
    const msg = err?.response?.data?.message || err?.message || 'Create contract failed'
    throw new Error(msg)
  }
}

export const updateContract = async (contractId: string, data: Record<string, unknown>) => {
  const res = await apiClient.put(`/contract/rental-contracts/${contractId}`, data)
  return res.data
}

export const sendContractToTenant = async (contractId: string) => {
  const res = await apiClient.put(`/contract/rental-contracts/${contractId}/send`)
  return res.data
}

export const tenantSignContract = async (contractId: string) => {
  const res = await apiClient.put(`/contract/rental-contracts/${contractId}/tenant-sign`)
  return res.data
}

export const ownerSignContract = async (contractId: string) => {
  const res = await apiClient.put(`/contract/rental-contracts/${contractId}/owner-sign`)
  return res.data
}

export const getContractDetail = async (contractId: string) => {
  const res = await apiClient.get(`/contract/rental-contracts/${contractId}`)
  return res.data
}

export const getMyPayments = async (params?: { rentalId?: string; status?: string; page?: number; limit?: number }) => {
  const query = new URLSearchParams()
  if (params?.rentalId) query.set('rentalId', params.rentalId)
  if (params?.status) query.set('status', params.status)
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  const res = await apiClient.get(`/contract/payments/my${qs ? `?${qs}` : ''}`)
  return res.data
}

export const confirmPayment = async (paymentId: string, data: { paymentMethod: string; paymentType?: string; transactionId?: string; transactionRef?: string; paidAmount?: number }) => {
  const res = await apiClient.post(`/contract/payments/confirm/${paymentId}`, data)
  return res.data
}

export default {
  createRentalRequest,
  openHoldingDeposit,
  getOwnerRequests,
  getRequestDetail,
  reviewRequest,
  cancelRequest,
  payHoldingDeposit,
  getMyRentalRequests,
  getMyContracts,
  getContractStatusCounts,
  getContractDetail,
  getMyPayments,
  getTemplates,
  getTemplateDetail,
  getRequestTemplateData,
  createContract,
  updateContract,
  confirmPayment,
  sendContractToTenant,
  tenantSignContract,
  ownerSignContract,
}

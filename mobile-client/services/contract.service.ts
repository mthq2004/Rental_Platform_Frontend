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

export const payHoldingDeposit = async (data: { requestId: string; method: string; platform?: string }) => {
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

export const confirmPayment = async (paymentId: string, data: { paymentMethod: string; paymentType?: string; transactionId?: string; transactionRef?: string; paidAmount?: number; platform?: string }) => {
  const res = await apiClient.post(`/contract/payments/confirm/${paymentId}`, data)
  return res.data
}

// ── Termination ────────────────────────────────────────────────────────────

export const createTerminationRequest = async (data: {
  rentalId: string
  reason: string
  note?: string
  requestedTerminationDate: string
  earlyTerminationFee?: number
}) => {
  const res = await apiClient.post('/contract/terminations', data)
  return res.data
}

export const getTerminationRequests = async (rentalId: string) => {
  const res = await apiClient.get(`/contract/terminations/contract/${rentalId}`)
  return res.data
}

export const reviewTerminationRequest = async (terminationId: string, data: { status: 'approved' | 'rejected'; reviewNote?: string }) => {
  const res = await apiClient.put(`/contract/terminations/${terminationId}/review`, data)
  return res.data
}

export const updateTerminationStatus = async (terminationId: string, data: { status: string; resolution?: string; note?: string }) => {
  const res = await apiClient.put(`/contract/terminations/${terminationId}/status`, data)
  return res.data
}

// ── Reports / Disputes ─────────────────────────────────────────────────────

export const createReport = async (data: {
  rentalId: string
  againstId: string
  type: string
  reportType?: string
  priority: string
  title: string
  description: string
  terminationRequestId?: string
  evidence?: { uri: string; name: string; type: string }[]
}) => {
  const formData = new FormData()
  formData.append('rentalId', data.rentalId)
  formData.append('againstId', data.againstId)
  formData.append('type', data.type)
  if (data.reportType) formData.append('reportType', data.reportType)
  formData.append('priority', data.priority)
  formData.append('title', data.title)
  formData.append('description', data.description)
  if (data.terminationRequestId) formData.append('terminationRequestId', data.terminationRequestId)
  if (data.evidence?.length) {
    data.evidence.forEach((file) => {
      formData.append('evidence', {
        uri: file.uri,
        name: file.name || 'evidence.jpg',
        type: file.type || 'image/jpeg',
      } as any)
    })
  }
  const res = await apiClient.post('/contract/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const getReportsByContract = async (rentalId: string) => {
  const res = await apiClient.get(`/contract/reports/contract/${rentalId}`)
  return res.data
}

export const updateReportStatus = async (reportId: string, data: { status: string; adminNote?: string; resolution?: string }) => {
  const res = await apiClient.put(`/contract/reports/${reportId}/status`, data)
  return res.data
}

// ── Renewals & Appendices ──────────────────────────────────────────────────

export const createRenewalRequest = async (data: { contractId: string; durationMonths: number; note?: string }) => {
  const res = await apiClient.post('/contract/renewals', data)
  return res.data
}

export const getRenewalsByContract = async (contractId: string) => {
  const res = await apiClient.get(`/contract/renewals/contract/${contractId}`)
  return res.data
}

export const approveRenewal = async (renewalId: string, data: { reviewNote?: string }) => {
  const res = await apiClient.put(`/contract/renewals/${renewalId}/approve`, data)
  return res.data
}

export const rejectRenewal = async (renewalId: string, data: { reviewNote?: string }) => {
  const res = await apiClient.put(`/contract/renewals/${renewalId}/reject`, data)
  return res.data
}

export const cancelRenewal = async (renewalId: string) => {
  const res = await apiClient.put(`/contract/renewals/${renewalId}/cancel`)
  return res.data
}

export const getContractAppendices = async (contractId: string) => {
  const res = await apiClient.get(`/contract/renewals/appendices/${contractId}`)
  return res.data
}

// ── Bookings ───────────────────────────────────────────────────────────────

export const getMyBookings = async () => {
  const res = await apiClient.get('/estate/booking/my')
  return res.data
}

export const getOwnerBookings = async () => {
  const res = await apiClient.get('/estate/booking/owner')
  return res.data
}

export const confirmBooking = async (bookingId: string, landlordNote?: string) => {
  const res = await apiClient.put(`/estate/booking/${bookingId}/confirm`, { landlordNote })
  return res.data
}

export const rejectBooking = async (bookingId: string, reason?: string) => {
  const res = await apiClient.put(`/estate/booking/${bookingId}/reject`, { reason })
  return res.data
}

export const cancelBooking = async (bookingId: string) => {
  const res = await apiClient.put(`/estate/booking/${bookingId}/cancel`)
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
  createTerminationRequest,
  getTerminationRequests,
  reviewTerminationRequest,
  updateTerminationStatus,
  createReport,
  getReportsByContract,
  updateReportStatus,
  createRenewalRequest,
  getRenewalsByContract,
  approveRenewal,
  rejectRenewal,
  cancelRenewal,
  getContractAppendices,
  getMyBookings,
  getOwnerBookings,
  confirmBooking,
  rejectBooking,
  cancelBooking,
}

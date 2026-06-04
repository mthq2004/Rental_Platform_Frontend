import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import contractService from '@/services/contract.service'

interface ContractState {
  loading: boolean
  actionLoading: boolean
  myRequests: any[]
  ownerRequests: any[]
  contracts: any[]
  contractDetail: any | null
  contractAppendices: any[]
  error?: string | null
}

const initialState: ContractState = {
  loading: false,
  actionLoading: false,
  myRequests: [],
  ownerRequests: [],
  contracts: [],
  contractDetail: null,
  contractAppendices: [],
  error: null,
}

export const createRentalRequest = createAsyncThunk(
  'contract/createRentalRequest',
  async (data: { propertyId: string; ownerId: string; startDate: string; endDate: string; proposedRent: number; message?: string; autoRenew?: boolean }, { rejectWithValue }) => {
    try {
      return await contractService.createRentalRequest(data)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Create rental request failed')
    }
  }
)

export const payHoldingDeposit = createAsyncThunk(
  'contract/payHoldingDeposit',
  async (data: { requestId: string; method: string; platform?: string }, { rejectWithValue }) => {
    try {
      return await contractService.payHoldingDeposit(data)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Pay holding deposit failed')
    }
  }
)

export const getContractDetail = createAsyncThunk(
  'contract/getContractDetail',
  async (contractId: string, { rejectWithValue }) => {
    try {
      return await contractService.getContractDetail(contractId)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Get contract detail failed')
    }
  }
)

export const getMyRentalRequests = createAsyncThunk(
  'contract/getMyRentalRequests',
  async (_, { rejectWithValue }) => {
    try {
      return await contractService.getMyRentalRequests()
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Get my rental requests failed')
    }
  }
)

export const getOwnerRequests = createAsyncThunk<any, string | undefined>(
  'contract/getOwnerRequests',
  async (status, thunkApi) => {
    const { rejectWithValue } = thunkApi
    try {
      return await contractService.getOwnerRequests(status)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Get owner rental requests failed')
    }
  }
)

export const reviewRequest = createAsyncThunk(
  'contract/reviewRequest',
  async (
    data: { requestId: string; status: 'under_review' | 'rejected'; rejectionReason?: string; landlordNotes?: string },
    { rejectWithValue }
  ) => {
    try {
      return await contractService.reviewRequest(data)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Review request failed')
    }
  }
)

export const cancelRequest = createAsyncThunk(
  'contract/cancelRequest',
  async (requestId: string, { rejectWithValue }) => {
    try {
      return await contractService.cancelRequest(requestId)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Cancel request failed')
    }
  }
)

export const openHoldingDepositWindow = createAsyncThunk(
  'contract/openHoldingDepositWindow',
  async (data: { requestIds: string[]; expireMinutes?: number }, { rejectWithValue }) => {
    try {
      return await contractService.openHoldingDeposit(data)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Open holding deposit failed')
    }
  }
)

export const getMyContracts = createAsyncThunk<any, { status?: string; page?: number; limit?: number } | undefined>(
  'contract/getMyContracts',
  async (params, thunkApi) => {
    const { rejectWithValue } = thunkApi
    try {
      return await contractService.getMyContracts(params)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Get my contracts failed')
    }
  }
)

export const getRequestDetail = createAsyncThunk(
  'contract/getRequestDetail',
  async (requestId: string, { rejectWithValue }) => {
    try {
      return await contractService.getRequestDetail(requestId)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Get request detail failed')
    }
  }
)

export const getTemplates = createAsyncThunk(
  'contract/getTemplates',
  async (propertyType: string, { rejectWithValue }) => {
    try {
      return await contractService.getTemplates(propertyType)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Get templates failed')
    }
  }
)

export const getTemplateDetail = createAsyncThunk(
  'contract/getTemplateDetail',
  async (templateId: string, { rejectWithValue }) => {
    try {
      return await contractService.getTemplateDetail(templateId)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Get template detail failed')
    }
  }
)

export const getRequestTemplateData = createAsyncThunk(
  'contract/getRequestTemplateData',
  async (requestId: string, { rejectWithValue }) => {
    try {
      return await contractService.getRequestTemplateData(requestId)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Get request template data failed')
    }
  }
)

export const createContract = createAsyncThunk(
  'contract/createContract',
  async (data: any, { rejectWithValue }) => {
    try {
      return await contractService.createContract(data)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Create contract failed')
    }
  }
)

export const updateContract = createAsyncThunk(
  'contract/updateContract',
  async (
    { contractId, data }: { contractId: string; data: Record<string, unknown> },
    { rejectWithValue }
  ) => {
    try {
      return await contractService.updateContract(contractId, data)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Cập nhật hợp đồng thất bại')
    }
  }
)

export const createUpdateDraft = createAsyncThunk(
  'contract/createUpdateDraft',
  async (
    { contractId, data }: { contractId: string; data: { expiresInHours: number; updateNote?: string } },
    { rejectWithValue }
  ) => {
    try {
      return await contractService.createUpdateDraft(contractId, data)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Tạo bản nháp chỉnh sửa thất bại')
    }
  }
)

export const sendContractToTenant = createAsyncThunk(
  'contract/sendContractToTenant',
  async (contractId: string, { rejectWithValue }) => {
    try {
      return await contractService.sendContractToTenant(contractId)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Gửi hợp đồng thất bại')
    }
  }
)

export const getContractAppendices = createAsyncThunk(
  'contract/getContractAppendices',
  async (contractId: string, { rejectWithValue }) => {
    try {
      return await contractService.getContractAppendices(contractId)
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Get contract appendices failed')
    }
  }
)

const slice = createSlice({
  name: 'contract',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createRentalRequest.pending, (state) => { state.loading = true; state.error = null })
      .addCase(createRentalRequest.fulfilled, (state, action) => {
        state.loading = false
        if (Array.isArray(state.myRequests)) {
          state.myRequests.unshift(action.payload)
        } else {
          state.myRequests = [action.payload]
        }
      })
      .addCase(createRentalRequest.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(payHoldingDeposit.pending, (state) => { state.loading = true; state.error = null })
      .addCase(payHoldingDeposit.fulfilled, (state, action) => { state.loading = false })
      .addCase(payHoldingDeposit.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(getTemplates.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getTemplates.fulfilled, (state) => { state.loading = false })
      .addCase(getTemplates.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(getTemplateDetail.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getTemplateDetail.fulfilled, (state) => { state.loading = false })
      .addCase(getTemplateDetail.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(getRequestTemplateData.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getRequestTemplateData.fulfilled, (state) => { state.loading = false })
      .addCase(getRequestTemplateData.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(createContract.pending, (state) => { state.loading = true; state.error = null })
      .addCase(createContract.fulfilled, (state) => { state.loading = false })
      .addCase(createContract.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(updateContract.pending, (state) => { state.actionLoading = true; state.error = null })
      .addCase(updateContract.fulfilled, (state, action) => {
        state.actionLoading = false
        const payload = (action.payload as any)?.data ?? action.payload
        if (payload && state.contractDetail?.rentalId === payload?.rentalId) {
          state.contractDetail = payload
        }
      })
      .addCase(updateContract.rejected, (state, action) => { state.actionLoading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(createUpdateDraft.pending, (state) => { state.actionLoading = true; state.error = null })
      .addCase(createUpdateDraft.fulfilled, (state) => { state.actionLoading = false })
      .addCase(createUpdateDraft.rejected, (state, action) => { state.actionLoading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(sendContractToTenant.pending, (state) => { state.actionLoading = true; state.error = null })
      .addCase(sendContractToTenant.fulfilled, (state) => { state.actionLoading = false })
      .addCase(sendContractToTenant.rejected, (state, action) => { state.actionLoading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(getContractDetail.pending, (state) => { state.loading = true; state.error = null; state.contractDetail = null })
      .addCase(getContractDetail.fulfilled, (state, action) => { state.loading = false; state.contractDetail = action.payload })
      .addCase(getContractDetail.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(getMyRentalRequests.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getMyRentalRequests.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        state.myRequests = Array.isArray(payload) ? payload : payload?.items || payload?.data || []
      })
      .addCase(getMyRentalRequests.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(getOwnerRequests.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getOwnerRequests.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        state.ownerRequests = Array.isArray(payload) ? payload : payload?.items || payload?.data || []
      })
      .addCase(getOwnerRequests.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(getRequestDetail.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getRequestDetail.fulfilled, (state) => { state.loading = false })
      .addCase(getRequestDetail.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(reviewRequest.pending, (state) => { state.loading = true; state.error = null })
      .addCase(reviewRequest.fulfilled, (state) => { state.loading = false })
      .addCase(reviewRequest.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(openHoldingDepositWindow.pending, (state) => { state.loading = true; state.error = null })
      .addCase(openHoldingDepositWindow.fulfilled, (state) => { state.loading = false })
      .addCase(openHoldingDepositWindow.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(cancelRequest.pending, (state) => { state.loading = true; state.error = null })
      .addCase(cancelRequest.fulfilled, (state) => { state.loading = false })
      .addCase(cancelRequest.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(getMyContracts.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getMyContracts.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        state.contracts = Array.isArray(payload) ? payload : payload?.items || payload?.data || []
      })
      .addCase(getMyContracts.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })

      .addCase(getContractAppendices.pending, (state) => { state.loading = true; state.error = null })
      .addCase(getContractAppendices.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        state.contractAppendices = Array.isArray(payload) ? payload : payload?.items || payload?.data || []
      })
      .addCase(getContractAppendices.rejected, (state, action) => { state.loading = false; state.error = String(action.payload || action.error?.message) })
  }
})

export default slice.reducer

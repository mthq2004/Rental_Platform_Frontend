import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import smartcaService from '@/services/smartca.service'

// ─── Types ────────────────────────────────────────────────────────────────────
export type SmartCASignStatus =
  | 'IDLE'
  | 'WAITING_CONFIRM'
  | 'PENDING'
  | 'PROCESSING'
  | 'SIGNED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ERROR'

interface SmartCAState {
  transactionId: string | null
  initialExpiredIn: number
  expiredIn: number
  resumed: boolean
  signStatus: SmartCASignStatus
  loading: boolean
  error: string | null
}

const initialState: SmartCAState = {
  transactionId: null,
  initialExpiredIn: 0,
  expiredIn: 0,
  resumed: false,
  signStatus: 'IDLE',
  loading: false,
  error: null,
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

/** Khởi tạo phiên ký SmartCA, trả về transactionId + expiredIn */
export const signContract = createAsyncThunk(
  'smartca/signContract',
  async (contractId: string, { rejectWithValue }) => {
    try {
      const data = await smartcaService.signContract(contractId)
      return {
        transactionId: String(data?.transactionId ?? ''),
        expiredIn: Number(data?.expiredIn ?? 0),
        resumed: Boolean(data?.resumed),
      }
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Không thể khởi tạo ký SmartCA')
    }
  }
)

/** Kiểm tra kết quả ký từ VNPT (polling WAITING_CONFIRM / PENDING) */
export const handleSignResult = createAsyncThunk(
  'smartca/handleSignResult',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const data = await smartcaService.handleSignResult(transactionId)
      return {
        status: (data?.status || 'PENDING') as SmartCASignStatus,
      }
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Không thể kiểm tra trạng thái ký')
    }
  }
)

/** Lấy trạng thái ký từ backend contract (polling PROCESSING) */
export const getContractSignStatus = createAsyncThunk(
  'smartca/getContractSignStatus',
  async (contractId: string, { rejectWithValue }) => {
    try {
      const data = await smartcaService.getContractSignStatus(contractId)
      return {
        status: (data?.status || 'PENDING') as 'SIGNED' | 'PROCESSING' | 'PENDING',
        signedFileUrl: data?.signedFileUrl,
      }
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Không thể lấy trạng thái ký')
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────
const smartcaSlice = createSlice({
  name: 'smartca',
  initialState,
  reducers: {
    /** Tick đếm ngược 1 giây – tự động set EXPIRED khi hết giờ */
    tickSmartCARemaining: (state) => {
      state.expiredIn = Math.max(0, state.expiredIn - 1)
      if (
        state.expiredIn <= 0 &&
        ['WAITING_CONFIRM', 'PENDING'].includes(state.signStatus)
      ) {
        state.signStatus = 'EXPIRED'
      }
    },
    /** Reset toàn bộ về trạng thái ban đầu */
    resetSmartCAState: () => initialState,
    // Giữ lại để tránh break imports cũ
    setSmartCAWaitingConfirm: (state) => {
      state.signStatus = 'WAITING_CONFIRM'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // ── signContract ────────────────────────────────────────────────────
    builder
      .addCase(signContract.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signContract.fulfilled, (state, action) => {
        state.loading = false
        state.transactionId = action.payload.transactionId
        state.initialExpiredIn = Number(action.payload.expiredIn || 0)
        state.expiredIn = Number(action.payload.expiredIn || 0)
        state.resumed = Boolean(action.payload.resumed)
        state.signStatus = 'WAITING_CONFIRM'
      })
      .addCase(signContract.rejected, (state, action) => {
        state.loading = false
        state.resumed = false
        state.signStatus = 'ERROR'
        state.error = (action.payload as string) || 'Không thể khởi tạo ký SmartCA'
      })

    // ── handleSignResult ────────────────────────────────────────────────
    builder
      .addCase(handleSignResult.pending, (state) => {
        state.loading = true
      })
      .addCase(handleSignResult.fulfilled, (state, action) => {
        state.loading = false
        const s = action.payload?.status

        if (s === 'SIGNED') { state.signStatus = 'SIGNED'; state.error = null; return }
        if (s === 'REJECTED') { state.signStatus = 'REJECTED'; return }
        if (s === 'PROCESSING') { state.signStatus = 'PROCESSING'; return }
        if (s === 'EXPIRED') { state.signStatus = 'EXPIRED'; state.expiredIn = 0; return }

        state.signStatus = 'PENDING'
      })
      .addCase(handleSignResult.rejected, (state, action) => {
        state.loading = false
        // Không set ERROR khi poll thất bại – chỉ bỏ qua lần poll đó
        state.error = (action.payload as string) || null
      })

    // ── getContractSignStatus ───────────────────────────────────────────
    builder
      .addCase(getContractSignStatus.fulfilled, (state, action) => {
        const s = action.payload?.status

        if (s === 'SIGNED') { state.signStatus = 'SIGNED'; state.error = null; return }
        if (s === 'PROCESSING') { state.signStatus = 'PROCESSING'; return }

        state.signStatus = 'PENDING'
      })
      .addCase(getContractSignStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || null
      })
  },
})

export const { setSmartCAWaitingConfirm, tickSmartCARemaining, resetSmartCAState } =
  smartcaSlice.actions

export default smartcaSlice.reducer

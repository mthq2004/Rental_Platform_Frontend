import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "@/utils/api";

export type SmartCASignStatus =
	| "IDLE"
	| "WAITING_CONFIRM"
	| "PENDING"
	| "PROCESSING"
	| "SIGNED"
	| "REJECTED"
	| "EXPIRED"
	| "ERROR";

interface StartSignResponse {
	transactionId: string;
	expiredIn?: number;
	resumed?: boolean;
}

interface HandleSignResultResponse {
	status: "SIGNED" | "REJECTED" | "PENDING" | "PROCESSING" | "EXPIRED";
	dataUri?: string;
}

interface ContractSignStatusResponse {
	status: "SIGNED" | "PROCESSING" | "PENDING";
	signedFileUrl?: string;
}

interface SmartCAState {
	transactionId: string | null;
	initialExpiredIn: number;
	expiredIn: number;
	startedAt: number | null;
	resumed: boolean;
	signStatus: SmartCASignStatus;
	loading: boolean;
	error: string | null;
}

const initialState: SmartCAState = {
	transactionId: null,
	initialExpiredIn: 0,
	expiredIn: 0,
	startedAt: null,
	resumed: false,
	signStatus: "IDLE",
	loading: false,
	error: null,
};

export const signContract = createAsyncThunk(
	"smartca/signContract",
	async (contractId: string, { rejectWithValue }) => {
		try {
			const response = await http.post(`/contract/smartca/contracts/${contractId}/sign`);
			const data = response?.data ?? response;
			return {
				transactionId: data?.transactionId,
				expiredIn: Number(data?.expiredIn ?? 0),
				resumed: Boolean(data?.resumed),
			} as StartSignResponse;
		} catch (e: any) {
			return rejectWithValue(e?.message || "Không thể khởi tạo ký SmartCA");
		}
	}
);

export const handleSignResult = createAsyncThunk(
	"smartca/handleSignResult",
	async (transactionId: string, { rejectWithValue }) => {
		try {
			const response = await http.post(`/contract/smartca/sign/${transactionId}`);
			const data = response?.data ?? response;
			return data as HandleSignResultResponse;
		} catch (e: any) {
			return rejectWithValue(e?.message || "Không thể kiểm tra trạng thái ký");
		}
	}
);

export const getContractSignStatus = createAsyncThunk(
	"smartca/getContractSignStatus",
	async (contractId: string, { rejectWithValue }) => {
		try {
			const response = await http.get(`/contract/smartca/contracts/${contractId}/status`);
			const data = response?.data ?? response;
			return data as ContractSignStatusResponse;
		} catch (e: any) {
			return rejectWithValue(e?.message || "Không thể lấy trạng thái xử lý ký hợp đồng");
		}
	}
);

const smartcaSlice = createSlice({
	name: "smartca",
	initialState,
	reducers: {
		setSmartCAWaitingConfirm: (state) => {
			state.signStatus = "WAITING_CONFIRM";
			state.error = null;
		},
		tickSmartCARemaining: (state) => {
			state.expiredIn = Math.max(0, state.expiredIn - 1);
			if (
				state.expiredIn <= 0 &&
				["WAITING_CONFIRM", "PENDING"].includes(state.signStatus)
			) {
				state.signStatus = "EXPIRED";
			}
		},
		resetSmartCAState: () => initialState,
	},
	extraReducers: (builder) => {
		builder
			.addCase(signContract.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(signContract.fulfilled, (state, action) => {
				state.loading = false;
				state.transactionId = action.payload.transactionId;
				state.initialExpiredIn = Number(action.payload.expiredIn || 0);
				state.expiredIn = Number(action.payload.expiredIn || 0);
				state.startedAt = Date.now();
				state.resumed = Boolean(action.payload.resumed);
				state.signStatus = "WAITING_CONFIRM";
			})
			.addCase(signContract.rejected, (state, action) => {
				state.loading = false;
				state.resumed = false;
				state.signStatus = "ERROR";
				state.error = (action.payload as string) || "Không thể khởi tạo ký SmartCA";
			});

		builder
			.addCase(handleSignResult.pending, (state) => {
				state.loading = true;
			})
			.addCase(handleSignResult.fulfilled, (state, action) => {
				state.loading = false;
				const status = action.payload?.status;

				if (status === "SIGNED") {
					state.signStatus = "SIGNED";
					state.error = null;
					return;
				}

				if (status === "REJECTED") {
					state.signStatus = "REJECTED";
					return;
				}

				if (status === "PROCESSING") {
					state.signStatus = "PROCESSING";
					return;
				}

				if (status === "EXPIRED") {
					state.signStatus = "EXPIRED";
					state.expiredIn = 0;
					return;
				}

				state.signStatus = "PENDING";
			})
			.addCase(handleSignResult.rejected, (state, action) => {
				state.loading = false;
				state.signStatus = "ERROR";
				state.error = (action.payload as string) || "Không thể kiểm tra trạng thái ký";
			});

		builder
			.addCase(getContractSignStatus.fulfilled, (state, action) => {
				const status = action.payload?.status;

				if (status === "SIGNED") {
					state.signStatus = "SIGNED";
					state.error = null;
					return;
				}

				if (status === "PROCESSING") {
					state.signStatus = "PROCESSING";
					return;
				}

				state.signStatus = "PENDING";
			})
			.addCase(getContractSignStatus.rejected, (state, action) => {
				state.error = (action.payload as string) || "Không thể lấy trạng thái xử lý ký hợp đồng";
			});
	},
});

export const {
	setSmartCAWaitingConfirm,
	tickSmartCARemaining,
	resetSmartCAState,
} = smartcaSlice.actions;

export default smartcaSlice.reducer;

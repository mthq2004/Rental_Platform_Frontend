import { AddConversationToCategoryDto, CreateCustomerCategoryDto, CustomerCategory } from "@/types/customer-category.type"
import apiClient from "@/utils/api"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

type CustomerCategoryState = {
  loading: boolean
  error: string | null
  customerCategories: CustomerCategory[]
  customerCategory?: CustomerCategory,
  currentConversationCategoryIds: string[]
}

const initialState: CustomerCategoryState = {
  loading: false,
  error: null,
  customerCategories: [],
  customerCategory: undefined,
  currentConversationCategoryIds: []
}

//
// ================= THUNKS =================
//

export const getAllCustomerCategories = createAsyncThunk<
  CustomerCategory[]
>(
  "customer-category/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/chat/customer-categories")
      return res.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Error")
    }
  }
)

export const createCustomerCategory = createAsyncThunk<
  CustomerCategory,
  CreateCustomerCategoryDto
>(
  "customer-category/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/chat/customer-categories", data)
      return res.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Error")
    }
  }
)

export const addConversationToCategory = createAsyncThunk<
  any,
  AddConversationToCategoryDto
>(
  "customer-category/addConversation",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(
        "/chat/customer-categories/add-conversation",
        data
      )
      return res.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Error")
    }
  }
)

export const getCustomerCategoryById = createAsyncThunk<
  CustomerCategory,
  string
>(
  "customer-category/getById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(
        `/chat/customer-categories/detail/${id}`
      )
      return res.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Error")
    }
  }
)

//
// ================= SLICE =================
//

const customerCategorySlice = createSlice({
  name: "customer-category",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // ================= GET ALL =================
      .addCase(getAllCustomerCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllCustomerCategories.fulfilled, (state, action) => {
        state.loading = false
        state.customerCategories = action.payload
      })
      .addCase(getAllCustomerCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // ================= CREATE =================
      .addCase(createCustomerCategory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createCustomerCategory.fulfilled, (state, action) => {
        state.loading = false
        state.customerCategories.unshift(action.payload)
      })
      .addCase(createCustomerCategory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // ================= ADD CONVERSATION =================
      .addCase(addConversationToCategory.fulfilled, (state, action) => {
        const { categoryIds } = action.meta.arg

        const oldIds = state.currentConversationCategoryIds || []

        const added = categoryIds.filter(id => !oldIds.includes(id))
        const removed = oldIds.filter(id => !categoryIds.includes(id))

        added.forEach(id => {
          const cat = state.customerCategories.find(c => c.id === id)
          if (cat) cat.conversationCount++

          if (state.customerCategory?.id === id) {
            state.customerCategory.conversationCount++
          }
        })

        removed.forEach(id => {
          const cat = state.customerCategories.find(c => c.id === id)
          if (cat && cat.conversationCount > 0) cat.conversationCount--

          if (state.customerCategory?.id === id &&
            state.customerCategory.conversationCount > 0) {
            state.customerCategory.conversationCount--
          }
        })

        state.currentConversationCategoryIds = categoryIds
      })

      // ================= GET BY ID =================
      .addCase(getCustomerCategoryById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCustomerCategoryById.fulfilled, (state, action) => {
        state.loading = false
        state.customerCategory = action.payload
      })
      .addCase(getCustomerCategoryById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

export default customerCategorySlice.reducer
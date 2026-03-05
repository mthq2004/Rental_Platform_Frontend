import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/utils/api";
import { GetMessagesResponse, Message } from "@/types/message.type";

type SendMessagePayload = {
  conversationId: string;
  content?: string;
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
  replyToId?: string | null;
};

type MessageState = {
  loading: boolean;
  error: string | null;
  messages: Message[];

  nextCursor: string | null;
  hasNextPage: boolean;
};

const initialState: MessageState = {
  loading: false,
  error: null,
  messages: [],
  nextCursor: null,
  hasNextPage: true,
};

export const fetchMessages = createAsyncThunk<
  GetMessagesResponse,
  {
    conversationId: string;
    cursor?: string | null;
    limit?: number;
  },
  { rejectValue: string }
>(
  "message/fetchByConversation",
  async ({ conversationId, cursor, limit = 20 }, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(
        `/chat/messages/conversation/${conversationId}`,
        {
          params: {
            cursor,
            limit,
          },
        }
      );

      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Fetch messages failed"
      );
    }
  }
);

export const sendMessage = createAsyncThunk<
  Message,
  SendMessagePayload,
  { rejectValue: string }
>("message/send", async (body, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/chat/messages", body);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Send message failed"
    );
  }
});

export const markAsRead = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("message/markAsRead", async (conversationId, { rejectWithValue }) => {
  try {
    await apiClient.put(
      `/chat/messages/conversation/${conversationId}/message/read`
    );
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Mark as read failed"
    );
  }
});

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.messages = [];
      state.nextCursor = null;
      state.hasNextPage = true;
    },

    addRealtimeMessage: (state, action: PayloadAction<Message>) => {
      const exists = state.messages.some(
        m => m.id === action.payload.id
      );

      if (!exists) {
        state.messages.unshift(action.payload);
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;

        const exists = state.messages.some(
          m => m.id === action.payload.id
        );

        if (!exists) {
          state.messages.unshift(action.payload);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      })

    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;

        const { messages, nextCursor, hasNextPage } = action.payload;

        if (state.nextCursor) {
          const existingIds = new Set(state.messages.map(m => m.id));

          const filtered = messages.filter(
            m => !existingIds.has(m.id)
          );

          state.messages = [...state.messages, ...filtered];
        } else {
          state.messages = messages;
        }

        state.nextCursor = nextCursor;
        state.hasNextPage = hasNextPage;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      });
  },
});

export const { clearMessages, addRealtimeMessage } = messageSlice.actions;
export default messageSlice.reducer;
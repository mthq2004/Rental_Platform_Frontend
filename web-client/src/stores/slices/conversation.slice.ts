import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { addConversationToCategory } from "./customer-category.slice";
import { Conversation } from "@/types/conversation.type";

type ConversationState = {
  loading: boolean;
  error: string | null;
  conversations: Conversation[];
  currentConversationId?: string,
  onlineUsers: string[]
};

const initialState: ConversationState = {
  loading: false,
  error: null,
  conversations: [],
  onlineUsers: []
};

export const fetchConversations = createAsyncThunk<
  Conversation[],
  void,
  { rejectValue: string }
>(
  "conversation/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/chat/conversations/my");
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Fetch conversations failed"
      );
    }
  }
);

export const createConversation = createAsyncThunk<
  Conversation,
  string,
  { rejectValue: string }
>(
  "conversation/create",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/chat/conversations", {
        userId,
      });

      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Create conversation failed"
      );
    }
  }
);

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

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    updateUnreadCount: (state, action) => {
      const { conversationId, count } = action.payload;

      const found = state.conversations.find(
        (c) => c.id === conversationId
      );

      if (found) {
        found.unreadCount = count;
      }
    },
    addConversation: (state, action) => {
      const exists = state.conversations.find(
        (c) => c.id === action.payload.id
      );

      if (!exists) {
        state.conversations.unshift(action.payload);
      }
    },
    updateConversationOnNewMessage: (state, action) => {
      const { conversationId, message, isCurrentOpen } = action.payload;

      console.log('====================================');
      console.log("choa: ", isCurrentOpen, message);
      console.log('====================================');

      const index = state.conversations.findIndex(
        (c) => c.id === conversationId
      );

      if (index !== -1) {
        const conversation = state.conversations[index];

        // update last message
        conversation.lastMessage.content = message;

        // nếu không mở chat đó thì tăng unread
        if (!isCurrentOpen) {
          conversation.unreadCount =
            (conversation.unreadCount || 0) + 1;
        }

        // move lên đầu
        state.conversations.splice(index, 1);
        state.conversations.unshift(conversation);
      }
    },
    setCurrentConversation: (state, action) => {
      state.currentConversationId = action.payload;
    },
    setUserOnline: (state, action) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    setUserOffline: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter(
        id => id !== action.payload
      );
    },
    setOnlineUsersSnapshot: (state, action: { payload: string[] }) => {
      // Thay thế hoàn toàn bằng snapshot từ server (authoritative)
      state.onlineUsers = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      })

    builder
      .addCase(createConversation.pending, (state) => {
        state.loading = true;
      })
      .addCase(createConversation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      });

    builder.addCase(addConversationToCategory.fulfilled, (state, action) => {
      const { conversationId, categories } = action.payload;

      const conversation = state.conversations.find(
        c => c.id === conversationId
      );

      if (conversation) {
        conversation.categories = categories;
      }
    });

    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const conversationId = action.meta.arg;

      const conversation = state.conversations.find(
        (c) => c.id === conversationId
      );

      if (conversation) {
        conversation.unreadCount = 0;
      }
    });
  },
});

export const { updateUnreadCount, addConversation, updateConversationOnNewMessage, setCurrentConversation, setUserOffline, setUserOnline, setOnlineUsersSnapshot } = conversationSlice.actions;
export default conversationSlice.reducer;
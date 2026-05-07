import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { addConversationToCategory } from "./customer-category.slice";
import { Conversation } from "@/types/conversation.type";

type ConversationState = {
  loading: boolean;
  error: string | null;
  conversations: Conversation[];
  archivedConversations: Conversation[];
  currentConversationId?: string,
  onlineUsers: string[]
};

const initialState: ConversationState = {
  loading: false,
  error: null,
  conversations: [],
  archivedConversations: [],
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

export const archiveConversation = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "conversation/archive",
  async (conversationId, { rejectWithValue }) => {
    try {
      await apiClient.post(`/chat/conversations/${conversationId}/archive`);
      return conversationId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Archive failed");
    }
  }
);

export const deleteConversation = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "conversation/delete",
  async (conversationId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/chat/conversations/${conversationId}`);
      return conversationId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Delete failed");
    }
  }
);

export const fetchArchivedConversations = createAsyncThunk<
  Conversation[],
  void,
  { rejectValue: string }
>(
  "conversation/fetchArchived",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/chat/conversations/archived");
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Fetch archived failed");
    }
  }
);

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

    builder.addCase(archiveConversation.fulfilled, (state, action) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      state.archivedConversations = state.archivedConversations.filter(c => c.id !== action.payload);
    });

    builder.addCase(deleteConversation.fulfilled, (state, action) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      state.archivedConversations = state.archivedConversations.filter(c => c.id !== action.payload);
    });

    builder.addCase(fetchArchivedConversations.pending, (state) => {
      state.loading = true;
    })
    .addCase(fetchArchivedConversations.fulfilled, (state, action) => {
      state.loading = false;
      state.archivedConversations = action.payload;
    })
    .addCase(fetchArchivedConversations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Error";
    });
  },
});

export const { updateUnreadCount, addConversation, updateConversationOnNewMessage, setCurrentConversation, setUserOffline, setUserOnline, setOnlineUsersSnapshot } = conversationSlice.actions;
export default conversationSlice.reducer;
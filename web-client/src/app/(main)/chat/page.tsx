"use client";

import { useEffect, useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  fetchConversations,
  markAsRead,
  setCurrentConversation,
} from "@/stores/slices/conversation.slice";
import {
  fetchMessages,
  sendMessage,
  SendMessagePayload,
} from "@/stores/slices/message.slice";
import { Spin, Empty } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const { conversations = [], loading: conversationLoading } = useAppSelector(
    (state) => state.conversation
  );
  const {
    messages,
    loading: messageLoading,
    hasNextPage,
    nextCursor,
  } = useAppSelector((state) => state.message);
  
  const { user, isAuth } = useAppSelector((state) => state.auth);
  const { onlineUsers } = useAppSelector((state) => state.conversation);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const initialConversationId = searchParams.get("conversationId");

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (!initialConversationId) return;
    setSelectedId(initialConversationId);
  }, [initialConversationId]);

  useEffect(() => {
    if (!selectedId) return;
    dispatch(fetchMessages({ conversationId: selectedId }));
  }, [selectedId, dispatch]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const handleLoadMore = () => {
    if (!selectedId || !hasNextPage || !nextCursor) return;
    dispatch(fetchMessages({ conversationId: selectedId, cursor: nextCursor }));
  };

  const isOnline = selectedConversation
    ? onlineUsers.includes(selectedConversation.participant.id)
    : false;

  useEffect(() => {
    if (!selectedId) return;
    dispatch(setCurrentConversation(selectedId));
    dispatch(markAsRead(selectedId));
    return () => {
      dispatch(setCurrentConversation(null));
    };
  }, [selectedId, dispatch]);

  const handleSendMessage = (data: SendMessagePayload) => {
    dispatch(sendMessage(data));
  };

  if (conversationLoading && conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <Spin size="large" />
      </div>
    );
  }
    if (!isAuth) {
    return (
      <div className="flex h-[calc(100vh-73px)] items-center justify-center bg-slate-50">
        <Empty description="Bạn cần đăng nhập để sử dụng chức năng chat" />
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden bg-gray-50">
      <ChatSidebar
        conversations={conversations}
        loading={conversationLoading}
        selectedId={selectedId ?? undefined}
        currentUserId={user?.id}
        onlineUsers={onlineUsers}
        onSelect={(conv) => setSelectedId(conv.id)}
      />

      {selectedConversation && user?.id && selectedId ? (
        <ChatWindow
          conversationId={selectedId}
          messages={messages}
          loading={messageLoading}
          currentUserId={user.id}
          participantId={selectedConversation.participant.id}
          participantName={selectedConversation.participant.fullName}
          participantAvatar={selectedConversation.participant.avatarUrl}
          isOnline={isOnline}
          onLoadMore={handleLoadMore}
          hasNextPage={hasNextPage}
          onSend={handleSendMessage}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-white">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-5">
            <MessageOutlined className="text-3xl text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Chào mừng đến với Chat
          </h3>
          <p className="text-sm text-gray-400 max-w-70 text-center">
            Hãy chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn
            tin
          </p>
        </div>
      )}
    </div>
  );
}
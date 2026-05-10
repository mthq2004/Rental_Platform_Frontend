"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  fetchArchivedConversations,
  markAsRead,
  setCurrentConversation,
} from "@/stores/slices/conversation.slice";
import { fetchMessages, sendMessage } from "@/stores/slices/message.slice";
import { Empty, Button, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";

function ArchivedChatContent() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const { archivedConversations = [], loading: conversationLoading, onlineUsers = [] } = useAppSelector(
    (state) => state.conversation
  );
  const {
    messages = [],
    loading: messageLoading,
    hasNextPage,
    nextCursor,
  } = useAppSelector((state) => state.message);
  const { user } = useAppSelector((state) => state.auth);

  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("id")
  );

  const selectedConversation = archivedConversations.find(
    (c) => c.id === selectedId
  );

  useEffect(() => {
    dispatch(fetchArchivedConversations());
  }, [dispatch]);

  useEffect(() => {
    if (selectedId) {
      dispatch(setCurrentConversation(selectedId));
      dispatch(fetchMessages({ conversationId: selectedId }));
      dispatch(markAsRead(selectedId));
    } else {
      dispatch(setCurrentConversation(null));
    }
  }, [selectedId, dispatch]);

  const handleSendMessage = (payload: any) => {
    dispatch(sendMessage(payload));
  };

  const handleLoadMore = () => {
    if (selectedId && hasNextPage && !messageLoading) {
      dispatch(fetchMessages({ conversationId: selectedId, cursor: nextCursor }));
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-gray-50">
      <div className="h-12 bg-white border-b border-gray-100 flex items-center px-4 shrink-0">
        <Link href="/chat">
          <Button type="text" icon={<ArrowLeftOutlined />}>
            Quay lại trò chuyện
          </Button>
        </Link>
        <span className="ml-4 font-semibold text-gray-700">Cuộc hội thoại bị ẩn</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          conversations={archivedConversations}
          archivedConversations={archivedConversations}
          loading={conversationLoading}
          selectedId={selectedId ?? undefined}
          currentUserId={user?.id}
          onlineUsers={onlineUsers}
          onSelect={(conv) => setSelectedId(conv.id)}
          onTabChange={() => { }} 
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
            isOnline={onlineUsers.includes(selectedConversation.participant.id)}
            hasNextPage={hasNextPage}
            onLoadMore={handleLoadMore}
            onSend={handleSendMessage}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white">
            <Empty
              description="Chọn một cuộc trò chuyện để xem tin nhắn"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArchivedChatPage() {
  return (
    <React.Suspense fallback={
      <div className="h-full flex items-center justify-center bg-white">
        <Spin size="large" />
      </div>
    }>
      <ArchivedChatContent />
    </React.Suspense>
  );
}


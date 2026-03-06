"use client";

import { useEffect, useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchConversations, markAsRead, setCurrentConversation } from "@/stores/slices/conversation.slice";
import { fetchMessages, sendMessage, SendMessagePayload } from "@/stores/slices/message.slice";
import { Spin } from "antd";

export default function ChatPage() {
  const dispatch = useAppDispatch();

  const { conversations = [], loading: conversationLoading } =useAppSelector((state) => state.conversation);
  const { messages, loading: messageLoading, error, hasNextPage, nextCursor } = useAppSelector((state) => state.message);
  const { user } = useAppSelector((state) => state.auth);
  const { onlineUsers } = useAppSelector(state => state.conversation)

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedId) return;
    console.log("jk: ", selectedId);

    dispatch(
      fetchMessages({
        conversationId: selectedId,
      })
    );
  }, [selectedId, dispatch]);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedId
  );

  const handleLoadMore = () => {
    if (!selectedId || !hasNextPage || !nextCursor) return;

    dispatch(
      fetchMessages({
        conversationId: selectedId,
        cursor: nextCursor,
      })
    );
  };

  const isOnline = selectedConversation ? onlineUsers.includes(selectedConversation.participant.id) : false;

  useEffect(() => {
    if (!selectedId) return;

    dispatch(setCurrentConversation(selectedId));
    dispatch(markAsRead(selectedId));

    return () => {
      dispatch(setCurrentConversation(null));
    };
  }, [selectedId, dispatch]);

  const handleSendMessage = (data: SendMessagePayload) => {
    dispatch(sendMessage(data))
  }

  if (conversationLoading && conversations.length === 0) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        overflow: "hidden",
        background: "#f5f5f5",
      }}
    >
      <ChatSidebar
        conversations={conversations}
        loading={conversationLoading}
        selectedId={selectedId ?? undefined}
        currentUserId={user?.id}
        onSelect={(conv) => setSelectedId(conv.id)}
        
      />

      {selectedConversation && user?.id && selectedId ? (
        <ChatWindow
          conversationId={selectedId}
          messages={messages}
          loading={messageLoading}
          currentUserId={user.id}
          participantName={selectedConversation.participant.fullName}
          participantAvatar={selectedConversation.participant.avatarUrl}
          isOnline={isOnline}
          onLoadMore={handleLoadMore}
          hasNextPage={hasNextPage}
          onSend={handleSendMessage}
        />
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "#fff",
          }}
        >
          <img
            src="/images/chat-placeholder.png"
            alt="chat"
            style={{ width: 250, marginBottom: 20 }}
          />
          <h3>Chào mừng đến với Chat</h3>
          <p style={{ color: "#888" }}>
            Hãy chọn một cuộc trò chuyện để bắt đầu nhắn tin
          </p>
        </div>
      )}
    </div>
  );
}
"use client";

import { Avatar, Button, Space, Typography, Tooltip, Image as AntImage, Spin, Badge } from "antd";
import {
  PhoneOutlined,
  VideoCameraOutlined,
  MoreOutlined,
  FileOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import MessageInput from "@/components/chat/MessageInput";
import { Message, ReplyMessage } from "@/types/message.type";
import MessageBubble from "./MessageBubble";
import { reactMessage, SendMessagePayload } from "@/stores/slices/message.slice";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/stores/hooks";

const { Text } = Typography;


interface ChatWindowProps {
  conversationId: string,
  messages?: Message[];
  loading?: boolean;
  currentUserId: string;
  isLoading?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  onSend?: (payload: SendMessagePayload) => void;
  participantName?: string;
  participantAvatar?: string;
  isOnline?: boolean;
}

export default function ChatWindow({
  conversationId,
  messages = [],
  loading,
  currentUserId,
  isLoading = false,
  hasNextPage = false,
  onLoadMore,
  onSend,
  participantName = "Người dùng",
  participantAvatar,
  isOnline = false,
}: ChatWindowProps) {

  const dispatch = useAppDispatch()
  const containerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number>(0);
  const isFetchingRef = useRef(false);
  const isPrependingRef = useRef(false);
  const isFirstLoadRef = useRef(true);

  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string | null;
    messageType: import("@/types/message.type").MessageType;
    senderName: string;
  } | null>(null);

  const handleReply = (msg: Message) => {
    setReplyTo({
      id: msg.id,
      content: msg.content,
      messageType: msg.messageType,
      senderName: msg.senderId === currentUserId ? "Bạn" : participantName ?? "Đối phương",
    });
  };

  const handleSend = (payload: SendMessagePayload) => {
    onSend?.(payload);
    setReplyTo(null);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (isFirstLoadRef.current && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
      isFirstLoadRef.current = false;
      return;
    }

    if (isFetchingRef.current && isPrependingRef.current) {
      const newHeight = el.scrollHeight;

      el.scrollTop = newHeight - previousHeightRef.current;

      isFetchingRef.current = false;
      isPrependingRef.current = false;
      return;
    }

    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 50;

    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }

  }, [messages]);

  const handleReact = (messageId: string, emoji: string) => {
    try {
      dispatch(reactMessage({ messageId, emoji }))
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    <div style={{ padding: 20, textAlign: "center" }}>
      <Spin />
    </div>
  }

  return (
    <div
      style={{
        flex: 1,
        height: "90%",
        display: "flex",
        flexDirection: "column",
        background: "#f5f7fb",
        minWidth: 0,
      }}
    >
      <div
        style={{
          height: 68,
          background: "#fff",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f0f0f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          flexShrink: 0,
        }}
      >
        <Space size={12}>
          <Badge dot color={isOnline ? "#52c41a" : "#d9d9d9"} offset={[-3, 38]}>
            <Avatar size={42} src={participantAvatar}>
              {participantName?.charAt(0)}
            </Avatar>
          </Badge>
          <div>
            <Text strong style={{ display: "block", fontSize: 15 }}>
              {participantName}
            </Text>
            <Text style={{ fontSize: 12, color: isOnline ? "#52c41a" : "#8c8c8c" }}>
              {isOnline ? "● Đang hoạt động" : "● Ngoại tuyến"}
            </Text>
          </div>
        </Space>

        <Space>
          <Tooltip title="Gọi điện">
            <Button type="text" icon={<PhoneOutlined />} size="large" />
          </Tooltip>
          <Tooltip title="Gọi Video">
            <Button type="text" icon={<VideoCameraOutlined />} size="large" />
          </Tooltip>
          <Button type="text" icon={<MoreOutlined />} size="large" />
        </Space>
      </div>

      <div
        ref={containerRef}
        onScroll={(e) => {
          const el = e.currentTarget;

          if (
            el.scrollTop < 5 &&
            hasNextPage &&
            !isFetchingRef.current &&
            onLoadMore
          ) {

            isFetchingRef.current = true;
            isPrependingRef.current = true;

            // Lưu chiều cao trước khi load
            previousHeightRef.current = el.scrollHeight;

            onLoadMore();
          }
        }}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {hasNextPage && (
          <div style={{ textAlign: "center", paddingBottom: 8 }}>
            <Button type="text" icon={<ReloadOutlined />} onClick={onLoadMore} size="small">
              Tải thêm tin nhắn
            </Button>
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: "center", padding: 16 }}>
            <Spin size="small" />
          </div>
        )}

        {[...messages].reverse().map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            currentUserId={currentUserId}
            onReply={handleReply}
            onReact={handleReact}
          />
        ))}
      </div>

      <MessageInput
        conversationId={conversationId}
        onSend={handleSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}


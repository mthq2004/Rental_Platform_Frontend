"use client";

import React, { useEffect, useRef, useState } from "react";
import { Avatar, Button, Space, Typography, Tooltip, Spin, Badge, Dropdown } from "antd";
import {
  PhoneOutlined,
  VideoCameraOutlined,
  TagsOutlined,
  MoreOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import MessageInput from "@/components/chat/MessageInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { Message } from "@/types/message.type";
import MessageBubble from "./MessageBubble";
import { reactMessage, SendMessagePayload } from "@/stores/slices/message.slice";
import { useAppDispatch } from "@/stores/hooks";
import { useCall } from "@/contexts/CallContext";
import { useSocket } from "@/contexts/ChatSocketContext";
import ConversationTagModal from "./ConversationTagModal";
import { formatTime } from "@/utils/format";

const TIME_GAP_MS = 15 * 60 * 1000; // 15 minutes

function shouldShowTimeDivider(prev: Message | undefined, curr: Message): boolean {
  if (!prev) return true;
  return new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime() >= TIME_GAP_MS;
}

const { Text } = Typography;

interface ChatWindowProps {
  conversationId: string;
  messages?: Message[];
  loading?: boolean;
  participantId?: string;
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
  participantId,
  currentUserId,
  isLoading = false,
  hasNextPage = false,
  onLoadMore,
  onSend,
  participantName = "Người dùng",
  participantAvatar,
  isOnline = false,
}: ChatWindowProps) {
  const dispatch = useAppDispatch();
  const { startCall } = useCall();
  const { emitTyping, onTypingEvent, offTypingEvent } = useSocket();
  const containerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number>(0);
  const isFetchingRef = useRef(false);
  const isPrependingRef = useRef(false);
  const isFirstLoadRef = useRef(true);
  const [showTagModal, setShowTagModal] = useState(false);
  const [isParticipantTyping, setIsParticipantTyping] = useState(false);
  const typingResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const isNearBottomRef = useRef(true);
  const prevMessagesLenRef = useRef(messages.length);
  const forcScrollBottomRef = useRef(false);


  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string | null;
    messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
    senderName: string;
  } | null>(null);

  const handleReply = (msg: Message) => {
    const safeType = (["TEXT", "IMAGE", "VIDEO", "FILE"].includes(msg.messageType)
      ? msg.messageType
      : "TEXT") as "TEXT" | "IMAGE" | "VIDEO" | "FILE";
    setReplyTo({
      id: msg.id,
      content: msg.content,
      messageType: safeType,
      senderName:
        msg.senderId === currentUserId
          ? "Bạn"
          : participantName ?? "Đối phương",
    });
  };

  const handleSend = (payload: SendMessagePayload) => {
    onSend?.(payload);
    setReplyTo(null);
    forcScrollBottomRef.current = true;
  };

  const handleTyping = (isTyping: boolean) => {
    if (participantId) emitTyping(conversationId, participantId, isTyping);
  };

  // Listen for typing events from participant
  useEffect(() => {
    onTypingEvent((data) => {
      if (data.conversationId === conversationId && data.userId === participantId) {
        setIsParticipantTyping(data.isTyping);

        // Auto-reset after 3s in case we miss the stop event
        if (typingResetRef.current) clearTimeout(typingResetRef.current);
        if (data.isTyping) {
          typingResetRef.current = setTimeout(() => {
            setIsParticipantTyping(false);
          }, 3000);
        }
      }
    });

    return () => {
      offTypingEvent();
      if (typingResetRef.current) clearTimeout(typingResetRef.current);
      setIsParticipantTyping(false);
    };
  }, [conversationId, participantId, onTypingEvent, offTypingEvent]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (isFirstLoadRef.current && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
      isFirstLoadRef.current = false;
      prevMessagesLenRef.current = messages.length;
      return;
    }

    if (isFetchingRef.current && isPrependingRef.current) {
      const newHeight = el.scrollHeight;
      el.scrollTop = newHeight - previousHeightRef.current;
      isFetchingRef.current = false;
      isPrependingRef.current = false;
      prevMessagesLenRef.current = messages.length;
      return;
    }

    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    isNearBottomRef.current = isNearBottom;

    // Detect new message added (messages prepend to array, so length increases)
    const isNewMessage = messages.length > prevMessagesLenRef.current;
    prevMessagesLenRef.current = messages.length;

    if (forcScrollBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      forcScrollBottomRef.current = false;
      setHasNewMessage(false);
    } else if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
      setHasNewMessage(false);
    } else if (isNewMessage) {
      setHasNewMessage(true);
    }
  }, [messages]);

  const handleReact = (messageId: string, emoji: string) => {
    dispatch(reactMessage({ messageId, emoji }));
  };

  const scrollToBottom = () => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    setHasNewMessage(false);
  };

  // Clear new message badge when user scrolls to bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    isNearBottomRef.current = isNearBottom;
    if (isNearBottom) {
      setHasNewMessage(false);
    }

    // Load more on scroll to top
    if (
      el.scrollTop < 5 &&
      hasNextPage &&
      !isFetchingRef.current &&
      onLoadMore
    ) {
      isFetchingRef.current = true;
      isPrependingRef.current = true;
      previousHeightRef.current = el.scrollHeight;
      onLoadMore();
    }
  };


  const moreItems = [
    { key: "tag", icon: <TagsOutlined />, label: "Gắn phân loại", onClick: () => setShowTagModal(true) },
  ];

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] min-w-0">
      {/* Header */}
      <div className="h-16 bg-white px-4 md:px-5 flex items-center justify-between border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Badge
            dot
            color={isOnline ? "#52c41a" : "#d9d9d9"}
            offset={[-3, 38]}
          >
            <Avatar size={42} src={participantAvatar}>
              {participantName?.charAt(0)}
            </Avatar>
          </Badge>
          <div className="min-w-0 flex flex-col">
            <Text
              strong
              ellipsis
              className="block text-[15px] leading-tight"
            >
              {participantName}
            </Text>
            <span
              className={`text-[12px] ${
                isOnline ? "text-green-500" : "text-gray-400"
              }`}
            >
              {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
            </span>
          </div>
        </div>

        <Space size={4}>
          <Tooltip title="Gọi điện">
            <Button
              type="text"
              icon={<PhoneOutlined />}
              className="text-gray-500 hover:text-blue-500"
              onClick={() =>
                startCall({
                  conversationId,
                  calleeId: participantId || "",
                  callType: "VOICE",
                  participantName,
                  participantAvatar,
                })
              }
            />
          </Tooltip>
          <Tooltip title="Gọi Video">
            <Button
              type="text"
              icon={<VideoCameraOutlined />}
              className="text-gray-500 hover:text-blue-500"
              onClick={() =>
                startCall({
                  conversationId,
                  calleeId: participantId || "",
                  callType: "VIDEO",
                  participantName,
                  participantAvatar,
                })
              }
            />
          </Tooltip>
          <Tooltip title="Gắn phân loại">
            <Button
              type="text"
              icon={<TagsOutlined />}
              className="text-gray-500 hover:text-blue-500"
              onClick={() => setShowTagModal(true)}
            />
          </Tooltip>
          <Dropdown menu={{ items: moreItems }} trigger={["click"]}>
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="text-gray-500 hover:text-blue-500"
            />
          </Dropdown>
        </Space>
      </div>

      {/* Messages */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 md:px-6 py-4 flex flex-col gap-2"
        >
        {hasNextPage && (
          <div className="text-center pb-2">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={onLoadMore}
              size="small"
              className="text-gray-400 hover:text-blue-500"
            >
              Tải thêm tin nhắn
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <Spin size="small" />
          </div>
        )}

        {[...messages].reverse().map((msg, idx, arr) => {
          const prev = arr[idx - 1];
          const next = arr[idx + 1];
          const showDivider = shouldShowTimeDivider(prev, msg);
          // Show time under the bubble when: it's the last message overall,
          // OR the next message is far away / from a different sender cluster
          const isLastMsg = idx === arr.length - 1;
          const nextFar = next
            ? new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime() >= TIME_GAP_MS
            : false;
          const senderChanges = next ? next.senderId !== msg.senderId : false;
          const showTime = isLastMsg || nextFar || senderChanges;

          return (
            <React.Fragment key={msg.id}>
              {showDivider && (
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-zinc-200" />
                  <span className="text-[11px] text-zinc-400 shrink-0">{formatTime(msg.createdAt)}</span>
                  <div className="flex-1 h-px bg-zinc-200" />
                </div>
              )}
              <MessageBubble
                msg={msg}
                currentUserId={currentUserId}
                participantName={participantName}
                showTime={showTime}
                onReply={handleReply}
                onReact={handleReact}
              />
            </React.Fragment>
          );
        })}

        {/* Typing indicator */}
        {isParticipantTyping && (
          <TypingIndicator
            participantName={participantName}
            participantAvatar={participantAvatar}
          />
        )}
      </div>

        {/* New message notification */}
        {hasNewMessage && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-lg text-sm text-blue-600 font-medium hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer animate-fade-in"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="7 13 12 18 17 13" /><polyline points="7 6 12 11 17 6" />
            </svg>
            Có tin nhắn mới
          </button>
        )}
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversationId}
        onSend={handleSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={handleTyping}
      />

      {/* Tag Modal */}
      <ConversationTagModal
        open={showTagModal}
        conversationId={conversationId}
        onClose={() => setShowTagModal(false)}
      />

    </div>
  );
}


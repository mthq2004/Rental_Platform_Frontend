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
import { Message } from "@/types/message.type";
import MessageBubble from "./MessageBubble";
import { reactMessage, SendMessagePayload } from "@/stores/slices/message.slice";
import { useAppDispatch } from "@/stores/hooks";
import { useCall } from "@/contexts/CallContext";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number>(0);
  const isFetchingRef = useRef(false);
  const isPrependingRef = useRef(false);
  const isFirstLoadRef = useRef(true);
  const [showTagModal, setShowTagModal] = useState(false);


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
      senderName:
        msg.senderId === currentUserId
          ? "Bạn"
          : participantName ?? "Đối phương",
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
    dispatch(reactMessage({ messageId, emoji }));
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
            previousHeightRef.current = el.scrollHeight;
            onLoadMore();
          }
        }}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 flex flex-col gap-2"
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
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversationId}
        onSend={handleSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
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


"use client";

import { Input, Avatar, Badge, Typography, Tag, Spin } from "antd";
import { SearchOutlined, PushpinFilled } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { Conversation } from "@/types/conversation.type";

const { Text } = Typography;

type FilterTab = "all" | "unread" | "spam";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "spam", label: "Tin rác / Bỏ qua" },
];

function formatTime(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0)
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diffDays === 1) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getLastMessagePreview(
  conv: Conversation,
  currentUserId: string
): string {
  const { lastMessage } = conv;
  if (!lastMessage.type) return "";
  const isMe = lastMessage.senderId === currentUserId;
  const prefix = isMe ? "Bạn: " : "";
  if (lastMessage.type === "IMAGE") return `${prefix}📷 Hình ảnh`;
  if (lastMessage.type === "VIDEO") return `${prefix}🎥 Video`;
  if (lastMessage.type === "FILE") return `${prefix}📎 Tệp đính kèm`;
  return `${prefix}${lastMessage.content ?? ""}`;
}

interface ChatSidebarProps {
  conversations?: Conversation[];
  loading?: boolean;
  selectedId?: string;
  currentUserId?: string;
  onlineUsers?: string[];
  onSelect?: (conversation: Conversation) => void;
}

export default function ChatSidebar({
  conversations = [],
  loading,
  selectedId,
  currentUserId = "me",
  onlineUsers = [],
  onSelect,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered = useMemo(() => {
    let list = conversations;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.participant?.fullName.toLowerCase().includes(q)
      );
    }

    // Tab filter
    if (activeTab === "unread") {
      list = list.filter((c) => c.unreadCount > 0);
    } else if (activeTab === "spam") {
      list = list.filter((c) => c.isArchived);
    }

    return list;
  }, [conversations, search, activeTab]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 w-80 min-w-70 max-w-90 lg:w-85">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Tin nhắn</h2>
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Tìm kiếm hội thoại..."
          variant="filled"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg"
          allowClear
          size="middle"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-4 pb-2 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border-none cursor-pointer
              ${
                activeTab === tab.key
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-gray-100 mx-4 shrink-0" />

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Không có hội thoại nào
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.id === selectedId;
            const preview = getLastMessagePreview(item, currentUserId);
            const hasUnread = item.unreadCount > 0;
            const isOnline = onlineUsers.includes(item.participant.id);

            return (
              <div
                key={item.id}
                onClick={() => onSelect?.(item)}
                className={`
                  flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-100
                  ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}
                  ${isSelected ? "border-l-[3px] border-l-blue-500" : "border-l-[3px] border-l-transparent"}
                `}
              >
                {/* Avatar with online indicator */}
                <div className="relative shrink-0">
                  <Avatar size={48} src={item.participant.avatarUrl}>
                    {item.participant.fullName.charAt(0)}
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      {item.isPinned && (
                        <PushpinFilled className="text-[11px] text-yellow-500 shrink-0" />
                      )}
                      <Text
                        ellipsis
                        className={`text-[14px] leading-tight ${
                          hasUnread
                            ? "font-semibold text-gray-900"
                            : "font-medium text-gray-800"
                        }`}
                      >
                        {item.participant.fullName}
                      </Text>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
                      {formatTime(item.lastMessage.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Text
                      ellipsis
                      className={`text-[12.5px] leading-tight ${
                        hasUnread
                          ? "font-medium text-gray-700"
                          : "text-gray-500"
                      }`}
                    >
                      {preview}
                    </Text>
                    {hasUnread && (
                      <Badge
                        count={item.unreadCount}
                        size="small"
                        className="shrink-0"
                      />
                    )}
                  </div>

                  {item.categories && item.categories.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {item.categories.map((cat) => (
                        <Tag
                          key={cat.id}
                          color={cat.color}
                          className="text-[10px] leading-4 px-1.5 py-0 m-0 rounded"
                        >
                          {cat.name}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
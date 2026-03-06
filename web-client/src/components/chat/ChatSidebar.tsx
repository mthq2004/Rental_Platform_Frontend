"use client";

import { Input, List, Avatar, Badge, Typography, Tag, Spin } from "antd";
import { SearchOutlined, PushpinFilled } from "@ant-design/icons";
import { useState } from "react";
import { Conversation } from "@/types/conversation.type";

const { Text } = Typography;


function formatTime(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0)
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function getLastMessagePreview(conv: Conversation, currentUserId: string): string {
  const { lastMessage } = conv;
  if (!lastMessage.type) return "";
  const isMe = lastMessage.senderId === currentUserId;

  console.log("xu: ", isMe, lastMessage.senderId, lastMessage.content, currentUserId);

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
  onSelect?: (conversation: Conversation) => void;
}

export default function ChatSidebar({
  conversations = [],
  loading,
  selectedId,
  currentUserId = "me",
  onSelect,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations
    .filter((c) =>
      c.participant.fullName.toLowerCase().includes(search.toLowerCase())
    )

  if (loading) {
    <div style={{ padding: 20, textAlign: "center" }}>
      <Spin />
    </div>
  }

  return (
    <div
      style={{
        width: 340,
        minWidth: 340,
        height: "100%",
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #f0f0f0" }}>
        <Typography.Title level={4} style={{ margin: "0 0 14px 0", color: "#1677ff" }}>
          Tin nhắn
        </Typography.Title>
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Tìm kiếm hội thoại..."
          variant="filled"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ borderRadius: 8 }}
          allowClear
        />
      </div>


      <div style={{ flex: 1, overflowY: "auto" }}>
        <List
          itemLayout="horizontal"
          dataSource={filtered}
          locale={{ emptyText: "Không có hội thoại nào" }}
          renderItem={(item) => {

            console.log("heoo: ", item);

            const isSelected = item.id === selectedId;
            const preview = getLastMessagePreview(item, currentUserId);
            const hasUnread = item.unreadCount > 0;

            return (
              <List.Item
                onClick={() => onSelect?.(item)}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  background: isSelected ? "#e6f4ff" : "transparent",
                  borderLeft: isSelected ? "3px solid #1677ff" : "3px solid transparent",
                  transition: "background 0.15s",
                }}
                className="hover:bg-blue-50"
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={46}
                      src={item.participant.avatarUrl}
                      style={{ border: "2px solid #f0f0f0", flexShrink: 0 }}
                    >
                      {item.participant.fullName.charAt(0)}
                    </Avatar>
                  }
                  title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                        {item.isPinned && (
                          <PushpinFilled style={{ fontSize: 11, color: "#faad14", flexShrink: 0 }} />
                        )}
                        <Text
                          ellipsis
                          style={{ fontSize: 14, fontWeight: hasUnread ? 700 : 500 }}
                        >
                          {item.participant.fullName}
                        </Text>
                      </div>
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, flexShrink: 0, whiteSpace: "nowrap" }}
                      >
                        {formatTime(item.lastMessage.createdAt)}
                      </Text>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text
                          type="secondary"
                          ellipsis
                          style={{
                            maxWidth: 200,
                            fontSize: 12,
                            fontWeight: hasUnread ? 600 : 400,
                            color: hasUnread ? "#262626" : undefined,
                          }}
                        >
                          {preview}
                        </Text>
                        {hasUnread && <Badge count={item.unreadCount} size="small" />}
                      </div>

                      {item.categories && item.categories.length > 0 && (
                        <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {item.categories.map((cat) => (
                            <Tag
                              key={cat.id}
                              color={cat.color}
                              style={{
                                fontSize: 10,
                                lineHeight: "16px",
                                padding: "0 5px",
                                margin: 0,
                                borderRadius: 4,
                              }}
                            >
                              {cat.name}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </div>
    </div>
  );
}
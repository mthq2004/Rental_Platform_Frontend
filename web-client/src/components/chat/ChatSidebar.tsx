"use client";
import { Input, List, Avatar, Badge, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { MOCK_CONVERSATIONS } from "@/app/(main)/chat/chatData";

const { Text } = Typography;

export default function ChatSidebar() {
  return (
    <div style={{ width: 340, height: "100%", background: "#fff", borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 16px", borderBottom: "1px solid #f0f0f0" }}>
        <Typography.Title level={4} style={{ margin: "0 0 16px 0", color: "#1890ff" }}>Tin nhắn</Typography.Title>
        <Input 
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />} 
          placeholder="Tìm kiếm hội thoại..." 
          variant="filled"
          style={{ borderRadius: 8 }}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <List
          itemLayout="horizontal"
          dataSource={MOCK_CONVERSATIONS}
          renderItem={(item) => (
            <List.Item 
              style={{ padding: "12px 16px", cursor: "pointer", transition: "all 0.3s" }}
              className="hover:bg-blue-50"
            >
              <List.Item.Meta
                avatar={
                  <Badge dot status={item.isOnline ? "success" : "default"} offset={[-2, 32]}>
                    <Avatar size={44} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.avatar}`} />
                  </Badge>
                }
                title={<div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>{item.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                </div>}
                description={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" ellipsis style={{ width: 150 }}>{item.lastMessage}</Text>
                    {item.unreadCount > 0 && <Badge count={item.unreadCount} size="small" />}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );
}
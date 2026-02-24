"use client";
import { Avatar, Button, Space, Typography, Tooltip, Image as AntImage } from "antd";
import { PhoneOutlined, VideoCameraOutlined, MoreOutlined, FileOutlined } from "@ant-design/icons";
import MessageInput from "./MessageInput";
import { MOCK_MESSAGES } from "@/app/(main)/chat/chatData";
const { Text } = Typography;

export default function ChatWindow() {
  return (
    <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", background: "#f9fbff" }}>
      {/* Header */}
      <div style={{ height: 70, background: "white", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
        <Space size="middle">
          <Avatar size={40} src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" />
          <div>
            <Text strong style={{ display: "block" }}>Mai Thành Hải Quân</Text>
            <Text type="success" style={{ fontSize: 12 }}>● Đang hoạt động</Text>
          </div>
        </Space>
        <Space>
          <Tooltip title="Gọi điện"><Button type="text" icon={<PhoneOutlined />} /></Tooltip>
          <Tooltip title="Gọi Video"><Button type="text" icon={<VideoCameraOutlined />} /></Tooltip>
          <Button type="text" icon={<MoreOutlined />} />
        </Space>
      </div>

      {/* Message Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {MOCK_MESSAGES.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <div key={msg.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "70%" }}>
              <div style={{ 
                padding: msg.type === 'image' ? "4px" : "12px 16px", 
                background: isMe ? "#1890ff" : "#fff", 
                color: isMe ? "#fff" : "inherit", 
                borderRadius: isMe ? "12px 12px 0 12px" : "0 12px 12px 12px", 
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)" 
              }}>
                {/* 1. TEXT */}
                {msg.type === 'text' && <span>{msg.content}</span>}

                {/* 2. IMAGE */}
                {msg.type === 'image' && (
                  <AntImage src={msg.content} style={{ borderRadius: 8, maxWidth: '100%' }} />
                )}

                {/* 3. FILE */}
                {msg.type === 'file' && (
                  <Space style={{ padding: '4px' }}>
                    <div style={{ background: isMe ? 'rgba(255,255,255,0.2)' : '#f5f5f5', padding: '8px', borderRadius: '8px' }}>
                      <FileOutlined style={{ fontSize: 24 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{msg.fileName}</div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>{msg.fileSize}</div>
                    </div>
                  </Space>
                )}
              </div>
              <div style={{ textAlign: isMe ? "right" : "left", marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 10 }}>{msg.timestamp}</Text>
                {isMe && <Text type="secondary" style={{ fontSize: 10, marginLeft: 8 }}>{msg.status === 'seen' ? 'Đã xem' : 'Đã gửi'}</Text>}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
}
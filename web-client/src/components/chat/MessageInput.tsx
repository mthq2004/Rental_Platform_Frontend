"use client";
import { Input, Button, Upload, Space } from "antd";
import { SendOutlined, PictureOutlined, SmileOutlined, PaperClipOutlined } from "@ant-design/icons";

export default function MessageInput() {
  return (
    <div style={{ padding: "16px 24px", background: "white", borderTop: "1px solid #f0f0f0" }}>
      <div style={{ background: "#f5f5f5", borderRadius: 12, padding: "4px 8px" }}>
        <Input.TextArea
          placeholder="Nhập tin nhắn..."
          autoSize={{ minRows: 1, maxRows: 5 }}
          variant="borderless"
          style={{ padding: "8px 12px" }}
        />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", borderTop: "1px solid #eee" }}>
          <Space size="small">
            <Upload showUploadList={false}>
              <Button type="text" icon={<PictureOutlined style={{ color: "#8c8c8c", fontSize: 18 }} />} />
            </Upload>
            <Upload showUploadList={false}>
              <Button type="text" icon={<PaperClipOutlined style={{ color: "#8c8c8c", fontSize: 18 }} />} />
            </Upload>
            <Button type="text" icon={<SmileOutlined style={{ color: "#8c8c8c", fontSize: 18 }} />} />
          </Space>
          
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            style={{ borderRadius: 8, boxShadow: "0 2px 4px rgba(24, 144, 255, 0.3)" }}
          >
            Gửi tin nhắn
          </Button>
        </div>
      </div>
    </div>
  );
}
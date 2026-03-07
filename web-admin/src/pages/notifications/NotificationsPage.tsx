import React, { useEffect } from "react";
import { List, Badge, Button, Tag, Empty, Spin, Typography } from "antd";
import {
  BellOutlined,
  CheckOutlined,
  HomeOutlined,
  FileTextOutlined,
  DollarOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import {
  getNotification,
  markAsRead,
  selectNotifications,
  selectNotificationLoading,
  selectUnreadCount,
} from "../../stores/slices/notification.slice";
import type { Notification } from "../../stores/slices/notification.slice";

const { Title, Text } = Typography;

const TYPE_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  PROPERTY_UPDATE: { color: "blue", label: "Bất động sản", icon: <HomeOutlined /> },
  ADMIN_ACTION: { color: "orange", label: "Admin", icon: <SettingOutlined /> },
  RENTAL_REQUEST: { color: "green", label: "Yêu cầu thuê", icon: <FileTextOutlined /> },
  CONTRACT_CREATED: { color: "purple", label: "Hợp đồng", icon: <FileTextOutlined /> },
  CONTRACT_UPDATED: { color: "purple", label: "Hợp đồng", icon: <FileTextOutlined /> },
  PAYMENT: { color: "gold", label: "Thanh toán", icon: <DollarOutlined /> },
  SYSTEM: { color: "default", label: "Hệ thống", icon: <BellOutlined /> },
};

const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const loading = useAppSelector(selectNotificationLoading);
  const unreadCount = useAppSelector(selectUnreadCount);

  useEffect(() => {
    dispatch(getNotification());
  }, [dispatch]);

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = () => {
    notifications.filter((n) => !n.isRead).forEach((n) => dispatch(markAsRead(n.id)));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeConfig = (type?: string) =>
    TYPE_CONFIG[type || "SYSTEM"] || TYPE_CONFIG.SYSTEM;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <BellOutlined style={{ marginRight: 8 }} />
            Thông báo
          </Title>
          <Text type="secondary">{unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}</Text>
        </div>
        {unreadCount > 0 && (
          <Button icon={<CheckOutlined />} onClick={handleMarkAllRead}>
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <Spin spinning={loading}>
        {notifications.length === 0 ? (
          <Empty description="Chưa có thông báo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item: Notification) => {
              const cfg = getTypeConfig(item.type);
              return (
                <List.Item
                  style={{
                    background: item.isRead ? "#fff" : "#f0f5ff",
                    padding: "16px 20px",
                    borderRadius: 8,
                    marginBottom: 8,
                    cursor: item.isRead ? "default" : "pointer",
                    border: "1px solid #f0f0f0",
                  }}
                  onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                  actions={
                    !item.isRead
                      ? [
                          <Button
                            key="read"
                            type="link"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(item.id);
                            }}
                          >
                            Đánh dấu đã đọc
                          </Button>,
                        ]
                      : undefined
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <Badge dot={!item.isRead} offset={[-2, 2]}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "#f5f5f5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                          }}
                        >
                          {cfg.icon}
                        </div>
                      </Badge>
                    }
                    title={
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: item.isRead ? 400 : 600 }}>{item.title}</span>
                        <Tag color={cfg.color} style={{ fontSize: 11 }}>
                          {cfg.label}
                        </Tag>
                      </div>
                    }
                    description={
                      <>
                        <div style={{ color: "#595959", marginBottom: 4 }}>{item.body}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDate(item.createdAt)}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Spin>
    </div>
  );
};

export default NotificationsPage;

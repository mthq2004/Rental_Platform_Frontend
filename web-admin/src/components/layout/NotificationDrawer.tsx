import React, { useEffect } from "react";
import {
  Drawer,
  List,
  Badge,
  Button,
  Tag,
  Empty,
  Spin,
  Typography,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  BellOutlined,
  CheckOutlined,
  HomeOutlined,
  FileTextOutlined,
  DollarOutlined,
  SettingOutlined,
  CloseOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import {
  getNotification,
  markAsRead,
  deleteReadNotifications,
  selectNotifications,
  selectNotificationLoading,
  selectUnreadCount,
} from "../../stores/slices/notification.slice";
import type { Notification } from "../../stores/slices/notification.slice";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

const TYPE_CONFIG: Record<
  string,
  { color: string; label: string; icon: React.ReactNode }
> = {
  PROPERTY_UPDATE: {
    color: "blue",
    label: "Bất động sản",
    icon: <HomeOutlined />,
  },
  ADMIN_ACTION: {
    color: "orange",
    label: "Admin",
    icon: <SettingOutlined />,
  },
  RENTAL_REQUEST: {
    color: "green",
    label: "Yêu cầu thuê",
    icon: <FileTextOutlined />,
  },
  CONTRACT_CREATED: {
    color: "purple",
    label: "Hợp đồng",
    icon: <FileTextOutlined />,
  },
  PAYMENT: { color: "gold", label: "Thanh toán", icon: <DollarOutlined /> },
  SYSTEM: { color: "default", label: "Hệ thống", icon: <BellOutlined /> },
};

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const loading = useAppSelector(selectNotificationLoading);
  const unreadCount = useAppSelector(selectUnreadCount);

  useEffect(() => {
    if (open) {
      dispatch(getNotification());
    }
  }, [open, dispatch]);

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = () => {
    notifications
      .filter((n) => !n.isRead)
      .forEach((n) => dispatch(markAsRead(n.id)));
  };

  const handleDeleteRead = () => {
    dispatch(deleteReadNotifications());
  };

  const readCount = notifications.filter((n) => n.isRead).length;

  const getNotificationLink = (item: Notification): string | null => {
    const event = item.metadata?.event;
    const propertyId = item.metadata?.propertyId;
    if (!propertyId) return null;

    switch (event) {
      case "ESTATE_CREATED":
        return `/dashboard/properties/${propertyId}`;
      case "ESTATE_APPROVED":
        return `/dashboard/properties/${propertyId}`;
      case "ESTATE_REJECTED":
        return `/dashboard/properties/${propertyId}`;
      default:
        if (item.type === "PROPERTY_UPDATE" || item.type === "ADMIN_ACTION") {
          return `/dashboard/properties/${propertyId}`;
        }
        return null;
    }
  };

  const handleNotificationClick = (item: Notification) => {
    if (!item.isRead) {
      dispatch(markAsRead(item.id));
    }
    const link = getNotificationLink(item);
    if (link) {
      onClose();
      navigate(link);
    }
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
    <Drawer
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BellOutlined />
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <Badge count={unreadCount} color="#ff4d4f" size="small" />
            )}
          </div>
          {unreadCount > 0 && (
            <Tooltip title="Đánh dấu tất cả đã đọc">
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleMarkAllRead}
              >
                Đọc tất cả
              </Button>
            </Tooltip>
          )}
          {readCount > 0 && (
            <Popconfirm
              title="Xóa thông báo đã đọc?"
              description={`Sẽ xóa ${readCount} thông báo đã đọc`}
              onConfirm={handleDeleteRead}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Tooltip title="Xóa thông báo đã đọc">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  Xóa đã đọc
                </Button>
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      }
      placement="right"
      size="default"
      open={open}
      onClose={onClose}
      closeIcon={<CloseOutlined />}
      styles={{ body: { padding: 0 } }}
    // footer={
    //   <div style={{ textAlign: "center" }}>
    //     <Button type="link" onClick={handleViewAll}>
    //       Xem tất cả thông báo
    //     </Button>
    //   </div>
    // }
    >
      <Spin spinning={loading}>
        {notifications.length === 0 ? (
          <Empty
            description="Chưa có thông báo nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 48 }}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item: Notification) => {
              const cfg = getTypeConfig(item.type);
              return (
                <List.Item
                  style={{
                    background: item.isRead ? "transparent" : "#f0f5ff",
                    padding: "14px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                    transition: "background 0.2s",
                  }}
                  onClick={() => handleNotificationClick(item)}
                  actions={[
                    ...(!item.isRead
                      ? [
                        <Button
                          key="read"
                          type="text"
                          size="small"
                          style={{ color: "#1677ff", padding: "0 4px" }}
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                        >
                          Đọc
                        </Button>,
                      ]
                      : []),
                    ...(getNotificationLink(item)
                      ? [
                        <Tooltip key="view" title="Xem chi tiết">
                          <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            style={{ color: "#1677ff", padding: "0 4px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(item);
                            }}
                          />
                        </Tooltip>,
                      ]
                      : []),
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge dot={!item.isRead} offset={[-2, 2]}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#f5f5f5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                          }}
                        >
                          {cfg.icon}
                        </div>
                      </Badge>
                    }
                    title={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: item.isRead ? 400 : 600,
                            fontSize: 13,
                          }}
                        >
                          {item.title}
                        </span>
                        <Tag
                          color={cfg.color}
                          style={{ fontSize: 10, lineHeight: "18px" }}
                        >
                          {cfg.label}
                        </Tag>
                      </div>
                    }
                    description={
                      <>
                        <div
                          style={{
                            color: "#595959",
                            fontSize: 12,
                            marginBottom: 2,
                          }}
                        >
                          {item.body}
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
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
    </Drawer>
  );
};

export default NotificationDrawer;

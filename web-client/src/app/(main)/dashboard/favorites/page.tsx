"use client";

import React, { useEffect } from "react";
import { App, Avatar, Button, Empty, Space, Spin, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EyeOutlined, HeartFilled } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { propertySlug } from "@/utils/slug";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { getFavoritePropertiesThunk, removeFavoriteThunk } from "@/stores/slices/estate.slice";
import type { PropertyListItem } from "@/types/property.type";

const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)} triệu/tháng`;
  }
  return `${price.toLocaleString("vi-VN")} đ/tháng`;
};

const FavoritesDashboardPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { message } = App.useApp();
  const { loading, items } = useAppSelector((state) => state.estate.favorites);

  useEffect(() => {
    dispatch(getFavoritePropertiesThunk({ page: 1, limit: 50 }));
  }, [dispatch]);

  const handleUnfavorite = async (propertyId: string) => {
    try {
      await dispatch(removeFavoriteThunk(propertyId)).unwrap();
      message.success("Đã bỏ lưu tin yêu thích");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể cập nhật tin yêu thích");
    }
  };

  const columns: ColumnsType<PropertyListItem> = [
    {
      title: "Tin đăng",
      key: "property",
      render: (_, record) => (
        <Space>
          <Avatar shape="square" size={56} src={record.images?.[0]?.uri} />
          <div>
            <Typography.Text strong>{record.title}</Typography.Text>
            <div>
              <Typography.Text type="secondary">
                {record.district}, {record.city}
              </Typography.Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Giá thuê",
      key: "price",
      render: (_, record) => <Typography.Text strong>{formatPrice(record.pricePerMonth)}</Typography.Text>,
    },
    {
      title: "Thông số",
      key: "spec",
      render: (_, record) => (
        <Space>
          <Tag>{record.areaSqm} m²</Tag>
          <Tag>{record.bedrooms} PN</Tag>
          <Tag>{record.bathrooms} WC</Tag>
        </Space>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/property/${propertySlug(record.title, record.id)}`)}
          >
            Xem
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleUnfavorite(record.id)}
          >
            Bỏ lưu
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Space align="center">
        <HeartFilled style={{ color: "#ef4444" }} />
        <Typography.Title level={4} style={{ marginBottom: 0 }}>
          Tin yêu thích
        </Typography.Title>
      </Space>

      {loading ? (
        <Spin />
      ) : items.length === 0 ? (
        <Empty description="Bạn chưa lưu tin yêu thích nào" />
      ) : (
        <Table rowKey="id" columns={columns} dataSource={items} pagination={false} />
      )}
    </div>
  );
};

export default FavoritesDashboardPage;

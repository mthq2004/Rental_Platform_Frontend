"use client";

import React from "react";
import { Tag, Button, Space, Typography, Tooltip } from "antd";
import {
  EyeOutlined,
  SendOutlined,
  CheckCircleOutlined,
  EditOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { RentalContract, RentalContractStatus } from "@/types/contract.type";
import { STATUS_CONFIG, formatDate, formatCurrency } from "./ContractStatusConfig";

const { Text } = Typography;

export interface ContractTableActions {
  onViewDetail: (rentalId: string) => void;
  onEdit: (record: RentalContract) => void;
  onSendToTenant: (rentalId: string) => void;
  onTenantSign: (rentalId: string) => void;
  onOwnerSign: (rentalId: string) => void;
  onActivate: (rentalId: string) => void;
  onCancel: (rentalId: string) => void;
}

export function getContractTableColumns(
  userId: string | undefined,
  actions: ContractTableActions
): ColumnsType<RentalContract> {
  const isOwner = (record: RentalContract) => record.ownerId === userId;

  return [
    {
      title: "Mã hợp đồng",
      dataIndex: "contractCode",
      key: "contractCode",
      width: 160,
      render: (val) => <Text strong className="text-sm">{val}</Text>,
    },
    {
      title: "Thời hạn",
      key: "period",
      width: 220,
      render: (_, r) => (
        <Text className="text-sm">
          {formatDate(r.startDate)} → {formatDate(r.endDate)}
        </Text>
      ),
    },
    {
      title: "Giá thuê / tháng",
      dataIndex: "monthlyRent",
      key: "monthlyRent",
      width: 160,
      render: (val) => (
        <Text strong className="text-red-500 text-sm">{formatCurrency(val)}</Text>
      ),
      sorter: (a, b) => a.monthlyRent - b.monthlyRent,
    },
    {
      title: "Tiền cọc",
      dataIndex: "depositAmount",
      key: "depositAmount",
      width: 140,
      render: (val) => <Text className="text-sm">{formatCurrency(val)}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (status: RentalContractStatus) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
        return (
          <Tag color={cfg.color} icon={cfg.icon} className="text-xs">
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Vai trò",
      key: "role",
      width: 100,
      render: (_, r) => (
        <Tag color={isOwner(r) ? "gold" : "blue"} className="text-xs">
          {isOwner(r) ? "Chủ nhà" : "Người thuê"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 220,
      fixed: "right",
      render: (_, record) => {
        const owner = isOwner(record);
        return (
          <Space size={4} wrap>
            <Tooltip title="Xem chi tiết">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => actions.onViewDetail(record.rentalId)}
              />
            </Tooltip>

            {owner && record.status === "draft" && (
              <>
                <Tooltip title="Chỉnh sửa">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => actions.onEdit(record)}
                  />
                </Tooltip>
                <Button
                  size="small"
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => actions.onSendToTenant(record.rentalId)}
                >
                  Gửi
                </Button>
              </>
            )}

            {!owner && record.status === "pending_tenant" && (
              <Button
                size="small"
                type="primary"
                onClick={() => actions.onTenantSign(record.rentalId)}
              >
                Ký hợp đồng
              </Button>
            )}

            {owner && record.status === "pending_landlord" && (
              <Button
                size="small"
                type="primary"
                onClick={() => actions.onOwnerSign(record.rentalId)}
              >
                Ký hợp đồng
              </Button>
            )}

            {owner && record.status === "fully_signed" && (
              <Button
                size="small"
                type="primary"
                onClick={() => actions.onActivate(record.rentalId)}
              >
                Kích hoạt
              </Button>
            )}

            {(record.status === "draft" || record.status === "pending_tenant") && owner && (
              <Tooltip title="Hủy hợp đồng">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => actions.onCancel(record.rentalId)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];
}

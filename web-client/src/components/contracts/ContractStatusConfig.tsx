import {
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SwapOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { RentalContractStatus } from "@/types/contract.type";
import React from "react";
import dayjs from "dayjs";

export const STATUS_CONFIG: Record<
  RentalContractStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Bản nháp",
    color: "default",
    icon: <EditOutlined />,
  },
  pending_tenant: {
    label: "Chờ người thuê ký",
    color: "processing",
    icon: <ClockCircleOutlined />,
  },
  tenant_signed: {
    label: "Người thuê đã ký",
    color: "blue",
    icon: <CheckCircleOutlined />,
  },
  pending_landlord: {
    label: "Chờ chủ nhà ký",
    color: "orange",
    icon: <ClockCircleOutlined />,
  },
  owner_signed: {
    label: "Chủ nhà đã ký",
    color: "blue",
    icon: <CheckCircleOutlined />,
  },
  fully_signed: {
    label: "Đã ký đầy đủ",
    color: "cyan",
    icon: <FileDoneOutlined />,
  },
  active: {
    label: "Đang hiệu lực",
    color: "success",
    icon: <PlayCircleOutlined />,
  },
  near_expiration: {
    label: "Sắp hết hạn",
    color: "warning",
    icon: <ExclamationCircleOutlined />,
  },
  expired: {
    label: "Hết hạn",
    color: "default",
    icon: <ClockCircleOutlined />,
  },
  terminated: {
    label: "Đã chấm dứt",
    color: "error",
    icon: <StopOutlined />,
  },
  renewed: {
    label: "Đã gia hạn",
    color: "purple",
    icon: <SwapOutlined />,
  },
  cancelled: {
    label: "Đã hủy",
    color: "default",
    icon: <CloseCircleOutlined />,
  },
  superseded: {
    label: "Đã bị thay thế",
    color: "default",
    icon: <SwapOutlined />,
  },
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return dayjs(dateStr).format("DD/MM/YYYY");
};

export const formatCurrency = (
  amount: number | string | null | undefined
) => {
  const n = Number(amount);
  if (isNaN(n)) return "—";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
};

export const moneyFormatter = (v: number | undefined) =>
  `${v ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const moneyParser = (v: any) =>
  Number((v || "").toString().replace(/,/g, ""));
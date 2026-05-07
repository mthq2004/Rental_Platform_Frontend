"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Table, Button, Empty, Card, Input, Avatar, Tag, Dropdown,
  MenuProps, Drawer, Space, Statistic, Row, Col, Skeleton, message, Badge
} from "antd";
import {
  UsergroupAddOutlined,
  ReloadOutlined,
  SearchOutlined,
  MailOutlined,
  PhoneOutlined,
  MessageOutlined,
  CrownOutlined,
  MoreOutlined,
  EyeOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  ArrowRightOutlined,
  HomeOutlined,
  TagOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { getMyContracts, getOwnerRequests } from "@/stores/slices/contract.slice";
import { createConversation } from "@/stores/slices/conversation.slice";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { App } from "antd";

/** ─── Status Configs ──────────────────────────────────────────── */
const REQUEST_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:                  { label: "Chờ xử lý",        color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  under_review:             { label: "Đang xem xét",     color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  approved:                 { label: "Chấp thuận",        color: "#065f46", bg: "#ecfdf5", border: "#a7f3d0" },
  holding_deposit_open:     { label: "Mở đặt cọc",       color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd" },
  holding_deposit_paid:     { label: "Đã đặt cọc",        color: "#065f46", bg: "#ecfdf5", border: "#a7f3d0" },
  holding_deposit_locked:   { label: "Đã có người",      color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
  holding_deposit_expired:  { label: "Hết hạn cọc",      color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
  holding_deposit_refunded: { label: "Hoàn cọc",          color: "#065f46", bg: "#ecfdf5", border: "#a7f3d0" },
  rejected:                 { label: "Đã từ chối",        color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
  cancelled:                { label: "Đã hủy",            color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
  expired:                  { label: "Hết hạn",           color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
  contract_created:         { label: "Đã tạo HĐ",        color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc" },
};

const CONTRACT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:           { label: "Nháp",            color: "#6b7280", bg: "#f3f4f6" },
  pending_tenant:  { label: "Chờ khách ký",    color: "#1d4ed8", bg: "#eff6ff" },
  tenant_signed:   { label: "Khách đã ký",     color: "#7c3aed", bg: "#f5f3ff" },
  pending_landlord:{ label: "Chờ chủ ký",      color: "#b45309", bg: "#fffbeb" },
  owner_signed:    { label: "Chủ đã ký",       color: "#065f46", bg: "#ecfdf5" },
  fully_signed:    { label: "Đã ký đầy đủ",   color: "#065f46", bg: "#ecfdf5" },
  active:          { label: "Đang hiệu lực",   color: "#065f46", bg: "#ecfdf5" },
  expired:         { label: "Đã hết hạn",      color: "#6b7280", bg: "#f3f4f6" },
  terminated:      { label: "Đã chấm dứt",     color: "#991b1b", bg: "#fef2f2" },
  cancelled:       { label: "Đã hủy",          color: "#991b1b", bg: "#fef2f2" },
};

const formatMoney = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

/** ─── Main Component ──────────────────────────────────────────── */
export default function CustomersPage() {
  const { message: msg } = App.useApp();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { contracts, ownerRequests, contractsLoading, requestsLoading } = useAppSelector(
    (state) => state.contract
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    dispatch(getMyContracts({ limit: 1000 }));
    dispatch(getOwnerRequests());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(getMyContracts({ limit: 1000 }));
    dispatch(getOwnerRequests());
  };

  /** Build unified customer map from contracts + rental requests */
  const customersData = useMemo(() => {
    const map = new Map<string, any>();

    const safeContracts = Array.isArray(contracts) ? contracts : [];
    const safeRequests = Array.isArray(ownerRequests) ? ownerRequests : [];

    // Helper to extract tenant profile from ANY object shape the API returns
    const extractProfile = (source: any) => ({
      name:      source?.name || source?.fullName || source?.displayName || null,
      email:     source?.email || null,
      phone:     source?.phone || source?.phoneNumber || source?.phoneRaw || null,
      avatarUrl: source?.avatarUrl || source?.avatar || null,
    });

    const upsert = (tenantId: string, profileSource: any) => {
      if (!tenantId) return null;
      if (!map.has(tenantId)) {
        map.set(tenantId, {
          id: tenantId,
          ...extractProfile(profileSource),
          status: "PROSPECT",
          activeContracts: 0,
          totalContracts: 0,
          totalRent: 0,
          rentingProperties: new Set<string>(),
          contractsList: [],
          requestsList: [],
          joinDate: new Date().toISOString(),
        });
      }
      const entry = map.get(tenantId)!;
      // Merge richer profile data if we find it later
      const profile = extractProfile(profileSource);
      if (profile.name && !entry.name)      entry.name = profile.name;
      if (profile.email && !entry.email)    entry.email = profile.email;
      if (profile.phone && !entry.phone)    entry.phone = profile.phone;
      if (profile.avatarUrl && !entry.avatarUrl) entry.avatarUrl = profile.avatarUrl;
      return entry;
    };

    // 1️⃣ Process owner requests first (now with tenant info from BE)
    safeRequests.forEach((req: any) => {
      const tenantId = req.tenantId;
      if (!tenantId) return;

      // After BE fix, req.tenant now contains { id, name, email, phone, avatarUrl }
      const profile = req.tenant || {};
      const entry = upsert(tenantId, profile);
      if (!entry) return;

      entry.requestsList.push(req);

      if (req.createdAt && req.createdAt < entry.joinDate) entry.joinDate = req.createdAt;

      const propName = req.property?.title || req.propertyId;
      if (propName) entry.rentingProperties.add(propName);
    });

    // 2️⃣ Process contracts (override status with authoritative data)
    safeContracts.forEach((c: any) => {
      const tenantId = c.tenant?.id || c.tenantId;
      if (!tenantId) return;

      // tenant field on contract has { name, fullName, email, phone, avatarUrl }
      const entry = upsert(tenantId, c.tenant || {});
      if (!entry) return;

      entry.totalContracts += 1;
      entry.totalRent += Number(c.monthlyRent || 0);
      entry.contractsList.push(c);

      if (c.createdAt && c.createdAt < entry.joinDate) entry.joinDate = c.createdAt;

      if (c.status === "active") {
        entry.activeContracts += 1;
        entry.status = "ACTIVE";
      } else if (entry.status !== "ACTIVE") {
        entry.status = "INACTIVE";
      }

      const propName = c.property?.title || c.propertyName;
      if (propName) entry.rentingProperties.add(propName);
    });

    return Array.from(map.values()).map((t) => ({
      ...t,
      // Fallback name: first word of email or short ID
      displayName: t.name || (t.email ? t.email.split("@")[0] : null) || `KH #${t.id.substring(0, 6).toUpperCase()}`,
      rentingProperties: Array.from(t.rentingProperties),
      contractsList: [...t.contractsList].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      requestsList: [...t.requestsList].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));
  }, [contracts, ownerRequests]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return customersData;
    return customersData.filter(
      (c) =>
        c.displayName.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term)
    );
  }, [customersData, searchTerm]);

  const summary = useMemo(() => ({
    total:     customersData.length,
    active:    customersData.filter((c) => c.status === "ACTIVE").length,
    prospects: customersData.filter((c) => c.status === "PROSPECT").length,
    inactive:  customersData.filter((c) => c.status === "INACTIVE").length,
    totalRent: customersData.reduce((s, c) => s + (c.activeContracts > 0 ? c.totalRent : 0), 0),
  }), [customersData]);

  /** Create conversation then navigate to chat */
  const handleChat = async (userId: string) => {
    if (!userId) return;
    setChatLoading(true);
    try {
      await dispatch(createConversation(userId)).unwrap();
      router.push(`/chat?userId=${userId}`);
    } catch (err: any) {
      msg.error("Không thể tạo cuộc trò chuyện. Vui lòng thử lại.");
    } finally {
      setChatLoading(false);
    }
  };

  const getActionMenu = (record: any): MenuProps => ({
    items: [
      {
        key: "view",
        icon: <EyeOutlined className="text-blue-500" />,
        label: "Xem hồ sơ chi tiết",
        onClick: () => setSelectedCustomer(record),
      },
      {
        key: "chat",
        icon: <MessageOutlined className="text-emerald-500" />,
        label: "Nhắn tin ngay",
        onClick: () => handleChat(record.id),
      },
    ],
  });

  const statusTag = (status: string) => {
    const cfg = REQUEST_STATUS_CONFIG[status] || { label: status, color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" };
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide border"
        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
      >
        {cfg.label}
      </span>
    );
  };

  const contractStatusTag = (status: string) => {
    const cfg = CONTRACT_STATUS_CONFIG[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border"
        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color + "33" }}
      >
        {cfg.label}
      </span>
    );
  };

  const columns = [
    {
      title: "Khách hàng",
      key: "name",
      width: "28%",
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedCustomer(record)}>
          <div className="relative">
            <Avatar
              src={record.avatarUrl}
              size={44}
              className="shadow-md ring-2 ring-white"
              style={{ background: record.status === "ACTIVE" ? "#059669" : record.status === "PROSPECT" ? "#3b82f6" : "#94a3b8" }}
            >
              {record.displayName.charAt(0).toUpperCase()}
            </Avatar>
            {record.status === "ACTIVE" && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
            )}
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-[14px] hover:text-blue-600 transition-colors leading-tight">
              {record.displayName}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              UID: {record.id.substring(0, 12)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Liên hệ",
      key: "contact",
      width: "22%",
      render: (_: any, record: any) => (
        <div className="space-y-1.5">
          {record.email ? (
            <div className="flex items-center gap-2 text-[12px] text-slate-600">
              <MailOutlined className="text-blue-400 text-[11px] shrink-0" />
              <span className="truncate max-w-[160px]">{record.email}</span>
            </div>
          ) : null}
          {record.phone ? (
            <div className="flex items-center gap-2 text-[12px] text-slate-600">
              <PhoneOutlined className="text-emerald-400 text-[11px] shrink-0" />
              <span>{record.phone}</span>
            </div>
          ) : null}
          {!record.email && !record.phone && (
            <span className="text-slate-300 italic text-[12px]">Chưa có thông tin liên hệ</span>
          )}
        </div>
      ),
    },
    {
      title: "Phân loại",
      key: "status",
      width: "22%",
      render: (_: any, record: any) => {
        const cfg =
          record.status === "ACTIVE"
            ? { label: "Đang thuê nhà", color: "#065f46", bg: "#ecfdf5", icon: <CrownOutlined /> }
            : record.status === "PROSPECT"
            ? { label: "Yêu cầu thuê", color: "#1d4ed8", bg: "#eff6ff", icon: <UserAddOutlined /> }
            : { label: "Khách cũ", color: "#6b7280", bg: "#f3f4f6", icon: <ClockCircleOutlined /> };

        return (
          <div className="space-y-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              {cfg.icon} {cfg.label}
            </span>
            <div className="text-[11px] text-slate-400">
              Gia nhập {dayjs(record.joinDate).format("DD/MM/YYYY")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Tổng quan",
      key: "stats",
      align: "right" as const,
      width: "20%",
      render: (_: any, record: any) => (
        <div className="flex flex-col items-end gap-0.5">
          {record.status === "PROSPECT" ? (
            <>
              <span className="text-[15px] font-bold text-blue-600">
                {record.requestsList.length} yêu cầu
              </span>
              <span className="text-[11px] text-slate-400">
                {record.requestsList.filter((r: any) => ["pending", "under_review"].includes(r.status)).length} đang chờ
              </span>
            </>
          ) : (
            <>
              <span className="text-[14px] font-bold text-slate-800">
                {formatMoney(record.totalRent)}
              </span>
              <span className="text-[11px] text-slate-400">
                {record.activeContracts}/{record.totalContracts} hợp đồng
              </span>
            </>
          )}
        </div>
      ),
    },
    {
      title: "",
      key: "action",
      width: "8%",
      align: "center" as const,
      render: (_: any, record: any) => (
        <Dropdown menu={getActionMenu(record)} trigger={["click"]} placement="bottomRight">
          <Button
            type="text"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"
          >
            <MoreOutlined className="text-slate-500 text-lg" />
          </Button>
        </Dropdown>
      ),
    },
  ];

  const isLoading = contractsLoading || requestsLoading;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* ─── Page Header ───────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý khách hàng</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tổng quan vòng đời từ yêu cầu thuê → ký hợp đồng → dòng tiền
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isLoading}
            className="rounded-xl h-10 px-5 border-slate-200 font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600"
          >
            Đồng bộ dữ liệu
          </Button>
        </motion.div>
      </div>

      {/* ─── Hero KPI Banner ───────────────────────────────────────── */}
      <motion.div
        className="mx-4 mt-4 rounded-3xl overflow-hidden shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative bg-[#0b1120] px-8 py-10">
          {/* Background glows */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-60 bg-emerald-600/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
            {/* Left copy */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80 mb-4">
                <UsergroupAddOutlined className="text-blue-400" />
                Trung tâm CRM — 360° Customer View
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Toàn bộ hồ sơ khách thuê
              </h1>
              <p className="mt-2 text-slate-400 text-sm max-w-md leading-relaxed">
                Theo dõi từng khách hàng từ lúc gửi yêu cầu cho đến khi ký hợp đồng và thanh toán dòng tiền. Mọi thứ trong một trang.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="flex-1 w-full grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Tổng khách",       val: summary.total,     color: "#94a3b8", icon: <UsergroupAddOutlined /> },
                { label: "Đang thuê",        val: summary.active,    color: "#34d399", icon: <CrownOutlined /> },
                { label: "Yêu cầu",          val: summary.prospects, color: "#60a5fa", icon: <UserAddOutlined /> },
                { label: "Dòng tiền/tháng",  val: formatMoney(summary.totalRent), color: "#a78bfa", icon: <WalletOutlined />, wide: true },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className={`bg-white/[0.06] border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5 hover:bg-white/10 transition-colors ${item.wide ? "col-span-2 lg:col-span-1" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: item.color + "cc" }}>
                      {item.label}
                    </span>
                    <span className="text-lg opacity-70" style={{ color: item.color }}>{item.icon}</span>
                  </div>
                  <div className="text-2xl font-bold text-white leading-tight truncate" style={{ color: item.color }}>
                    {item.val}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Data Table ────────────────────────────────────────────── */}
      <motion.div
        className="mx-4 mt-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="rounded-3xl border-0 shadow-sm" styles={{ body: { padding: "24px" } }}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5">
            <Input
              placeholder="Tra cứu theo tên, email, số điện thoại..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              className="max-w-sm h-11 rounded-xl border-slate-200 text-[13px]"
            />
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
              <Badge color="#3b82f6" />
              {filteredCustomers.length} hồ sơ
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <Table
              dataSource={filteredCustomers}
              columns={columns}
              rowKey="id"
              loading={isLoading}
              pagination={{
                current: page,
                pageSize: 10,
                onChange: setPage,
                showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} khách hàng`,
                className: "px-6 pb-4 pt-3",
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div className="text-center py-8">
                        <div className="text-slate-400 font-medium mb-1">Chưa có dữ liệu khách hàng</div>
                        <div className="text-slate-300 text-sm">
                          Khách hàng sẽ xuất hiện khi có yêu cầu thuê hoặc hợp đồng
                        </div>
                      </div>
                    }
                  />
                ),
              }}
              className="
                [&_.ant-table-thead_th]:bg-slate-50
                [&_.ant-table-thead_th]:text-slate-500
                [&_.ant-table-thead_th]:text-[11px]
                [&_.ant-table-thead_th]:font-bold
                [&_.ant-table-thead_th]:uppercase
                [&_.ant-table-thead_th]:tracking-wider
                [&_.ant-table-thead_th]:py-4
                [&_.ant-table-thead_th]:px-6
                [&_.ant-table-tbody_td]:py-5
                [&_.ant-table-tbody_td]:px-6
                [&_.ant-table-tbody_tr:hover_td]:bg-blue-50/40
              "
            />
          </div>
        </Card>
      </motion.div>

      {/* ─── Customer Detail Drawer ─────────────────────────────────── */}
      <Drawer
        title={null}
        placement="right"
        size="large"
        onClose={() => setSelectedCustomer(null)}
        open={!!selectedCustomer}
        closable={false}
        styles={{ body: { padding: 0, background: "#f8fafc" } }}
        className="[&_.ant-drawer-content]:rounded-l-3xl overflow-hidden"
      >
        <AnimatePresence>
          {selectedCustomer && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="h-full flex flex-col"
            >
              {/* ── Drawer Header ── */}
              <div className="relative bg-[#0b1120] px-8 pt-10 pb-20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-emerald-600/10 pointer-events-none" />
                <Button
                  onClick={() => setSelectedCustomer(null)}
                  type="text"
                  shape="circle"
                  className="absolute top-4 right-4 text-white/40 hover:text-white hover:bg-white/10 border-none"
                  icon={
                    <span className="text-lg leading-none">✕</span>
                  }
                />
                <div className="relative flex items-center gap-5">
                  <Avatar
                    src={selectedCustomer.avatarUrl}
                    size={80}
                    className="ring-4 ring-white/10 shadow-2xl text-3xl font-bold text-white"
                    style={{
                      background:
                        selectedCustomer.status === "ACTIVE"
                          ? "linear-gradient(135deg, #059669, #10b981)"
                          : "linear-gradient(135deg, #3b82f6, #6366f1)",
                    }}
                  >
                    {selectedCustomer.displayName.charAt(0).toUpperCase()}
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-[22px] font-bold text-white truncate">
                      {selectedCustomer.displayName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <code className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-md font-mono">
                        {selectedCustomer.id}
                      </code>
                      <span
                        className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5"
                        style={{
                          color: selectedCustomer.status === "ACTIVE" ? "#34d399" : selectedCustomer.status === "PROSPECT" ? "#60a5fa" : "#94a3b8",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {selectedCustomer.status === "ACTIVE" ? "ĐANG THUÊ" : selectedCustomer.status === "PROSPECT" ? "TIỀM NĂNG" : "KHÁCH CŨ"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Drawer Body ── */}
              <div className="flex-1 overflow-y-auto -mt-10 px-6 pb-8 space-y-5">
                {/* Contact card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                  <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Thông tin liên hệ
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] text-slate-400 mb-1">Email</div>
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                        <MailOutlined className="text-blue-400" />
                        <span className="truncate">{selectedCustomer.email || "Không có"}</span>
                      </div>
                    </div>
                    <div className="border-l border-slate-100 pl-4">
                      <div className="text-[11px] text-slate-400 mb-1">Điện thoại</div>
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                        <PhoneOutlined className="text-emerald-400" />
                        <span>{selectedCustomer.phone || "Không có"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial stats */}
                {selectedCustomer.status !== "PROSPECT" && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Hồ sơ tài chính
                    </h3>
                    <Row gutter={16}>
                      <Col span={12}>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-1">Tổng giá trị hợp đồng</div>
                          <div className="text-[18px] font-extrabold text-blue-900">{formatMoney(selectedCustomer.totalRent)}</div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Hợp đồng</div>
                          <div className="text-[18px] font-extrabold text-emerald-900">
                            {selectedCustomer.activeContracts}
                            <span className="text-[13px] font-medium text-emerald-500"> / {selectedCustomer.totalContracts}</span>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Rental Requests */}
                {selectedCustomer.requestsList.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <UserAddOutlined className="text-blue-400" />
                      Yêu cầu thuê ({selectedCustomer.requestsList.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedCustomer.requestsList.map((req: any, i: number) => (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <HomeOutlined className="text-slate-400 text-[11px]" />
                                <span className="font-semibold text-[13px] text-slate-800 truncate">
                                  {req.property?.title || "Bất động sản"}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {req.requestCode}
                              </div>
                            </div>
                            {statusTag(req.status)}
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                              <DollarOutlined className="text-emerald-400" />
                              <span className="font-bold text-emerald-700">{formatMoney(req.proposedRent)}</span>
                              <span className="text-slate-400">/tháng</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <CalendarOutlined />
                              {dayjs(req.createdAt).format("DD/MM/YYYY HH:mm")}
                            </div>
                          </div>
                          {req.message && (
                            <div className="mt-2 text-[12px] text-slate-500 bg-white rounded-lg px-3 py-2 border border-slate-100 italic">
                              "{req.message}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contracts */}
                {selectedCustomer.contractsList.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileTextOutlined className="text-slate-500" />
                      Lịch sử hợp đồng ({selectedCustomer.contractsList.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedCustomer.contractsList.map((c: any, i: number) => (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[13px] text-slate-800 truncate">
                                {c.property?.title || c.propertyName || "BĐS không tên"}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">{c.contractCode}</div>
                            </div>
                            {contractStatusTag(c.status)}
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-[12px]">
                              <TagOutlined className="text-slate-400" />
                              <span className="font-bold text-blue-700">{formatMoney(c.monthlyRent)}</span>
                              <span className="text-slate-400">/tháng</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <CalendarOutlined />
                              {dayjs(c.startDate).format("MM/YYYY")}
                              <ArrowRightOutlined className="text-[9px]" />
                              {dayjs(c.endDate).format("MM/YYYY")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Drawer Footer ── */}
              <div className="p-5 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={chatLoading}
                  icon={<MessageOutlined />}
                  onClick={() => handleChat(selectedCustomer.id)}
                  className="h-12 rounded-2xl text-[14px] font-bold shadow-lg"
                  style={{ background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", border: "none" }}
                >
                  Kết nối Chat trực tiếp
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Drawer>
    </div>
  );
}
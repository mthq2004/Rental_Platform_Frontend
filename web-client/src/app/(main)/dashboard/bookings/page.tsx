"use client";

import React, { useEffect, useState } from "react";
import { Tabs, Table, Tag, Button, Modal, Input, App, Avatar, Empty, Space } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getMyBookings,
  getOwnerBookings,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  selectMyBookings,
  selectOwnerBookings,
  selectBookingLoading,
} from "@/stores/slices/booking.slice";
import type { BookingItem } from "@/stores/slices/booking.slice";
import dayjs from "dayjs";

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  pending: { color: "orange", label: "Chờ xác nhận" },
  confirmed: { color: "green", label: "Đã xác nhận" },
  rejected: { color: "red", label: "Đã từ chối" },
  cancelled: { color: "default", label: "Đã hủy" },
  completed: { color: "blue", label: "Hoàn thành" },
};

export default function BookingsPage() {
  const { message, modal } = App.useApp();
  const dispatch = useAppDispatch();
  const myBookings = useAppSelector(selectMyBookings);
  const ownerBookings = useAppSelector(selectOwnerBookings);
  const loading = useAppSelector(selectBookingLoading);

  const [activeTab, setActiveTab] = useState("my");
  const [detailModal, setDetailModal] = useState<BookingItem | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [noteModal, setNoteModal] = useState<string | null>(null);
  const [landlordNote, setLandlordNote] = useState("");

  useEffect(() => {
    dispatch(getMyBookings());
    dispatch(getOwnerBookings(undefined));
  }, [dispatch]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const handleConfirm = async (bookingId: string) => {
    if (noteModal === bookingId && landlordNote.trim()) {
      try {
        await dispatch(confirmBooking({ bookingId, landlordNote })).unwrap();
        message.success("Đã xác nhận lịch xem");
        setNoteModal(null);
        setLandlordNote("");
        dispatch(getOwnerBookings(undefined));
      } catch { message.error("Xác nhận thất bại"); }
    } else {
      setNoteModal(bookingId);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await dispatch(rejectBooking({ bookingId: rejectModal, reason: rejectReason })).unwrap();
      message.success("Đã từ chối lịch xem");
      setRejectModal(null);
      setRejectReason("");
      dispatch(getOwnerBookings(undefined));
    } catch { message.error("Từ chối thất bại"); }
  };

  const handleCancel = (bookingId: string) => {
    modal.confirm({
      title: "Hủy lịch xem",
      content: "Bạn có chắc chắn muốn hủy lịch xem này?",
      okText: "Hủy lịch",
      cancelText: "Không",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(cancelBooking({ bookingId })).unwrap();
          message.success("Đã hủy lịch xem");
          dispatch(getMyBookings());
        } catch { message.error("Hủy thất bại"); }
      },
    });
  };

  const myColumns = [
    {
      title: "Bất động sản",
      dataIndex: "property",
      key: "property",
      render: (_: any, r: BookingItem) => (
        <div className="flex items-center gap-2">
          <EnvironmentOutlined className="text-blue-500" />
          <span className="font-medium">{r.property?.title || r.propertyId}</span>
        </div>
      ),
    },
    {
      title: "Ngày xem",
      dataIndex: "visitDate",
      key: "visitDate",
      width: 120,
      render: (d: string) => (
        <span className="flex items-center gap-1">
          <CalendarOutlined /> {formatDate(d)}
        </span>
      ),
      sorter: (a: BookingItem, b: BookingItem) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime(),
    },
    {
    title: "Giờ",
    key: "time",
    width: 140,
    render: (_: any, r: BookingItem) =>
        `${dayjs(r.visitTimeStart).format("HH:mm")}${
        r.visitTimeEnd ? ` - ${dayjs(r.visitTimeEnd).format("HH:mm")}` : ""
        }`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (s: string) => {
        const cfg = STATUS_MAP[s] || { color: "default", label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      render: (_: any, r: BookingItem) => (
        <Space>
          <Button size="small" onClick={() => setDetailModal(r)}>Chi tiết</Button>
          {r.status === "pending" && (
            <Button size="small" danger onClick={() => handleCancel(r.bookingId)}>Hủy</Button>
          )}
        </Space>
      ),
    },
  ];

  const ownerColumns = [
    {
      title: "Khách hàng",
      key: "tenant",
      render: (_: any, r: BookingItem) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" src={r.tenant?.avatarUrl} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{r.tenant?.fullName || "N/A"}</div>
            {r.tenantPhone && (
              <div className="text-xs text-gray-500">
                <PhoneOutlined /> {r.tenantPhone}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Bất động sản",
      key: "property",
      render: (_: any, r: BookingItem) => r.property?.title || r.propertyId,
    },
    {
      title: "Ngày xem",
      dataIndex: "visitDate",
      key: "visitDate",
      width: 120,
      render: (d: string) => formatDate(d),
      sorter: (a: BookingItem, b: BookingItem) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime(),
    },
    {
    title: "Giờ",
    key: "time",
    width: 140,
    render: (_: any, r: BookingItem) =>
        `${dayjs(r.visitTimeStart).format("HH:mm")}${
        r.visitTimeEnd ? ` - ${dayjs(r.visitTimeEnd).format("HH:mm")}` : ""
        }`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (s: string) => {
        const cfg = STATUS_MAP[s] || { color: "default", label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 220,
      render: (_: any, r: BookingItem) => (
        <Space>
          <Button size="small" onClick={() => setDetailModal(r)}>Chi tiết</Button>
          {r.status === "pending" && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleConfirm(r.bookingId)}>
                Xác nhận
              </Button>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => setRejectModal(r.bookingId)}>
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        <CalendarOutlined className="mr-2" />
        Quản lý lịch xem nhà
      </h2>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "my",
            label: `Lịch của tôi (${myBookings.length})`,
            children: (
              <Table
                dataSource={myBookings}
                columns={myColumns}
                rowKey="bookingId"
                loading={loading}
                locale={{ emptyText: <Empty description="Bạn chưa có lịch xem nào" /> }}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: "owner",
            label: `Yêu cầu nhận được (${ownerBookings.length})`,
            children: (
              <Table
                dataSource={ownerBookings}
                columns={ownerColumns}
                rowKey="bookingId"
                loading={loading}
                locale={{ emptyText: <Empty description="Chưa có yêu cầu xem nhà nào" /> }}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
        ]}
      />

      {/* Detail Modal */}
      <Modal
        open={!!detailModal}
        title="Chi tiết lịch xem"
        onCancel={() => setDetailModal(null)}
        footer={null}
        width={500}
      >
        {detailModal && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Bất động sản:</span>
              <span className="font-medium">{detailModal.property?.title || detailModal.propertyId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ngày xem:</span>
              <span>{formatDate(detailModal.visitDate)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500">Thời gian:</span>

                <span>
                    {dayjs(detailModal.visitTimeStart).format("HH:mm")}
                    {detailModal.visitTimeEnd
                    ? ` - ${dayjs(detailModal.visitTimeEnd).format("HH:mm")}`
                    : ""}
                </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Trạng thái:</span>
              <Tag color={STATUS_MAP[detailModal.status]?.color}>{STATUS_MAP[detailModal.status]?.label}</Tag>
            </div>
            {detailModal.tenant && (
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng:</span>
                <span>{detailModal.tenant.fullName}</span>
              </div>
            )}
            {detailModal.tenantPhone && (
              <div className="flex justify-between">
                <span className="text-gray-500">SĐT:</span>
                <span>{detailModal.tenantPhone}</span>
              </div>
            )}
            {detailModal.numberOfVisitors && (
              <div className="flex justify-between">
                <span className="text-gray-500">Số người:</span>
                <span>{detailModal.numberOfVisitors}</span>
              </div>
            )}
            {detailModal.tenantNote && (
              <div>
                <span className="text-gray-500">Ghi chú khách:</span>
                <p className="mt-1 bg-gray-50 p-3 rounded-lg text-sm">{detailModal.tenantNote}</p>
              </div>
            )}
            {detailModal.landlordNote && (
              <div>
                <span className="text-gray-500">Ghi chú chủ nhà:</span>
                <p className="mt-1 bg-blue-50 p-3 rounded-lg text-sm">{detailModal.landlordNote}</p>
              </div>
            )}
            {detailModal.cancellationReason && (
              <div>
                <span className="text-gray-500">Lý do hủy:</span>
                <p className="mt-1 bg-red-50 p-3 rounded-lg text-sm">{detailModal.cancellationReason}</p>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Ngày tạo:</span>
              <span>{formatDate(detailModal.createdAt)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm with Note Modal */}
      <Modal
        open={!!noteModal}
        title="Xác nhận lịch xem"
        onCancel={() => { setNoteModal(null); setLandlordNote(""); }}
        onOk={() => noteModal && handleConfirm(noteModal)}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <p className="mb-2">Thêm ghi chú cho khách hàng (tuỳ chọn):</p>
        <Input.TextArea
          rows={3}
          value={landlordNote}
          onChange={(e) => setLandlordNote(e.target.value)}
          placeholder="VD: Vui lòng đến đúng giờ, bảo vệ sẽ hướng dẫn..."
        />
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        title={<span className="text-red-500"><ExclamationCircleOutlined /> Từ chối lịch xem</span>}
        onCancel={() => { setRejectModal(null); setRejectReason(""); }}
        onOk={handleReject}
        okText="Từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
      >
        <p className="mb-2">Lý do từ chối:</p>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối..."
        />
      </Modal>
    </div>
  );
}

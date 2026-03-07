"use client";

import React, { useEffect, useState, use } from "react";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Spin,
  Modal,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  UserOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";

import {
  getAvailableSlots,
  createBooking,
  clearBookingMessage,
  selectTimeSlots,
  selectBookingLoading,
  selectSlotsLoading,
  selectBookingMessage,
} from "@/stores/slices/booking.slice";
import {
  getPropertyDetailThunk,
  clearDetail,
  selectDetailState,
} from "@/stores/slices/estate.slice";
import { AppDispatch } from "@/stores/store";

type Params = Promise<{ propertyId: string }>;

export default function BookSchedulePage({ params }: { params: Params }) {
  const { propertyId } = use(params);
  const { message } = App.useApp();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { data: property, loading: propertyLoading } = useSelector(selectDetailState);
  const timeSlots = useSelector(selectTimeSlots);
  const slotsLoading = useSelector(selectSlotsLoading);
  const bookingLoading = useSelector(selectBookingLoading);
  const bookingMessage = useSelector(selectBookingMessage);

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Fetch property info on mount
  useEffect(() => {
    dispatch(getPropertyDetailThunk(propertyId));
    return () => {
      dispatch(clearDetail());
    };
  }, [propertyId, dispatch]);

  // Fetch available slots when date changes
  useEffect(() => {
    dispatch(
      getAvailableSlots({
        propertyId,
        date: selectedDate.format("YYYY-MM-DD"),
      })
    );
    setSelectedSlotId(null);
  }, [selectedDate, propertyId, dispatch]);

  // Handle booking response
  useEffect(() => {
    if (!bookingMessage) return;

    if (bookingMessage.type === "success") {
      message.success(bookingMessage.message);
      setTimeout(() => router.back(), 1000);
    } else {
      message.error(bookingMessage.message);
    }

    dispatch(clearBookingMessage());
  }, [bookingMessage, dispatch, message, router]);

  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    if (!selectedSlotId) {
      message.error("Vui lòng chọn khung giờ");
      return;
    }

    const slot = timeSlots.find((s) => s.id === selectedSlotId);
    if (!slot) return;
    if (!slot.available) {
      message.error("Khung giờ này đã được đặt, vui lòng chọn giờ khác");
      return;
    }

    const [start, end] = slot.time.split(" - ");

    Modal.confirm({
      title: "Xác nhận đặt lịch",
      content: `Bạn muốn đặt lịch xem nhà vào ${selectedDate.format("DD/MM/YYYY")} - ${slot.time}?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () => {
        dispatch(
          createBooking({
            propertyId,
            visitDate: selectedDate.format("YYYY-MM-DD"),
            visitTimeStart: `${start}:00`,
            visitTimeEnd: end ? `${end}:00` : `${start}:00`,
            tenantPhone: values.tenantPhone,
            tenantNote: values.tenantNote,
            numberOfVisitors: values.numberOfVisitors ?? 1,
          })
        );
      },
    });
  };

  const isToday = selectedDate.isSame(dayjs(), "day");

  const isPastSlot = (slot: { time: string }) => {
    if (!isToday) return false;
    const startTime = slot.time.split(" - ")[0];
    const [h, m] = startTime.split(":").map(Number);
    const now = dayjs();
    return h < now.hour() || (h === now.hour() && m <= now.minute());
  };

  return (
  <div className="max-w-3xl mx-auto py-10 px-4">

    {/* Header */}
    <div className="flex items-center gap-3 mb-8">

      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        className="text-gray-600"
      />

      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Đặt lịch xem nhà
        </h1>

        <p className="text-gray-500 text-sm">
          Chọn thời gian phù hợp để tham quan bất động sản
        </p>
      </div>

    </div>

    <div className="space-y-8">

      {/* Property Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <HomeOutlined className="text-blue-500" />
          Thông tin bất động sản
        </h3>

        {propertyLoading ? (
          <div className="flex justify-center py-6">
            <Spin />
          </div>
        ) : property ? (
          <div className="flex gap-5 items-center">
            {property.images?.[0] ? (
              <img
                src={property.images[0].uri}
                className="w-28 h-28 rounded-lg object-cover"
              />
            ) : (
              <div className="w-28 h-28 bg-gray-200 rounded-lg flex items-center justify-center">
                <HomeOutlined />
              </div>
            )}

            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-800 mb-1">
                {property.title}
              </p>

              <div className="flex items-center text-gray-500 text-sm mb-2">
                <EnvironmentOutlined className="mr-1" />
                {property.district}, {property.city}
              </div>

              <p className="text-blue-600 font-bold text-lg">
                {property.pricePerMonth?.toLocaleString("vi-VN")} đ/tháng
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 italic text-sm">
            Không tìm thấy thông tin bất động sản
          </p>
        )}
      </div>

      {/* Date */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CalendarOutlined className="text-blue-500" />
          Chọn ngày xem nhà
        </h3>

        <DatePicker
          className="w-full"
          size="large"
          value={selectedDate}
          format="DD/MM/YYYY"
          disabledDate={(d) => d.isBefore(dayjs().startOf("day"))}
          onChange={(d) => d && setSelectedDate(d)}
        />
      </div>

      {/* Time Slots */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ClockCircleOutlined className="text-blue-500" />
          Chọn khung giờ
        </h3>

        {slotsLoading ? (
          <div className="flex justify-center py-6">
            <Spin tip="Đang tải khung giờ..." />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {timeSlots?.map((slot) => {
              const disabled = !slot.available || isPastSlot(slot);
              const selected = selectedSlotId === slot.id && !disabled;

              return (
                <button
                  key={slot.id}
                  disabled={disabled}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`
                    h-12 rounded-lg border text-sm font-medium transition
                    ${
                      disabled
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                        : selected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "hover:border-blue-500 hover:text-blue-600"
                    }
                  `}
                >
                  {slot.time}
                </button>
              );
            })}

            {(!timeSlots || timeSlots.length === 0) && (
              <div className="col-span-3 text-center py-6 text-gray-500 text-sm">
                Không có khung giờ trống
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UserOutlined className="text-blue-500" />
          Thông tin liên hệ
        </h3>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="tenantPhone"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              { pattern: /^[0-9]{9,11}$/, message: "Số điện thoại không hợp lệ" },
            ]}
          >
            <Input size="large" placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="numberOfVisitors"
            label="Số người tham quan"
            initialValue={1}
          >
            <InputNumber
              size="large"
              min={1}
              max={10}
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            name="tenantNote"
            label="Ghi chú"
          >
            <Input.TextArea
              rows={4}
              placeholder="Yêu cầu hoặc câu hỏi cho chủ nhà"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </div>

      {/* Submit */}
      <Button
        type="primary"
        size="large"
        block
        loading={bookingLoading}
        onClick={handleSubmit}
        className="h-12 text-base font-semibold rounded-lg"
      >
        Gửi yêu cầu đặt lịch
      </Button>

    </div>
  </div>
);
}
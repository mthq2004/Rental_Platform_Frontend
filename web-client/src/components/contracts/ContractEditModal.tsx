"use client";

import React from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Badge,
  type FormInstance,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import type { RentalContract } from "@/types/contract.type";
import SmartPriceInput from "@/components/common/SmartPriceInput";

interface ContractEditModalProps {
  open: boolean;
  contractDetail: RentalContract | null;
  actionLoading: boolean;
  form: FormInstance;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export default function ContractEditModal({
  open,
  contractDetail,
  actionLoading,
  form,
  onClose,
  onSubmit,
}: ContractEditModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-3 pb-3 border-b">
          <div className="p-2 bg-blue-50 rounded-lg">
            <EditOutlined className="text-blue-600 text-lg" />
          </div>
          <div>
            <div className="text-base font-semibold text-gray-800">Chỉnh sửa điều khoản hợp đồng</div>
            <div className="text-xs font-normal text-gray-500">Mã: {contractDetail?.contractCode}</div>
          </div>
        </div>
      }
      okText="Cập nhật hợp đồng"
      cancelText="Để sau"
      onOk={onSubmit}
      confirmLoading={actionLoading}
      destroyOnClose
      width={720}
      centered
      className="professional-modal"
    >
      <Form
        form={form}
        layout="vertical"
        className="pt-4 max-h-[70vh] overflow-y-auto px-1"
        requiredMark="optional"
      >
        {/* Section: Financial Terms */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
            Thông tin tài chính
          </h4>

          <div className="grid grid-cols-2 gap-6">
            <Form.Item
              label="Giá thuê hàng tháng"
              name="monthlyRent"
              rules={[{ required: true }]}
            >
              <SmartPriceInput
                value={form.getFieldValue("monthlyRent") || 0}
                onChange={(val) => form.setFieldValue("monthlyRent", val)}
                placeholder="VD: 5000000"
              />
            </Form.Item>

            <Form.Item label="Tiền đặt cọc" name="depositAmount">
              <SmartPriceInput
                value={form.getFieldValue("depositAmount") || 0}
                onChange={(val) => form.setFieldValue("depositAmount", val)}
                placeholder="VD: 10000000"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-2">
            <Form.Item label="Giá điện (kWh)" name="electricityCostPerKwh">
              <SmartPriceInput
                value={form.getFieldValue("electricityCostPerKwh") || 0}
                onChange={(val) => form.setFieldValue("electricityCostPerKwh", val)}
                placeholder="VD: 3500"
              />
            </Form.Item>

            <Form.Item label="Giá nước (m³)" name="waterCostPerM3">
              <SmartPriceInput
                value={form.getFieldValue("waterCostPerM3") || 0}
                onChange={(val) => form.setFieldValue("waterCostPerM3", val)}
                placeholder="VD: 15000"
              />
            </Form.Item>

            <Form.Item label="Phí quản lý" name="managementFee">
              <SmartPriceInput
                value={form.getFieldValue("managementFee") || 0}
                onChange={(val) => form.setFieldValue("managementFee", val)}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Form.Item label="Phí giữ xe" name="parkingFee">
              <SmartPriceInput
                value={form.getFieldValue("parkingFee") || 0}
                onChange={(val) => form.setFieldValue("parkingFee", val)}
              />
            </Form.Item>

            <Form.Item label="Phí internet" name="internetFee">
              <SmartPriceInput
                value={form.getFieldValue("internetFee") || 0}
                onChange={(val) => form.setFieldValue("internetFee", val)}
              />
            </Form.Item>

            <Form.Item label="Phí phạt chậm/ngày" name="lateFeePerDay">
              <SmartPriceInput
                value={form.getFieldValue("lateFeePerDay") || 0}
                onChange={(val) => form.setFieldValue("lateFeePerDay", val)}
              />
            </Form.Item>
          </div>
        </div>

        {/* Section: Payment & Rules */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
            Quy định thanh toán
          </h4>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Form.Item
                label="Ngày chốt tiền nhà"
                name="paymentDueDay"
                tooltip="Ngày trong tháng người thuê phải thanh toán"
                rules={[{ required: true, message: "Vui lòng nhập ngày thanh toán" }]}
              >
                <div className="flex items-center">
                  <InputNumber
                    min={1}
                    max={28}
                    precision={0}
                    placeholder="VD: 5"
                    className="w-20 h-10"
                    controls={false}
                  />
                  <span className="ml-2 text-sm text-gray-500">/ tháng</span>
                </div>
              </Form.Item>

              <Form.Item
                label="Thời gian gia hạn"
                name="gracePeriodDays"
                tooltip="Số ngày cho phép trễ hạn trước khi tính phí phạt"
              >
                <div className="flex items-center">
                  <InputNumber
                    min={0}
                    max={30}
                    precision={0}
                    placeholder="VD: 3"
                    className="w-20 h-10"
                    controls={false}
                  />
                  <span className="ml-2 text-sm text-gray-500">ngày</span>
                </div>
              </Form.Item>
            </div>

            <Form.Item name="autoRenewal" valuePropName="checked" className="mb-0">
              <div className="flex items-start justify-between bg-white border border-gray-200 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Tự động gia hạn hợp đồng</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Hệ thống sẽ tự động tạo hợp đồng mới khi hợp đồng hiện tại hết hạn
                  </p>
                </div>
                <Switch />
              </div>
            </Form.Item>
          </div>
        </div>

        {/* Section: Terms List */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-green-500 rounded-full"></span>
              Điều khoản bổ sung
            </h4>
          </div>

          <Form.List name="terms">
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    className="relative group bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-all"
                  >
                    <div className="flex gap-3">
                      <Badge count={index + 1} color="#bfbfbf" style={{ marginTop: 8 }} />
                      <Form.Item {...field} noStyle>
                        <Input.TextArea
                          autoSize={{ minRows: 1, maxRows: 4 }}
                          placeholder="Nhập nội dung điều khoản..."
                          variant="borderless"
                          className="p-0 focus:shadow-none"
                        />
                      </Form.Item>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(field.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block
                  className="h-10 rounded-lg border-gray-300 text-gray-500 hover:text-blue-500 hover:border-blue-500"
                >
                  Thêm điều khoản mới
                </Button>
              </div>
            )}
          </Form.List>
        </div>

        {/* Section: Notes */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
            Ghi chú nội bộ
          </h4>
          <Form.Item name="notes">
            <Input.TextArea
              rows={3}
              placeholder="Các lưu ý đặc biệt dành cho hợp đồng này..."
              maxLength={1000}
              showCount
              className="rounded-lg shadow-sm"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

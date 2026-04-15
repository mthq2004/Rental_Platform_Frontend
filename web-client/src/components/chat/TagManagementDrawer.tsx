"use client";

import { useState } from "react";
import {
  Drawer,
  Button,
  Modal,
  Input,
  message,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  createCustomerCategory,
  deleteCustomerCategory,
  updateCustomerCategory,
} from "@/stores/slices/customer-category.slice";

const PRESET_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#eab308",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#1f2937",
];

interface TagManagementDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface TagFormData {
  name: string;
  color: string;
  description: string;
}

export default function TagManagementDrawer({
  open,
  onClose,
}: TagManagementDrawerProps) {
  const dispatch = useAppDispatch();
  const { customerCategories } = useAppSelector(
    (state) => state.customerCategory
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TagFormData>({
    name: "",
    color: "#ef4444",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({ name: "", color: "#ef4444", description: "" });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (cat: {
    id: string;
    name: string;
    color: string;
    description: string;
  }) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      color: cat.color,
      description: cat.description || "",
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      message.warning("Vui lòng nhập tên phân loại");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await dispatch(
          updateCustomerCategory({
            id: editingId,
            data: {
              name: form.name.trim(),
              color: form.color,
              description: form.description.trim(),
            },
          })
        ).unwrap();
        message.success("Đã cập nhật phân loại");
      } else {
        await dispatch(
          createCustomerCategory({
            name: form.name.trim(),
            color: form.color,
            description: form.description.trim(),
          })
        ).unwrap();
        message.success("Đã tạo phân loại mới");
      }
      setShowCreateModal(false);
      resetForm();
    } catch {
      message.error("Không thể lưu phân loại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteCustomerCategory(id)).unwrap();
      message.success("Đã xóa phân loại");
    } catch {
      message.error("Không thể xóa phân loại");
    }
  };

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">Quản lý phân loại</span>
          </div>
        }
        open={open}
        onClose={onClose}
        styles={{ body: { padding: 0 }, wrapper: { width: 420 } }}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {customerCategories.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Chưa có phân loại nào
              </div>
            ) : (
              customerCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.color + "20" }}
                    >
                      <div
                        className="w-4.5 h-4.5 rounded-full"
                        style={{
                          backgroundColor: cat.color,
                          width: 18,
                          height: 18,
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 m-0 truncate">
                        {cat.name}
                      </p>
                      <p className="text-[11px] text-gray-400 m-0">
                        {cat.conversationCount} đoạn chat
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      className="text-gray-400 hover:text-blue-500"
                      onClick={() => handleOpenEdit(cat)}
                    />
                    <Popconfirm
                      title="Xóa phân loại này?"
                      description="Hành động này không thể hoàn tác"
                      onConfirm={() => handleDelete(cat.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        className="text-gray-400 hover:text-red-500"
                      />
                    </Popconfirm>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-100">
            <Button
              block
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
              className="h-10"
            >
              Tạo mới
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Create / Edit Modal */}
      <Modal
        title={
          <span className="text-base font-semibold">
            {editingId ? "Chỉnh sửa phân loại" : "Tạo phân loại mới"}
          </span>
        }
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        centered
        width={400}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button type="primary" onClick={handleSave} loading={saving}>
              {editingId ? "Cập nhật" : "Tạo"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên phân loại <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Khách mới, Đã chốt..."
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mô tả
            </label>
            <Input.TextArea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Mô tả ngắn gọn về phân loại này..."
              rows={3}
              maxLength={200}
              showCount
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Màu sắc
            </label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                    form.color === color
                      ? "border-gray-800 scale-110 shadow-md"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs text-gray-400 mb-2">
              Xem trước
            </label>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: form.color + "20" }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: form.color }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {form.name || "Tên phân loại"}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

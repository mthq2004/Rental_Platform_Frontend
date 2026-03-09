"use client";

import { useEffect, useState } from "react";
import { Modal, Checkbox, Button, Spin, message } from "antd";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getAllCustomerCategories,
  addConversationToCategory,
} from "@/stores/slices/customer-category.slice";
import TagManagementDrawer from "./TagManagementDrawer";

interface ConversationTagModalProps {
  open: boolean;
  conversationId: string;
  onClose: () => void;
}

const TAG_ICONS: Record<string, string> = {
  red: "🏷️",
  blue: "🏷️",
  green: "🏷️",
  orange: "🏷️",
  yellow: "🏷️",
  purple: "🏷️",
  black: "🏷️",
};

export default function ConversationTagModal({
  open,
  conversationId,
  onClose,
}: ConversationTagModalProps) {
  const dispatch = useAppDispatch();
  const { customerCategories, loading } = useAppSelector(
    (state) => state.customerCategory
  );
  const { conversations } = useAppSelector((state) => state.conversation);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showManagement, setShowManagement] = useState(false);
  const [saving, setSaving] = useState(false);

  const conversation = conversations.find((c) => c.id === conversationId);

  useEffect(() => {
    if (open) {
      dispatch(getAllCustomerCategories());
      // Initialize selected from current conversation categories
      const currentIds =
        conversation?.categories?.map((c) => c.id) ?? [];
      setSelectedIds(currentIds);
    }
  }, [open, dispatch, conversationId]);

  const handleToggle = (categoryId: string) => {
    setSelectedIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(
        addConversationToCategory({
          conversationId,
          categoryIds: selectedIds,
        })
      ).unwrap();
      message.success("Đã cập nhật phân loại");
      onClose();
    } catch {
      message.error("Không thể cập nhật phân loại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        title={
          <span className="text-base font-semibold">Gắn phân loại</span>
        }
        open={open}
        onCancel={onClose}
        centered
        width={400}
        footer={null}
        styles={{ body: { padding: "12px 0 0" } }}
      >
        {loading && customerCategories.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : (
          <div>
            <div className="max-h-80 overflow-y-auto">
              {customerCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleToggle(cat.id)}
                  className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: cat.color + "20" }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">
                        {cat.name}
                      </span>
                      {cat.description && (
                        <p className="text-[11px] text-gray-400 m-0 mt-0.5">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Checkbox checked={selectedIds.includes(cat.id)} />
                </div>
              ))}

              {customerCategories.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Chưa có phân loại nào
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-100 mt-2">
              <Button onClick={() => setShowManagement(true)}>
                Quản lý
              </Button>
              <Button
                type="primary"
                onClick={handleSave}
                loading={saving}
                className="min-w-20"
              >
                Lưu
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <TagManagementDrawer
        open={showManagement}
        onClose={() => setShowManagement(false)}
      />
    </>
  );
}

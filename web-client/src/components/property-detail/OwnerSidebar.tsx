"use client";

import React, { useState } from "react";
import {
  MessageOutlined,
  PhoneOutlined,
  SendOutlined,
  RightOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type { PropertyOwner } from "./types";

interface OwnerSidebarProps {
  owner: PropertyOwner;
  propertyId: string;
}

const QUICK_QUESTIONS = [
  "Nhà này còn không ạ ?",
  "Thời hạn thuê tối đa là bao lâu?",
  "Có thể xem nhà khi nào?",
  "Giá có thương lượng không?",
];

const USER_TYPE_LABELS: Record<string, string> = {
  personal: "Cá nhân",
  broker: "Môi giới",
  agency: "Đại lý",
};

export default function OwnerSidebar({ owner, propertyId }: OwnerSidebarProps) {
  const router = useRouter();
  const [showPhone, setShowPhone] = useState(false);
  const [message, setMessage] = useState("");
  const [questionIdx, setQuestionIdx] = useState(0);

  const visibleQuestions = QUICK_QUESTIONS.slice(questionIdx, questionIdx + 2);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // TODO: Send message via API or redirect to chat
    console.log("Send message:", message);
    setMessage("");
  };

  const handleChat = () => {
    router.push(`/chat?to=${owner.id}&property=${propertyId}`);
  };

  const handlePhoneReveal = () => {
    setShowPhone(true);
  };

  return (
    <div className="sticky top-18 space-y-4">
      {/* Owner card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        {/* Avatar + info */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden shrink-0">
            {owner.avatarUrl ? (
              <img
                src={owner.avatarUrl}
                alt={owner.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {owner.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-base truncate">
              {owner.fullName}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <UserOutlined className="text-xs" />
              {USER_TYPE_LABELS[owner.userType] || "Cá nhân"}
            </p>
          </div>
        </div>

        {/* Activity info */}
        <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Hoạt động {owner.lastActive}</span>
          {owner.responseRate && (
            <>
              <span className="mx-2 text-gray-300">|</span>
              <span>Phản hồi: {owner.responseRate}</span>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <FileTextOutlined className="text-blue-500" />
            {owner.totalListings} tin đăng
          </span>
          <span className="flex items-center gap-1">
            <CalendarOutlined className="text-blue-500" />
            {owner.joinedYears} năm trên hệ thống
          </span>
        </div>

        {/* CTA buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleChat}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-300 
              text-gray-700 hover:border-blue-400 hover:text-blue-500 
              px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageOutlined />
            Chat
          </button>
          <button
            onClick={handlePhoneReveal}
            className="flex-1 flex items-center justify-center gap-2 
              bg-blue-500 hover:bg-blue-600 text-white 
              px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <PhoneOutlined />
            {showPhone
              ? owner.phone.replace(/\*/g, "8")
              : `Hiện số ${owner.phone}`}
          </button>
        </div>

        {/* Quick message */}
        <div className="mt-4">
          <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2">
            <MessageOutlined className="text-gray-400" />
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Nhắn hỏi thông tin"
              className="flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className={`text-sm font-bold px-3 py-1 rounded-full transition-colors
                ${message.trim()
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
            >
              Gửi
            </button>
          </div>
        </div>

        {/* Quick questions */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 flex gap-2 overflow-hidden">
            {visibleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setMessage(q)}
                className="text-xs border border-gray-200 rounded-full px-3 py-1.5 
                  text-gray-600 hover:border-blue-400 hover:text-blue-500 
                  transition-colors whitespace-nowrap truncate"
              >
                {q}
              </button>
            ))}
          </div>
          {QUICK_QUESTIONS.length > 2 && (
            <button
              onClick={() =>
                setQuestionIdx((prev) =>
                  prev + 2 >= QUICK_QUESTIONS.length ? 0 : prev + 2
                )
              }
              className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 
                text-gray-400 hover:text-blue-500 hover:border-blue-400 transition-colors shrink-0"
            >
              <RightOutlined className="text-xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

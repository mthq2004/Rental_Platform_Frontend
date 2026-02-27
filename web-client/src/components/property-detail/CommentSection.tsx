"use client";

import React, { useState } from "react";
import {
  SendOutlined,
  MessageOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@/stores/hooks";
import type { CommentData } from "./types";

interface CommentSectionProps {
  propertyId: string;
}

export default function CommentSection({ propertyId }: CommentSectionProps) {
  const { isAuth, user } = useAppSelector((state) => state.auth);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    if (!isAuth) {
      // TODO: open auth modal
      return;
    }

    const comment: CommentData = {
      id: `c-${Date.now()}`,
      userId: user?.id || "",
      userName: user?.fullName || "Ẩn danh",
      userAvatar: user?.avatarUrl || "",
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, comment]);
    setNewComment("");

    // TODO: Send comment to API
    // http.post(`/properties/${propertyId}/comments`, { content: newComment.trim() });
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mt-4">
      <h3 className="font-semibold text-gray-900 mb-4">Bình luận</h3>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageOutlined className="text-4xl text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Chưa có bình luận nào.</p>
          <p className="text-sm text-gray-400">
            Hãy để lại bình luận cho người bán.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                {comment.userAvatar ? (
                  <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                    <UserOutlined className="text-blue-500 text-xs" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-sm font-medium text-gray-800">
                    {comment.userName}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {comment.content}
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-1">
                  {formatCommentTime(comment.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 overflow-hidden">
          {isAuth && user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
              <UserOutlined className="text-blue-500 text-xs" />
            </div>
          )}
        </div>
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Bình luận..."
          className="flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent py-1"
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          className={`transition-colors ${
            newComment.trim()
              ? "text-blue-500 hover:text-blue-600 cursor-pointer"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <SendOutlined className="text-lg" />
        </button>
      </div>
    </div>
  );
}

function formatCommentTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${Math.floor(diffHours / 24)} ngày trước`;
}

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StarFilled,
  StarOutlined,
  UserOutlined,
  SendOutlined,
  SortAscendingOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@/stores/hooks";
import { useRouter } from "next/navigation";
import apiClient from "@/utils/api";
import type { ReviewData, ReviewListResponse } from "./types";

interface CommentSectionProps {
  propertyId: string;
}

const SORT_OPTIONS = [
  { key: "newest", label: "Mới nhất" },
  { key: "oldest", label: "Cũ nhất" },
  { key: "highest", label: "Cao nhất" },
  { key: "lowest", label: "Thấp nhất" },
];

// Màu vàng chuẩn của Star trong thiết kế
const STAR_COLOR = "#fadb14";

export default function CommentSection({ propertyId }: CommentSectionProps) {
  const router = useRouter();
  const { isAuth, user } = useAppSelector((state) => state.auth);

  // Reviews data state
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("newest");

  // Statistics state (Cần cập nhật ngay lập tức)
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Fetch dữ liệu từ API
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/estate/reviews/property/${propertyId}?page=${page}&limit=5&sortBy=${sortBy}`
      );
      const data = res.data as ReviewListResponse;
      setReviews(data.items);
      setTotalPages(data.totalPages);
      setTotalReviews(data.totalReviews);
      setAverageRating(data.averageRating);
    } catch (err) {
      console.error("Lỗi khi tải đánh giá:", err);
    } finally {
      setLoading(false);
    }
  }, [propertyId, page, sortBy]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Logic gửi bình luận & Cập nhật điểm trung bình ngay lập tức
  const handleSubmitReview = async () => {
    if (!isAuth) {
      router.push("/?auth=login");
      return;
    }
    if (rating === 0 || !comment.trim()) return;

    setSubmitting(true);
    try {
      const res = await apiClient.post("/estate/reviews", {
        rentalId: "00000000-0000-0000-0000-000000000000", // Cần thay bằng ID thực tế nếu có
        propertyId,
        rating,
        comment: comment.trim(),
      });

      const newReview = res.data as ReviewData;

      // --- CẬP NHẬT ĐIỂM TRUNG BÌNH & TỔNG SỐ LƯỢNG NGAY LẬP TỨC ---
      const newTotal = totalReviews + 1;
      const newAverage = (averageRating * totalReviews + rating) / newTotal;

      setTotalReviews(newTotal);
      setAverageRating(newAverage);
      setReviews((prev) => [newReview, ...prev]);
      // -----------------------------------------------------------

      setRating(0);
      setComment("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Gửi đánh giá thất bại";
      alert(typeof msg === "string" ? msg : "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm render ngôi sao đồng nhất màu sắc
  const renderStars = (value: number, size = "text-sm") => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={size}>
            {star <= value ? (
              <StarFilled style={{ color: STAR_COLOR }} />
            ) : (
              <StarOutlined className="text-gray-300" />
            )}
          </span>
        ))}
      </div>
    );
  };

  // Tính toán phân bổ sao (Lưu ý: Cái này tốt nhất nên trả về từ Backend)
  const ratingDistribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length, // Demo dựa trên list hiện tại
    }));
  }, [reviews]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-4 overflow-hidden">
      {/* Header: Tổng quan điểm số */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
          <MessageOutlined className="text-blue-500" />
          Đánh giá & Bình luận
          {totalReviews > 0 && (
            <span className="text-sm font-normal text-gray-500">({totalReviews})</span>
          )}
        </h3>

        {totalReviews > 0 && (
          <div className="flex items-center gap-6 mt-4">
            <div className="text-center border-r border-gray-100 pr-6">
              <div className="text-4xl font-extrabold text-gray-900 leading-none">
                {averageRating.toFixed(1)}
              </div>
              <div className="mt-2">{renderStars(Math.round(averageRating), "text-base")}</div>
              <div className="text-xs text-gray-400 mt-1">{totalReviews} đánh giá</div>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingDistribution.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-2">{star}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: totalReviews > 0 ? `${(count / reviews.length) * 100}%` : "0%",
                        backgroundColor: STAR_COLOR,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form viết đánh giá */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/30">
        {isAuth ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-white shadow-sm overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserOutlined className="text-blue-500 text-lg" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{user?.fullName || "Người dùng"}</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="cursor-pointer transition-transform hover:scale-120 focus:outline-none"
                    >
                      {star <= (hoverRating || rating) ? (
                        <StarFilled style={{ color: STAR_COLOR, fontSize: '1.1rem' }} />
                      ) : (
                        <StarOutlined className="text-gray-300" style={{ fontSize: '1.1rem' }} />
                      )}
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="text-xs font-medium text-orange-500 ml-2 animate-pulse">
                      {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"][rating]}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về bất động sản này..."
                className="flex-1 h-11 text-sm border border-gray-200 rounded-xl px-4 outline-none 
                  focus:border-blue-400 focus:ring-2 focus:ring-blue-50 
                  bg-white transition-all shadow-sm"
              />
              <button
                onClick={handleSubmitReview}
                disabled={rating === 0 || !comment.trim() || submitting}
                className={`h-11 px-5 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                  ${rating > 0 && comment.trim() && !submitting
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {submitting ? "..." : <SendOutlined />}
                Gửi
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">
              Hãy <button onClick={() => router.push("/?auth=login")} className="text-blue-600 font-bold hover:underline">Đăng nhập</button> để gửi đánh giá của bạn.
            </p>
          </div>
        )}
      </div>

      {/* Thanh công cụ: Sắp xếp */}
      {totalReviews > 0 && (
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tất cả bình luận</span>
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-blue-600 transition-colors"
            >
              <SortAscendingOutlined />
              {SORT_OPTIONS.find((s) => s.key === sortBy)?.label}
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 top-7 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-20 min-w-[120px] animate-in fade-in slide-in-from-top-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSortBy(opt.key);
                      setPage(1);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                      sortBy === opt.key ? "text-blue-600 bg-blue-50 font-bold" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Danh sách Review */}
      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="p-10 text-center animate-pulse text-gray-400 text-sm">Đang tải bình luận...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 px-5">
            <MessageOutlined className="text-5xl text-gray-100 mb-4" />
            <p className="text-gray-400 text-sm italic">Chưa có ai đánh giá nơi này.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 overflow-hidden border border-gray-200">
                  {review.reviewer.avatarUrl ? (
                    <img src={review.reviewer.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <UserOutlined className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-gray-900">{review.reviewer.fullName}</h4>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">
                      {formatReviewTime(review.createdAt)}
                    </span>
                  </div>
                  <div className="mb-2">{renderStars(review.rating, "text-[10px]")}</div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{review.comment}</p>

                  {/* Ảnh đính kèm */}
                  {review.imageUrls && review.imageUrls.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {review.imageUrls.map((url, idx) => (
                        <img key={idx} src={url} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-100 shadow-sm" />
                      ))}
                    </div>
                  )}

                  {/* Phản hồi từ chủ nhà */}
                  {review.reply && (
                    <div className="mt-4 bg-blue-50/40 border-l-4 border-blue-400 rounded-r-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Phản hồi từ chủ nhà</span>
                      </div>
                      <p className="text-sm text-gray-600 italic">"{review.reply}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-center gap-4 bg-gray-50/20">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              page === 1 ? "text-gray-300 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            TRƯỚC
          </button>
          <span className="text-xs font-extrabold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            TIẾP THEO
          </button>
        </div>
      )}
    </div>
  );
}

// Hàm format thời gian chuyên nghiệp
function formatReviewTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}
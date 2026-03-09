"use client";

import { ReplyMessage } from "@/types/message.type";

const ReplyPreview = ({
    reply,
    isMe,
    senderName,
}: {
    reply: ReplyMessage;
    isMe: boolean;
    senderName: string;
}) => {

    const typeLabel =
        reply.messageType === "IMAGE"
            ? "📷 Hình ảnh"
            : reply.messageType === "FILE"
            ? "📎 Tệp đính kèm"
            : reply.messageType === "VIDEO"
            ? "🎥 Video"
            : reply.content;

    const content = reply.isDeleted ? "Tin nhắn đã bị xóa" : typeLabel;

    return (
        <div className="flex flex-col gap-[2px] border-none">
            <span
                className="text-[12px] font-semibold leading-tight truncate" // Đổi leading-none thành leading-tight
                style={{ color: isMe ? "#1d4ed8" : "#0068ff" }}
            >
                {senderName}
            </span>
            <span
                className="text-[12px] leading-[1.4] line-clamp-2"
                style={{
                    color: isMe ? "#374151" : "#6b7280",
                    fontStyle: reply.isDeleted ? "italic" : "normal",
                }}
            >
                {content}
            </span>
        </div>
    );
};

export default ReplyPreview;
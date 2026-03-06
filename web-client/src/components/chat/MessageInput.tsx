"use client";

import { useRef, useState, useEffect } from "react";
import type { UploadFile } from "antd";
import { SendMessagePayload } from "@/stores/slices/message.slice";

interface ReplyInfo {
  id: string;
  content: string | null;
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  senderName: string;
}

interface MessageInputProps {
  conversationId: string;
  onSend?: (payload: SendMessagePayload) => void;
  replyTo?: ReplyInfo | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

// ── Icons ────────────────────────────────────────────────────────────────────
const IconImage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
  </svg>
);
const IconPaperclip = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.47" />
  </svg>
);
const IconSmile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);
const IconSend = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405z" />
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IconReply = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </svg>
);
const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MessageInput({
  conversationId,
  onSend,
  replyTo,
  onCancelReply,
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<UploadFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = (text.trim().length > 0 || pendingFile !== null) && !disabled && !loading;
  const isImage = pendingFile?.type?.startsWith("image/");

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [text]);

  const detectMessageType = (): SendMessagePayload["messageType"] => {
    if (!pendingFile) return "TEXT";
    if (pendingFile.type?.startsWith("image/")) return "IMAGE";
    if (pendingFile.type?.startsWith("video/")) return "VIDEO";
    return "FILE";
  };

  const handleSend = async () => {
    if (!canSend || loading) return;
    try {
      setLoading(true);
      const payload: SendMessagePayload = {
        conversationId,
        messageType: detectMessageType(),
        replyToId: replyTo?.id ?? null,
        content: !pendingFile ? text.trim() : undefined,
      };
      onSend?.(payload);
      setText("");
      setPendingFile(null);
      onCancelReply?.();
      textareaRef.current?.focus();
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (file: File) => {
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setPendingFile({
      uid: `${Date.now()}-${file.name}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: previewUrl,
      originFileObj: file,
    } as UploadFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="px-4 pb-4 pt-3 bg-white border-t border-gray-100">

      {/* ── Reply banner ── */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-indigo-50 border-l-[3px] border-indigo-500 rounded-r-lg">
          <span className="text-indigo-500 flex-shrink-0"><IconReply /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-indigo-600 leading-none mb-0.5">{replyTo.senderName}</p>
            <p className="text-xs text-gray-400 truncate">
              {replyTo.messageType !== "TEXT" ? `[${replyTo.messageType}]` : replyTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <IconX />
          </button>
        </div>
      )}

      {/* ── File / Image preview ── */}
      {pendingFile && (
        <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-gray-50 border border-gray-200 rounded-xl">
          {isImage && pendingFile.url ? (
            <img src={pendingFile.url} alt="preview" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
              <IconFile />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-800 truncate">{pendingFile.name}</p>
            {pendingFile.size && (
              <p className="text-[11px] text-gray-400 mt-0.5">{formatFileSize(pendingFile.size)}</p>
            )}
          </div>
          <button
            onClick={() => setPendingFile(null)}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
          >
            <IconX />
          </button>
        </div>
      )}

      {/* ── Input shell ── */}
      <div
        className={[
          "flex items-end gap-1.5 rounded-2xl border px-3.5 py-1.5 transition-all duration-200",
          dragOver
            ? "border-dashed border-indigo-400 bg-indigo-50"
            : "border-gray-200 bg-gray-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]",
          disabled ? "opacity-50 pointer-events-none" : "",
        ].join(" ")}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dragOver ? "Thả file vào đây…" : "Nhập tin nhắn…"}
          disabled={disabled || loading}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-[13.5px] leading-relaxed text-gray-800 placeholder-gray-400 py-1.5 min-h-[32px] max-h-[140px] overflow-y-auto"
          style={{ height: "auto" }}
        />

        {/* Emoji */}
        <button
          title="Emoji"
          disabled={disabled || loading}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <IconSmile />
        </button>

        {/* Image/Video upload */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }}
        />
        <button
          title="Ảnh / Video"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled || loading}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <IconImage />
        </button>

        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }}
        />
        <button
          title="Tệp đính kèm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <IconPaperclip />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-0.5 self-center flex-shrink-0" />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={[
            "w-[34px] h-[34px] rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
            canSend
              ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)] hover:scale-105 active:scale-95"
              : "bg-gray-200 text-gray-400 cursor-not-allowed",
          ].join(" ")}
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <IconSend />
          )}
        </button>
      </div>

      {/* Hint */}
      <p className="text-[10.5px] text-gray-300 text-right mt-1 pr-1">
        Enter để gửi · Shift+Enter xuống dòng
      </p>
    </div>
  );
}
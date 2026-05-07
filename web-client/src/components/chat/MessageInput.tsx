"use client";

import { useRef, useState, useEffect } from "react";
import type { UploadFile } from "antd";
import { SendMessagePayload } from "@/stores/slices/message.slice";
import { getUploadUrl } from "@/utils/url-upload-s3";

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
  onTyping?: (isTyping: boolean) => void;
}



// ── Icons ──
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
const IconSuggestion = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// ── Helpers ──
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Component ──
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export default function MessageInput({
  conversationId,
  onSend,
  replyTo,
  onCancelReply,
  disabled = false,
  onTyping,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressMapRef = useRef<Record<string, number>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const canSend =
    (text.trim().length > 0 || pendingFiles.length > 0) && !disabled && !loading;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [text]);

  // Auto-focus textarea when replying
  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus();
    }
  }, [replyTo]);

  // Typing indicator logic
  const handleTypingStart = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping?.(true);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping?.(false);
    }, 2000);
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping?.(false);
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const detectMessageType = (file?: UploadFile | null): SendMessagePayload["messageType"] => {
    if (!file) return "TEXT";
    if (file.type?.startsWith("image/")) return "IMAGE";
    if (file.type?.startsWith("video/")) return "VIDEO";
    return "FILE";
  };

  const updateOverallProgress = (fileCount: number) => {
    if (!fileCount) {
      setUploadProgress(0);
      return;
    }

    const values = Object.values(progressMapRef.current);
    const total = values.reduce((sum, value) => sum + value, 0);
    const percent = Math.round(total / fileCount);
    setUploadProgress(percent);
  };

  const uploadToS3 = async (file: File, fileId: string, fileCount: number) => {
    const response = await getUploadUrl(file.name, file.type || "application/octet-stream");
    const uploadUrl = response?.uploadUrl;
    const fileUrl = response?.fileUrl;

    if (!uploadUrl || !fileUrl) {
      throw new Error("Không thể lấy URL upload");
    }

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          progressMapRef.current[fileId] = percent;
          updateOverallProgress(fileCount);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error("Upload thất bại"));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Lỗi mạng khi upload")));

      xhr.open("PUT", uploadUrl, true);

      xhr.send(file);
    });

    return { fileUrl };
  };

  const handleSend = async () => {
    if (!canSend || loading) return;
    try {
      setLoading(true);
      if (text.trim().length > 0) {
        onSend?.({
          conversationId,
          messageType: "TEXT",
          replyToId: replyTo?.id ?? null,
          content: text.trim(),
        });
      }

      const filesToSend = [...pendingFiles];
      const fileCount = filesToSend.length;

      for (const pendingFile of filesToSend) {
        if (!pendingFile.originFileObj) continue;
        const file = pendingFile.originFileObj as File;
        const msgType = detectMessageType(pendingFile);
        const uploaded = await uploadToS3(file, pendingFile.uid, fileCount);

        const payload: SendMessagePayload = {
          conversationId,
          messageType: msgType,
          replyToId: replyTo?.id ?? null,
          fileUrl: uploaded.fileUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        };
        onSend?.(payload);
      }

      setText("");
      stopTyping();
      pendingFiles.forEach((file) => {
        if (file.url?.startsWith("blob:")) {
          URL.revokeObjectURL(file.url);
        }
      });
      setPendingFiles([]);
      setUploadProgress(0);
      progressMapRef.current = {};
      onCancelReply?.();
      textareaRef.current?.focus();
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };



  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const createPendingFile = (file: File): UploadFile => {
    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : undefined;
    return {
      uid: `${Date.now()}-${file.name}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: previewUrl,
      originFileObj: file,
    } as UploadFile;
  };

  const handleFilesSelect = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;

    setPendingFiles((prev) => [...prev, ...list.map(createPendingFile)]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white border-t border-gray-100 shrink-0">


      <div className="px-4 pb-3 pt-2">
        {/* Reply banner */}
        {replyTo && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-blue-50 border-l-[3px] border-blue-500 rounded-r-lg">
            <span className="text-blue-500 shrink-0">
              <IconReply />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-blue-600 leading-none mb-0.5">
                {replyTo.senderName}
              </p>
              <p className="text-xs text-gray-400 truncate m-0">
                {replyTo.messageType !== "TEXT"
                  ? `[${replyTo.messageType}]`
                  : replyTo.content}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
            >
              <IconX />
            </button>
          </div>
        )}

        {/* File / Image preview */}
        {pendingFiles.length > 0 && (
          <div className="space-y-2 mb-2">
            {pendingFiles.map((pendingFile) => {
              const isImage = pendingFile.type?.startsWith("image/");
              return (
                <div
                  key={pendingFile.uid}
                  className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                >
                  {isImage && pendingFile.url ? (
                    <img
                      src={pendingFile.url}
                      alt="preview"
                      className="w-11 h-11 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <IconFile />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 truncate m-0">
                      {pendingFile.name}
                    </p>
                    {pendingFile.size && (
                      <p className="text-[11px] text-gray-400 mt-0.5 m-0">
                        {formatFileSize(pendingFile.size)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (pendingFile.url?.startsWith("blob:")) {
                        URL.revokeObjectURL(pendingFile.url);
                      }
                      setPendingFiles((prev) => prev.filter((item) => item.uid !== pendingFile.uid));
                    }}
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <IconX />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload progress */}
        {loading && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-500">Đang tải lên...</span>
              <span className="text-[11px] text-blue-500 font-medium">{uploadProgress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Input shell */}
        <div
          className={[
            "flex items-end gap-1.5 rounded-2xl border px-3 py-1.5 transition-all duration-200",
            dragOver
              ? "border-dashed border-blue-400 bg-blue-50"
              : "border-gray-200 bg-gray-50 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.08)]",
            disabled ? "opacity-50 pointer-events-none" : "",
          ].join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >


          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value.trim()) handleTypingStart();
              else stopTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={dragOver ? "Thả file vào đây…" : "Nhập tin nhắn…"}
            disabled={disabled || loading}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[13.5px] leading-relaxed text-gray-800 placeholder-gray-400 py-1.5 min-h-8 max-h-30 overflow-y-auto"
            style={{ height: "auto" }}
          />

          {/* Emoji */}
          <button
            title="Emoji"
            disabled={disabled || loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition-colors shrink-0 border-none bg-transparent cursor-pointer"
          >
            <IconSmile />
          </button>

          {/* Image/Video upload */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFilesSelect(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            title="Ảnh / Video"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition-colors shrink-0 border-none bg-transparent cursor-pointer"
          >
            <IconImage />
          </button>

          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFilesSelect(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            title="Tệp đính kèm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition-colors shrink-0 border-none bg-transparent cursor-pointer"
          >
            <IconPaperclip />
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 mx-0.5 self-center shrink-0" />

          {/* Send button */}
          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            title="Gửi tin nhắn"
            className={`
                w-8 h-8 flex items-center justify-center shrink-0 
                transition-all duration-200 border-none bg-transparent cursor-pointer
                ${canSend ? "text-blue-500 hover:text-blue-600 active:scale-90" : "text-gray-300"}
              `}
          >
            {loading ? (
              <svg
                className="animate-spin w-4 h-4 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            ) : (
              <IconSend />
            )}
          </button>
        </div>

        {/* Hint */}
        <p className="text-[10.5px] text-gray-300 text-right mt-1 pr-1 m-0">
          Enter để gửi · Shift+Enter xuống dòng
        </p>
      </div>
    </div>
  );
}
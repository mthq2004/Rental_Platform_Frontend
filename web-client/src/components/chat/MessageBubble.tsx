"use client";

import { useRef, useState } from "react";
import { Image as AntImage, message } from "antd";
import { Heart, ThumbsUp, Laugh, Frown, Angry } from "lucide-react";
import { Message } from "@/types/message.type";
import ReplyPreview from "./ReplyPreview";
import ReactionsDisplay from "./ReactionsDisplay";
import { formatBytes, formatTime } from "@/utils/format";

const IconQuote = () => (
  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="currentColor">
    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
  </svg>
);

const IconForward = () => (
  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="currentColor">
    <path d="M13 7.5V4L21 12l-8 8v-3.6C7 16.4 3 18.4 1 23c0-6 2-12 12-15.5z" />
  </svg>
);

const IconMore = () => (
  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="currentColor">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

const IconThumb = ({ active }: { active?: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]" fill="none"
    stroke={active ? "#0068ff" : "#a1a1aa"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3L7 14v7h11.3a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
    <path d="M7 14H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h3" />
  </svg>
);

const IconTick = ({ delivered }: { delivered: boolean }) => (
  <svg viewBox="0 0 20 12" className="w-[16px] h-[10px]" fill="none">
    <path d="M1 6L5.5 10.5L12 2" stroke={delivered ? "#0068ff" : "#c4c4c4"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    {delivered && <path d="M8 6L12.5 10.5L19 2" stroke="#0068ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

const IconFile = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#0068ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);

const REACTIONS = [
  { key: "love", Icon: Heart, color: "#ff3b30", label: "Yêu thích" },
  { key: "like", Icon: ThumbsUp, color: "#0a84ff", label: "Thích" },
  { key: "haha", Icon: Laugh, color: "#ffd60a", label: "Haha" },
  { key: "sad", Icon: Frown, color: "#64d2ff", label: "Buồn" },
  { key: "angry", Icon: Angry, color: "#ff453a", label: "Phẫn nộ" },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]["key"];

const ActionBtn = ({
  onClick, title, children,
}: {
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
}) => (
  <button
    title={title}
    onClick={onClick}
    className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-zinc-400
      hover:text-blue-500 hover:bg-blue-50 transition-colors duration-100 cursor-pointer border-none outline-none bg-transparent"
  >
    {children}
  </button>
);

const ReactionPicker = ({
  onReact,
  onClose,
  anchorRef,
}: {
  onReact: (key: ReactionKey) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) => {
  const [hover, setHover] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const rect = anchorRef.current?.getBoundingClientRect();
  if (!rect) return null;

  return (
    <div
      ref={pickerRef}
      style={{
        position: "fixed",
        top: rect.top - 60,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
    >
      <div
        className="
        bg-white border border-zinc-200
        rounded-full
        px-3 py-2
        flex items-end gap-1
        shadow-xl
        "
      >
        {REACTIONS.map(({ key, Icon, color }) => {
          const isHover = hover === key;

          return (
            <div
              key={key}
              onClick={() => {
                onReact(key);
                onClose();
              }}
              onMouseEnter={() => setHover(key)}
              onMouseLeave={() => setHover(null)}
              className="flex flex-col items-center cursor-pointer"
            >
              <div
                className="flex items-center justify-center rounded-full transition-all duration-150"
                style={{
                  width: isHover ? 36 : 28,
                  height: isHover ? 36 : 28,
                  transform: isHover ? "translateY(-6px)" : "none",
                }}
              >
                <Icon
                  size={isHover ? 22 : 18}
                  fill={key === "like" ? "none" : color}
                  strokeWidth={key === "like" ? 2 : 1.5}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MessageBubble = ({
  msg,
  currentUserId,
  onReply,
  onReact,
}: {
  msg: Message;
  currentUserId: string;
  onReply?: (msg: Message) => void;
  onReact?: (messageId: string, reactionKey: ReactionKey) => void;
}) => {
  const isMe = msg.senderId === currentUserId;
  const [hovered, setHovered] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const thumbRef = useRef<HTMLButtonElement>(null);
  const emojiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openEmoji = () => {
    if (emojiTimer.current) clearTimeout(emojiTimer.current);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowEmoji(true);
  };

  const closeEmoji = (ms = 180) => {
    if (emojiTimer.current) clearTimeout(emojiTimer.current);
    emojiTimer.current = setTimeout(() => setShowEmoji(false), ms);
  };

  const handleMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimer.current = setTimeout(() => {
      setHovered(false);
      closeEmoji(300);
    }, 100);
  };

  if (msg.isDeleted) {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400 text-[13px] italic">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
          Tin nhắn đã bị thu hồi
        </div>
      </div>
    );
  }

  const isMedia = msg.messageType === "IMAGE" || msg.messageType === "VIDEO";
  const hasReactions = !!(msg.reactions && msg.reactions.length > 0);

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} group`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative" style={{ maxWidth: "70%" }}>
        {msg.replyTo && (
          <div className={`
            mb-[3px] pl-3 py-[7px] pr-3 rounded-[14px] border-l-[3px]
            ${isMe ? "border-[#93c5fd] bg-[#bfdbfe]/40" : "border-[#0068ff] bg-[#dbeafe]/50"}
          `}>
            <ReplyPreview reply={msg.replyTo} isMe={isMe} currentUserId={currentUserId} />
          </div>
        )}

        <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <div className="relative">
            <div
              onDoubleClick={() => onReply?.(msg)}
              className={`
                ${isMedia ? "p-[3px]" : "py-[9px] px-[14px]"}
                ${isMe
                  ? "bg-[#d9eaff] border border-[#bfdbfe] rounded-tl-[18px] rounded-tr-[18px] rounded-bl-[18px] rounded-br-[5px]"
                  : "bg-white border border-zinc-200 rounded-tl-[5px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[18px]"
                }
                shadow-[0_1px_3px_rgba(0,0,0,0.07)]
                break-words cursor-default select-text
                text-[#111827] text-[14px] leading-[1.55]
                min-w-[44px]
              `}
              style={{ marginBottom: hasReactions ? 18 : 0 }}
            >
              {msg.messageType === "TEXT" && (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}

              {msg.messageType === "IMAGE" && msg.fileUrl && (
                <AntImage
                  src={msg.fileUrl}
                  className="rounded-[14px] block"
                  style={{ maxWidth: 255, maxHeight: 290, objectFit: "cover", display: "block" }}
                  preview={{ mask: <span className="text-xs">Xem ảnh</span> }}
                />
              )}

              {msg.messageType === "VIDEO" && msg.fileUrl && (
                <video
                  src={msg.fileUrl}
                  controls
                  poster={msg.thumbnailUrl ?? undefined}
                  className="rounded-[14px] block"
                  style={{ maxWidth: 255 }}
                />
              )}

              {msg.messageType === "FILE" && (
                <a
                  href={msg.fileUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 no-underline group/file"
                  style={{ minWidth: 190, maxWidth: 260 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-[42px] h-[42px] rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover/file:bg-blue-100 transition-colors">
                    <IconFile />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-[#111827] truncate m-0 group-hover/file:text-blue-600 transition-colors">
                      {msg.fileName ?? "Tệp đính kèm"}
                    </p>
                    {msg.fileSize != null && (
                      <p className="text-[11px] text-zinc-400 mt-0.5 m-0">{formatBytes(msg.fileSize)}</p>
                    )}
                  </div>
                </a>
              )}
            </div>

            {hasReactions && msg.reactions && (
              <div
                className={`absolute z-10 ${isMe ? "left-1.5" : "right-1.5"}`}
                style={{ bottom: -14 }}
              >
                <ReactionsDisplay reactions={msg.reactions} isMe={isMe} />
              </div>
            )}
          </div>

          <button
            ref={thumbRef}
            onMouseEnter={openEmoji}
            onMouseLeave={() => closeEmoji()}
            className={`
              w-[24px] h-[24px] rounded-full border flex items-center justify-center
              cursor-pointer bg-white outline-none shrink-0 self-end mb-1
              transition-all duration-150
              ${hovered || showEmoji
                ? "border-zinc-200 shadow-sm opacity-100 scale-100"
                : "border-transparent opacity-0 scale-90 pointer-events-none"
              }
            `}
          >
            <IconThumb active={false} />
          </button>
        </div>

        <div
          className={`flex items-center gap-1 mt-[4px] ${isMe ? "justify-end" : "justify-start"}`}
          style={{ paddingBottom: hasReactions ? 4 : 0 }}
        >
          <span className="text-[11px] text-zinc-400 leading-none">{formatTime(msg.createdAt)}</span>
          {isMe && <IconTick delivered={!!msg.isDelivered} />}
        </div>

        {showEmoji && (
          <div
            onMouseEnter={openEmoji}
            onMouseLeave={() => closeEmoji()}
          >
            <ReactionPicker
              anchorRef={thumbRef}
              onReact={(key) => {
                onReact?.(msg.id, key);
                setShowEmoji(false);
              }}
              onClose={() => setShowEmoji(false)}
            />
          </div>
        )}

        {hovered && (
          <div
            className={`
              absolute top-0 bottom-0 flex items-center pointer-events-auto
              ${isMe ? "right-[calc(100%+50px)]" : "left-[calc(100%+50px)]"}
            `}
          >
            <div
              className="flex flex-row items-center gap-0.5
                bg-white border border-zinc-200 rounded-2xl px-1.5 py-1
                shadow-[0_2px_16px_rgba(0,0,0,0.10)]"
              style={{ animation: "barFade .13s ease forwards" }}
            >
              <style>{`@keyframes barFade{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}`}</style>
              <ActionBtn title="Trích dẫn" onClick={() => onReply?.(msg)}><IconQuote /></ActionBtn>
              <ActionBtn title="Chuyển tiếp"><IconForward /></ActionBtn>
              <ActionBtn title="Xem thêm"><IconMore /></ActionBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
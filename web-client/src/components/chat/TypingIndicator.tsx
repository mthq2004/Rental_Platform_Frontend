"use client";

interface TypingIndicatorProps {
  participantName?: string;
  participantAvatar?: string;
}

export default function TypingIndicator({
  participantName = "Đối phương",
  participantAvatar,
}: TypingIndicatorProps) {
  return (
    <div className="flex items-end gap-2 px-1 py-1">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-medium text-gray-500 shrink-0 overflow-hidden">
        {participantAvatar ? (
          <img
            src={participantAvatar}
            alt={participantName}
            className="w-full h-full object-cover"
          />
        ) : (
          participantName.charAt(0)
        )}
      </div>

      {/* Typing bubble */}
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-1">
          <span
            className="w-[7px] h-[7px] rounded-full bg-gray-400 animate-typing-dot"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-[7px] h-[7px] rounded-full bg-gray-400 animate-typing-dot"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-[7px] h-[7px] rounded-full bg-gray-400 animate-typing-dot"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

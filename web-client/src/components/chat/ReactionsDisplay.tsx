"use client";

import { useState, useRef } from "react";
import { Heart, ThumbsUp, Laugh, Frown, Angry, type LucideIcon } from "lucide-react";
import { Message } from "@/types/message.type";

type Reaction = NonNullable<Message["reactions"]>[number];

/* ── Map key → meta (đồng bộ với MessageBubble + DB) ── */
const REACTION_META: Record<
    string,
    { label: string; color: string; Icon: LucideIcon; filled: boolean }
> = {
    love: { label: "Yêu thích", color: "#ff3b30", Icon: Heart, filled: true },
    like: { label: "Thích", color: "#0a84ff", Icon: ThumbsUp, filled: false },
    haha: { label: "Haha", color: "#ffd60a", Icon: Laugh, filled: true },
    sad: { label: "Buồn", color: "#64d2ff", Icon: Frown, filled: true },
    angry: { label: "Phẫn nộ", color: "#ff453a", Icon: Angry, filled: true },
};

const ReactionsDisplay = ({
    reactions,
    isMe,
}: {
    reactions: NonNullable<Message["reactions"]>;
    isMe: boolean;
}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    if (!reactions || reactions.length === 0) return null;

    const grouped = reactions.reduce<Record<string, { count: number; users: string[] }>>(
        (acc, r: Reaction) => {
            const key: string = (r as any).key ?? (r as any).emoji ?? "like";
            if (!acc[key]) acc[key] = { count: 0, users: [] };
            acc[key].count += 1;
            const name = (r as any).userName ?? (r as any).userId ?? null;
            if (name) acc[key].users.push(name);
            return acc;
        },
        {}
    );

    const entries = Object.entries(grouped);
    const total = reactions.length;

    const openTooltip = () => { if (tooltipTimer.current) clearTimeout(tooltipTimer.current); setShowTooltip(true); };
    const closeTooltip = () => { tooltipTimer.current = setTimeout(() => setShowTooltip(false), 160); };

    return (
        <div
            className={`flex items-center mt-[-6px] mb-1 z-10 relative ${isMe ? "justify-end pr-1" : "justify-start pl-1"
                }`}
        >
            <div className="relative" onMouseEnter={openTooltip} onMouseLeave={closeTooltip}>
                <div
                    className={`
            flex items-center gap-0.5
            bg-white border border-zinc-200 rounded-full
            px-[7px] py-[3px]
            shadow-[0_1px_4px_rgba(0,0,0,0.10)]
            cursor-pointer
            hover:border-blue-300 hover:shadow-[0_2px_8px_rgba(0,104,255,0.13)]
            transition-all duration-150 select-none
          `}
                    style={{ minHeight: 22 }}
                >
                    <div className="flex items-center">
                        {entries.slice(0, 3).map(([key], i) => {
                            const meta = REACTION_META[key];
                            if (!meta) return null;
                            const { Icon, color, filled } = meta;

                            return (
                                <span
                                    key={key}
                                    className="inline-flex items-center justify-center"
                                    style={{
                                        marginLeft: i > 0 ? -2 : 0,
                                        filter: "drop-shadow(0 0 0.5px rgba(0,0,0,0.08))",
                                    }}
                                >
                                    <Icon
                                        size={13}
                                        fill={filled ? color : "none"}
                                        strokeWidth={filled ? 1.5 : 2}
                                    />
                                </span>
                            );
                        })}
                    </div>

                    {total > 1 && (
                        <span
                            className="text-[11px] font-semibold leading-none ml-[3px]"
                            style={{ color: "#52525b", letterSpacing: "-0.01em" }}
                        >
                            {total}
                        </span>
                    )}
                </div>

                {showTooltip && (
                    <div
                        className={`
              absolute z-[999] bottom-[calc(100%+8px)]
              ${isMe ? "right-0" : "left-0"}
              bg-[#1c1c1e] text-white rounded-2xl
              px-3 py-2.5 min-w-[140px] max-w-[220px]
              shadow-[0_8px_32px_rgba(0,0,0,0.22)]
              pointer-events-none
            `}
                        style={{ animation: "tooltipIn 0.15s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
                    >
                        <style>{`
              @keyframes tooltipIn {
                from { opacity: 0; transform: translateY(6px) scale(0.96); }
                to   { opacity: 1; transform: translateY(0)   scale(1);    }
              }
            `}</style>

                        <div className="flex flex-col gap-2">
                            {entries.map(([key, { count, users }]) => {
                                const meta = REACTION_META[key];
                                if (!meta) return null;
                                const { Icon, color, label, filled } = meta;
                                return (
                                    <div key={key} className="flex items-center gap-2">
                                        <span className="shrink-0 flex items-center justify-center w-5 h-5">
                                            <Icon
                                                size={17}
                                                fill={filled ? color : "none"}
                                                strokeWidth={filled ? 1.5 : 2}
                                            />
                                        </span>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[12px] font-semibold" style={{ color }}>
                                                    {label}
                                                </span>
                                                <span className="text-[11px] text-zinc-400 font-medium">{count}</span>
                                            </div>
                                            {users.length > 0 && (
                                                <p className="text-[11px] text-zinc-400 truncate m-0 mt-0.5">
                                                    {users.slice(0, 2).join(", ")}
                                                    {users.length > 2 ? ` +${users.length - 2}` : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div
                            className={`
                absolute -bottom-[5px]
                ${isMe ? "right-3" : "left-3"}
                rotate-45 w-2.5 h-2.5 bg-[#1c1c1e]
              `}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReactionsDisplay;
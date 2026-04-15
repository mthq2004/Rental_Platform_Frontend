"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCall } from "@/contexts/CallContext";
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX,
  Video, VideoOff, MessageCircle, Settings2,
  Minimize2, Maximize2, Signal, Clock, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  navy0: "#021B32",
  navy1: "#042C53",
  navy2: "#0C447C",
  navy3: "#185FA5",
  blue:  "#378ADD",
  blueLight: "#B5D4F4",
  orange: "#EA580C",
  orangeLight: "#FFF0E8",
  green: "#059669",
  red: "#C7202B",
  redLight: "#FEE2E2",
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray600: "#4B5563",
  gray800: "#1F2937",
  fontBase: '"Inter", "Segoe UI", Arial, sans-serif',
};

// ── Avatar ────────────────────────────────────────────────────────────────────
interface AvatarProps { name?: string; avatarUrl?: string | null | undefined; size: number; fontSize?: number; }

const Avatar: React.FC<AvatarProps> = ({ name, avatarUrl, size, fontSize }) => {
  const initials = name?.charAt(0)?.toUpperCase() ?? "U";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      background: `linear-gradient(145deg, ${T.navy3} 0%, ${T.navy1} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: `2.5px solid rgba(255,255,255,0.22)`,
      boxShadow: "0 8px 24px rgba(4,44,83,0.4)",
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name ?? "User"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ color: T.white, fontSize: fontSize ?? size * 0.38, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.01em" }}>{initials}</span>
      }
    </div>
  );
};

// ── NetworkIcon ───────────────────────────────────────────────────────────────
const networkQualityColor = (q: string) =>
  q === "good" ? T.green : q === "ok" ? "#D97706" : q === "poor" ? T.red : T.gray400;

const NetworkIcon = ({ quality }: { quality: string }) => (
  <Signal size={12} color={networkQualityColor(quality)} />
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function CallOverlay() {
  const {
    callState, localStream, remoteStream, callDurationSec,
    networkQuality, acceptCall, rejectCall, cancelCall, endCall,
  } = useCall();

  const localVideoRef  = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isMinimized, setIsMinimized]     = useState(false);
  const [isMicMuted, setIsMicMuted]       = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isVideoOff, setIsVideoOff]       = useState(false);
  const [isVideoSwapped, setIsVideoSwapped] = useState(false); // swap local ↔ remote như Zalo

  const [dragPos, setDragPos]     = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const audioRef       = useRef<AudioContext | null>(null);
  const oscillatorRef  = useRef<OscillatorNode | null>(null);
  const ringIntervalRef = useRef<number | null>(null);
  const htmlAudioRef   = useRef<HTMLAudioElement | null>(null);

  const isVisible       = callState.status !== "idle";
  const isVideo         = callState.callType === "VIDEO";
  const showRemoteVideo = isVideo && !!remoteStream;
  const showLocalVideo  = isVideo && !!localStream;

  // ── Derived labels ────────────────────────────────────────────────────────
  const formattedDuration = useMemo(() => {
    const m = Math.floor(callDurationSec / 60).toString().padStart(2, "0");
    const s = (callDurationSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [callDurationSec]);

  const statusLabel = useMemo(() => {
    if (callState.status === "incoming") return "Cuộc gọi đến";
    if (callState.status === "outgoing") return "Đang gọi đi...";
    if (callState.status === "active")   return "Đang trong cuộc gọi";
    return "Cuộc gọi";
  }, [callState.status]);

  const qualityLabel = useMemo(() => {
    if (networkQuality === "good") return "Kết nối ổn định";
    if (networkQuality === "ok")   return "Kết nối trung bình";
    if (networkQuality === "poor") return "Tín hiệu yếu";
    return "Đang đo tín hiệu...";
  }, [networkQuality]);

  // ── Stream binding ────────────────────────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream, isVideoOff, isVideoSwapped, isMinimized, callState.status]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current && remoteStream)  remoteAudioRef.current.srcObject  = remoteStream;
  }, [remoteStream, isVideoSwapped, isMinimized, callState.status]);

  // ── Reset on idle ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState.status !== "idle") return;
    setIsMinimized(false); setIsMicMuted(false);
    setIsSpeakerMuted(false); setIsVideoOff(false); setIsVideoSwapped(false);
  }, [callState.status]);

  // ── Minimized init position ───────────────────────────────────────────────
  useEffect(() => {
    if (!isMinimized) return;
    if (dragPos.x || dragPos.y) return;
    setDragPos({ x: Math.max(24, window.innerWidth - 336), y: Math.max(24, window.innerHeight - 220) });
  }, [isMinimized, dragPos.x, dragPos.y]);

  // ── Drag ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => setDragPos({
      x: Math.max(12, Math.min(window.innerWidth - 308, e.clientX - dragOffsetRef.current.x)),
      y: Math.max(12, Math.min(window.innerHeight - 210, e.clientY - dragOffsetRef.current.y)),
    });
    const onUp = () => setIsDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [isDragging]);

  // ── Ringtone ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const shouldRing = callState.status === "incoming" || callState.status === "outgoing";
    if (!shouldRing) {
      htmlAudioRef.current?.pause();
      if (htmlAudioRef.current) htmlAudioRef.current.currentTime = 0;
      htmlAudioRef.current = null;
      oscillatorRef.current?.stop(); oscillatorRef.current = null;
      if (ringIntervalRef.current) window.clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
      audioRef.current?.close(); audioRef.current = null;
      return;
    }
    let cancelled = false;
    let ringAudio: HTMLAudioElement | null = null;
    const audio = new Audio("/sounds/zalo-call.mp3");
    ringAudio = audio; audio.loop = true; audio.volume = 0.5;
    audio.play().then(() => {
      if (cancelled) { audio.pause(); audio.currentTime = 0; return; }
      htmlAudioRef.current = audio;
    }).catch(() => {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.7);
      osc.connect(gain); gain.connect(ctx.destination); osc.start();
      ringIntervalRef.current = window.setInterval(() => {
        if (!audioRef.current) return;
        const now = audioRef.current.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + 0.7);
      }, 1300);
      audioRef.current = ctx; oscillatorRef.current = osc;
    });
    return () => {
      cancelled = true;
      ringAudio?.pause(); if (ringAudio) ringAudio.currentTime = 0;
      htmlAudioRef.current?.pause();
      if (htmlAudioRef.current) htmlAudioRef.current.currentTime = 0;
      htmlAudioRef.current = null;
      oscillatorRef.current?.stop(); oscillatorRef.current = null;
      if (ringIntervalRef.current) window.clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
      audioRef.current?.close(); audioRef.current = null;
    };
  }, [callState.status]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleMic = () => {
    const next = !isMicMuted;
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !next));
    setIsMicMuted(next);
  };
  const toggleSpeaker = () => {
    const next = !isSpeakerMuted;
    if (remoteVideoRef.current) { remoteVideoRef.current.muted = next; remoteVideoRef.current.volume = next ? 0 : 1; }
    if (remoteAudioRef.current) { remoteAudioRef.current.muted = next; remoteAudioRef.current.volume = next ? 0 : 1; }
    setIsSpeakerMuted(next);
  };
  const toggleVideo = () => {
    const next = !isVideoOff;
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !next));
    setIsVideoOff(next);
  };

  if (!isVisible) return null;

  // ── Minimized bubble ──────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      // Outer wrapper không dùng framer-motion transform để tránh xung đột với left/top
      <div
        style={{
          position: "fixed",
          left: dragPos.x,
          top: dragPos.y,
          zIndex: 2000,
          width: 308,
          fontFamily: T.fontBase,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{
            borderRadius: 18,
            background: T.white,
            boxShadow: "0 20px 60px rgba(4,44,83,0.2), 0 4px 12px rgba(4,44,83,0.1)",
            border: `1px solid ${T.gray200}`,
            overflow: "hidden",
          }}
        >
          {/* Drag strip */}
          <div
            onPointerDown={(e) => {
              setIsDragging(true);
              dragOffsetRef.current = { x: e.clientX - dragPos.x, y: e.clientY - dragPos.y };
            }}
            style={{
              height: 5, cursor: "grab", userSelect: "none",
              background: `linear-gradient(90deg, ${T.navy1} 0%, ${T.navy3} 50%, ${T.orange} 100%)`,
            }}
          />

          {/* Body */}
          <div style={{ padding: "12px 14px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Avatar name={callState.participant?.name} avatarUrl={callState.participant?.avatarUrl} size={46} />
              <span style={{
                position: "absolute", bottom: 0, right: 0,
                width: 13, height: 13, borderRadius: "50%",
                background: callState.status === "active" ? T.green : T.blue,
                border: `2px solid ${T.white}`,
                animation: "dotPulse 1.4s ease-in-out infinite",
              }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.gray800, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {callState.participant?.name ?? "Người dùng"}
              </p>
              <p style={{ fontSize: 11.5, color: T.gray400, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                {callState.status === "incoming" && <><span style={{ color: T.orange, fontWeight: 600 }}>●</span> Đang đổ chuông</>}
                {callState.status === "outgoing" && <><span style={{ color: T.blue }}>●</span> Đang kết nối...</>}
                {callState.status === "active"   && <><Clock size={11} color={T.green} /> {formattedDuration}</>}
              </p>
            </div>

            <button
              onClick={() => setIsMinimized(false)}
              style={{
                width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.gray200}`,
                background: T.gray50, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: T.gray600, flexShrink: 0,
              }}
              title="Mở rộng"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Actions */}
          <div style={{ padding: "10px 14px 14px", display: "flex", gap: 8 }}>
            {callState.status === "incoming" && (
              <>
                <MiniActionBtn onClick={rejectCall} bg={T.redLight} color={T.red} icon={<PhoneOff size={14} />} label="Từ chối" />
                <MiniActionBtn onClick={acceptCall} bg={T.navy1} color={T.white} icon={<Phone size={14} />} label="Chấp nhận" />
              </>
            )}
            {callState.status === "outgoing" && (
              <MiniActionBtn onClick={cancelCall} bg={T.redLight} color={T.red} icon={<PhoneOff size={14} />} label="Hủy cuộc gọi" />
            )}
            {callState.status === "active" && (
              <>
                {isVideo && (
                  <MiniActionBtn
                    onClick={toggleVideo}
                    bg={isVideoOff ? T.navy1 : T.gray100}
                    color={isVideoOff ? T.white : T.gray600}
                    icon={isVideoOff ? <Video size={13} /> : <VideoOff size={13} />}
                    label={isVideoOff ? "Bật camera" : "Tắt camera"}
                  />
                )}
                <MiniActionBtn onClick={endCall} bg={T.red} color={T.white} icon={<PhoneOff size={13} />} label="Kết thúc" />
              </>
            )}
          </div>

          <audio ref={remoteAudioRef} autoPlay />
          <style>{`@keyframes dotPulse{0%,100%{opacity:.45;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}`}</style>
        </motion.div>
      </div>
    );
  }

  // ── Full overlay ──────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        key="call-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        style={{
          position: "fixed", inset: 0, zIndex: 2000,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: T.fontBase,
          background: "rgba(2,20,40,0.78)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: "100%", maxWidth: 480,
            margin: "0 16px",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(2,20,40,0.55), 0 0 0 1px rgba(255,255,255,0.07)",
          }}
        >
          {/* ── HEADER ───────────────────────────────────────────────── */}
          <div style={{
            background: `linear-gradient(162deg, ${T.navy0} 0%, ${T.navy1} 45%, ${T.navy2} 100%)`,
            padding: "28px 28px 30px",
            display: "flex", flexDirection: "column", alignItems: "center",
            position: "relative", overflow: "hidden",
          }}>
            {/* Decorative blobs */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(55,138,221,0.07)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: `rgba(234,88,12,0.06)`, pointerEvents: "none" }} />
            {/* Subtle grid lines */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(181,212,244,0.05) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

            {/* Top controls bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
              {/* Status pill */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20, padding: "5px 12px",
                fontSize: 11.5, fontWeight: 600,
                color: "rgba(255,255,255,0.82)",
                letterSpacing: "0.04em",
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: callState.status === "active" ? T.green : T.blue,
                  boxShadow: callState.status === "active" ? `0 0 6px ${T.green}` : `0 0 6px ${T.blue}`,
                  animation: "dotPulse 1.4s ease-in-out infinite",
                  flexShrink: 0,
                }} />
                {statusLabel}
              </div>

              {/* Minimize button */}
              <button
                onClick={() => setIsMinimized(true)}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "rgba(255,255,255,0.65)",
                }}
                title="Thu nhỏ"
              >
                <Minimize2 size={15} />
              </button>
            </div>

            {/* Avatar area */}
            <div style={{ position: "relative", marginBottom: 20, marginTop: 16, zIndex: 1 }}>
              {(callState.status === "incoming" || callState.status === "outgoing") &&
                [0, 0.8, 1.6].map((delay, i) => (
                  <div key={i} style={{
                    position: "absolute",
                    inset: -(18 + i * 14),
                    borderRadius: "50%",
                    border: "1.5px solid rgba(181,212,244,0.22)",
                    animation: `ringPulse 2.6s ease-out ${delay}s infinite`,
                  }} />
                ))
              }
              <Avatar name={callState.participant?.name} avatarUrl={callState.participant?.avatarUrl} size={100} fontSize={38} />
              {/* Call type badge */}
              <div style={{
                position: "absolute", bottom: -2, right: -2,
                width: 28, height: 28, borderRadius: "50%",
                background: isVideo ? T.orange : T.navy3,
                border: `2.5px solid ${T.navy1}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isVideo ? <Video size={12} color={T.white} /> : <Phone size={11} color={T.white} />}
              </div>
            </div>

            {/* Name */}
            <p style={{ fontSize: 22, fontWeight: 800, color: T.white, margin: 0, letterSpacing: "-0.02em", zIndex: 1, position: "relative", textAlign: "center" }}>
              {callState.participant?.name ?? "Người dùng"}
            </p>

            {/* Duration row (active) */}
            {callState.status === "active" && (
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, zIndex: 1, position: "relative" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 20, padding: "6px 14px",
                }}>
                  <Clock size={13} color={T.blueLight} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.blueLight, fontVariantNumeric: "tabular-nums", letterSpacing: "0.03em" }}>
                    {formattedDuration}
                  </span>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 20, padding: "6px 12px",
                }}>
                  <NetworkIcon quality={networkQuality} />
                  <span style={{ fontSize: 12, color: "rgba(181,212,244,0.8)", fontWeight: 500 }}>{qualityLabel}</span>
                </div>
              </div>
            )}

            {/* Connecting animation (outgoing / incoming) */}
            {(callState.status === "outgoing" || callState.status === "incoming") && (
              <p style={{ marginTop: 12, fontSize: 12.5, color: "rgba(181,212,244,0.65)", zIndex: 1, position: "relative", fontWeight: 500 }}>
                {callState.status === "outgoing" ? "Đang chờ phản hồi..." : "Nhấn chấp nhận để kết nối"}
              </p>
            )}

            {/* ── LOCAL CAMERA PiP (video call – incoming / outgoing) ── */}
            {isVideo && (callState.status === "incoming" || callState.status === "outgoing") && (
              <div style={{
                position: "absolute", bottom: 14, right: 14, zIndex: 2,
                width: 120, height: 160, borderRadius: 14,
                overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
                background: T.navy0,
              }}>
                {localStream && !isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay muted playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    background: "linear-gradient(180deg, #0A1628 0%, #041B32 100%)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    {isVideoOff
                      ? <><VideoOff size={20} color="rgba(181,212,244,0.35)" /><span style={{ fontSize: 10, color: "rgba(181,212,244,0.35)" }}>Camera tắt</span></>
                      : <><Video size={20} color="rgba(181,212,244,0.25)" /><span style={{ fontSize: 10, color: "rgba(181,212,244,0.3)" }}>Đang mở...</span></>
                    }
                  </div>
                )}
                {/* Mic status indicator */}
                <div style={{
                  position: "absolute", bottom: 6, left: 6,
                  width: 24, height: 24, borderRadius: "50%",
                  background: isMicMuted ? "rgba(199,32,43,0.85)" : "rgba(0,0,0,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isMicMuted ? <MicOff size={11} color="#fff" /> : <Mic size={11} color="rgba(255,255,255,0.8)" />}
                </div>
                {/* Label */}
                <div style={{
                  position: "absolute", top: 6, left: 0, right: 0,
                  textAlign: "center",
                  fontSize: 9.5, fontWeight: 600, color: "rgba(255,255,255,0.6)",
                  textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                  letterSpacing: "0.03em",
                }}>Bạn</div>
              </div>
            )}
          </div>

          {/* ── AUDIO WAVEFORM (active voice) ─────────────────────────── */}
          {callState.status === "active" && !isVideo && (
            <div style={{
              background: T.navy1,
              borderTop: "1px solid rgba(255,255,255,0.05)",
              height: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 3.5,
            }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} style={{
                  width: 3.5, borderRadius: 2,
                  background: `linear-gradient(180deg, ${T.orange} 0%, ${T.blue} 100%)`,
                  opacity: 0.75,
                  animation: `waveAnim 1.15s ease-in-out ${(i * 0.065).toFixed(3)}s infinite`,
                }} />
              ))}
            </div>
          )}



          {/* ── VIDEO AREA (active video) ─────────────────────────────── */}
          {isVideo && callState.status === "active" && (
            <div style={{ position: "relative", background: T.navy0, height: 300 }}>
              {/* Main video (remote hoặc local tùy isVideoSwapped) */}
              <div style={{ width: "100%", height: "100%" }}>
                {isVideoSwapped ? (
                  // Hiển thị local to
                  localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay muted playsInline
                      style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                    />
                  ) : (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#041B32" }}>
                      <VideoOff size={28} color="rgba(181,212,244,0.3)" />
                      <span style={{ fontSize: 13, color: "rgba(181,212,244,0.4)" }}>Camera của bạn chưa khởi động</span>
                    </div>
                  )
                ) : (
                  // Hiển thị remote to
                  showRemoteVideo ? (
                    <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "#041B32" }}>
                      <VideoOff size={28} color="rgba(181,212,244,0.3)" />
                      <span style={{ fontSize: 13, color: "rgba(181,212,244,0.4)", fontWeight: 500 }}>Đang chờ video từ đối phương...</span>
                    </div>
                  )
                )}
              </div>

              {/* Label màn hình chính */}
              <div style={{
                position: "absolute", top: 10, left: 10,
                background: "rgba(0,0,0,0.42)", borderRadius: 8, padding: "4px 10px",
                fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 500,
              }}>
                {isVideoSwapped ? "Camera của bạn" : (callState.participant?.name ?? "Đối phương")}
              </div>

              {/* PiP – click để swap */}
              <div
                onClick={() => setIsVideoSwapped((v) => !v)}
                title="Nhấn để đổi chỗ"
                style={{
                  position: "absolute", bottom: 12, right: 12,
                  width: 112, height: 80, borderRadius: 12,
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.22)",
                  background: T.navy0,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.6)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.5)"; }}
              >
                {isVideoSwapped ? (
                  // PiP hiện remote
                  showRemoteVideo ? (
                    <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A1628" }}>
                      <VideoOff size={16} color="#4B5563" />
                    </div>
                  )
                ) : (
                  // PiP hiện local
                  showLocalVideo ? (
                    <video ref={localVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                  ) : (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "#0A1628" }}>
                      <VideoOff size={14} color="#4B5563" />
                      <span style={{ fontSize: 9.5, color: "#4B5563" }}>Camera</span>
                    </div>
                  )
                )}

                {/* Video tắt overlay cho PiP local */}
                {!isVideoSwapped && isVideoOff && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <VideoOff size={16} color="rgba(255,255,255,0.6)" />
                  </div>
                )}

                {/* Swap hint icon */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "rgba(0,0,0,0)", height: 28,
                  display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4,
                }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.02em" }}>NHẤN ĐỂ ĐỔI</span>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTION FOOTER ─────────────────────────────────────────── */}
          <div style={{
            background: T.white,
            borderTop: `1px solid ${T.gray100}`,
            padding: callState.status === "active" ? "18px 24px" : "24px 28px",
            display: "flex", alignItems: "center",
            justifyContent: callState.status === "active" ? "space-between" : "center",
            gap: 12,
          }}>
            {/* INCOMING */}
            {callState.status === "incoming" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
                {/* Media controls row */}
                {isVideo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                    <IconCtrlBtn onClick={toggleMic} active={isMicMuted} label={isMicMuted ? "Bật mic" : "Tắt mic"}>
                      {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    </IconCtrlBtn>
                    <IconCtrlBtn onClick={toggleVideo} active={isVideoOff} label={isVideoOff ? "Bật camera" : "Tắt camera"}>
                      {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                    </IconCtrlBtn>
                  </div>
                )}
                {/* Action row */}
                <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                  <PrimaryActionBtn onClick={rejectCall} bg={T.red} label="Từ chối">
                    <PhoneOff size={22} color={T.white} />
                  </PrimaryActionBtn>
                  <PrimaryActionBtn onClick={() => {}} bg={T.gray100} label="Nhắn tin" borderColor={T.gray200}>
                    <MessageCircle size={20} color={T.gray600} />
                  </PrimaryActionBtn>
                  <PrimaryActionBtn onClick={acceptCall} bg={T.navy2} label="Chấp nhận" glow>
                    <Phone size={22} color={T.white} />
                  </PrimaryActionBtn>
                </div>
              </div>
            )}

            {/* OUTGOING */}
            {callState.status === "outgoing" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
                {/* Media controls row */}
                {isVideo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                    <IconCtrlBtn onClick={toggleMic} active={isMicMuted} label={isMicMuted ? "Bật mic" : "Tắt mic"}>
                      {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    </IconCtrlBtn>
                    <IconCtrlBtn onClick={toggleVideo} active={isVideoOff} label={isVideoOff ? "Bật camera" : "Tắt camera"}>
                      {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                    </IconCtrlBtn>
                  </div>
                )}
                <PrimaryActionBtn onClick={cancelCall} bg={T.red} label="Hủy cuộc gọi">
                  <PhoneOff size={22} color={T.white} />
                </PrimaryActionBtn>
              </div>
            )}

            {/* ACTIVE */}
            {callState.status === "active" && (
              <>
                {/* Control buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <IconCtrlBtn onClick={toggleMic} active={isMicMuted} label={isMicMuted ? "Bật mic" : "Tắt mic"}>
                    {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </IconCtrlBtn>
                  <IconCtrlBtn onClick={toggleSpeaker} active={isSpeakerMuted} label={isSpeakerMuted ? "Bật loa" : "Tắt loa"}>
                    {isSpeakerMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </IconCtrlBtn>
                  {isVideo && (
                    <IconCtrlBtn onClick={toggleVideo} active={isVideoOff} label={isVideoOff ? "Bật camera" : "Tắt camera"}>
                      {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                    </IconCtrlBtn>
                  )}
                  <IconCtrlBtn onClick={() => {}} label="Cài đặt">
                    <Settings2 size={16} />
                  </IconCtrlBtn>
                </div>

                {/* End call button */}
                <button
                  onClick={endCall}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "0 20px", height: 44, borderRadius: 22,
                    background: T.red, border: "none",
                    color: T.white, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", letterSpacing: "0.02em",
                    boxShadow: `0 4px 16px rgba(199,32,43,0.35)`,
                    transition: "transform 0.1s, box-shadow 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 20px rgba(199,32,43,0.45)`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 16px rgba(199,32,43,0.35)`; }}
                >
                  <PhoneOff size={15} />
                  Kết thúc
                </button>
              </>
            )}
          </div>
        </motion.div>

        <audio ref={remoteAudioRef} autoPlay />

        <style>{`
          @keyframes ringPulse {
            0%   { transform: scale(0.86); opacity: 0.75; }
            55%  { transform: scale(1.02); opacity: 0.22; }
            100% { transform: scale(1.10); opacity: 0; }
          }
          @keyframes dotPulse {
            0%, 100% { opacity: 0.45; transform: scale(0.82); }
            50%       { opacity: 1;    transform: scale(1.15); }
          }
          @keyframes waveAnim {
            0%, 100% { height: 6px;  opacity: 0.25; }
            50%       { height: 34px; opacity: 1; }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface MiniActionBtnProps {
  onClick: () => void;
  bg: string; color: string;
  icon: React.ReactNode; label: string;
}
function MiniActionBtn({ onClick, bg, color, icon, label }: MiniActionBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "9px 0", borderRadius: 11, background: bg, border: "none",
        color, fontSize: 12, fontWeight: 700, cursor: "pointer",
        transition: "filter 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.93)")}
      onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
    >
      {icon}
      {label}
    </button>
  );
}

interface PrimaryActionBtnProps {
  onClick: () => void;
  bg: string; label: string;
  borderColor?: string; glow?: boolean;
  children: React.ReactNode;
}
function PrimaryActionBtn({ onClick, bg, label, borderColor, glow, children }: PrimaryActionBtnProps) {
  return (
    <button onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <div
        style={{
          width: 64, height: 64, borderRadius: "50%",
          background: bg,
          border: borderColor ? `1.5px solid ${borderColor}` : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: glow ? `0 4px 20px ${T.navy2}55` : "0 2px 8px rgba(0,0,0,0.12)",
          transition: "transform 0.12s, box-shadow 0.12s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.07)"; (e.currentTarget as HTMLDivElement).style.boxShadow = glow ? `0 8px 28px ${T.navy2}77` : "0 4px 14px rgba(0,0,0,0.18)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; (e.currentTarget as HTMLDivElement).style.boxShadow = glow ? `0 4px 20px ${T.navy2}55` : "0 2px 8px rgba(0,0,0,0.12)"; }}
      >
        {children}
      </div>
      <span style={{ fontSize: 11.5, color: T.gray600, fontWeight: 600, letterSpacing: "0.01em" }}>{label}</span>
    </button>
  );
}

interface IconCtrlBtnProps {
  onClick: () => void;
  active?: boolean; label?: string;
  children: React.ReactNode;
}
function IconCtrlBtn({ onClick, active, label, children }: IconCtrlBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 42, height: 42, borderRadius: 12,
        background: active ? "#EFF6FF" : T.gray50,
        border: `1px solid ${active ? T.blue + "55" : T.gray200}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: active ? T.navy3 : T.gray600,
        transition: "background 0.12s, border-color 0.12s, transform 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = active ? "#DBEAFE" : T.gray100; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = active ? "#EFF6FF" : T.gray50; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {children}
    </button>
  );
}
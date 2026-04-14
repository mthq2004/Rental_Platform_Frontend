"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "antd";
import {
  PhoneOutlined,
  VideoCameraOutlined,
  CloseCircleOutlined,
  PhoneFilled,
  ShrinkOutlined,
  BorderOutlined,
  PauseCircleOutlined,
  AudioOutlined,
  SoundOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useCall } from "@/contexts/CallContext";

export default function CallOverlay() {
  const {
    callState,
    localStream,
    remoteStream,
    callDurationSec,
    networkQuality,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const ringIntervalRef = useRef<number | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const isVisible = callState.status !== "idle";
  const isVideo = callState.callType === "VIDEO";
  const showRemoteVideo = isVideo && !!remoteStream;
  const showLocalVideo = isVideo && !!localStream;
  const showRemotePlaceholder = isVideo && !showRemoteVideo;
  const title = useMemo(() => {
    if (callState.status === "incoming") return "Cuộc gọi đến";
    if (callState.status === "outgoing") return "Đang gọi";
    if (callState.status === "active") return "Đang nói chuyện";
    return "Cuộc gọi";
  }, [callState.status]);

  const formattedDuration = useMemo(() => {
    const minutes = Math.floor(callDurationSec / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (callDurationSec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [callDurationSec]);

  const qualityLabel = useMemo(() => {
    if (networkQuality === "good") return "Tốt";
    if (networkQuality === "ok") return "Ổn định";
    if (networkQuality === "poor") return "Yếu";
    return "Đang đo";
  }, [networkQuality]);

  useEffect(() => {
    if (!isMinimized) return;
    if (dragPos.x || dragPos.y) return;
    const initialX = Math.max(24, window.innerWidth - 320);
    const initialY = Math.max(24, window.innerHeight - 220);
    setDragPos({ x: initialX, y: initialY });
  }, [isMinimized, dragPos.x, dragPos.y]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (callState.status !== "idle") return;
    setIsMinimized(false);
    setIsMicMuted(false);
    setIsSpeakerMuted(false);
    setIsVideoOff(false);
  }, [callState.status]);

  const toggleMic = () => {
    const nextMuted = !isMicMuted;
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMicMuted(nextMuted);
  };

  const toggleSpeaker = () => {
    const nextMuted = !isSpeakerMuted;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = nextMuted;
      remoteVideoRef.current.volume = nextMuted ? 0 : 1;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = nextMuted;
      remoteAudioRef.current.volume = nextMuted ? 0 : 1;
    }
    setIsSpeakerMuted(nextMuted);
  };

  const toggleVideo = () => {
    const nextOff = !isVideoOff;
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = !nextOff;
    });
    setIsVideoOff(nextOff);
  };

  useEffect(() => {
    const shouldRing = callState.status === "incoming" || callState.status === "outgoing";
    if (!shouldRing) {
      htmlAudioRef.current?.pause();
      if (htmlAudioRef.current) {
        htmlAudioRef.current.currentTime = 0;
      }
      htmlAudioRef.current = null;
      oscillatorRef.current?.stop();
      oscillatorRef.current = null;
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      audioRef.current?.close();
      audioRef.current = null;
      return;
    }

    let isCancelled = false;
    let ringAudio: HTMLAudioElement | null = null;
    const audio = new Audio("/sounds/zalo-call.mp3");
    ringAudio = audio;
    audio.loop = true;
    audio.volume = 0.5;
    audio
      .play()
      .then(() => {
        if (isCancelled) {
          audio.pause();
          audio.currentTime = 0;
          return;
        }
        htmlAudioRef.current = audio;
      })
      .catch(() => {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        gain.gain.setValueAtTime(0.0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        ringIntervalRef.current = window.setInterval(() => {
          if (!audioRef.current || !oscillatorRef.current) return;
          const now = audioRef.current.currentTime;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(0.0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
          gain.gain.linearRampToValueAtTime(0.0, now + 0.7);
        }, 1300);

        audioRef.current = ctx;
        oscillatorRef.current = osc;

        return undefined;
      });

    return () => {
      isCancelled = true;
      if (ringAudio) {
        ringAudio.pause();
        ringAudio.currentTime = 0;
      }
      htmlAudioRef.current?.pause();
      if (htmlAudioRef.current) {
        htmlAudioRef.current.currentTime = 0;
      }
      htmlAudioRef.current = null;
      oscillatorRef.current?.stop();
      oscillatorRef.current = null;
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      audioRef.current?.close();
      audioRef.current = null;
    };
  }, [callState.status]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (event: PointerEvent) => {
      setDragPos({
        x: Math.max(12, Math.min(window.innerWidth - 280, event.clientX - dragOffsetRef.current.x)),
        y: Math.max(12, Math.min(window.innerHeight - 220, event.clientY - dragOffsetRef.current.y)),
      });
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging]);

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div
        className="fixed z-[1000] w-[260px] overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-4 text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur"
        style={{ transform: `translate(${dragPos.x}px, ${dragPos.y}px)` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cuộc gọi phong cách Zalo</p>
            <p className="text-base font-semibold">
              {callState.participant?.name || "Người dùng"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="text"
              icon={<BorderOutlined />}
              onClick={() => setIsMinimized(false)}
              className="text-slate-500 hover:!text-slate-700"
            />
            <Button
              type="text"
              icon={<PauseCircleOutlined />}
              onPointerDown={(event) => {
                setIsDragging(true);
                dragOffsetRef.current = {
                  x: event.clientX - dragPos.x,
                  y: event.clientY - dragPos.y,
                };
              }}
              className="text-slate-500 hover:!text-slate-700"
            />
          </div>
        </div>
        {isVideo && (
          <div className="mt-3 h-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <p className="mt-2 text-sm text-slate-500">
          {callState.status === "incoming" && "Đang đổ chuông"}
          {callState.status === "outgoing" && "Đang kết nối"}
          {callState.status === "active" && "Đang nói chuyện"}
        </p>
        {callState.status === "active" && (
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{formattedDuration}</span>
            <span>{qualityLabel}</span>
          </div>
        )}
        <div className="mt-4 flex items-center gap-2">
          {callState.status === "incoming" && (
            <>
              <Button danger onClick={rejectCall} className="rounded-full px-3">
                Từ chối
              </Button>
              <Button
                type="primary"
                onClick={acceptCall}
                className="rounded-full bg-[#1a73e8] text-white hover:!bg-[#1664c7]"
              >
                Chấp nhận
              </Button>
            </>
          )}
          {callState.status === "outgoing" && (
            <Button danger onClick={cancelCall} className="rounded-full px-3">
              Hủy
            </Button>
          )}
          {callState.status === "active" && (
            <Button danger onClick={endCall} className="rounded-full px-3">
              Kết thúc
            </Button>
          )}
        </div>
        <audio ref={remoteAudioRef} autoPlay />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ fontFamily: '"Manrope", "Segoe UI", sans-serif' }}
    >
      <div className="absolute inset-0 bg-white/85" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#eef2ff_45%,#ffffff_100%)]" />

      <div className="relative mx-4 w-full max-w-[980px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4 text-slate-900">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Cuộc gọi phong cách Zalo</p>
            <h2 className="mt-1 text-xl font-semibold">
              {callState.participant?.name || "Người dùng"}
            </h2>
            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">{title}</span>
              {callState.status === "active" && (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-[#1a73e8]">
                  {formattedDuration}
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2 py-1">{qualityLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Button
              type="text"
              icon={<ShrinkOutlined />}
              onClick={() => setIsMinimized(true)}
              className="text-slate-500 hover:!text-slate-800"
            />
          </div>
        </div>

        <div className="relative bg-slate-50">
          {isVideo ? (
            <div className="relative h-[520px]">
              {showRemoteVideo ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 via-white to-cyan-100">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white shadow">
                      {callState.participant?.avatarUrl ? (
                        <img
                          src={callState.participant.avatarUrl}
                          alt={callState.participant?.name || "Nguoi dung"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-semibold text-slate-700">
                          {callState.participant?.name?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                    <div className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow">
                      Đang chờ bắt máy...
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute left-5 top-4 rounded-md bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm">
                {callState.status === "active" ? formattedDuration : "Đang chờ bắt máy"}
              </div>
              <div className="absolute right-5 top-4 rounded-md bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm">
                {qualityLabel}
              </div>
              <div className="absolute right-6 bottom-6 h-36 w-48 overflow-hidden rounded-xl border border-white bg-slate-900/10 shadow-lg">
                {showLocalVideo ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/90 text-xs text-slate-600">
                    Đang mở camera...
                  </div>
                )}
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-xs uppercase tracking-[0.2em] text-white">
                    Camera đã tắt
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-[520px] flex-col items-center justify-center gap-6 text-slate-900">
              <div className="relative h-32 w-32">
                <div className="call-ring absolute inset-0 rounded-full border border-blue-300/60" />
                <div className="call-ring call-ring-delay absolute inset-0 rounded-full border border-blue-300/40" />
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 p-[3px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-3xl font-semibold text-slate-900">
                    {callState.participant?.name?.charAt(0) || "U"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-blue-600/70">
                <span className="call-bars" />
                <span className="call-bars delay-1" />
                <span className="call-bars delay-2" />
                <span className="call-bars delay-3" />
              </div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Cuộc gọi thoại</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-white px-6 py-4 text-slate-900">
          <div className="flex items-center gap-3 text-slate-500">
            <Button
              type={isMicMuted ? "default" : "text"}
              icon={<AudioOutlined />}
              onClick={toggleMic}
              className={isMicMuted ? "border border-slate-200 text-slate-800" : "text-slate-500 hover:!text-slate-800"}
            />
            <Button
              type={isSpeakerMuted ? "default" : "text"}
              icon={<SoundOutlined />}
              onClick={toggleSpeaker}
              className={isSpeakerMuted ? "border border-slate-200 text-slate-800" : "text-slate-500 hover:!text-slate-800"}
            />
            <Button
              type={isVideoOff ? "default" : "text"}
              icon={<VideoCameraOutlined />}
              onClick={toggleVideo}
              disabled={!isVideo}
              className={
                isVideo
                  ? isVideoOff
                    ? "border border-slate-200 text-slate-800"
                    : "text-slate-500 hover:!text-slate-800"
                  : "text-slate-300"
              }
            />
            <Button type="text" icon={<SettingOutlined />} className="text-slate-500 hover:!text-slate-800" />
          </div>
          <div className="flex items-center gap-3">
            {callState.status === "incoming" && (
              <>
                <Button danger onClick={rejectCall} icon={<CloseCircleOutlined />} className="rounded-full px-5">
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  onClick={acceptCall}
                  icon={<PhoneFilled />}
                  className="rounded-full bg-[#1a73e8] text-white hover:!bg-[#1664c7]"
                >
                  Chấp nhận
                </Button>
              </>
            )}
            {callState.status === "outgoing" && (
              <Button danger onClick={cancelCall} icon={<CloseCircleOutlined />} className="rounded-full px-5">
                Hủy cuộc gọi
              </Button>
            )}
            {callState.status === "active" && (
              <Button danger onClick={endCall} icon={<CloseCircleOutlined />} className="rounded-full px-5">
                Kết thúc
              </Button>
            )}
          </div>
        </div>
      </div>

      <audio ref={remoteAudioRef} autoPlay />

      <style jsx>{`
        .call-ring {
          animation: callPulse 2.6s ease-in-out infinite;
        }
        .call-ring-delay {
          animation-delay: 1.2s;
        }
        .call-bars {
          width: 6px;
          height: 28px;
          background: linear-gradient(180deg, #1a73e8, #38bdf8);
          border-radius: 999px;
          animation: callBars 1.2s ease-in-out infinite;
        }
        .call-bars.delay-1 {
          animation-delay: 0.15s;
        }
        .call-bars.delay-2 {
          animation-delay: 0.3s;
        }
        .call-bars.delay-3 {
          animation-delay: 0.45s;
        }
        @keyframes callPulse {
          0% {
            transform: scale(0.9);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
        @keyframes callBars {
          0%,
          100% {
            transform: scaleY(0.6);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

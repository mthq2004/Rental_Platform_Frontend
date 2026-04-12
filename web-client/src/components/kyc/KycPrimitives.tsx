"use client";

import Image from "next/image";
import { AlertTriangle, Camera, CheckCircle2, ImageUp, Shield, Upload, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BRAND } from "./constants";

export function ActionButton({
  text,
  onClick,
  primary,
  icon,
  disabled,
}: {
  text: string;
  onClick: () => void;
  primary?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition md:text-base"
      style={{
        background: disabled ? "#CBD5E1" : primary ? BRAND.primary : "#E9EEF7",
        color: disabled ? "#64748B" : primary ? "#FFFFFF" : BRAND.text,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {icon}
      {text}
    </button>
  );
}

export function BottomActionBar({ onPrimary }: { onPrimary: () => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white/95 p-3 backdrop-blur md:hidden">
      <button
        type="button"
        onClick={onPrimary}
        className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white"
        style={{ background: BRAND.primary }}
      >
        Về trang chủ
      </button>
    </div>
  );
}

export function Field({
  label,
  placeholder,
  icon,
  suffix,
}: {
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold" style={{ color: BRAND.text }}>
        {label}
      </span>
      <div className="flex h-12 items-center justify-between rounded-xl border px-3" style={{ borderColor: BRAND.border, background: "#F7F9FC" }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: BRAND.muted }}>
          <span style={{ color: BRAND.primary }}>{icon}</span>
          <span>{placeholder}</span>
        </div>
        {suffix ? <span className="text-xs font-semibold" style={{ color: BRAND.primary }}>{suffix}</span> : null}
      </div>
    </label>
  );
}

export function UploadCard({
  label,
  imageUrl,
  onCaptureFile,
}: {
  label: string;
  imageUrl?: string;
  onCaptureFile: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOpen(false);
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Trình duyệt không hỗ trợ camera.");
      setIsCameraOpen(true);
      return;
    }
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      requestAnimationFrame(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      });
    } catch {
      setCameraError("Vui lòng cấp quyền camera.");
      setIsCameraOpen(true);
    }
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
          onCaptureFile(file);
          stopCamera();
        }
      }, "image/jpeg", 0.92);
    }
  };

  return (
    <div>
      <p className="mb-2 text-sm font-semibold" style={{ color: BRAND.text }}>{label}</p>
      <div className="rounded-2xl border border-dashed p-3 transition-colors hover:bg-slate-50" style={{ borderColor: BRAND.border, background: "#F7FAFF" }}>
        <div className="relative h-44 w-full overflow-hidden rounded-xl border bg-[#F2F6FC]" style={{ borderColor: BRAND.border }}>
          {imageUrl ? (
            <Image src={imageUrl} alt={label} fill unoptimized className="object-contain p-1" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <Camera className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-xs font-medium">Yêu cầu chụp ảnh trực tiếp</p>
            </div>
          )}
        </div>

        {/* Thiết kế lại nút Chụp ảnh to và rõ ràng */}
        <button
          type="button"
          onClick={openCamera}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98]"
          style={{ background: BRAND.primary }}
        >
          <Camera className="h-5 w-5" />
          Mở máy ảnh
        </button>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold" style={{ color: BRAND.text }}>Chụp ảnh xác thực</span>
              <button onClick={stopCamera} className="rounded-full bg-slate-100 p-2"><X className="h-5 w-5" /></button>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-black border-4 border-slate-100">
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            </div>
            {cameraError && <p className="mt-3 text-center text-sm font-medium text-red-500">{cameraError}</p>}
            <div className="mt-5 flex gap-3">
              <button onClick={stopCamera} className="flex-1 rounded-xl border py-3 font-semibold" style={{ borderColor: BRAND.border }}>Hủy</button>
              <button onClick={captureFromCamera} className="flex-[2] rounded-xl py-3 font-bold text-white" style={{ background: BRAND.primary }}>Chụp ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Hint({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm" style={{ color: BRAND.text }}>
      {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
      <span>{text}</span>
    </div>
  );
}

export function Guide({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: "#F8FAFE", borderColor: BRAND.border }}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg p-2" style={{ background: "#EAF1FF", color: BRAND.primary }}>{icon}</div>
        <div>
          <p className="font-semibold" style={{ color: BRAND.text }}>{title}</p>
          <p className="mt-1 text-sm" style={{ color: BRAND.muted }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

export function Tag({
  icon,
  text,
  color,
  bg,
}: {
  icon: React.ReactNode;
  text: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold" style={{ color, background: bg }}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

export function ReadOnlyCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7E8AA0" }}>{label}</p>
      <p className="mt-1 text-lg font-bold" style={{ color: BRAND.text }}>{value}</p>
    </div>
  );
}

export function PreviewBox({ title, imageUrl }: { title: string; imageUrl?: string }) {
  return (
    <div className="relative h-44 overflow-hidden rounded-2xl border bg-slate-50 md:h-52" style={{ borderColor: BRAND.border }}>
      {imageUrl ? (
        <Image src={imageUrl} alt={title} fill unoptimized className="object-contain p-1" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm font-semibold" style={{ color: BRAND.muted }}>{title}</p>
        </div>
      )}
    </div>
  );
}

export function StatusItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
      <div className="flex items-center gap-2" style={{ color: BRAND.text }}>
        <Shield className="h-4 w-4" style={{ color: BRAND.primary }} />
        <span className="text-sm">{title}</span>
      </div>
      <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: BRAND.primarySoft, color: BRAND.primary }}>
        {value}
      </span>
    </div>
  );
}
export function KycErrorModal({
  onClose,
  onRetry,
  onSendToAdmin,
}: {
  onClose: () => void;
  onRetry: () => void;
  onSendToAdmin: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all animate-in fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex h-32 items-center justify-center bg-red-50">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-9 w-9" />
          </div>
        </div>
        
        <div className="p-8 text-center">
          <h3 className="text-2xl font-extrabold" style={{ color: BRAND.text }}>Xác thực thất bại</h3>
          <p className="mt-4 text-sm leading-6" style={{ color: BRAND.muted }}>
            Hệ thống nhận diện FPT không thể xác minh thông tin của bạn. Ảnh có thể bị mờ, lóa hoặc không khớp. Vui lòng thử lại hoặc gửi yêu cầu xác thực thủ công.
          </p>
          
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="w-full rounded-2xl px-5 py-4 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 shadow-md shadow-blue-200"
              style={{ background: BRAND.primary }}
            >
              Kiểm tra & Thử lại
            </button>
            <button
              onClick={onSendToAdmin}
              className="w-full rounded-2xl border px-5 py-4 text-sm font-bold transition hover:bg-slate-50 active:scale-95"
              style={{ borderColor: BRAND.border, color: BRAND.text }}
            >
              Gửi quản trị viên (Chờ xác thực)
            </button>
            <button
              onClick={onClose}
              className="mt-4 text-xs font-semibold text-slate-400 underline underline-offset-4 hover:text-slate-600"
            >
              Quay lại sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

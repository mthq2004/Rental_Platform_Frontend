import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  ImageUp,
  IdCard,
  Lock,
  Phone,
  Shield,
  Sparkles,
  User,
  UserCircle2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BRAND } from "./constants";
import { Field, Guide, Hint, PreviewBox, ReadOnlyCell, StatusItem, Tag, UploadCard } from "./KycPrimitives";
import { StepKey } from "./types";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";

export function StepOne() {

  const { user } = useAppSelector(state => state.auth)

  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm md:p-8" style={{ borderColor: BRAND.border }}>
      <h2 className="text-3xl font-extrabold" style={{ color: BRAND.text }}>
        Thông tin cá nhân
      </h2>
      <p className="mt-2 text-sm md:text-base" style={{ color: BRAND.muted }}>
        Vui lòng cung cấp các thông tin cơ bản để hệ thống định danh tài khoản của bạn.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Field label="Họ và tên" placeholder={user?.fullName || "Chưa có thông tin"} icon={<User className="h-4 w-4" />} />
        <Field label="Ngày sinh" placeholder={user?.dateOfBirth || "Chưa có thông tin"} icon={<IdCard className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[140px_1fr]">
        <Field label="Mã vùng" placeholder="+84" icon={<Phone className="h-4 w-4" />} />
        <Field label="Số điện thoại" placeholder={user?.phone || "Chưa có thông tin"} icon={<Phone className="h-4 w-4" />} />
      </div>

      <div className="mt-4">
        <Field label="Email" placeholder={user?.email || "Chưa có thông tin"} icon={<Lock className="h-4 w-4" />} suffix={user?.email ? "ĐÃ XÁC THỰC" : undefined} />
      </div>

      <div className="mt-6 rounded-2xl border px-4 py-3 text-xs md:text-sm" style={{ borderColor: "#DCE8FF", background: "#F6F9FF", color: BRAND.muted }}>
        <div className="flex items-start gap-2">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND.primary }} />
          <p>Thông tin được mã hóa và chỉ phục vụ xác thực chủ tài khoản theo chính sách bảo mật dữ liệu doanh nghiệp.</p>
        </div>
      </div>
    </section>
  );
}

// ... (các import giữ nguyên)

export function StepTwo({
  frontImage,
  backImage,
  // Đã bỏ onPickFront và onPickBack
  onCaptureFront,
  onCaptureBack,
}: {
  frontImage?: string;
  backImage?: string;
  onCaptureFront: (file: File) => void;
  onCaptureBack: (file: File) => void;
}) {
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm md:p-8 mb-6" style={{ borderColor: BRAND.border }}>
      <h2 className="text-3xl font-extrabold" style={{ color: BRAND.text }}>
        Chụp ảnh giấy tờ tùy thân
      </h2>
      <p className="mt-2 text-sm md:text-base" style={{ color: BRAND.muted }}>
        Chụp ảnh rõ nét hai mặt CCCD/CMND để hệ thống OCR xử lý trực tiếp.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {/* UploadCard bên dưới Primitives sẽ tự động chỉ hiện nút Camera nếu bạn đã sửa file KycPrimitives như mình hướng dẫn trước đó */}
        <UploadCard label="Mặt trước thẻ" imageUrl={frontImage} onCaptureFile={onCaptureFront} />
        <UploadCard label="Mặt sau thẻ" imageUrl={backImage} onCaptureFile={onCaptureBack} />
      </div>

      <div className="mt-4 rounded-2xl border px-4 py-3" style={{ background: "#F6F9FF", borderColor: "#DCE8FF" }}>
        <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
          Công nghệ nhận diện thông minh
        </p>
        <p className="mt-1 text-sm leading-5" style={{ color: BRAND.muted }}>
          Hệ thống yêu cầu chụp ảnh trực tiếp để đảm bảo tính xác thực cao nhất. Vui lòng đảm bảo ảnh đủ sáng, không lóa.
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border bg-slate-50 p-3" style={{ borderColor: BRAND.border }}>
          <p className="mb-2 text-base font-semibold" style={{ color: BRAND.text }}>
            Lưu ý khi chụp ảnh
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Hint ok text="Ảnh rõ nét, đủ sáng" />
            <Hint ok text="Hiển thị đủ 4 góc thẻ" />
            <Hint ok={false} text="Không lóa đèn flash" />
            <Hint ok={false} text="Không dùng ảnh chụp màn hình" />
          </div>
        </div>

        <div className="rounded-2xl p-3 text-white" style={{ background: `linear-gradient(155deg, ${BRAND.primary} 0%, #0A2E7A 100%)` }}>
          <p className="text-base font-semibold">Bảo mật dữ liệu</p>
          <p className="mt-1 text-sm text-blue-100">Dữ liệu chụp trực tiếp giúp rút ngắn thời gian thẩm định hồ sơ.</p>
        </div>
      </div>
    </section>
  );
}

export function StepThree({
  selfieImage,
  onCaptureSelfie,
}: {
  selfieImage?: string;
  onCaptureSelfie: (imageDataUrl: string) => void;
}) {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Trình duyệt chưa hỗ trợ camera.");
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOn(true);
    } catch {
      setCameraError("Không thể mở camera. Vui lòng cấp quyền.");
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onCaptureSelfie(dataUrl);
    stopCamera();
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <section className="grid gap-5 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-[1fr_1.2fr] md:p-8" style={{ borderColor: BRAND.border }}>
      <div>
        <h2 className="text-3xl font-extrabold" style={{ color: BRAND.text }}>
          Xác thực khuôn mặt
        </h2>
        <p className="mt-2 text-sm md:text-base" style={{ color: BRAND.muted }}>
          Hãy đặt khuôn mặt vào khung tròn và chụp ảnh trực tiếp để xác minh chính chủ.
        </p>

        <div className="mt-6 space-y-3">
          <Guide icon={<UserCircle2 className="h-5 w-5" />} title="Giữ ổn định thiết bị" desc="Đặt camera ngang tầm mắt, giữ khuôn mặt nằm giữa khung." />
          <Guide icon={<Camera className="h-5 w-5" />} title="Chụp trực tiếp" desc="Hệ thống không chấp nhận ảnh tải lên để đảm bảo an toàn." />
          <Guide icon={<Sparkles className="h-5 w-5" />} title="Đảm bảo ánh sáng" desc="Tránh ngược sáng để khuôn mặt rõ nét nhất." />
        </div>
      </div>

      <div className="rounded-3xl border p-3" style={{ background: BRAND.panel, borderColor: BRAND.border }}>
        <div className="relative h-[320px] overflow-hidden rounded-3xl border bg-slate-700 p-4 text-white md:h-[360px] xl:h-[400px]" style={{ borderColor: BRAND.border }}>
          <div className="flex items-center justify-between text-xs text-slate-200">
            <span className="rounded-full bg-black/35 px-2 py-1">Camera Live</span>
            {isCameraOn && <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-2 py-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Đang quét</span>}
          </div>

          <div className="absolute inset-x-6 bottom-16 top-16 rounded-[32px] border-2 border-dashed border-slate-400/50" />

          {selfieImage && !isCameraOn && (
            <div className="absolute inset-0">
              <Image src={selfieImage} alt="Selfie preview" fill unoptimized className="object-contain p-4" />
            </div>
          )}

          <video ref={videoRef} className={`absolute inset-0 h-full w-full object-cover ${isCameraOn ? "block" : "hidden"}`} muted playsInline />

          {!selfieImage && !isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                <p className="text-sm text-slate-200">Nhấn nút bên dưới để bắt đầu</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={isCameraOn ? stopCamera : startCamera}
            className="rounded-xl py-3 text-sm font-bold transition active:scale-95 border bg-white"
            style={{ borderColor: BRAND.border, color: BRAND.text }}
          >
            {isCameraOn ? "Tắt camera" : "Bật camera"}
          </button>

          <button
            type="button"
            onClick={isCameraOn ? captureFrame : startCamera}
            className="rounded-xl py-3 text-sm font-bold text-white shadow-lg transition active:scale-95"
            style={{ background: BRAND.primary }}
          >
            {isCameraOn ? "Chụp ảnh ngay" : "Mở & Chụp"}
          </button>
        </div>

        {cameraError && <p className="mt-3 text-center text-sm font-medium text-red-500">{cameraError}</p>}
      </div>
    </section>
  );
}

// ... (StepFour, Completion, StepContent giữ nguyên logic nhưng nhớ xóa các props onPick dư thừa)
export function StepFour({
  frontImage,
  backImage,
  selfieImage,
  kycData,
  onRetry,
  onSendToAdmin,
  isFailed,
}: {
  frontImage?: string;
  backImage?: string;
  selfieImage?: string;
  kycData?: any;
  onRetry?: () => void;
  onSendToAdmin?: () => void;
  isFailed?: boolean;
}) {
  const score = kycData?.score ?? kycData?.similarity ?? (kycData ? 0 : 0);
  const flags = Array.isArray(kycData?.flags) ? kycData.flags : [];

  const statusMap: Record<string, string> = {
    pending: "Chờ xác thực",
    in_review: "Đang thẩm định",
    verified: "Đã xác minh",
    rejected: "Bị từ chối",
    failed: "Xác thực thất bại",
    expired: "Hết hạn",
  };

  const status = statusMap[String(kycData?.status || "pending")] || "Chờ xác thực";
  const showFailureBlock = isFailed || kycData?.status === "failed";

  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm md:p-8 mb-6" style={{ borderColor: BRAND.border }}>
      <h2 className="text-3xl font-extrabold" style={{ color: BRAND.text }}>
        Kiểm tra thông tin
      </h2>
      <p className="mt-2 text-sm md:text-base" style={{ color: BRAND.muted }}>
        {showFailureBlock
          ? "Hệ thống không thể xác minh thông tin của bạn. Vui lòng kiểm tra lại hoặc gửi yêu cầu xác thực thủ công."
          : "Thông tin đã được hệ thống xác thực tự động. Vui lòng kiểm tra trước khi hoàn tất."}
      </p>

      {/* Failure alert banner */}
      {showFailureBlock && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-red-700">Xác thực thất bại</p>
              <p className="mt-1 text-sm leading-relaxed text-red-600">
                Hệ thống nhận diện FPT không thể xác minh thông tin của bạn. Ảnh có thể bị mờ, lóa hoặc không khớp.
              </p>
              {typeof score === "number" && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-700">Độ tin cậy:</span>
                  <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                    {Math.round(score)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 rounded-2xl px-5 py-3.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 shadow-md shadow-blue-200"
                style={{ background: BRAND.primary }}
              >
                Kiểm tra & Thử lại
              </button>
            )}
            {onSendToAdmin && (
              <button
                onClick={onSendToAdmin}
                className="flex-1 rounded-2xl border px-5 py-3.5 text-sm font-bold transition hover:bg-slate-50 active:scale-95"
                style={{ borderColor: BRAND.border, color: BRAND.text }}
              >
                Gửi quản trị viên (Chờ xác thực)
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Tag
          icon={showFailureBlock ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          text={showFailureBlock ? "Dữ liệu: Không hợp lệ" : kycData ? "Dữ liệu: Hợp lệ" : "Đang xử lý"}
          color={showFailureBlock ? "#DC2626" : "#1A9A54"}
          bg={showFailureBlock ? "#FEF2F2" : "#E8F8EF"}
        />
        <Tag
          icon={<BadgeCheck className="h-4 w-4" />}
          text={`Độ tin cậy: ${Math.round(score)}%`}
          color={showFailureBlock ? "#DC2626" : "#1E63F0"}
          bg={showFailureBlock ? "#FEF2F2" : "#EAF1FF"}
        />
        <Tag
          icon={<Shield className="h-4 w-4" />}
          text={`Trạng thái: ${status}`}
          color="#0A2E7A" bg="#F1F5F9"
        />
      </div>

      <div className="mt-6 rounded-2xl border p-4 md:p-5" style={{ borderColor: BRAND.border }}>
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#7E8AA0]">Thông tin trích xuất</p>
        <div className="grid gap-4 text-sm md:grid-cols-2 md:text-base">
          <ReadOnlyCell label="Họ và tên" value={kycData?.fullName || "—"} />
          <ReadOnlyCell label="Số định danh" value={kycData?.idNumber || "—"} />
          <ReadOnlyCell label="Ngày sinh" value={kycData?.dob || "—"} />
          <ReadOnlyCell label="Giới tính" value={kycData?.gender || "—"} />
        </div>

        {flags.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">Cảnh báo hệ thống</p>
            <p className="mt-1">{flags.join(", ")}</p>
          </div>
        )}

        {kycData?.status === "rejected" && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-semibold">Lý do từ chối</p>
            <p className="mt-1">{kycData?.rejectionReason || "Hồ sơ chưa đạt yêu cầu xác thực"}</p>
          </div>
        )}

        {kycData?.kycDocumentId && (
          <div className="mt-4 pt-4 border-t border-dashed">
            <p className="text-xs text-slate-400">ID Chứng từ: {kycData.kycDocumentId}</p>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <PreviewBox title="CCCD Mặt trước" imageUrl={frontImage} />
          <PreviewBox title="CCCD Mặt sau" imageUrl={backImage} />
          <PreviewBox title="Ảnh Selfie" imageUrl={selfieImage} />
        </div>
      </div>

      <p className="mt-5 text-center text-xs md:text-sm" style={{ color: BRAND.muted }}>
        Dữ liệu được mã hóa AES-256 và tuân thủ tiêu chuẩn bảo mật doanh nghiệp.
      </p>
    </section>
  );
}

export function Completion() {
  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border bg-white p-6 text-center shadow-sm md:p-10" style={{ borderColor: BRAND.border }}>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ background: BRAND.primarySoft }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: BRAND.primary }}>
          <Check className="h-8 w-8 text-white" />
        </div>
      </div>
      <h2 className="mt-6 text-4xl font-extrabold" style={{ color: BRAND.text }}>
        Xác thực thành công
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm md:text-base" style={{ color: BRAND.muted }}>
        Tài khoản đã hoàn tất quy trình kiểm tra bảo mật và sẵn sàng sử dụng trên toàn bộ nền tảng.
      </p>

      <div className="mx-auto mt-6 max-w-md space-y-3 rounded-2xl border p-4 text-left">
        <StatusItem title="Trạng thái tài khoản" value="Đã xác minh" />
        <StatusItem title="Hạn mức đăng tin" value="Không giới hạn" />
      </div>
    </section>
  );
}

export function PendingReview({ kycData }: { kycData?: any }) {
  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border bg-white p-6 text-center shadow-sm md:p-10" style={{ borderColor: BRAND.border }}>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "#FFF7ED" }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "#F97316" }}>
          <Clock className="h-8 w-8 text-white" />
        </div>
      </div>
      <h2 className="mt-6 text-3xl font-extrabold md:text-4xl" style={{ color: BRAND.text }}>
        Đang chờ quản trị viên xử lý
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm md:text-base" style={{ color: BRAND.muted }}>
        Hồ sơ xác thực của bạn đã được gửi đến quản trị viên để thẩm định thủ công. Bạn sẽ nhận được thông báo khi có kết quả.
      </p>

      <div className="mx-auto mt-6 max-w-md space-y-3 rounded-2xl border p-4 text-left" style={{ borderColor: BRAND.border }}>
        <StatusItem title="Trạng thái" value="Đang thẩm định" />
        <StatusItem title="Phương thức" value="Xác thực thủ công bởi Admin" />
        {kycData?.kycDocumentId && (
          <StatusItem title="Mã hồ sơ" value={kycData.kycDocumentId} />
        )}
      </div>

      <div className="mx-auto mt-5 max-w-md rounded-2xl border px-4 py-3 text-left text-xs md:text-sm" style={{ borderColor: "#FED7AA", background: "#FFF7ED", color: "#9A3412" }}>
        <div className="flex items-start gap-2">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#F97316" }} />
          <p>Vui lòng không gửi lại hồ sơ trong thời gian chờ. Quản trị viên sẽ xem xét và phản hồi trong thời gian sớm nhất.</p>
        </div>
      </div>
    </section>
  );
}

export function StepContent({
  step,
  done,
  frontImage,
  backImage,
  selfieImage,
  kycData,
  onPickFront,
  onCaptureFront,
  onPickBack,
  onCaptureBack,
  onCaptureSelfie,
  onPickSelfie,
  onRetry,
  onSendToAdmin,
  isFailed,
  pendingReview,
}: {
  step: StepKey;
  done: boolean;
  frontImage?: string;
  backImage?: string;
  selfieImage?: string;
  kycData?: any;
  onPickFront: (file: File) => void;
  onCaptureFront: (file: File) => void;
  onPickBack: (file: File) => void;
  onCaptureBack: (file: File) => void;
  onCaptureSelfie: (imageDataUrl: string) => void;
  onPickSelfie: (file: File) => void;
  onRetry?: () => void;
  onSendToAdmin?: () => void;
  isFailed?: boolean;
  pendingReview?: boolean;
}) {
  if (pendingReview) {
    return <PendingReview kycData={kycData} />;
  }

  if (done) {
    return <Completion />;
  }

  if (step === 1) {
    return <StepOne />;
  }

  if (step === 2) {
    return (
      <StepTwo
        frontImage={frontImage}
        backImage={backImage}
        onCaptureFront={onCaptureFront}
        onCaptureBack={onCaptureBack}
      />
    );
  }

  if (step === 3) {
    return <StepThree selfieImage={selfieImage} onCaptureSelfie={onCaptureSelfie}  />;
  }

  return <StepFour frontImage={frontImage} backImage={backImage} selfieImage={selfieImage} kycData={kycData} onRetry={onRetry} onSendToAdmin={onSendToAdmin} isFailed={isFailed} />;
}

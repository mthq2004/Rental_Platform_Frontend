import {
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  ImageUp,
  IdCard,
  Lock,
  Phone,
  Shield,
  Sparkles,
  User,
  UserCircle2,
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
        <Field label="Email" placeholder={user?.email || "Chưa có thông tin"} icon={<Lock className="h-4 w-4" />} suffix="ĐÃ XÁC THỰC" />
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

export function StepTwo({
  frontImage,
  backImage,
  onPickFront,
  onCaptureFront,
  onPickBack,
  onCaptureBack,
}: {
  frontImage?: string;
  backImage?: string;
  onPickFront: (file: File) => void;
  onCaptureFront: (file: File) => void;
  onPickBack: (file: File) => void;
  onCaptureBack: (file: File) => void;
}) {
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm md:p-8 mb-6" style={{ borderColor: BRAND.border }}>
      <h2 className="text-3xl font-extrabold" style={{ color: BRAND.text }}>
        Chụp ảnh giấy tờ tùy thân
      </h2>
      <p className="mt-2 text-sm md:text-base" style={{ color: BRAND.muted }}>
        Tải ảnh rõ nét hai mặt CCCD/CMND để hệ thống OCR xử lý tự động.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <UploadCard label="Mặt trước thẻ" imageUrl={frontImage} onPickFile={onPickFront} onCaptureFile={onCaptureFront} />
        <UploadCard label="Mặt sau thẻ" imageUrl={backImage} onPickFile={onPickBack} onCaptureFile={onCaptureBack} />
      </div>

      <div className="mt-4 rounded-2xl border px-4 py-3" style={{ background: "#F6F9FF", borderColor: "#DCE8FF" }}>
        <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
          Công nghệ nhận diện thông minh
        </p>
        <p className="mt-1 text-sm leading-5" style={{ color: BRAND.muted }}>
          Hệ thống dùng OCR để trích xuất thông tin tự động. Vui lòng đảm bảo ảnh đủ sáng, không lóa và đầy đủ 4 góc.
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
            <Hint ok={false} text="Không che mất thông tin" />
          </div>
        </div>

        <div className="rounded-2xl p-3 text-white" style={{ background: `linear-gradient(155deg, ${BRAND.primary} 0%, #0A2E7A 100%)` }}>
          <p className="text-base font-semibold">Bảo mật dữ liệu</p>
          <p className="mt-1 text-sm text-blue-100">Dữ liệu luôn được mã hóa AES-256 và dùng duy nhất cho định danh chủ tài khoản.</p>
        </div>
      </div>
    </section>
  );
}

export function StepThree({
  selfieImage,
  onCaptureSelfie,
  onPickSelfie,
}: {
  selfieImage?: string;
  onCaptureSelfie: (imageDataUrl: string) => void;
  onPickSelfie: (file: File) => void;
}) {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

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
      setCameraError("Trình duyệt chưa hỗ trợ camera hoặc đang chạy ở chế độ không an toàn.");
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
      setCameraError("Không thể mở camera. Vui lòng cấp quyền camera trên trình duyệt.");
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onCaptureSelfie(dataUrl);
    stopCamera();
  };

  const handlePickSelfie = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onPickSelfie(file);
      event.target.value = "";
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <section className="grid gap-5 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-[1fr_1.2fr] md:p-8" style={{ borderColor: BRAND.border }}>
      <div>
        <h2 className="text-3xl font-extrabold" style={{ color: BRAND.text }}>
          Xác thực khuôn mặt
        </h2>
        <p className="mt-2 text-sm md:text-base" style={{ color: BRAND.muted }}>
          Hãy đặt khuôn mặt vào khung tròn, đảm bảo đủ sáng và làm theo hướng dẫn chuyển động.
        </p>

        <div className="mt-6 space-y-3">
          <Guide icon={<UserCircle2 className="h-5 w-5" />} title="Giữ ổn định thiết bị" desc="Đặt camera ngang tầm mắt, giữ khuôn mặt nằm giữa khung." />
          <Guide icon={<Camera className="h-5 w-5" />} title="Làm theo yêu cầu" desc="Hệ thống có thể yêu cầu chớp mắt hoặc quay nhẹ theo hướng dẫn." />
          <Guide icon={<Sparkles className="h-5 w-5" />} title="Đảm bảo ánh sáng" desc="Tránh ngược sáng hoặc môi trường quá tối để tăng độ chính xác." />
        </div>
      </div>

      <div className="rounded-3xl border p-3" style={{ background: BRAND.panel, borderColor: BRAND.border }}>
        <div className="relative h-[320px] overflow-hidden rounded-3xl border bg-slate-700 p-4 text-white md:h-[360px] xl:h-[400px]" style={{ borderColor: BRAND.border }}>
          <div className="flex items-center justify-between text-xs text-slate-200">
            <span className="rounded-full bg-black/35 px-2 py-1">Hệ thống sẵn sàng</span>
            <span className="rounded-full bg-black/35 px-2 py-1">Khoảng cách: OK</span>
          </div>

          <div className="absolute inset-x-6 bottom-16 top-16 rounded-[32px] border-2 border-dashed border-slate-400/50" />

          {selfieImage && !isCameraOn ? (
            <div className="absolute inset-0">
              <Image src={selfieImage} alt="Selfie preview" fill unoptimized className="object-contain p-4" />
            </div>
          ) : null}

          <video ref={videoRef} className={`absolute inset-0 h-full w-full object-cover ${isCameraOn ? "block" : "hidden"}`} muted playsInline />

          {!selfieImage && !isCameraOn ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                  <ImageUp className="h-7 w-7" />
                </div>
                <p className="mt-2 text-sm text-slate-200">Bật camera để chụp ảnh selfie</p>
              </div>
            </div>
          ) : null}

          <div className="absolute bottom-6 left-1/2 w-[80%] -translate-x-1/2 rounded-2xl bg-white/15 p-4 text-center backdrop-blur-sm">
            <p className="text-lg font-semibold md:text-2xl">Giữ nguyên vị trí</p>
            <p className="text-xs text-slate-200 md:text-sm">Hệ thống đang quét khuôn mặt...</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={startCamera}
            className="rounded-lg px-3 py-2 text-sm font-medium text-white"
            style={{ background: BRAND.primary }}
          >
            Bật camera
          </button>

          <button
            type="button"
            onClick={() => {
              if (isCameraOn) {
                captureFrame();
                return;
              }
              startCamera();
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-white"
            style={{ background: "#0A2E7A" }}
          >
            {isCameraOn ? "Chụp ảnh" : "Mở & chụp"}
          </button>

          <button
            type="button"
            onClick={() => selfieInputRef.current?.click()}
            className="rounded-lg border px-3 py-2 text-sm font-medium"
            style={{ borderColor: BRAND.border, color: BRAND.text, background: "#FFFFFF" }}
          >
            Chọn ảnh có sẵn
          </button>
        </div>

        <input
          ref={selfieInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handlePickSelfie}
          className="hidden"
        />

        {cameraError ? (
          <p className="mt-2 text-sm" style={{ color: "#D14343" }}>
            {cameraError}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function StepFour({
  frontImage,
  backImage,
  selfieImage,
  kycData,
}: {
  frontImage?: string;
  backImage?: string;
  selfieImage?: string;
  kycData?: any;
}) {
  const score = kycData?.score ?? kycData?.similarity ?? (kycData ? 0 : 0);
  const flags = Array.isArray(kycData?.flags) ? kycData.flags : [];

  const statusMap: Record<string, string> = {
    pending: "Chờ xác thực",
    in_review: "Đang thẩm định",
    verified: "Đã xác minh",
    rejected: "Bị từ chối",
    expired: "Hết hạn",
  };

  const status = statusMap[String(kycData?.status || "pending")] || "Chờ xác thực";

  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm md:p-8 mb-6" style={{ borderColor: BRAND.border }}>
      <h2 className="text-3xl font-extrabold" style={{ color: BRAND.text }}>
        Kiểm tra thông tin
      </h2>
      <p className="mt-2 text-sm md:text-base" style={{ color: BRAND.muted }}>
        Thông tin đã được hệ thống xác thực tự động. Vui lòng kiểm tra trước khi hoàn tất.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Tag
          icon={<CheckCircle2 className="h-4 w-4" />}
          text={kycData ? "Dữ liệu: Hợp lệ" : "Đang xử lý"}
          color="#1A9A54" bg="#E8F8EF"
        />
        <Tag
          icon={<BadgeCheck className="h-4 w-4" />}
          text={`Độ tin cậy: ${Math.round(score)}%`}
          color="#1E63F0" bg="#EAF1FF"
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
          <ReadOnlyCell label="Họ và tên" value={kycData?.fullName || "Bùi Kim Nam"} />
          <ReadOnlyCell label="Số định danh" value={kycData?.idNumber || "031092004567"} />
          <ReadOnlyCell label="Ngày sinh" value={kycData?.dob || "15 / 08 / 1992"} />
          <ReadOnlyCell label="Giới tính" value={kycData?.gender || "Nam"} />
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
}) {
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
        onPickFront={onPickFront}
        onCaptureFront={onCaptureFront}
        onPickBack={onPickBack}
        onCaptureBack={onCaptureBack}
      />
    );
  }

  if (step === 3) {
    return <StepThree selfieImage={selfieImage} onCaptureSelfie={onCaptureSelfie} onPickSelfie={onPickSelfie} />;
  }

  return <StepFour frontImage={frontImage} backImage={backImage} selfieImage={selfieImage} kycData={kycData} />;
}

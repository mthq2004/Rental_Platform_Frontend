"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BRAND, STEP_LABELS } from "./constants";
import { ActionButton, BottomActionBar } from "./KycPrimitives";
import { StepContent } from "./KycSteps";
import { App, Modal, Spin } from "antd";
import { StepBadge, StepperDots } from "./KycStepper";
import { StepKey } from "./types";
import { useAppDispatch } from "@/stores/hooks";
import { verifyKyc, saveForAdmin, extractOcr, verifyFace } from "@/stores/slices/kyc.slice";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/stores/store";
import { getProfileUser } from "@/stores/slices/auth.slice";

type KycImages = {
  front?: string;
  back?: string;
  selfie?: string;
};

export default function KycFlowMock() {
  const { message, modal } = App.useApp();
  const [step, setStep] = useState<StepKey>(1);
  const [done, setDone] = useState(false);
  const [images, setImages] = useState<KycImages>({});
  const [files, setFiles] = useState<{ front?: File; back?: File; selfie?: File }>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [kycData, setKycData] = useState<any>(null);
  const [isFailed, setIsFailed] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);
  const imageRef = useRef<KycImages>({});

  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;

  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, isAuth } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuth && user?.kycStatus === "verified") {
      modal.success({
        title: "Tài khoản đã xác thực",
        content: "Tài khoản của bạn đã hoàn tất xác thực KYC. Bạn không cần thực hiện lại bước này.",
        okText: "Quay lại trang chủ",
        onOk: () => router.push("/home"),
        cancelText: "Đóng",
        okButtonProps: { style: { background: BRAND.primary } },
      });
    }
  }, [isAuth, user, router]);

  useEffect(() => {
    const oldBodyOverflow = document.body.style.overflow;
    const oldHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldBodyOverflow;
      document.documentElement.style.overflow = oldHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    imageRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      Object.values(imageRef.current).forEach((value) => {
        if (value?.startsWith("blob:")) {
          URL.revokeObjectURL(value);
        }
      });
    };
  }, []);

  const isStepFour = step === 4 && !done;

  const title = useMemo(() => {
    if (pendingReview) {
      return "Đang chờ xác thực";
    }
    if (done) {
      return "Hoàn tất xác thực";
    }
    return `KYC - ${STEP_LABELS[step - 1]}`;
  }, [done, step, pendingReview]);

  const goBack = () => {
    if (done) {
      setDone(false);
      setStep(4);
      return;
    }

    setStep((prev) => (prev > 1 ? ((prev - 1) as StepKey) : prev));
  };

  const goNext = async () => {
    // Stage 1 -> 2: No validation needed for now or basic check
    if (step === 1) {
      setStep(2);
      return;
    }

    // Stage 2 -> 3: Validate front and back images
    if (step === 2) {
      if (!files.front || !files.back) {
        message.warning("Vui lòng tải lên cả mặt trước và mặt sau thẻ.");
        return;
      }
      setStep(3);
      return;
    }

    // Stage 3 -> 4: Validate selfie, front, back cards & call extractOcr and verifyFace sequentially
    if (step === 3) {
      if (!files.selfie) {
        message.warning("Vui lòng chụp hoặc chọn ảnh khuôn mặt.");
        return;
      }
      if (!files.front || !files.back) {
        message.warning("Không tìm thấy ảnh hai mặt thẻ. Vui lòng quay lại bước 2.");
        return;
      }

      try {
        setIsVerifying(true);

        // 1. Call extractOcr first
        const ocrFormData = new FormData();
        ocrFormData.append("files", files.back, "back.jpg");
        ocrFormData.append("files", files.front, "front.jpg");

        const ocrAction = await dispatch(extractOcr(ocrFormData));

        if (extractOcr.fulfilled.match(ocrAction)) {
          const ocrResponse = ocrAction.payload;
          const kycId = ocrResponse?.kycDocumentId;

          if (!kycId) {
            message.error("Không thể tạo hồ sơ KYC từ giấy tờ.");
            return;
          }

          // 2. Call verifyFace with the retrieved kycId
          const faceAction = await dispatch(verifyFace({ selfie: files.selfie, kycId }));

          if (verifyFace.fulfilled.match(faceAction)) {
            const response = faceAction.payload;
            setKycData(response);
            setStep(4);

            if (response?.status === "verified") {
              setIsFailed(false);
              message.success("KYC đã được xác thực thành công");
            } else if (response?.status === "in_review") {
              setIsFailed(false);
              message.info("KYC đang được quản trị viên thẩm định");
            } else {
              setIsFailed(true);
              message.error(response?.rejectionReason || "Xác thực thất bại. Bạn có thể thử lại hoặc gửi quản trị viên.");
            }
            dispatch(getProfileUser());
          } else {
            setKycData({ status: "failed", score: 0 });
            setIsFailed(true);
            setStep(4);
            dispatch(getProfileUser());
          }
        } else {
          message.error(ocrAction.error?.message || "Không thể nhận diện thông tin trên thẻ. Vui lòng chụp lại rõ nét hơn.");
        }
      } catch (error: any) {
        console.error("eKYC Error:", error);
        setKycData({ status: "failed", score: 0 });
        setIsFailed(true);
        setStep(4);
        dispatch(getProfileUser());
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    if (step === 4) {
      if (kycData?.status === "verified") {
        setDone(true);
      } else {
        message.warning("Hồ sơ chưa được xác thực. Vui lòng thử lại hoặc gửi quản trị viên.");
      }
    }
  };

  const handleStepClick = (nextStep: StepKey) => {
    setDone(false);
    setStep(nextStep);
  };

  const validateFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      message.error("Chỉ hỗ trợ JPG, PNG hoặc WEBP.");
      return false;
    }

    if (file.size > MAX_SIZE_BYTES) {
      message.error("Kích thước ảnh tối đa 5MB.");
      return false;
    }

    return true;
  };

  const setImageFromFile = (key: keyof KycImages, file: File) => {
    if (!validateFile(file)) {
      return;
    }

    const url = URL.createObjectURL(file);
    setFiles((prev) => ({ ...prev, [key]: file }));
    setImages((prev) => {
      const old = prev[key];
      if (old?.startsWith("blob:")) {
        URL.revokeObjectURL(old);
      }
      return {
        ...prev,
        [key]: url,
      };
    });
  };

  const setImageFromDataUrl = (key: keyof KycImages, dataUrl: string) => {
    // Convert Data URL to File for API upload
    const file = dataURLtoFile(dataUrl, `kyc-${key}-${Date.now()}.jpg`);
    if (file) {
      if (!validateFile(file)) {
        return;
      }
      setFiles((prev) => ({ ...prev, [key]: file }));
    }

    setImages((prev) => {
      const old = prev[key];
      if (old?.startsWith("blob:")) {
        URL.revokeObjectURL(old);
      }
      return {
        ...prev,
        [key]: dataUrl,
      };
    });
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const isCurrentStepInvalid =
    (step === 2 && (!files.front || !files.back)) ||
    (step === 3 && !files.selfie);

  return (
    <div className="h-[calc(100dvh-76px)] overflow-hidden" style={{ background: BRAND.background }}>
      <Spin spinning={isVerifying} fullscreen description="Đang phân tích AI KYC..." />
      <div className="h-full px-3 pb-2 pt-2 md:px-6 md:pt-4">
        <main className="mx-auto mt-3 flex h-[calc(100%-12px)] w-full max-w-6xl flex-col md:mt-4">
          <StepBadge step={step} />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold md:text-2xl" style={{ color: BRAND.text }}>
              {title}
            </h1>
            {!done && !pendingReview ? <StepperDots step={step} labels={STEP_LABELS} onStepClick={handleStepClick} /> : null}
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <StepContent
              step={step}
              done={done}
              frontImage={images.front}
              backImage={images.back}
              selfieImage={images.selfie}
              kycData={kycData}
              isFailed={isFailed}
              pendingReview={pendingReview}
              onPickFront={(file) => setImageFromFile("front", file)}
              onCaptureFront={(file) => setImageFromFile("front", file)}
              onPickBack={(file) => setImageFromFile("back", file)}
              onCaptureBack={(file) => setImageFromFile("back", file)}
              onCaptureSelfie={(dataUrl) => setImageFromDataUrl("selfie", dataUrl)}
              onPickSelfie={(file) => setImageFromFile("selfie", file)}
              onRetry={() => {
                // Stay at step 3 to re-capture selfie and re-call API
                setIsFailed(false);
                setKycData(null);
                setStep(3);
                // Clear selfie so user re-captures
                setFiles((prev) => ({ ...prev, selfie: undefined }));
                setImages((prev) => {
                  const old = prev.selfie;
                  if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
                  return { ...prev, selfie: undefined };
                });
                message.info("Vui lòng chụp lại ảnh khuôn mặt rõ nét hơn.");
              }}
              onSendToAdmin={async () => {
                const kycId = kycData?.kycDocumentId;
                if (!kycId) {
                  message.error("Không tìm thấy thông tin chứng từ KYC để gửi.");
                  return;
                }
                try {
                  setIsVerifying(true);
                  const action = await dispatch(saveForAdmin(kycId));
                  if (saveForAdmin.fulfilled.match(action)) {
                    setIsFailed(false);
                    setKycData((prev: any) => ({ ...prev, status: "in_review" }));
                    setPendingReview(true);
                    message.success("Đã gửi yêu cầu xác thực đến quản trị viên. Vui lòng chờ phản hồi.");
                    dispatch(getProfileUser());
                  } else {
                    message.error("Gửi yêu cầu thất bại. Vui lòng thử lại.");
                  }
                } catch {
                  message.error("Có lỗi xảy ra khi gửi yêu cầu.");
                } finally {
                  setIsVerifying(false);
                }
              }}
            />
          </div>

          {!pendingReview && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pb-14 md:pb-0">
            <ActionButton text="Quay lại" icon={<ArrowLeft className="h-4 w-4" />} onClick={goBack} />

            <div className="flex items-center gap-3">
              {done ? (
                <>
                  {/* <ActionButton text="Làm lại" onClick={resetFlow} /> */}
                  <ActionButton text="Tiếp tục đăng tin" primary icon={<ArrowRight className="h-4 w-4" />} onClick={() => router.push("/post/create")} disabled={user?.kycStatus !== "verified"} />
                </>
              ) : (
                <ActionButton
                  text={isVerifying ? "Đang xác thực..." : step === 4 && kycData?.status === "verified" ? "Hoàn tất" : step === 4 ? "" : "Tiếp tục"}
                  primary
                  icon={<ArrowRight className="h-4 w-4" />}
                  onClick={goNext}
                  disabled={isVerifying || isCurrentStepInvalid || pendingReview || (step === 4 && kycData?.status !== "verified")}
                />
              )}
            </div>
          </div>
          )}
        </main>
      </div>

      {isStepFour ? <BottomActionBar onPrimary={() => undefined} /> : null}
    </div>
  );
}

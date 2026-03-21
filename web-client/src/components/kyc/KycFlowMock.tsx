"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BRAND, STEP_LABELS } from "./constants";
import { ActionButton, BottomActionBar, KycErrorModal } from "./KycPrimitives";
import { StepContent } from "./KycSteps";
import http from "../../utils/api";
import { message } from "antd";
import { StepBadge, StepperDots } from "./KycStepper";
import { StepKey } from "./types";
import { useAppDispatch } from "@/stores/hooks";
import { saveForAdmin, verifyKyc } from "@/stores/slices/kyc.slice";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Modal } from "antd";
import { RootState } from "@/stores/store";

type KycImages = {
  front?: string;
  back?: string;
  selfie?: string;
};

export default function KycFlowMock() {
  const [step, setStep] = useState<StepKey>(1);
  const [done, setDone] = useState(false);
  const [images, setImages] = useState<KycImages>({});
  const [files, setFiles] = useState<{ front?: File; back?: File; selfie?: File }>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [kycData, setKycData] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const imageRef = useRef<KycImages>({});

  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, isAuth } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuth && user?.kycStatus === "verified") {
      Modal.success({
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
    if (done) {
      return "Hoàn tất xác thực";
    }
    return `KYC - ${STEP_LABELS[step - 1]}`;
  }, [done, step]);

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

    // Stage 3 -> 4: Validate selfie and Call API
    if (step === 3) {
      if (!files.selfie) {
        message.warning("Vui lòng chụp hoặc chọn ảnh khuôn mặt.");
        return;
      }

      try {
        setIsVerifying(true);
        const formData = new FormData();
        // Append 3 files in order: front, back, selfie as requested
        if (files.selfie) formData.append("files", files.selfie);
        if (files.back) formData.append("files", files.back);
        if (files.front) formData.append("files", files.front);

        // API Call using Redux thunk
        const action = await dispatch(verifyKyc(formData));

        if (verifyKyc.fulfilled.match(action)) {
          const response = action.payload;
          if (response.success) {
            message.success("Xác thực khuôn mặt thành công!");
            setKycData(response);
            setStep(4);
          } else {
            setShowErrorModal(true);
          }
        } else {
          setShowErrorModal(true);
        }
      } catch (error: any) {
        console.error("KYC Error:", error);
        setShowErrorModal(true);
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    if (step === 4) {
      setDone(true);
    }
  };

  const resetFlow = () => {
    setDone(false);
    setStep(1);
  };

  const handleStepClick = (nextStep: StepKey) => {
    setDone(false);
    setStep(nextStep);
  };

  const setImageFromFile = (key: keyof KycImages, file: File) => {
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

  const handleSendToAdmin = async () => {
    try {
      setIsVerifying(true);
      const formData = new FormData();
      if (files.front) formData.append("files", files.front);
      if (files.back) formData.append("files", files.back);
      if (files.selfie) formData.append("files", files.selfie);

      // Call thunk dedicated for manual verification review
      const action = await dispatch(saveForAdmin(formData));

      if (saveForAdmin.fulfilled.match(action)) {
        message.info("Đã gửi thông tin cho Admin. Vui lòng chờ kết quả!");
        setShowErrorModal(false);
        setDone(true); // Proceed to completion page
      } else {
        message.error("Gửi yêu cầu thất bại. Vui lòng thử lại sau.");
      }
    } catch (error) {
      message.error("Lỗi hệ thống khi gửi yêu cầu.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="h-[calc(100dvh-76px)] overflow-hidden" style={{ background: BRAND.background }}>
      {showErrorModal && (
        <KycErrorModal
          onClose={() => setShowErrorModal(false)}
          onRetry={() => setShowErrorModal(false)}
          onSendToAdmin={handleSendToAdmin}
        />
      )}
      <div className="h-full px-3 pb-2 pt-2 md:px-6 md:pt-4">
        <main className="mx-auto mt-3 flex h-[calc(100%-12px)] w-full max-w-6xl flex-col md:mt-4">
          <StepBadge step={step} />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold md:text-2xl" style={{ color: BRAND.text }}>
              {title}
            </h1>
            {!done ? <StepperDots step={step} labels={STEP_LABELS} onStepClick={handleStepClick} /> : null}
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <StepContent
              step={step}
              done={done}
              frontImage={images.front}
              backImage={images.back}
              selfieImage={images.selfie}
              kycData={kycData}
              onPickFront={(file) => setImageFromFile("front", file)}
              onCaptureFront={(file) => setImageFromFile("front", file)}
              onPickBack={(file) => setImageFromFile("back", file)}
              onCaptureBack={(file) => setImageFromFile("back", file)}
              onCaptureSelfie={(dataUrl) => setImageFromDataUrl("selfie", dataUrl)}
              onPickSelfie={(file) => setImageFromFile("selfie", file)}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pb-14 md:pb-0">
            <ActionButton text="Quay lại" icon={<ArrowLeft className="h-4 w-4" />} onClick={goBack} />

            <div className="flex items-center gap-3">
              {done ? (
                <>
                  {/* <ActionButton text="Làm lại" onClick={resetFlow} /> */}
                  <ActionButton text="Tiếp tục đăng tin" primary icon={<ArrowRight className="h-4 w-4" />} onClick={() => router.push("/post/create")} />
                </>
              ) : (
                <ActionButton
                  text={isVerifying ? "Đang xác thực..." : step === 4 ? "Hoàn tất" : "Tiếp tục"}
                  primary
                  icon={<ArrowRight className="h-4 w-4" />}
                  onClick={goNext}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {isStepFour ? <BottomActionBar onPrimary={() => undefined} /> : null}
    </div>
  );
}

"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BRAND, STEP_LABELS } from "./constants";
import { ActionButton, BottomActionBar } from "./KycPrimitives";
import { StepContent } from "./KycSteps";
import { StepBadge, StepperDots } from "./KycStepper";
import { StepKey } from "./types";

type KycImages = {
  front?: string;
  back?: string;
  selfie?: string;
};

export default function KycFlowMock() {
  const [step, setStep] = useState<StepKey>(1);
  const [done, setDone] = useState(false);
  const [images, setImages] = useState<KycImages>({});
  const imageRef = useRef<KycImages>({});

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

  const goNext = () => {
    if (step < 4) {
      setStep((prev) => (prev < 4 ? ((prev + 1) as StepKey) : prev));
      return;
    }

    setDone(true);
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

  return (
    <div className="h-[calc(100dvh-76px)] overflow-hidden" style={{ background: BRAND.background }}>
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
                  <ActionButton text="Làm lại" onClick={resetFlow} />
                  <ActionButton text="Tiếp tục đăng tin" primary icon={<ArrowRight className="h-4 w-4" />} onClick={() => undefined} />
                </>
              ) : (
                <ActionButton
                  text={step === 4 ? "Hoàn tất" : "Tiếp tục"}
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

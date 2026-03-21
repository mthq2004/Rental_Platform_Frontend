import { BRAND } from "./constants";
import { StepKey } from "./types";

export function StepBadge({ step }: { step: StepKey }) {
  return (
    <div className="mb-6 text-center md:mb-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.primary }}>
        Bước 0{step} / 04
      </p>
      <div className="mx-auto h-1 w-28 rounded-full" style={{ background: BRAND.primarySoft }}>
        <div className="h-1 rounded-full transition-all" style={{ width: `${step * 25}%`, background: BRAND.primary }} />
      </div>
    </div>
  );
}

export function StepperDots({
  step,
  labels,
  onStepClick,
}: {
  step: StepKey;
  labels: string[];
  onStepClick: (step: StepKey) => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-center gap-2 md:justify-start">
      {labels.map((label, idx) => {
        const current = (idx + 1) as StepKey;
        const isActive = current === step;
        const isPassed = current < step;
        return (
          <button
            key={label}
            type="button"
            aria-label={`Chuyển sang bước ${current}`}
            onClick={() => onStepClick(current)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
            style={{
              background: isActive ? BRAND.primary : isPassed ? "#DDE8FF" : "#E5EAF2",
              color: isActive ? "#FFFFFF" : isPassed ? BRAND.primary : "#7A879C",
            }}
          >
            {current}
          </button>
        );
      })}
    </div>
  );
}

// Hook: useAnimatedPlaceholder.ts
import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  "Tìm phòng trọ quận Bình Thạnh...",
  "Căn hộ 2 phòng ngủ quận 7...",
  "Nhà nguyên căn Thủ Đức dưới 10 triệu...",
  "Văn phòng cho thuê quận 1...",
  "Phòng trọ gần ĐH Bách Khoa...",
];

export function useAnimatedPlaceholder(active: boolean) {
  const [displayText, setDisplayText] = useState("");
  const indexRef = useRef(0);
  const charRef = useRef(0);
  const deletingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!active) {
      clearTimeout(timerRef.current);
      return;
    }

    const type = () => {
      const current = SUGGESTIONS[indexRef.current];
      if (!deletingRef.current) {
        charRef.current++;
        setDisplayText(current.slice(0, charRef.current));
        if (charRef.current === current.length) {
          deletingRef.current = true;
          timerRef.current = setTimeout(type, 2000);
        } else {
          timerRef.current = setTimeout(type, 60);
        }
      } else {
        charRef.current--;
        setDisplayText(current.slice(0, charRef.current));
        if (charRef.current === 0) {
          deletingRef.current = false;
          indexRef.current = (indexRef.current + 1) % SUGGESTIONS.length;
          timerRef.current = setTimeout(type, 400);
        } else {
          timerRef.current = setTimeout(type, 30);
        }
      }
    };

    type();
    return () => clearTimeout(timerRef.current);
  }, [active]);

  return displayText;
}
"use client";

import { useEffect } from "react";

const ClickEffect = () => {
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Support both left (0) and right (2) clicks
      if (e.button !== 0 && e.button !== 2) return;

      const spark = document.createElement("div");
      spark.className = "spark";
      spark.style.left = `${e.clientX}px`;
      spark.style.top = `${e.clientY}px`;
      document.body.appendChild(spark);

      setTimeout(() => {
        spark.remove();
      }, 600);
    };

    document.addEventListener("mousedown", handleMouseDown, { capture: true });

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, { capture: true });
    };
  }, []);

  return null;
};

export default ClickEffect;

"use client";

import React from "react";

interface CKEditorWrapperProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CKEditorWrapper({ value, onChange }: CKEditorWrapperProps) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <textarea
        className="w-full min-h-[120px] p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y rounded-lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập nội dung..."
      />
    </div>
  );
}

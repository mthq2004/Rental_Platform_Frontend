"use client";

import React from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

interface CKEditorWrapperProps {
  value: string;
  onChange: (value: string) => void;
}

const CKEDITOR_LICENSE_KEY = process.env.NEXT_PUBLIC_CKEDITOR_LICENSE_KEY || "GPL";

export default function CKEditorWrapper({ value, onChange }: CKEditorWrapperProps) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden ckeditor-wrapper">
      <style>{`
        .ckeditor-wrapper .ck-editor__editable {
          min-height: 120px;
          border-bottom-left-radius: 8px !important;
          border-bottom-right-radius: 8px !important;
        }
        .ckeditor-wrapper .ck-toolbar {
          border-top-left-radius: 8px !important;
          border-top-right-radius: 8px !important;
          background: #f8fafc !important;
        }
      `}</style>
      <CKEditor
        // @ts-expect-error type incompatibility in ckeditor react bindings
        editor={ClassicEditor}
        data={value}
        onChange={(event, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
        config={{
          licenseKey: CKEDITOR_LICENSE_KEY,
          toolbar: ["bold", "italic", "bulletedList", "numberedList", "link", "blockQuote"],
        }}
      />
    </div>
  );
}

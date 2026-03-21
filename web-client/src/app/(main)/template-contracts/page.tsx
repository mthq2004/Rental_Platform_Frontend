"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { getRequestTemplateData, getTemplates } from "@/stores/slices/template-contract.slice";

interface Template {
  templateId: string;
  templateName: string;
  templateType: string;
  description: string;
  isDefault: boolean;
  version: number;
}

interface TemplateUI extends Template {
  category: string;
  typeLabel: string;
}

const ContractTemplatesContent = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestId = searchParams.get("requestId");

  const { templates, templatesLoading } = useAppSelector(
    (state) => state.template
  );

  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateUI | null>(
    null
  );

  useEffect(() => {
    if (requestId) {
      dispatch(getRequestTemplateData(requestId));
    }
  }, [requestId, dispatch]);

  // fetch templates
  useEffect(() => {
    dispatch(getTemplates());
  }, [dispatch]);

  const getCategory = (type: string) => {
    const map: Record<string, string> = {
      standard: "Thuê nhà tiêu chuẩn",
      government: "Theo pháp luật nhà nước",
    };

    return map[type] || "Tùy chỉnh";
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      standard: "Tiêu chuẩn",
      government: "Pháp luật",
    };

    return map[type] || "Tùy chỉnh";
  };

  // transform API → UI
  const transformedTemplates: TemplateUI[] = useMemo(() => {
    return templates.map((t) => ({
      ...t,
      category: getCategory(t.templateType),
      typeLabel: getTypeLabel(t.templateType),
    }));
  }, [templates]);

  const categories = Array.from(
    new Set(transformedTemplates.map((t) => t.category))
  );

  const handleSelectTemplate = (template: TemplateUI) => {
    setSelectedTemplate(template);
    setView("detail");
  };

  const handleBack = () => {
    setView("list");
    setSelectedTemplate(null);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    router.push(
      `/template-contracts/${selectedTemplate.templateId}?requestId=${requestId || ""}`
    );
  };

  if (templatesLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Đang tải mẫu hợp đồng...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf8",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: "1px solid #e0e0e0", background: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "auto", padding: "30px 20px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
            Mẫu Hợp Đồng
          </h1>
          <p style={{ fontSize: "13px", color: "#666" }}>
            Chọn mẫu phù hợp để tạo hợp đồng
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "auto", padding: "30px 20px" }}>
        {view === "list" && (
          <>
            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                gap: 20,
                marginBottom: 40,
              }}
            >
              <StatBox title="Tổng mẫu" value={transformedTemplates.length} />
              <StatBox title="Danh mục" value={categories.length} />
              <StatBox
                title="Mẫu mặc định"
                value={
                  transformedTemplates.filter((t) => t.isDefault).length
                }
              />
            </div>

            {/* Template list */}
            {categories.map((category) => (
              <div key={category} style={{ marginBottom: 40 }}>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 16,
                    borderBottom: "1px solid #e0e0e0",
                    paddingBottom: 8,
                  }}
                >
                  {category}
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))",
                    gap: 16,
                  }}
                >
                  {transformedTemplates
                    .filter((t) => t.category === category)
                    .map((template) => (
                      <TemplateCard
                        key={template.templateId}
                        template={template}
                        onClick={() => handleSelectTemplate(template)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </>
        )}

        {view === "detail" && selectedTemplate && (
          <>
            <button
              onClick={handleBack}
              style={{ marginBottom: 20 }}
            >
              ← Quay lại
            </button>

            <div
              style={{
                background: "white",
                border: "1px solid #e0e0e0",
                padding: 30,
                borderRadius: 6,
              }}
            >
              <h1 style={{ fontSize: 22 }}>
                {selectedTemplate.templateName}
              </h1>

              <p style={{ color: "#666", marginTop: 10 }}>
                {selectedTemplate.description}
              </p>

              <div style={{ marginTop: 20 }}>
                <p>Phiên bản: v{selectedTemplate.version}</p>
                <p>Loại: {selectedTemplate.typeLabel}</p>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 30,
                }}
              >
                <button
                  onClick={handleUseTemplate}
                  style={{
                    background: "#2c2c2c",
                    color: "white",
                    padding: "10px 24px",
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Sử dụng mẫu này
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ContractTemplatesPage = () => {
  return (
    <React.Suspense fallback={<div>Đang tải...</div>}>
      <ContractTemplatesContent />
    </React.Suspense>
  );
};

export default ContractTemplatesPage;



/* Components */

const StatBox = ({ title, value }: any) => (
  <div
    style={{
      background: "white",
      padding: 20,
      border: "1px solid #e0e0e0",
      borderRadius: 4,
    }}
  >
    <p style={{ fontSize: 12, color: "#888" }}>{title}</p>
    <p style={{ fontSize: 28, fontWeight: 700 }}>{value}</p>
  </div>
);

const TemplateCard = ({ template, onClick }: any) => (
  <div
    onClick={onClick}
    style={{
      background: "white",
      border: "1px solid #e0e0e0",
      padding: 20,
      borderRadius: 4,
      cursor: "pointer",
    }}
  >
    <h3 style={{ fontSize: 14 }}>{template.templateName}</h3>

    <p style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
      {template.description}
    </p>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 12,
      }}
    >
      <span>{template.typeLabel}</span>
      <span>v{template.version}</span>
    </div>
  </div>
);

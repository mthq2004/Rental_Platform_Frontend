"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getRequestTemplateData,
  getTemplates,
} from "@/stores/slices/template-contract.slice";
import { Input, Empty, Spin } from "antd";
import {
  FileTextOutlined,
  SearchOutlined,
  RightOutlined,
  HomeOutlined
} from "@ant-design/icons";
import Link from "next/link";

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

  const { templates, templatesLoading, requestData } = useAppSelector(
    (state) => state.template
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    if (requestId) {
      dispatch(getRequestTemplateData(requestId));
    }
  }, [requestId, dispatch]);

  useEffect(() => {
    const propertyType = requestData?.property?.type;
    dispatch(getTemplates(propertyType || "all"));
  }, [requestData, dispatch]);

  /* ---------------- MAP ---------------- */

  const getCategory = (type: string) => {
    const map: Record<string, string> = {
      standard: "standard",
      government: "government",
    };
    return map[type] || "custom";
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      standard: "Tiêu chuẩn",
      government: "Pháp lý",
    };
    return map[type] || "Tùy chỉnh";
  };

  const transformedTemplates: TemplateUI[] = useMemo(() => {
    return (templates || [])
      .map((t) => ({
        ...t,
        category: getCategory(t.templateType),
        typeLabel: getTypeLabel(t.templateType),
      }))
      .filter(
        (t) =>
          t.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.description || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
  }, [templates, searchTerm]);

  const filterTabs = [
    { key: "all", label: "Tất cả" },
    { key: "standard", label: "Tiêu chuẩn" },
    { key: "government", label: "Theo pháp luật" },
    { key: "custom", label: "Tùy chỉnh" },
  ];

  const filteredTemplates = useMemo(() => {
    if (activeTab === "all") return transformedTemplates;
    return transformedTemplates.filter((t) => t.category === activeTab);
  }, [transformedTemplates, activeTab]);

  const handleUseTemplate = (templateId: string) => {
    router.push(
      `/template-contracts/${templateId}?requestId=${requestId || ""}`
    );
  };

  /* ---------------- LOADING ---------------- */

  if (templatesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Spin size="large" />
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="h-screen bg-[#F8F9FA] flex flex-col overflow-hidden">
      <div className="shrink-0 max-w-5xl w-full mx-auto px-6 pt-10 pb-2">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
            <HomeOutlined /> Trang chủ
          </Link>
          <RightOutlined className="text-[10px]" />
          <span className="text-gray-900 font-medium">Chọn mẫu hợp đồng</span>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Mẫu hợp đồng thuê nhà</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Vui lòng chọn một mẫu hợp đồng phù hợp với nhu cầu của bạn để tiếp tục. Các mẫu đã được soạn sẵn điều khoản chuẩn xác.
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.key 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <Input 
              size="large"
              placeholder="Tìm kiếm mẫu..." 
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="rounded-xl border-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Grid Container - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-10">
        <div className="max-w-5xl mx-auto px-6 h-full">
          {filteredTemplates.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
               <Empty description={<span className="text-gray-500">Không tìm thấy mẫu hợp đồng nào phù hợp</span>} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div 
                  key={template.templateId}
                  onClick={() => handleUseTemplate(template.templateId)}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 transition-all cursor-pointer group flex flex-col h-full"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileTextOutlined />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {template.templateName}
                  </h3>
                  
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                    {template.description || "Mẫu hợp đồng cơ bản, phù hợp với hầu hết các giao dịch thuê nhà thông thường."}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                    <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg">
                      {template.typeLabel}
                    </span>
                    <span className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 -translate-x-2 group-hover:translate-x-0 duration-300">
                      Sử dụng mẫu này <RightOutlined className="text-[10px]" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- PAGE ---------------- */

const ContractTemplatesPage = () => {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
          <Spin size="large" />
        </div>
      }
    >
      <ContractTemplatesContent />
    </React.Suspense>
  );
};

export default ContractTemplatesPage;
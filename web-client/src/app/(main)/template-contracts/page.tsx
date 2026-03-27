"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { getRequestTemplateData, getTemplates } from "@/stores/slices/template-contract.slice";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Layers,
  Star,
  ArrowLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Calendar,
  Info,
  Settings
} from "lucide-react";

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

  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateUI | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Tất cả");

  useEffect(() => {
    if (requestId) {
      dispatch(getRequestTemplateData(requestId));
    }
  }, [requestId, dispatch]);

  useEffect(() => {
    if (requestData?.property.type) {
      dispatch(getTemplates(requestData?.property.type));
    }
  }, [dispatch, requestData]);

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

  const transformedTemplates: TemplateUI[] = useMemo(() => {
    return (templates || []).map((t) => ({
      ...t,
      category: getCategory(t.templateType),
      typeLabel: getTypeLabel(t.templateType),
    })).filter(t =>
      t.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  const filterTabs = [
    { label: "Tất cả", icon: Layers },
    { label: "Thuê nhà tiêu chuẩn", icon: FileText },
    { label: "Theo pháp luật nhà nước", icon: CheckCircle2 },
    { label: "Tùy chỉnh", icon: Settings }
  ];

  const filteredTemplates = useMemo(() => {
    let result = transformedTemplates;
    if (activeTab !== "Tất cả") {
      result = result.filter(t => t.category === activeTab);
    }
    return result;
  }, [transformedTemplates, activeTab]);

  const handleSelectTemplate = (template: TemplateUI) => {
    setSelectedTemplate(template);
    setView("detail");
  };

  const handleBack = () => {
    setView("list");
    setSelectedTemplate(null);
  };

  const handleUseTemplate = (templateId?: string) => {
    const id = templateId || selectedTemplate?.templateId;
    if (!id) return;

    router.push(
      `/template-contracts/${id}?requestId=${requestId || ""}`
    );
  };

  if (templatesLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-[1400px] mx-auto space-y-8">
          <div className="h-20 w-1/3 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-10">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-[450px] bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-900 pb-20">
      {/* Premium Header - TopCV Inspired */}
      <div className="bg-white pt-6 pb-12 border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm font-medium mb-6">
            <button className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors">Trang chủ</button>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-500 font-semibold">Mẫu Hợp Đồng</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold tracking-tight text-[#2D333F] mb-4">
                Mẫu hợp đồng thuê nhà chuẩn 2026
              </h1>
              <p className="text-[#555E68] text-lg max-w-3xl leading-relaxed">
                Tuyển chọn các mẫu hợp đồng pháp lý chuẩn mực, đa dạng phong cách, giúp bạn tạo lập giao dịch an toàn, cá nhân hóa và kết nối mạnh mẽ hơn với đối tác.
              </p>
            </div>

            {/* Mascot Area */}
            <div className="hidden lg:block">
              <div className="relative w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center p-4 ring-8 ring-blue-100/60">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <FileText size={56} className="text-[#2563EB]" />
                </motion.div>
                <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-xl shadow-xl border border-slate-100">
                  <div className="px-2 py-0.5 bg-amber-400 rounded-md text-white text-[10px] font-black uppercase tracking-wider">PREMIUM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Options Area */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3">
              {filterTabs.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${activeTab === tab.label
                    ? "bg-[#2563EB] border-[#2563EB] text-white shadow-lg shadow-blue-500/20"
                    : "bg-white border-slate-200 text-[#2D333F] hover:border-[#2563EB] hover:text-[#2563EB]"
                    }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative group min-w-[280px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm mẫu hợp đồng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {view === "list" ? (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.templateId}
                    template={template}
                    onUse={() => handleUseTemplate(template.templateId)}
                    onPreview={() => handleSelectTemplate(template)}
                  />
                ))}

                {filteredTemplates.length === 0 && (
                  <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-dashed border-slate-300">
                    <div className="p-6 bg-slate-50 rounded-full mb-6">
                      <Search className="text-slate-300" size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">Không tìm thấy mẫu nào phù hợp</h3>
                    <p className="text-slate-500 mt-2">Hãy thử thay đổi tiêu chí bộ lọc hoặc từ khóa tìm kiếm</p>
                    <button
                      onClick={() => { setActiveTab("Tất cả"); setSearchTerm(""); }}
                      className="mt-6 text-[#2563EB] font-bold hover:underline"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-[1100px] mx-auto"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-500 hover:text-[#2563EB] font-bold mb-8 group transition-colors"
              >
                <div className="p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
                  <ArrowLeft size={20} />
                </div>
                Quay lại danh sách mẫu
              </button>

              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/5 flex flex-col lg:flex-row border border-slate-100">
                {/* Visual Preview */}
                <div className="lg:w-[45%] bg-[#F0F2F5] p-12 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-100">
                  <div className="w-full max-w-[350px] aspect-[1/1.41] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-sm p-10 flex flex-col gap-5 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2563EB]" />
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100" />
                      <div className="h-5 w-40 bg-slate-100 rounded" />
                    </div>
                    <div className="space-y-3 mt-6">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                        <div key={i} className={`h-2 bg-slate-50 rounded ${i % 4 === 0 ? 'w-full' : 'w-[92%]'}`} />
                      ))}
                    </div>
                    <div className="mt-auto grid grid-cols-2 gap-4 pt-10">
                      <div className="h-14 bg-slate-50 rounded-xl" />
                      <div className="h-14 bg-slate-50 rounded-xl" />
                    </div>
                  </div>
                </div>

                {/* Detail Content */}
                <div className="flex-1 p-12 lg:p-16 flex flex-col bg-white">
                  <div className="mb-10">
                    <div className="flex items-center gap-3 text-[#2563EB] font-bold text-xs uppercase tracking-[0.15em] mb-6">
                      <span className="px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100">{selectedTemplate?.typeLabel}</span>
                      <span className="text-slate-400">Phiên bản {selectedTemplate?.version}.0.0</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-extrabold text-[#2D333F] tracking-tight leading-[1.15] mb-8">
                      {selectedTemplate?.templateName}
                    </h1>
                    <p className="text-[#555E68] text-xl leading-relaxed opacity-90">
                      {selectedTemplate?.description || "Mẫu hợp đồng được thiết kế chuyên nghiệp, tuân thủ các quy định pháp lý hiện hành, phù hợp cho mọi đối tác."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                    <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                      <div className="p-3.5 bg-white rounded-2xl shadow-sm">
                        <Calendar className="text-[#2563EB]" size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cập nhật cuối</p>
                        <p className="font-bold text-[#2D333F] text-lg">Tháng 3, 2026</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                      <div className="p-3.5 bg-white rounded-2xl shadow-sm">
                        <CheckCircle2 className="text-[#2563EB]" size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kiểm định</p>
                        <p className="font-bold text-[#2D333F] text-lg">Pháp lý chuẩn</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col md:flex-row gap-5 pt-12 border-t border-slate-100">
                    <button
                      onClick={() => handleUseTemplate()}
                      className="flex-[2] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-4.5 px-10 rounded-[1.25rem] shadow-2xl shadow-blue-500/30 active:scale-[0.98] transition-all text-center text-xl tracking-wide"
                    >
                      DÙNG MẪU NÀY
                    </button>
                    <button className="flex-1 px-8 py-4.5 bg-white border-2 border-slate-100 rounded-[1.25rem] font-bold text-[#2D333F] hover:bg-slate-50 hover:border-[#2563EB]/30 transition-all text-xl">
                      Tải mẫu PDF
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* --- Sub-Components --- */

const TemplateCard = ({ template, onUse, onPreview }: any) => {
  return (
    <div className="bg-white rounded-[1rem] overflow-hidden border border-slate-100 hover:border-[#2563EB]/30 shadow-sm hover:shadow-2xl hover:shadow-[#2563EB]/10 transition-all duration-500 group flex flex-col h-full cursor-pointer" onClick={onPreview}>
      {/* Preview Section */}
      <div className="relative aspect-[1/1.32] bg-[#F7F8F9] p-8 overflow-hidden">
        {/* Mock Document */}
        <div className="w-full h-full bg-white shadow-[0_15px_40px_rgba(0,0,0,0.06)] rounded-sm border border-slate-200 p-6 flex flex-col gap-3.5 group-hover:scale-[1.03] transition-transform duration-700 origin-top">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
              <FileText size={14} className="text-[#2563EB]" />
            </div>
            <div className="h-2 w-24 bg-slate-100 rounded" />
          </div>
          <div className="h-2.5 w-full bg-slate-50 rounded" />
          <div className="h-2.5 w-full bg-slate-50 rounded" />
          <div className="h-2.5 w-[85%] bg-slate-50 rounded" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="h-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200" />
            <div className="h-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200" />
          </div>
          <div className="mt-auto flex justify-between pt-5 border-t border-slate-50">
            <div className="h-2 w-12 bg-slate-100 rounded" />
            <div className="h-2 w-12 bg-slate-100 rounded" />
          </div>
        </div>

        {/* Status Badge "Mới" */}
        {template.templateId.includes('1') || template.isDefault ? (
          <div className="absolute top-5 left-5 flex items-center gap-1.5 px-4 py-2 bg-white rounded-full shadow-lg border border-blue-50 animate-pulse z-10">
            <div className="w-2 h-2 bg-[#2563EB] rounded-full" />
            <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-[0.1em]">Nổi bật</span>
          </div>
        ) : null}

        {/* Hover Action Button */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-10 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUse();
            }}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-3.5 px-10 rounded-[5px] shadow-[0_10px_30px_rgba(0,177,79,0.3)] transform transition-all active:scale-95 translate-y-12 group-hover:translate-y-0 duration-500 text-base tracking-wide pointer-events-auto"
          >
            Dùng mẫu
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-8 flex flex-col flex-1 bg-white">
        {/* Style Indicators (Dots) */}
        <div className="flex gap-2.5 mb-5">
          {['bg-[#2563EB]', 'bg-slate-200', 'bg-slate-200', 'bg-slate-200'].map((color, i) => (
            <div key={i} className={`w-4 h-4 rounded-full ${color} ${i === 0 ? 'ring-4 ring-blue-100' : ''} transition-all duration-300`} />
          ))}
        </div>

        <h3 className="text-2xl font-bold text-[#2D333F] mb-3 group-hover:text-[#2563EB] transition-colors line-clamp-1 leading-tight tracking-tight">
          {template.templateName}
        </h3>

        <p className="text-[#555E68] text-base leading-relaxed line-clamp-2 mb-8 opacity-80 font-medium">
          {template.description || "Thiết kế chuẩn chỉnh, đầy đủ các điều khoản pháp lý cần thiết cho mọi mục đích."}
        </p>

        <div className="mt-auto flex flex-wrap gap-2.5">
          <span className="px-4 py-2 bg-slate-100 text-[#555E68] text-[10px] font-black rounded-xl uppercase tracking-[0.1em] border border-slate-200/50">
            {template.typeLabel || "Standard"}
          </span>
          <span className="px-4 py-2 bg-blue-50 text-[#2563EB] text-[10px] font-black rounded-xl uppercase tracking-[0.1em] border border-blue-100/50">
            Professional
          </span>
        </div>
      </div>
    </div>
  );
};

const ContractTemplatesPage = () => {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-[#2563EB] rounded-full animate-spin mb-4" />
        <p className="font-bold text-[#2563EB] animate-pulse">Đang chuẩn bị các tài liệu chuyên nghiệp...</p>
      </div>
    }>
      <ContractTemplatesContent />
    </React.Suspense>
  );
};

export default ContractTemplatesPage;


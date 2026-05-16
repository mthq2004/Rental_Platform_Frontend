"use client";
import React, { useState } from "react";
import { Input, Button, Modal, Popover, Switch, Tooltip, App } from "antd";
import {
    BulbOutlined,
    LoadingOutlined,
    SettingOutlined,
    ThunderboltOutlined,
    RobotOutlined,
    CopyOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import { PropertyFormData } from "@/types/property.type";
import { Editor } from "@tinymce/tinymce-react";
import TextEditor from "@/components/TextEditor";
const { TextArea } = Input;

interface DescriptionSectionProps {
    formData: PropertyFormData;
    updateFormData: (field: keyof PropertyFormData, value: any) => void;
    imageUrls?: string[];
}

const AI_TONES = [
    { value: "professional", label: "Chuyên nghiệp", icon: "💼" },
    { value: "friendly", label: "Thân thiện", icon: "😊" },
    { value: "luxury", label: "Sang trọng", icon: "✨" },
    { value: "simple", label: "Đơn giản", icon: "📝" },
];

export default function DescriptionSection({
    formData,
    updateFormData,
    imageUrls = [],
}: DescriptionSectionProps) {
    const { message } = App.useApp();
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [showAISettings, setShowAISettings] = useState(false);
    const [aiTone, setAiTone] = useState("professional");
    const [aiLength, setAiLength] = useState<"short" | "medium" | "long">("medium");
    const [includeEmoji, setIncludeEmoji] = useState(false);
    const [generatedDescription, setGeneratedDescription] = useState("");
    const [showAIPreview, setShowAIPreview] = useState(false);

    const handleGenerateWithAI = async () => {
        if (!formData.title && !formData.address && formData.areaSqm === 0) {
            message.warning("Vui lòng nhập thông tin cơ bản (tiêu đề, địa chỉ, diện tích) để AI có thể tạo mô tả chính xác hơn");
            return;
        }

        setIsGeneratingAI(true);

        try {
            const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000";
            const res = await fetch(`${apiEndpoint}/api/ai/api/v1/vision/generate-description`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    propertyType: formData.propertyType,
                    areaSqm: formData.areaSqm,
                    bedrooms: formData.bedrooms,
                    bathrooms: formData.bathrooms,
                    address: formData.address,
                    district: formData.district,
                    city: formData.city,
                    pricePerMonth: formData.pricePerMonth,
                    depositAmount: formData.depositAmount,
                    furnitureStatus: formData.furnitureStatus,
                    amenities: formData.amenities,
                    tone: aiTone,
                    length: aiLength,
                    includeEmoji,
                    imageUrls: imageUrls.slice(0, 3),
                }),
            });

            if (!res.ok) {
                throw new Error("API error");
            }

            const data = await res.json();
            setGeneratedDescription(data.description);
            setShowAIPreview(true);
        } catch {
            message.error("Không thể tạo mô tả AI. Vui lòng thử lại sau.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleApplyAIDescription = () => {
        updateFormData("description", generatedDescription);
        setShowAIPreview(false);
        setGeneratedDescription("");
        message.success("Đã áp dụng mô tả từ AI");
    };

    const handleRegenerateAI = () => {
        handleGenerateWithAI();
    };

    return (
        <>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">

                <div className="space-y-4">

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Mô tả chi tiết</h3>


                            {/* AI Generate Button */}
                            <div className="flex items-center gap-2">
                                <Popover
                                    open={showAISettings}
                                    onOpenChange={setShowAISettings}
                                    trigger="click"
                                    placement="bottomRight"
                                    content={
                                        <div className="w-72 p-2">
                                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                                <RobotOutlined className="text-blue-500 text-lg" />
                                                <span className="font-semibold text-gray-800">Cài đặt AI</span>
                                            </div>

                                            {/* Tone Selection */}
                                            <div className="mb-4">
                                                <label className="text-xs font-medium text-gray-600 mb-2 block">Phong cách viết</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {AI_TONES.map(tone => (
                                                        <button
                                                            key={tone.value}
                                                            onClick={() => setAiTone(tone.value)}
                                                            className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium transition-all ${aiTone === tone.value
                                                                ? "bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                                                }`}
                                                        >
                                                            <span>{tone.icon}</span>
                                                            <span>{tone.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Length Selection */}
                                            <div className="mb-4">
                                                <label className="text-xs font-medium text-gray-600 mb-2 block">Độ dài mô tả</label>
                                                <div className="flex gap-2">
                                                    {["short", "medium", "long"].map(len => (
                                                        <button
                                                            key={len}
                                                            onClick={() => setAiLength(len as any)}
                                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${aiLength === len
                                                                ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                                                                : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                                                                }`}
                                                        >
                                                            {len === "short" ? "Ngắn" : len === "medium" ? "Vừa" : "Dài"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Include Emoji */}
                                            <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                                <span className="text-sm text-gray-600">Thêm emoji 🎉</span>
                                                <Switch
                                                    size="small"
                                                    checked={includeEmoji}
                                                    onChange={setIncludeEmoji}
                                                    className="bg-gray-300"
                                                />
                                            </div>
                                        </div>
                                    }
                                >
                                    <Tooltip title="Cài đặt AI">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<SettingOutlined />}
                                            className="text-gray-400 hover:text-blue-500"
                                        />
                                    </Tooltip>
                                </Popover>

                                <button
                                    onClick={handleGenerateWithAI}
                                    disabled={isGeneratingAI}
                                    className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed bg-linear-to-r from-blue-500 to-blue-600"
                                >
                                    {/* Shimmer Effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent" />

                                    {isGeneratingAI ? (
                                        <>
                                            <LoadingOutlined className="text-base animate-spin" />
                                            <span>Đang tạo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <BulbOutlined className="text-base group-hover:animate-bounce" />
                                            <span>Tạo với AI</span>
                                            <ThunderboltOutlined className="text-yellow-300 text-xs" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* <Editor
                            apiKey="kwxyzg10ywt6lk8ia1b6cx1ix2s5ydtgtnnu52mqfavyz6u8"
                            value={formData.description}
                            init={{
                                height: 350,
                                menubar: true,

                                plugins: [
                                    "advlist",
                                    "autolink",
                                    "lists",
                                    "link",
                                    "image",
                                    "charmap",
                                    "preview",
                                    "anchor",
                                    "searchreplace",
                                    "visualblocks",
                                    "code",
                                    "fullscreen",
                                    "insertdatetime",
                                    "media",
                                    "table",
                                    "help",
                                    "wordcount",
                                ],

                                toolbar:
                                    "undo redo | blocks | " +
                                    "bold italic underline | forecolor backcolor | " +
                                    "alignleft aligncenter alignright alignjustify | " +
                                    "bullist numlist outdent indent | " +
                                    "link image table | removeformat",

                                content_style:
                                    "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                            }}
                            onEditorChange={(content) =>
                                updateFormData("description", content)
                            }
                        /> */}

                        <TextEditor content={formData.description} onChange={(value) => updateFormData("description", value)} />

                        {/* AI Tips */}
                        <div className="flex items-start gap-2 mt-3 p-3 bg-linear-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-100">
                            <BulbOutlined className="text-blue-500 mt-0.5" />
                            <p className="text-xs text-gray-600">
                                <span className="font-medium text-blue-700">Mẹo:</span> Điền càng nhiều thông tin (tiêu đề, địa chỉ, diện tích, giá) thì AI sẽ tạo mô tả càng chính xác và hấp dẫn hơn!
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Preview Modal */}
            <Modal
                open={showAIPreview}
                onCancel={() => setShowAIPreview(false)}
                footer={null}
                width={600}
                centered
                closable={false}
                className="ai-preview-modal"
            >
                <div className="p-2">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <RobotOutlined className="text-2xl text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Mô tả được tạo bởi AI</h3>
                            <p className="text-sm text-gray-500">Xem trước và chỉnh sửa nếu cần</p>
                        </div>
                    </div>

                    {/* Generated Content */}
                    <div className="relative mb-6">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-37.5\">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {generatedDescription}
                            </p>
                        </div>

                        {/* Copy Button */}
                        <Tooltip title="Sao chép">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedDescription);
                                    message.success("Đã sao chép!");
                                }}
                                className="absolute top-3 right-3 p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-blue-500 hover:border-blue-300 transition-colors"
                            >
                                <CopyOutlined />
                            </button>
                        </Tooltip>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleRegenerateAI}
                            disabled={isGeneratingAI}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                        >
                            <SyncOutlined className={isGeneratingAI ? "animate-spin" : ""} />
                            <span>Tạo lại</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <Button
                                size="large"
                                onClick={() => setShowAIPreview(false)}
                                className="rounded-lg px-6"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleApplyAIDescription}
                                className="rounded-lg px-6 font-semibold bg-blue-500 hover:bg-blue-600 border-none"
                            >
                                Áp dụng mô tả này
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}

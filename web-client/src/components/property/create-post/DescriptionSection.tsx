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
import { PropertyFormData, PropertyType } from "@/types/property.type";
import { PROPERTY_META } from "@/constants/property.constant";

const { TextArea } = Input;

interface DescriptionSectionProps {
    formData: PropertyFormData;
    updateFormData: (field: keyof PropertyFormData, value: any) => void;
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

        // Simulate AI generation (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 2000));

        const propertyTypeLabel = PROPERTY_META[formData.propertyType].label;
        const emoji = includeEmoji ? "🏠 " : "";

        // Mock AI-generated description
        const mockDescriptions: Record<string, string> = {
            professional: `${emoji}Cho thuê ${propertyTypeLabel.toLowerCase()} ${formData.areaSqm}m² tại ${formData.address || "vị trí đắc địa"}. Căn hộ được thiết kế hiện đại với không gian thoáng đãng, đầy đủ tiện nghi cao cấp. Vị trí thuận tiện di chuyển, gần các trung tâm thương mại, trường học và bệnh viện. Phù hợp cho gia đình hoặc chuyên gia nước ngoài. Liên hệ ngay để được tư vấn và xem nhà!`,
            friendly: `${emoji}Chào bạn! Mình đang cho thuê ${propertyTypeLabel.toLowerCase()} siêu xinh ${formData.areaSqm}m² nè! 🌟 Nhà mình ở ${formData.address || "khu vực trung tâm"}, đi đâu cũng tiện. Nội thất đầy đủ, dọn vào ở ngay luôn nhé. Bạn nào quan tâm inbox mình để xem nhà ha!`,
            luxury: `${emoji}✨ Trải nghiệm không gian sống đẳng cấp với ${propertyTypeLabel.toLowerCase()} ${formData.areaSqm}m² tại ${formData.address || "vị trí vàng"}. Thiết kế nội thất tinh tế, vật liệu cao cấp, view panorama tuyệt đẹp. Tiện ích 5 sao: hồ bơi, gym, spa, sky lounge. Dành cho quý khách hàng thượng lưu đề cao chất lượng cuộc sống.`,
            simple: `${emoji}Cho thuê ${propertyTypeLabel.toLowerCase()} ${formData.areaSqm}m², ${formData.address || "trung tâm thành phố"}. Đầy đủ nội thất. Giá ${formData.pricePerMonth?.toLocaleString() || "thương lượng"} VNĐ/tháng. Liên hệ xem nhà.`
        };

        const generated = mockDescriptions[aiTone] || mockDescriptions.professional;
        setGeneratedDescription(generated);
        setShowAIPreview(true);
        setIsGeneratingAI(false);
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tiêu đề tin đăng và Mô tả chi tiết</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tiêu đề tin đăng <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="Nhập tiêu đề tin đăng"
                            size="large"
                            className="rounded-lg"
                            maxLength={100}
                            showCount
                            value={formData.title}
                            onChange={(e) => updateFormData("title", e.target.value)}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Mô tả chi tiết <span className="text-red-500">*</span>
                            </label>

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
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent"/>

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

                        <TextArea
                            placeholder="Nhập mô tả chi tiết về bất động sản của bạn... Hoặc nhấn 'Tạo với AI' để tự động tạo mô tả hấp dẫn!"
                            rows={6}
                            className="rounded-lg"
                            maxLength={3000}
                            showCount
                            value={formData.description}
                            onChange={(e) => updateFormData("description", e.target.value)}
                        />

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

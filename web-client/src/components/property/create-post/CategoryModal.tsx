"use client";
import React from "react";
import { Modal } from "antd";
import { ArrowLeftOutlined, RightOutlined, HomeOutlined } from "@ant-design/icons";
import { PROPERTY_META } from "@/constants/property.constant";
import { PropertyType } from "@/types/property.type";

interface CategoryModalProps {
    open: boolean;
    onClose: () => void;
    selectedType: PropertyType;
    onSelect: (type: PropertyType) => void;
    isFirstTime?: boolean; // If true, cannot close modal without selecting
}

export default function CategoryModal({
    open,
    onClose,
    selectedType,
    onSelect,
    isFirstTime = false,
}: CategoryModalProps) {
    const handleSelect = (type: PropertyType) => {
        onSelect(type);
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={520}
            centered
            closable={false}
            mask={{ closable: !isFirstTime }}
            keyboard={!isFirstTime} // Cannot press ESC to close if first time
            className="category-modal"
        >
            <div className="py-2">
                {/* Header */}
                <div className="flex items-center border-b pb-4 mb-6">
                    {!isFirstTime ? (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeftOutlined className="text-lg" />
                        </button>
                    ) : (
                        <div className="w-10" />
                    )}
                    <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <HomeOutlined className="text-blue-500 text-xl" />
                            <h3 className="text-xl font-bold text-gray-800">Đăng tin cho thuê</h3>
                        </div>
                        {isFirstTime && (
                            <p className="text-sm text-gray-500">Vui lòng chọn loại bất động sản để bắt đầu</p>
                        )}
                    </div>
                    <div className="w-10" />
                </div>

                {/* Category List */}
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-4 tracking-wide">
                        Chọn loại bất động sản
                    </h4>
                    <div className="space-y-2">
                        {Object.entries(PROPERTY_META).map(([key, meta]) => {
                            const IconComponent = meta.icon;
                            const isSelected = selectedType === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleSelect(key as PropertyType)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${isSelected
                                            ? "bg-blue-50 border-2 border-blue-400 shadow-sm"
                                            : "border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-500"
                                            }`}>
                                            <IconComponent className="text-lg" />
                                        </div>
                                        <span className={`text-base font-medium ${isSelected ? "text-blue-600" : "text-gray-700 group-hover:text-blue-600"
                                            }`}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <RightOutlined className={`${isSelected ? "text-blue-500" : "text-gray-400 group-hover:text-blue-500"
                                        }`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer hint */}
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        {isFirstTime
                            ? "👆 Nhấn vào loại bất động sản để tiếp tục"
                            : "Chọn loại bất động sản phù hợp để đăng tin"
                        }
                    </p>
                </div>
            </div>
        </Modal>
    );
}

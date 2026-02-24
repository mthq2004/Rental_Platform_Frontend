"use client";
import React from "react";
import { Input, Select } from "antd";
import { PropertyFormData, PropertyType } from "@/types/property.type";
import { PROPERTY_META } from "@/constants/property.constant";
import SmartPriceInput from "@/components/common/SmartPriceInput/SmartPriceInput";

interface PropertyDetailsSectionProps {
    propertyType: PropertyType;
    formData: PropertyFormData;
    updateFormData: (key: keyof PropertyFormData, value: any) => void;
}
import { FIELD_CONFIG, FURNITURE_STATUS_OPTIONS, OWNERSHIP_TYPE_OPTIONS } from "./types";

const { Option } = Select;

interface PropertyDetailsSectionProps {
    propertyType: PropertyType;
    formData: PropertyFormData;
    updateFormData: (field: keyof PropertyFormData, value: any) => void;
}

export default function PropertyDetailsSection({
    propertyType,
    formData,
    updateFormData,
}: PropertyDetailsSectionProps) {
    const currentPropertyMeta = PROPERTY_META[propertyType];

    const renderField = (fieldKey: string) => {
        const config = FIELD_CONFIG[fieldKey];
        if (!config) return null;

        if (fieldKey === "furnitureStatus") {
            return (
                <div key={fieldKey} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{config.label}</label>
                    <Select
                        value={formData.furnitureStatus}
                        onChange={(value) => updateFormData("furnitureStatus", value)}
                        className="w-full"
                        size="large"
                        placeholder={config.placeholder}
                    >
                        {FURNITURE_STATUS_OPTIONS.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                                {opt.label}
                            </Option>
                        ))}
                    </Select>
                </div>
            );
        }

        if (fieldKey === "ownershipType") {
            return (
                <div key={fieldKey} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{config.label}</label>
                    <Select
                        value={(formData as any)[fieldKey]}
                        onChange={(value) => updateFormData(fieldKey as keyof PropertyFormData, value)}
                        className="w-full"
                        size="large"
                        placeholder={config.placeholder}
                    >
                        {OWNERSHIP_TYPE_OPTIONS.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                                {opt.label}
                            </Option>
                        ))}
                    </Select>
                </div>
            );
        }

        // Các field tiền sử dụng SmartPriceInput
        const priceFields = ["electricityCostPerKwh", "waterCostPerM3", "parkingFee", "managementFee"];
        if (priceFields.includes(fieldKey)) {
            return (
                <div key={fieldKey} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{config.label}</label>
                    <SmartPriceInput
                        value={(formData as any)[fieldKey] || 0}
                        onChange={(value) => updateFormData(fieldKey as keyof PropertyFormData, value)}
                        placeholder={config.placeholder}
                    />
                </div>
            );
        }

        return (
            <div key={fieldKey} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{config.label}</label>
                <Input
                    value={(formData as any)[fieldKey] || ""}
                    onChange={(e) => updateFormData(fieldKey as keyof PropertyFormData, e.target.value)}
                    placeholder={config.placeholder}
                    suffix={config.suffix ? <span className="text-gray-400">{config.suffix}</span> : null}
                    size="large"
                    className="rounded-lg"
                    type="number"
                />
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Thông tin chi tiết - {currentPropertyMeta.label}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {currentPropertyMeta.fields.map((field) => renderField(field))}
            </div>
        </div>
    );
}

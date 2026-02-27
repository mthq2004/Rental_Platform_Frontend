"use client";
import React from "react";
import { Input } from "antd";
import { PropertyFormData } from "@/types/property.type";
import SmartPriceInput from "@/components/common/SmartPriceInput";

interface PriceSectionProps {
    formData: PropertyFormData;
    updateFormData: (field: keyof PropertyFormData, value: any) => void;
}

export default function PriceSection({
    formData,
    updateFormData,
}: PriceSectionProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Diện tích & Giá cho thuê</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diện tích <span className="text-red-500">*</span>
                    </label>
                    <Input
                        placeholder="Nhập diện tích"
                        suffix={<span className="text-gray-400">m²</span>}
                        size="large"
                        className="rounded-lg"
                        type="number"
                        value={formData.areaSqm || ""}
                        onChange={(e) => updateFormData("areaSqm", e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá thuê <span className="text-red-500">*</span>
                    </label>
                    <SmartPriceInput
                        value={formData.pricePerMonth}
                        onChange={(value: number) => updateFormData("pricePerMonth", value)}
                        placeholder="Nhập giá (VD: 9, 15, 50)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền cọc</label>
                    <SmartPriceInput
                        value={formData.depositAmount as number}
                        onChange={(value: number) => updateFormData("depositAmount", value)}
                        placeholder="Nhập tiền cọc (VD: 5, 10, 15)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời hạn thuê tối thiểu</label>
                    <Input
                        placeholder="Số tháng"
                        suffix={<span className="text-gray-400">tháng</span>}
                        size="large"
                        className="rounded-lg"
                        type="number"
                        value={formData.minimumLeaseMonths}
                        onChange={(e) => updateFormData("minimumLeaseMonths", e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}

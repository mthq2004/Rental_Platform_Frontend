"use client";

import React, { useEffect, useState } from "react";
import { Modal, Select, Input, Spin, App } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";

import provinceService from "@/services/province.service";
import { Province, District, Ward } from "@/types/province.type";
import { AddressData } from "./types";

const { Option } = Select;

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (addressData: AddressData) => void;
}

export default function AddressModal({
  open,
  onClose,
  onConfirm,
}: AddressModalProps) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] =
    useState<{ code: number; name: string } | null>(null);
  const [selectedDistrict, setSelectedDistrict] =
    useState<{ code: number; name: string } | null>(null);
  const [selectedWard, setSelectedWard] =
    useState<{ code: number; name: string } | null>(null);

  const [streetAddress, setStreetAddress] = useState("");

  /* =========================
     Load Provinces
  ========================= */
  useEffect(() => {
    if (open) loadProvinces();
  }, [open]);

  const loadProvinces = async () => {
    try {
      setLoading(true);
      const data = await provinceService.getProvinces();
      setProvinces(data);
    } catch {
      message.error("Không thể tải tỉnh/thành phố");
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceChange = async (code: number, option: any) => {
    setSelectedProvince({ code, name: option.children });
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);

    try {
      setLoading(true);
      const data = await provinceService.getProvinceWithDistricts(code);
      setDistricts(data.districts || []);
    } catch {
      message.error("Không thể tải quận/huyện");
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictChange = async (code: number, option: any) => {
    setSelectedDistrict({ code, name: option.children });
    setSelectedWard(null);
    setWards([]);

    try {
      setLoading(true);
      const data = await provinceService.getDistrictWithWards(code);
      setWards(data.wards || []);
    } catch {
      message.error("Không thể tải xã/phường");
    } finally {
      setLoading(false);
    }
  };

  const handleWardChange = (code: number, option: any) => {
    setSelectedWard({ code, name: option.children });
  };

  /* =========================
     Confirm
  ========================= */
  const handleConfirm = () => {
    if (!selectedProvince)
      return message.warning("Vui lòng chọn Tỉnh/Thành phố");
    if (!selectedDistrict)
      return message.warning("Vui lòng chọn Quận/Huyện");
    if (!selectedWard)
      return message.warning("Vui lòng chọn Xã/Phường");
    if (!streetAddress.trim())
      return message.warning("Vui lòng nhập số nhà, tên đường");

    const fullAddress = [
      streetAddress.trim(),
      selectedWard.name,
      selectedDistrict.name,
      selectedProvince.name,
    ].join(", ");

    onConfirm({
      city: selectedProvince.name,
      cityCode: selectedProvince.code,
      district: selectedDistrict.name,
      districtCode: selectedDistrict.code,
      ward: selectedWard.name,
      wardCode: selectedWard.code,
      streetAddress: streetAddress.trim(),
      fullAddress,
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setStreetAddress("");
    setDistricts([]);
    setWards([]);
  };

  /* =========================
     Render
  ========================= */
  return (
    <Modal
      open={open}
      onCancel={() => {
        resetForm();
        onClose();
      }}
      footer={null}
      width={560}
      centered
      title={
        <div className="flex items-center gap-2">
          <EnvironmentOutlined className="text-blue-500" />
          <span>Chọn địa chỉ bất động sản</span>
        </div>
      }
    >
      <Spin spinning={loading}>
        <div className="py-4 space-y-4">
          {/* Province */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              placeholder="Chọn Tỉnh/Thành phố"
              value={selectedProvince?.code}
              onChange={handleProvinceChange}
            >
              {provinces.map((p) => (
                <Option key={p.code} value={p.code}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              placeholder="Chọn Quận/Huyện"
              disabled={!selectedProvince}
              value={selectedDistrict?.code}
              onChange={handleDistrictChange}
            >
              {districts.map((d) => (
                <Option key={d.code} value={d.code}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </div>

          {/* Ward */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Xã/Phường <span className="text-red-500">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              placeholder="Chọn Xã/Phường"
              disabled={!selectedDistrict}
              value={selectedWard?.code}
              onChange={handleWardChange}
            >
              {wards.map((w) => (
                <Option key={w.code} value={w.code}>
                  {w.name}
                </Option>
              ))}
            </Select>
          </div>

          {/* Street */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Số nhà, tên đường <span className="text-red-500">*</span>
            </label>
            <Input
              size="large"
              placeholder="Ví dụ: 123 Nguyễn Văn Linh"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-6 py-2 rounded-lg border border-gray-300"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </Spin>
    </Modal>
  );
}

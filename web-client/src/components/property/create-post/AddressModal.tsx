"use client";

import React, { useEffect, useState, useMemo } from "react";
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

  /* =========================
     Handlers
  ========================= */
  const handleProvinceChange = async (code: number, option: any) => {
    setSelectedProvince({ code, name: option.label });
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
    setSelectedDistrict({ code, name: option.label });
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
    setSelectedWard({ code, name: option.label });
  };

  /* =========================
     Filter function (search)
  ========================= */
  const filterOption = (input: string, option: any) =>
    option?.label?.toLowerCase().includes(input.toLowerCase());

  /* =========================
     Google Maps Query
  ========================= */
  const mapQuery = useMemo(() => {
    const parts = [
      streetAddress.trim(),
      selectedWard?.name,
      selectedDistrict?.name,
      selectedProvince?.name,
    ].filter(Boolean);

    // Chỉ hiển thị map khi có ít nhất đến cấp Phường/Xã
    if (!selectedProvince || !selectedDistrict || !selectedWard) return "";
    return parts.join(", ");
  }, [streetAddress, selectedWard, selectedDistrict, selectedProvince]);

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
      width={680}
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
              showSearch
              allowClear
              className="w-full"
              placeholder="Tìm hoặc chọn Tỉnh/Thành phố"
              value={selectedProvince?.code}
              onChange={handleProvinceChange}
              filterOption={filterOption}
              options={provinces.map((p) => ({
                value: p.code,
                label: p.name,
              }))}
            />
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <Select
              size="large"
              showSearch
              allowClear
              className="w-full"
              placeholder="Tìm hoặc chọn Quận/Huyện"
              disabled={!selectedProvince}
              value={selectedDistrict?.code}
              onChange={handleDistrictChange}
              filterOption={filterOption}
              options={districts.map((d) => ({
                value: d.code,
                label: d.name,
              }))}
            />
          </div>

          {/* Ward */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Xã/Phường <span className="text-red-500">*</span>
            </label>
            <Select
              size="large"
              showSearch
              allowClear
              className="w-full"
              placeholder="Tìm hoặc chọn Xã/Phường"
              disabled={!selectedDistrict}
              value={selectedWard?.code}
              onChange={handleWardChange}
              filterOption={filterOption}
              options={wards.map((w) => ({
                value: w.code,
                label: w.name,
              }))}
            />
          </div>

          {/* Street */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Số nhà, tên đường <span className="text-red-500">*</span>
            </label>
            <Input
              size="large"
              placeholder="Ví dụ: 460/6 Nơ Trang Long"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
            />
          </div>

          {/* Google Maps Preview */}
          {mapQuery && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                📍 Xác nhận vị trí trên bản đồ
              </label>
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <iframe
                  key={mapQuery}
                  width="100%"
                  height="260"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Địa chỉ: {mapQuery}
              </p>
            </div>
          )}

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
export const FIELD_STANDARD = [
  // ================= OWNER =================
  {
    name: "owner.name",
    label: "Tên chủ nhà",
    type: "string",
    source: "system",
    readonly: true
  },
  {
    name: "owner.phone",
    label: "Số điện thoại chủ nhà",
    type: "string",
    source: "system",
    readonly: true
  },
  {
    name: "owner.email",
    label: "Email chủ nhà",
    type: "string",
    source: "system",
    readonly: true
  },
  {
    name: "owner.address",
    label: "Địa chỉ chủ nhà",
    type: "string",
    source: "system",
    readonly: true
  },
  {
    name: "owner.idNumber",
    label: "CMND/CCCD chủ nhà",
    type: "string",
    source: "system",
    readonly: true
  },

  // ================= TENANT =================
  {
    name: "tenant.name",
    label: "Tên người thuê",
    type: "string",
    source: "system",
    readonly: true
  },
  {
    name: "tenant.phone",
    label: "Số điện thoại người thuê",
    type: "string",
    source: "system",
    readonly: true
  },
  {
    name: "tenant.email",
    label: "Email người thuê",
    type: "string",
    source: "system",
    readonly: true
  },
  {
    name: "tenant.address",
    label: "Địa chỉ người thuê",
    type: "string",
    source: "system",
    readonly: true
  },
  {
    name: "tenant.idNumber",
    label: "CMND/CCCD người thuê",
    type: "string",
    source: "system",
    readonly: true
  },

  // ================= PROPERTY =================
  {
    name: "property.name",
    label: "Tên bất động sản",
    type: "string",
    source: "system",
    readonly: true
  },
  {
    name: "property.address",
    label: "Địa chỉ",
    type: "string",
    source: "system",
    readonly: true
  },
  {
    name: "property.type",
    label: "Loại hình",
    type: "string",
    source: "system",
    readonly: true
  },
  {
    name: "property.area",
    label: "Diện tích (m²)",
    type: "number",
    source: "system",
    readonly: true
  },

  {
    name: "property.monthlyRent",
    label: "Giá thuê hàng tháng",
    type: "number",
    source: "contract",
    required: true
  },
  {
    name: "property.depositAmount",
    label: "Tiền đặt cọc",
    type: "number",
    source: "contract",
    required: true
  },

  // ================= CONTRACT BASIC =================
  {
    name: "contract.contractNumber",
    label: "Số hợp đồng",
    type: "string",
    source: "contract"
  },
  {
    name: "contract.contractDate",
    label: "Ngày ký hợp đồng",
    type: "date",
    source: "contract",
    required: true
  },
  {
    name: "contract.location",
    label: "Địa điểm ký",
    type: "string",
    source: "custom"
  },
  {
    name: "contract.signingLocation",
    label: "Địa điểm ký hợp đồng",
    type: "string",
    source: "custom"
  },

  {
    name: "contract.startDate",
    label: "Ngày bắt đầu",
    type: "date",
    source: "contract",
    required: true
  },
  {
    name: "contract.endDate",
    label: "Ngày kết thúc",
    type: "date",
    source: "contract",
    required: true
  },
  {
    name: "contract.durationMonths",
    label: "Thời gian thuê (tháng)",
    type: "number",
    source: "computed",
    readonly: true
  },

  // ================= UTILITIES =================
  {
    name: "property.electricityCostPerKwh",
    label: "Giá điện (VNĐ/kWh)",
    type: "number",
    source: "contract"
  },
  {
    name: "contract.electricityCostPerKwh",
    label: "Giá điện (VNĐ/kWh)",
    type: "number",
    source: "contract"
  },
  {
    name: "property.waterCostPerM3",
    label: "Giá nước (VNĐ/m³)",
    type: "number",
    source: "contract"
  },
  {
    name: "contract.waterCostPerM3",
    label: "Giá nước (VNĐ/m³)",
    type: "number",
    source: "contract"
  },
  {
    name: "property.internetFee",
    label: "Phí internet (VNĐ/tháng)",
    type: "number",
    source: "contract"
  },
  {
    name: "contract.internetFee",
    label: "Phí internet (VNĐ/tháng)",
    type: "number",
    source: "contract"
  },
  {
    name: "property.parkingFee",
    label: "Phí gửi xe (VNĐ/tháng)",
    type: "number",
    source: "contract"
  },
  {
    name: "contract.parkingFee",
    label: "Phí gửi xe (VNĐ/tháng)",
    type: "number",
    source: "contract"
  },
  {
    name: "property.managementFee",
    label: "Phí quản lý (VNĐ/tháng)",
    type: "number",
    source: "contract"
  },
  {
    name: "contract.managementFee",
    label: "Phí quản lý (VNĐ/tháng)",
    type: "number",
    source: "contract"
  },
  {
    name: "contract.usableArea",
    label: "Diện tích sử dụng (m²)",
    type: "number",
    source: "contract"
  },
  {
    name: "contract.monthlyRent",
    label: "Tiền thuê hàng tháng",
    type: "number",
    source: "contract",
    required: true
  },
  {
    name: "contract.depositAmount",
    label: "Tiền đặt cọc",
    type: "number",
    source: "contract",
    required: true
  },

  // ================= PAYMENT =================
  {
    name: "contract.paymentDueDay",
    label: "Ngày thanh toán hàng tháng",
    type: "number",
    source: "contract"
  },
  {
    name: "contract.lateFeePerDay",
    label: "Phí trễ mỗi ngày",
    type: "number",
    source: "contract"
  },
  {
    name: "contract.gracePeriodDays",
    label: "Số ngày ân hạn",
    type: "number",
    source: "contract"
  },

  // ================= RENEWAL =================
  {
    name: "contract.autoRenewal",
    label: "Tự động gia hạn",
    type: "boolean",
    source: "contract"
  },
  {
    name: "contract.renewalNoticeDays",
    label: "Số ngày báo trước gia hạn",
    type: "number",
    source: "contract"
  },

  // ================= TERMINATION =================
  {
    name: "contract.earlyTerminationFee",
    label: "Phí chấm dứt sớm",
    type: "number",
    source: "contract"
  },

  // ================= CUSTOM =================
  {
    name: "custom.generalTerms",
    label: "Điều khoản chung",
    type: "string",
    source: "custom"
  },
  {
    name: "custom.specialTerms",
    label: "Điều khoản riêng",
    type: "string",
    source: "custom"
  }
];

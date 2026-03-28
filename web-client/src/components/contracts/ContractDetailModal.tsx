"use client";

import React from "react";
import { Modal, Tag, Button, Space, Timeline } from "antd";
import {
  FileTextOutlined,
  EditOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { RentalContract, RentalContractStatus } from "@/types/contract.type";
import { STATUS_CONFIG, formatDate, formatCurrency } from "./ContractStatusConfig";
import dayjs from "dayjs";

interface ContractDetailModalProps {
  open: boolean;
  contractDetail: RentalContract | null;
  userId: string | undefined;
  onClose: () => void;
  onEdit: (record: RentalContract) => void;
  onTenantSign: (rentalId: string) => void;
  onOwnerSign: (rentalId: string) => void;
  onActivate: (rentalId: string) => void;
  onCancel: (rentalId: string) => void;
}

export default function ContractDetailModal({
  open,
  contractDetail,
  userId,
  onClose,
  onEdit,
  onTenantSign,
  onOwnerSign,
  onActivate,
  onCancel,
}: ContractDetailModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={null}
      footer={null}
      width={1000}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      {contractDetail && (() => {
        const cfg = STATUS_CONFIG[contractDetail.status] || STATUS_CONFIG.draft;
        const ownerSide = contractDetail.ownerId === userId;
        const tenantSigned = contractDetail.signatureLog?.some((l) => l.action === "TENANT_SIGNED");
        const landlordSigned = contractDetail.signatureLog?.some((l) => l.action === "LANDLORD_SIGNED");
        const tenantSignDate = contractDetail.signatureLog?.find((l) => l.action === "TENANT_SIGNED")?.createdAt;
        const landlordSignDate = contractDetail.signatureLog?.find((l) => l.action === "LANDLORD_SIGNED")?.createdAt;

        return (
          <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b rounded-t-lg">
              <div className="flex items-center gap-3">
                <FileTextOutlined className="text-blue-500 text-lg" />
                <span className="font-semibold text-gray-700">Hợp đồng thuê nhà</span>
                <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
              </div>
              <Space>
                {contractDetail.status === "draft" && ownerSide && (
                  <>
                    <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(contractDetail)}>
                      Chỉnh sửa
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => onOwnerSign(contractDetail.rentalId)}
                    >
                      Ký hợp đồng
                    </Button>
                  </>
                )}

                {contractDetail.status === "owner_signed" && !ownerSide && (
                  <>
                    {contractDetail.signedContractUrl && (
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        href={contractDetail.signedContractUrl}
                        target="_blank"
                      >
                        Tải hợp đồng đã ký
                      </Button>
                    )}
                    <Button size="small" type="primary" onClick={() => onTenantSign(contractDetail.rentalId)}>
                      Ký hợp đồng
                    </Button>
                  </>
                )}

                {contractDetail.status === "fully_signed" && ownerSide && (
                  <Button size="small" type="primary" onClick={() => onActivate(contractDetail.rentalId)}>
                    Kích hoạt hợp đồng
                  </Button>
                )}

                {/* Cancel/Reject buttons */}
                {contractDetail.status === "draft" && ownerSide && (
                    <Button
                      size="small"
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => onCancel(contractDetail.rentalId)}
                    >
                      Từ chối / Hủy
                    </Button>
                  )}
              </Space>
            </div>

            {/* A4 document view area */}
            <div className="overflow-y-auto bg-[#e8eaed]" style={{ maxHeight: "80vh" }}>
              <div
                className="mx-auto my-8 bg-white shrink-0 contract-a4-view transition-all duration-300"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  padding: "25mm 20mm",
                  fontFamily: "'Times New Roman', Times, serif",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.06)",
                  borderRadius: "2px",
                  position: "relative",
                  color: "#1a1a1a",
                  lineHeight: 1.6,
                }}
              >
                {contractDetail.contractHtml ? (
                  <div
                    className="contract-content-html"
                    style={{ fontSize: "12pt" }}
                    dangerouslySetInnerHTML={{ __html: contractDetail.contractHtml }}
                  />
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <h1 className="font-bold text-[14pt] uppercase mb-1">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
                      <h2 className="italic font-bold text-[12pt] mb-1">Độc lập - Tự do - Hạnh phúc</h2>
                      <div className="mx-auto mt-2 border-b-[1.5px] border-black w-32"></div>
                    </div>

                    <div className="text-center mb-10 mt-6">
                      <h2 className="text-[16pt] font-bold uppercase tracking-widest mb-1">HỢP ĐỒNG THUÊ NHÀ Ở</h2>
                      <p className="text-[13pt] mt-2">Số: <strong>{contractDetail.contractCode}</strong></p>
                      <p className="text-[13pt] italic">Ngày {dayjs(contractDetail.createdAt).format("DD/MM/YYYY")}</p>
                    </div>

                    <div className="mb-8 text-[12pt] italic leading-relaxed">
                      <p>- Căn cứ Bộ luật Dân sự nước Cộng hoà xã hội chủ nghĩa Việt Nam;</p>
                      <p>- Căn cứ Luật Nhà ở và các văn bản hướng dẫn thi hành;</p>
                      <p>- Dựa trên nhu cầu và thoả thuận tự nguyện giữa các bên.</p>
                    </div>

                    <section className="mb-8">
                      <h3 className="font-bold text-[12pt] uppercase mb-4 border-b border-gray-100 pb-1">I. CÁC BÊN THAM GIA</h3>
                      <div className="grid grid-cols-2 gap-8 text-[12pt]">
                        <div className="space-y-1">
                          <p className="font-bold">BÊN CHO THUÊ (BÊN A):</p>
                          <p>Họ tên: {contractDetail.owner?.name || "N/A"}</p>
                          <p className="text-gray-400 text-xs break-all">ID: {contractDetail.ownerId}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold">BÊN THUÊ (BÊN B):</p>
                          <p>Họ tên: {contractDetail.tenant?.name || "N/A"}</p>
                          <p className="text-gray-400 text-xs break-all">ID: {contractDetail.tenantId}</p>
                        </div>
                      </div>
                    </section>

                    <section className="mb-8 text-[12pt]">
                      <h3 className="font-bold text-[12pt] uppercase mb-4 border-b border-gray-100 pb-1">II. NỘI DUNG CHÍNH</h3>
                      <div className="space-y-3">
                        <p><strong>Điều 1.</strong> Đối tượng cho thuê: Bất động sản mã {contractDetail.propertyId}</p>
                        <p><strong>Điều 2.</strong> Thời hạn thuê: Từ {formatDate(contractDetail.startDate)} đến {formatDate(contractDetail.endDate)}</p>
                        <p><strong>Điều 3.</strong> Giá thuê: {formatCurrency(contractDetail.monthlyRent)}/tháng</p>
                        <p><strong>Điều 4.</strong> Đặt cọc: {formatCurrency(contractDetail.depositAmount)}</p>
                      </div>
                    </section>
                  </>
                )}

                <div className="mt-20">
                  <div className="grid grid-cols-2 gap-10 text-center text-[12pt]">
                    <div>
                      <p className="font-bold uppercase mb-2">BÊN CHO THUÊ</p>
                      <p className="italic text-xs mb-8 text-gray-400">(Ký và ghi rõ họ tên)</p>
                      {landlordSigned ? (
                        <div className="flex flex-col items-center">
                          <div className="border-2 border-green-500 rounded-md p-2 bg-green-50 text-green-600 font-bold uppercase rotate-[-5deg]">
                            ĐÃ KÝ SỐ
                          </div>
                          <p className="text-[10pt] text-gray-500 mt-2">{dayjs(landlordSignDate).format("HH:mm DD/MM/YYYY")}</p>
                        </div>
                      ) : (
                        <div className="h-20 flex items-center justify-center border border-dashed border-gray-200 rounded text-gray-300 italic">Chưa ký</div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold uppercase mb-2">BÊN THUÊ</p>
                      <p className="italic text-xs mb-8 text-gray-400">(Ký và ghi rõ họ tên)</p>
                      {tenantSigned ? (
                        <div className="flex flex-col items-center">
                          <div className="border-2 border-green-500 rounded-md p-2 bg-green-50 text-green-600 font-bold uppercase rotate-[-5deg]">
                            ĐÃ KÝ SỐ
                          </div>
                          <p className="text-[10pt] text-gray-500 mt-2">{dayjs(tenantSignDate).format("HH:mm DD/MM/YYYY")}</p>
                        </div>
                      ) : (
                        <div className="h-20 flex items-center justify-center border border-dashed border-gray-200 rounded text-gray-300 italic">Chưa ký</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-[210mm] mx-auto mb-10 px-8 py-6 bg-white border-t border-gray-100 rounded-b shadow-sm">
                <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                  <CheckCircleOutlined className="text-blue-500" />
                  Lịch sử ký kết & Thao tác
                </h4>
                <Timeline
                  items={contractDetail.signatureLog?.map((log) => ({
                    color: log.action.includes("SIGNED") ? "green" : "blue",
                    children: (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700">
                          {log.action === "SENT_TO_TENANT" && "Gửi hợp đồng cho người thuê"}
                          {log.action === "TENANT_SIGNED" && "Người thuê đã ký xác nhận"}
                          {log.action === "LANDLORD_SIGNED" && "Chủ nhà đã ký xác nhận"}
                          {log.action === "ACTIVATED" && "Hợp đồng đã được kích hoạt"}
                          {log.action === "CANCELLED" && "Hợp đồng bị hủy"}
                          {!["SENT_TO_TENANT", "TENANT_SIGNED", "LANDLORD_SIGNED", "ACTIVATED", "CANCELLED"].includes(log.action) && log.action}
                        </span>
                        <span className="text-xs text-gray-400">
                          {dayjs(log.createdAt).format("HH:mm:ss · DD/MM/YYYY")}
                        </span>
                      </div>
                    ),
                  })) || []}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}

"use client";

import React from "react";
import { Modal, Tag, Button, Space, Timeline } from "antd";
import {
  FileTextOutlined,
  EditOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { RentalContract } from "@/types/contract.type";
import { STATUS_CONFIG, formatDate, formatCurrency } from "./ContractStatusConfig";
import dayjs from "dayjs";

interface ContractDetailModalProps {
  open: boolean;
  contractDetail: RentalContract | null;
  userId: string | undefined;
  onClose: () => void;
  onEdit: (record: RentalContract) => void;
  onSendToTenant: (rentalId: string) => void;
  onTenantSign: (rentalId: string) => void;
  onOwnerSign: (rentalId: string) => void;
  onActivate: (rentalId: string) => void;
}

export default function ContractDetailModal({
  open,
  contractDetail,
  userId,
  onClose,
  onEdit,
  onSendToTenant,
  onTenantSign,
  onOwnerSign,
  onActivate,
}: ContractDetailModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={null}
      footer={null}
      width={860}
      destroyOnClose
      styles={{ body: { padding: 0 } }}
    >
      {contractDetail && (() => {
        const cfg = STATUS_CONFIG[contractDetail.status] || STATUS_CONFIG.draft;
        const ownerSide = contractDetail.ownerId === userId;
        const tenantSigned = contractDetail.signatureLog?.some((l) => l.action === "TENANT_SIGNED");
        const landlordSigned = contractDetail.signatureLog?.some((l) => l.action === "LANDLORD_SIGNED");
        const tenantSignDate = contractDetail.signatureLog?.find((l) => l.action === "TENANT_SIGNED")?.createdAt;
        const landlordSignDate = contractDetail.signatureLog?.find((l) => l.action === "LANDLORD_SIGNED")?.createdAt;
        const hasFees =
          contractDetail.electricityCostPerKwh != null ||
          contractDetail.waterCostPerM3 != null ||
          contractDetail.managementFee != null ||
          contractDetail.parkingFee != null ||
          contractDetail.internetFee != null;

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
                      icon={<SendOutlined />}
                      onClick={() => onSendToTenant(contractDetail.rentalId)}
                    >
                      Gửi cho người thuê
                    </Button>
                  </>
                )}
                {contractDetail.status === "pending_tenant" && !ownerSide && (
                  <Button size="small" type="primary" onClick={() => onTenantSign(contractDetail.rentalId)}>
                    Ký hợp đồng
                  </Button>
                )}
                {contractDetail.status === "pending_landlord" && ownerSide && (
                  <Button size="small" type="primary" onClick={() => onOwnerSign(contractDetail.rentalId)}>
                    Ký hợp đồng
                  </Button>
                )}
                {contractDetail.status === "fully_signed" && ownerSide && (
                  <Button size="small" type="primary" onClick={() => onActivate(contractDetail.rentalId)}>
                    Kích hoạt hợp đồng
                  </Button>
                )}
              </Space>
            </div>

            {/* A4 document */}
            <div className="overflow-y-auto bg-gray-100" style={{ maxHeight: "76vh" }}>
              <div
                className="mx-auto my-6 bg-white shadow-lg"
                style={{ maxWidth: 700, padding: "48px 64px", fontFamily: "'Times New Roman', Times, serif" }}
              >
                {/* National header */}
                <div className="text-center mb-5">
                  <p className="font-bold text-sm tracking-wide">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p className="italic text-sm">Độc lập - Tự do - Hạnh phúc</p>
                  <p className="text-gray-400 text-xs mt-1">────────────────────────</p>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold uppercase tracking-widest mb-1">HỢP ĐỒNG THUÊ NHÀ Ở</h2>
                  <p className="text-sm">Số: <strong>{contractDetail.contractCode}</strong></p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ngày {dayjs(contractDetail.createdAt).format("DD")} tháng{" "}
                    {dayjs(contractDetail.createdAt).format("MM")} năm{" "}
                    {dayjs(contractDetail.createdAt).format("YYYY")}
                  </p>
                </div>

                {/* Legal basis */}
                <div className="mb-5 text-sm text-gray-600 italic leading-relaxed">
                  <p>- Căn cứ Bộ luật Dân sự nước Cộng hoà xã hội chủ nghĩa Việt Nam;</p>
                  <p>- Căn cứ Luật Nhà ở và các văn bản hướng dẫn thi hành;</p>
                  <p>- Dựa trên nhu cầu và thoả thuận tự nguyện giữa các bên.</p>
                </div>

                {/* Parties */}
                <section className="mb-5">
                  <h3 className="font-bold text-sm uppercase mb-3 pb-1" style={{ borderBottom: "1.5px solid #333" }}>
                    I. CÁC BÊN THAM GIA HỢP ĐỒNG
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="font-bold text-blue-700">BÊN A – BÊN CHO THUÊ</p>
                      {ownerSide && <span className="text-xs text-blue-500">(Bạn)</span>}
                      <p className="text-gray-400 text-xs mt-1 break-all">ID: {contractDetail.ownerId}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <p className="font-bold text-green-700">BÊN B – BÊN THUÊ</p>
                      {!ownerSide && <span className="text-xs text-green-500">(Bạn)</span>}
                      <p className="text-gray-400 text-xs mt-1 break-all">ID: {contractDetail.tenantId}</p>
                    </div>
                  </div>
                </section>

                {/* Content header */}
                <section className="mb-1">
                  <h3 className="font-bold text-sm uppercase mb-3 pb-1" style={{ borderBottom: "1.5px solid #333" }}>
                    II. NỘI DUNG HỢP ĐỒNG
                  </h3>
                </section>

                {/* Article 1 */}
                <section className="mb-4 text-sm">
                  <p className="font-bold mb-1">Điều 1. Đối tượng hợp đồng</p>
                  <p className="leading-relaxed">
                    Bên A đồng ý cho Bên B thuê bất động sản mã:{" "}
                    <strong>{contractDetail.propertyId}</strong>
                  </p>
                </section>

                {/* Article 2 */}
                <section className="mb-4 text-sm">
                  <p className="font-bold mb-2">Điều 2. Thời hạn và giá thuê</p>
                  <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td className="py-1.5 text-gray-600 w-48">Thời gian thuê:</td>
                        <td className="py-1.5 font-medium">
                          {formatDate(contractDetail.startDate)} — {formatDate(contractDetail.endDate)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td className="py-1.5 text-gray-600">Giá thuê hàng tháng:</td>
                        <td className="py-1.5 font-bold text-red-600">{formatCurrency(contractDetail.monthlyRent)}</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td className="py-1.5 text-gray-600">Tiền đặt cọc:</td>
                        <td className="py-1.5 font-medium">{formatCurrency(contractDetail.depositAmount)}</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td className="py-1.5 text-gray-600">Ngày thanh toán:</td>
                        <td className="py-1.5">
                          Ngày <strong>{contractDetail.paymentDueDay}</strong> hàng tháng
                        </td>
                      </tr>
                      {contractDetail.gracePeriodDays > 0 && (
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td className="py-1.5 text-gray-600">Gia hạn thanh toán:</td>
                          <td className="py-1.5">{contractDetail.gracePeriodDays} ngày</td>
                        </tr>
                      )}
                      {contractDetail.lateFeePerDay != null && (
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td className="py-1.5 text-gray-600">Phí chậm/ngày:</td>
                          <td className="py-1.5">{formatCurrency(contractDetail.lateFeePerDay)}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-1.5 text-gray-600">Tự động gia hạn:</td>
                        <td className="py-1.5">{contractDetail.autoRenewal ? "Có" : "Không"}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                {/* Article 3: Fees */}
                {hasFees && (
                  <section className="mb-4 text-sm">
                    <p className="font-bold mb-2">Điều 3. Chi phí dịch vụ</p>
                    <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                      <tbody>
                        {contractDetail.electricityCostPerKwh != null && (
                          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td className="py-1.5 text-gray-600 w-48">Tiền điện:</td>
                            <td className="py-1.5">{formatCurrency(contractDetail.electricityCostPerKwh)} / kWh</td>
                          </tr>
                        )}
                        {contractDetail.waterCostPerM3 != null && (
                          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td className="py-1.5 text-gray-600">Tiền nước:</td>
                            <td className="py-1.5">{formatCurrency(contractDetail.waterCostPerM3)} / m³</td>
                          </tr>
                        )}
                        {contractDetail.managementFee != null && (
                          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td className="py-1.5 text-gray-600">Phí quản lý:</td>
                            <td className="py-1.5">{formatCurrency(contractDetail.managementFee)}</td>
                          </tr>
                        )}
                        {contractDetail.parkingFee != null && (
                          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td className="py-1.5 text-gray-600">Phí giữ xe:</td>
                            <td className="py-1.5">{formatCurrency(contractDetail.parkingFee)}</td>
                          </tr>
                        )}
                        {contractDetail.internetFee != null && (
                          <tr>
                            <td className="py-1.5 text-gray-600">Phí internet:</td>
                            <td className="py-1.5">{formatCurrency(contractDetail.internetFee)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </section>
                )}

                {/* Article 4: Terms */}
                {contractDetail.terms && contractDetail.terms.length > 0 && (
                  <section className="mb-4 text-sm">
                    <p className="font-bold mb-2">Điều {hasFees ? 4 : 3}. Điều khoản và nội quy</p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-gray-700 leading-relaxed">
                      {contractDetail.terms.map((term) => (
                        <li key={term.id}>{term.content}</li>
                      ))}
                    </ol>
                  </section>
                )}

                {/* Notes */}
                {contractDetail.notes && (
                  <section className="mb-4 text-sm">
                    <p className="font-bold mb-2">Ghi chú bổ sung</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {contractDetail.notes}
                    </div>
                  </section>
                )}

                {/* Signature history */}
                {contractDetail.signatureLog && contractDetail.signatureLog.length > 0 && (
                  <section className="mb-4 text-sm">
                    <p className="font-bold mb-2">Lịch sử thao tác</p>
                    <Timeline
                      items={contractDetail.signatureLog.map((log) => ({
                        color: log.action.includes("SIGNED") ? "green" : "blue",
                        children: (
                          <span className="text-xs text-gray-600">
                            {log.action === "SENT_TO_TENANT" && "Gửi cho người thuê"}
                            {log.action === "TENANT_SIGNED" && "Người thuê đã ký"}
                            {log.action === "LANDLORD_SIGNED" && "Chủ nhà đã ký"}
                            {!["SENT_TO_TENANT", "TENANT_SIGNED", "LANDLORD_SIGNED"].includes(log.action) && log.action}
                            {" · "}
                            {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm")}
                          </span>
                        ),
                      }))}
                    />
                  </section>
                )}

                {/* Signatures */}
                <section className="mt-8 pt-5" style={{ borderTop: "2px solid #333" }}>
                  <div className="grid grid-cols-2 gap-8 text-center text-sm">
                    <div>
                      <p className="font-bold">BÊN A – BÊN CHO THUÊ</p>
                      <p className="text-gray-400 text-xs italic mb-3">(Chủ nhà)</p>
                      {landlordSigned ? (
                        <div className="border border-green-400 rounded p-3 bg-green-50">
                          <CheckCircleOutlined className="text-green-500 text-xl" />
                          <p className="text-green-600 text-xs mt-1 font-medium">Đã ký điện tử</p>
                          <p className="text-gray-500 text-xs">{formatDate(landlordSignDate || "")}</p>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded p-4 text-gray-400 text-xs">
                          Chưa ký
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold">BÊN B – BÊN THUÊ</p>
                      <p className="text-gray-400 text-xs italic mb-3">(Người thuê)</p>
                      {tenantSigned ? (
                        <div className="border border-green-400 rounded p-3 bg-green-50">
                          <CheckCircleOutlined className="text-green-500 text-xl" />
                          <p className="text-green-600 text-xs mt-1 font-medium">Đã ký điện tử</p>
                          <p className="text-gray-500 text-xs">{formatDate(tenantSignDate || "")}</p>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded p-4 text-gray-400 text-xs">
                          Chưa ký
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}

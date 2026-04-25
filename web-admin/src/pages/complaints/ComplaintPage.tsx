import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  Row,
  Select,
  Table,
  Tag,
  Typography,
  message,
  Radio,
  Space,
  Avatar,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  AlertFilled,
  UserOutlined,
  BankOutlined,
  FileImageOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  FilePdfOutlined,
  FileOutlined,
} from "@ant-design/icons";
import http from "../../utils/api";
import "../dashboard/dashboard-enterprise.css";
import "./disputes.css";

const { Text, Title, Paragraph } = Typography;

// --- Interfaces ---
interface ReportHistory {
  id: string;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  performedBy?: string;
  note?: string;
  createdAt: string;
}

interface Report {
  id: string;
  rentalId: string;
  createdBy: string;
  againstId: string;
  type: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  adminNote?: string;
  createdAt: string;
  resolvedAt?: string;
  histories: ReportHistory[];
  attachments?: { id: string; url: string; type: string; fileName?: string; uploadedBy?: string; }[];
  terminationRequest?: {
    terminationRequestId: string;
    reason: string;
    note?: string;
    reviewNote?: string;
    requestedBy?: string;
    status: string;
    requesterRole: string;
    requestedTerminationDate: string;
    earlyTerminationFee?: number;
    resolution?: string;
  };
  rental?: {
    rentalId: string;
    contractCode: string;
    propertyId: string;
    ownerId: string;
    tenantId: string;
    monthlyRent?: number;
    depositAmount?: number;
    property?: {
      title: string;
      address: string;
    };
    tenantUser?: {
      fullName: string;
    };
    ownerUser?: {
      fullName: string;
    };
  };
}

interface ReportStats {
  total: number;
  open: number;
  negotiating: number;
  admin: number;
  resolved: number;
  cancelRequested: number;
  cancelled: number;
}

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

// --- Configs mapping to the UI Design ---

const priorityConfig: Record<string, { bg: string; color: string; label: string }> = {
  low: { bg: "#e0e7ff", color: "#3730a3", label: "Thấp" },
  medium: { bg: "#ffedd5", color: "#9a3412", label: "Trung bình" },
  high: { bg: "#fee2e2", color: "#991b1b", label: "Cao" },
};

const statusConfig: Record<string, { dot: string; bg: string; color: string; label: string }> = {
  open: { dot: "#ef4444", bg: "#fce7f3", color: "#831843", label: "Yêu cầu mới" },
  negotiating: { dot: "#f59e0b", bg: "#fef3c7", color: "#92400e", label: "Đang thương lượng" },
  admin: { dot: "#dc2626", bg: "#f5e6e6", color: "#7f1d1d", label: "Admin xem xét" }, // Matching image style
  resolved: { dot: "#10b981", bg: "#d1fae5", color: "#065f46", label: "Đã giải quyết" },
  cancel_requested: { dot: "#6366f1", bg: "#e0e7ff", color: "#3730a3", label: "Chờ hủy" },
  cancelled: { dot: "#6b7280", bg: "#f3f4f6", color: "#374151", label: "Đã hủy" },
};

const typeConfig: Record<string, string> = {
  payment: "Vấn đề thanh toán",
  deposit: "Tranh chấp tiền cọc",
  property: "Hư hỏng tài sản",
  contract: "Vi phạm hợp đồng",
  other: "Khác",
  unlawful_eviction: "Thông báo trục xuất trái phép",
  deposit_withholding: "Giữ tiền cọc sai quy định",
  late_fee: "Tranh chấp phí phạt trễ"
};

const ComplaintPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats>({ total: 0, open: 0, negotiating: 0, admin: 0, resolved: 0, cancelRequested: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  
  // Resolution View State
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionViewOpen, setResolutionViewOpen] = useState(false);
  
  // Resolution Form State
  const [adminNote, setAdminNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const [terminationResolution, setTerminationResolution] = useState<string>("continue_contract");
  const [depositReturnAmount, setDepositReturnAmount] = useState<number>(0);
  const [penaltyAmount, setPenaltyAmount] = useState<number>(0);
  const [amountRetained, setAmountRetained] = useState<number>(0);

  // Filters
  const [filterPriority, setFilterPriority] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [searchText, setSearchText] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPriority) params.append("priority", filterPriority);
      if (filterType) params.append("type", filterType);
      if (searchText) params.append("search", searchText);

      const queryString = params.toString();
      const url = `/contract/admin/reports${queryString ? `?${queryString}` : ""}`;
      const res = await http.get(url);
      setReports(res.data.reports || []);
      setStats(res.data.stats || { total: 0, open: 0, negotiating: 0, admin: 0, resolved: 0, cancelRequested: 0, cancelled: 0 });
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filterPriority, filterType, searchText]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpenResolutionView = async (report: Report) => {
    try {
      const res = await http.get(`/contract/admin/reports/${report.id}`);
      setSelectedReport(res.data);
    } catch {
      setSelectedReport(report);
    }
    setAdminNote("");
    setTerminationResolution("continue_contract");
    // Initial financial values
    setDepositReturnAmount(report.rental?.depositAmount || 0);
    setAmountRetained(0);
    setPenaltyAmount(0);
    setResolutionViewOpen(true);
  };

  const confirmResolve = async () => {
    if (!selectedReport) return;
    if (!adminNote.trim() && terminationResolution === "terminate_contract") {
      message.warning("Vui lòng nhập ghi chú hoặc lý do cho quyết định tài chính này.");
      return;
    }
    
    setResolving(true);
    try {
      if (selectedReport.terminationRequest) {
        await http.put(`/contract/terminations/admin/${selectedReport.terminationRequest.terminationRequestId}/resolve`, {
          adminNote,
          resolution: terminationResolution,
          depositReturnAmount: terminationResolution === "terminate_contract" ? depositReturnAmount : undefined,
          penaltyAmount: terminationResolution === "terminate_contract" ? penaltyAmount : undefined,
          compensationAmount: terminationResolution === "terminate_contract" ? amountRetained : undefined, // Mapping to existing API
        });
      } else {
        await http.patch(`/contract/admin/reports/${selectedReport.id}/resolve`, {
          adminNote,
          terminationResolution,
        });
      }
      message.success("Đã xử lý khiếu nại thành công");
      setResolutionViewOpen(false);
      fetchReports();
    } catch {
      message.error("Không thể xử lý khiếu nại");
    } finally {
      setResolving(false);
    }
  };

  // Main Page Columns matching the design
  const columns = [
    {
      title: "Mã / Tiêu đề khiếu nại",
      key: "subject",
      width: 250,
      render: (_: unknown, record: Report) => (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* Priority Dot */}
          <div style={{ 
            width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0,
            backgroundColor: record.priority === "high" ? "#dc2626" : record.priority === "medium" ? "#f59e0b" : "#3b82f6" 
          }} />
          <div>
            <div style={{ fontWeight: 600, color: "#111827" }}>
              DSP-{record.id.split("-")[0].toUpperCase()}
            </div>
            <div style={{ color: "#4b5563", fontSize: 13, marginTop: 2 }}>
              {record.title || typeConfig[record.type] || record.type}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Thông tin hợp đồng",
      key: "contract",
      width: 200,
      render: (_: unknown, record: Report) => (
        <div>
          <div style={{ fontWeight: 600, color: "#374151" }}>{record.rental?.contractCode || "N/A"}</div>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
             {record.rental?.property?.address || "Chưa có địa chỉ"}
          </div>
        </div>
      ),
    },
    {
      title: "Các bên liên quan",
      key: "parties",
      width: 220,
      render: (_: unknown, record: Report) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <UserOutlined style={{ color: "#6b7280" }} />
            <span style={{ color: "#4b5563" }}>Bên thuê: <span style={{ color: "#111827", fontWeight: 500 }}>{record.rental?.tenantUser?.fullName || "Người dùng"}</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <BankOutlined style={{ color: "#6b7280" }} />
            <span style={{ color: "#4b5563" }}>Chủ nhà: <span style={{ color: "#111827", fontWeight: 500 }}>{record.rental?.ownerUser?.fullName || "Chủ nhà"}</span></span>
          </div>
        </div>
      ),
    },
    {
      title: "Mức ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority: string) => {
        const config = priorityConfig[priority] || priorityConfig.low;
        return (
          <span style={{ 
            background: config.bg, color: config.color, padding: "4px 12px", 
            borderRadius: 16, fontSize: 12, fontWeight: 500 
          }}>
            {config.label}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: string) => {
        const config = statusConfig[status] || statusConfig.open;
        return (
          <span style={{ 
            background: config.bg, color: config.color, padding: "4px 12px", 
            borderRadius: 16, fontSize: 12, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: config.dot }} />
            {config.label}
          </span>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Report) => (
        <Button 
          type="primary" 
          ghost 
          style={{ background: "#eff6ff", borderColor: "transparent", color: "#2563eb", fontWeight: 500, borderRadius: 6 }}
          onClick={() => handleOpenResolutionView(record)}
        >
          {record.status === "resolved" ? "Chi tiết" : "Xử lý"}
        </Button>
      ),
    },
  ];

  // If viewing a specific resolution, render that full screen
  if (resolutionViewOpen && selectedReport) {
    return (
      <div className="dispute-resolution-page">
        {/* Header matching Design 2 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Tag color="orange" style={{ borderRadius: 16, border: 0, background: "#ffedd5", color: "#9a3412" }}>
            ĐANG CHỜ XỬ LÝ
          </Tag>
          {selectedReport.priority === "high" && (
            <Tag color="red" style={{ borderRadius: 16, border: 0, background: "#fee2e2", color: "#991b1b" }}>
              ƯU TIÊN CAO
            </Tag>
          )}
        </div>
        
        <Title level={2} style={{ margin: "0 0 8px 0", color: "#111827" }}>
          Hồ sơ khiếu nại #DP-{selectedReport.id.split("-")[0].toUpperCase()}
        </Title>
        <Text style={{ color: "#4b5563", fontSize: 15 }}>
          {selectedReport.title || selectedReport.description.slice(0, 80) + "..."}
        </Text>

        <Row gutter={24} style={{ marginTop: 24 }}>
          {/* Left Column: Context */}
          <Col xs={24} lg={16} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Contract Overview Card */}
            <Card className="dispute-info-card" variant="borderless">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <BankOutlined style={{ fontSize: 20, color: "#4f46e5" }} />
                <Title level={4} style={{ margin: 0, color: "#111827" }}>Tổng quan hợp đồng</Title>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>Tài sản</div>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: 15 }}>{selectedReport.rental?.property?.title || "Chi tiết bất động sản"}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{selectedReport.rental?.property?.address || "Chưa có địa chỉ"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>Thời hạn</div>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: 15 }}>Jan 1, 2023 - Dec 31, 2023</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>Còn 8 tháng</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
                  <Avatar size={40} style={{ backgroundColor: "#6366f1" }}>T</Avatar>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Người thuê {selectedReport.createdBy === selectedReport.rental?.tenantId ? <strong style={{ color: '#ef4444' }}>(Người khiếu nại)</strong> : "(Bị khiếu nại)"}
                    </div>
                    <div style={{ fontWeight: 500, color: "#111827" }}>{selectedReport.rental?.tenantUser?.fullName || "Tenant Name"}</div>
                  </div>
                </div>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
                  <Avatar size={40} style={{ backgroundColor: "#e5e7eb", color: "#374151" }}>O</Avatar>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Chủ nhà {selectedReport.createdBy === selectedReport.rental?.ownerId ? <strong style={{ color: '#ef4444' }}>(Người khiếu nại)</strong> : "(Bị khiếu nại)"}
                    </div>
                    <div style={{ fontWeight: 500, color: "#111827" }}>{selectedReport.rental?.ownerUser?.fullName || "Owner Name"}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, borderTop: "1px solid #f3f4f6", paddingTop: 20, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Tiền thuê hàng tháng</div>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: 18 }}>{money.format(selectedReport.rental?.monthlyRent || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Tiền cọc đang giữ</div>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: 18 }}>{money.format(selectedReport.rental?.depositAmount || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Trạng thái thanh toán</div>
                  <div style={{ fontWeight: 600, color: "#4338ca", fontSize: 15 }}>Đã cập nhật</div>
                </div>
              </div>
            </Card>

            {/* Dispute Report Card */}
            <Card className="dispute-info-card" variant="borderless">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <AlertFilled style={{ fontSize: 20, color: "#4f46e5" }} />
                <Title level={4} style={{ margin: 0, color: "#111827" }}>Nội dung khiếu nại</Title>
              </div>
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
                <Paragraph style={{ margin: 0, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {selectedReport.description}
                </Paragraph>
              </div>
            </Card>

            {/* Evidence Gallery Card */}
            <Card className="dispute-info-card" variant="borderless">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FileImageOutlined style={{ fontSize: 20, color: "#4f46e5" }} />
                  <Title level={4} style={{ margin: 0, color: "#111827" }}>Thư viện bằng chứng</Title>
                </div>
                <Text style={{ color: "#6b7280", fontSize: 13 }}>{selectedReport.attachments?.length || 0} File đính kèm</Text>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Cột 1: Người khiếu nại */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Avatar size={32} style={{ backgroundColor: selectedReport.createdBy === selectedReport.rental?.ownerId ? "#e5e7eb" : "#6366f1", color: selectedReport.createdBy === selectedReport.rental?.ownerId ? "#374151" : "#fff" }}>
                      {selectedReport.createdBy === selectedReport.rental?.ownerId ? "O" : "T"}
                    </Avatar>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.2 }}>{selectedReport.createdBy === selectedReport.rental?.ownerId ? "Chủ nhà" : "Người thuê"} <strong style={{ color: '#4f46e5' }}>(Người khiếu nại)</strong></div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111827", lineHeight: 1.2 }}>
                        {selectedReport.createdBy === selectedReport.rental?.ownerId ? selectedReport.rental?.ownerUser?.fullName : selectedReport.rental?.tenantUser?.fullName}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "#f9fafb", border: "1px dashed #d1d5db", padding: 12, borderRadius: 8, minHeight: 120 }}>
                    {selectedReport.attachments?.map(att => (
                      <a key={att.id} href={att.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                        {att.type === "image" ? (
                          <div style={{ width: 100, height: 100, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                            <img src={att.url} alt={att.fileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ) : (
                          <div style={{ width: 100, height: 100, borderRadius: 8, border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", padding: 8 }}>
                            {att.fileName?.toLowerCase().endsWith(".pdf") ? (
                              <FilePdfOutlined style={{ fontSize: 24, color: "#ef4444", marginBottom: 8 }} />
                            ) : (
                              <FileImageOutlined style={{ fontSize: 24, color: "#6366f1", marginBottom: 8 }} />
                            )}
                            <Text style={{ fontSize: 10, textAlign: "center", width: "100%" }} ellipsis={{ tooltip: att.fileName }}>
                              {att.fileName}
                            </Text>
                          </div>
                        )}
                      </a>
                    ))}
                    {(!selectedReport.attachments || selectedReport.attachments.length === 0) && (
                      <div style={{ color: "#9ca3af", fontStyle: "italic", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>Không có bằng chứng</div>
                    )}
                  </div>
                </div>

                {/* Cột 2: Bị khiếu nại */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Avatar size={32} style={{ backgroundColor: selectedReport.createdBy === selectedReport.rental?.ownerId ? "#6366f1" : "#e5e7eb", color: selectedReport.createdBy === selectedReport.rental?.ownerId ? "#fff" : "#374151" }}>
                      {selectedReport.createdBy === selectedReport.rental?.ownerId ? "T" : "O"}
                    </Avatar>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.2 }}>{selectedReport.createdBy === selectedReport.rental?.ownerId ? "Người thuê" : "Chủ nhà"} <strong style={{ color: '#ef4444' }}>(Bị khiếu nại)</strong></div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111827", lineHeight: 1.2 }}>
                        {selectedReport.createdBy === selectedReport.rental?.ownerId ? selectedReport.rental?.tenantUser?.fullName : selectedReport.rental?.ownerUser?.fullName}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "#fef2f2", border: "1px dashed #fca5a5", padding: 12, borderRadius: 8, minHeight: 120 }}>
                    {(() => {
                      const req = selectedReport.terminationRequest;
                      if (!req || !req.reviewNote || !req.reviewNote.includes("--- TÀI LIỆU MINH CHỨNG ---")) {
                        return <div style={{ color: "#ef4444", fontStyle: "italic", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>Không có bằng chứng phản hồi</div>;
                      }
                      
                      const parts = req.reviewNote.split("--- TÀI LIỆU MINH CHỨNG ---");
                      const linksStr = parts[1].trim();
                      const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
                      const links = [];
                      let match;
                      while ((match = regex.exec(linksStr)) !== null) {
                        links.push({ label: match[1], url: match[2] });
                      }
                      
                      return links.map((link, idx) => {
                        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(link.url);
                        return (
                          <a key={`review-ev-${idx}`} href={link.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                            {isImage ? (
                              <div style={{ width: 100, height: 100, borderRadius: 8, overflow: "hidden", border: "1px solid #fecaca" }}>
                                <img src={link.url} alt={link.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            ) : (
                              <div style={{ width: 100, height: 100, borderRadius: 8, border: "1px solid #fecaca", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", padding: 8 }}>
                                <FileOutlined style={{ fontSize: 24, color: "#ef4444", marginBottom: 8 }} />
                                <Text style={{ fontSize: 10, textAlign: "center", width: "100%", color: "#b91c1c" }} ellipsis={{ tooltip: link.label }}>
                                  {link.label}
                                </Text>
                              </div>
                            )}
                          </a>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* Right Column: Actions */}
          <Col xs={24} lg={8} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Resolution Action */}
            <Card className="dispute-action-card" variant="borderless">
              <Title level={4} style={{ margin: "0 0 8px 0", color: "#111827" }}>Hành động xử lý</Title>
              <Text style={{ color: "#6b7280", fontSize: 13, display: "block", marginBottom: 16 }}>
                Chọn kết quả chính cho tranh chấp hợp đồng này dựa trên các bằng chứng đã xem xét.
              </Text>

              <Radio.Group 
                value={terminationResolution} 
                onChange={(e) => setTerminationResolution(e.target.value)}
                style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div className={`resolution-radio-box ${terminationResolution === 'continue_contract' ? 'active' : ''}`} onClick={() => setTerminationResolution('continue_contract')} style={{ cursor: "pointer" }}>
                  <Radio value="continue_contract" style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircleFilled style={{ color: terminationResolution === 'continue_contract' ? "#4f46e5" : "#9ca3af" }} />
                      <span style={{ fontWeight: 500, color: "#111827" }}>Cho thương lượng / Tiếp tục hợp đồng</span>
                    </div>
                  </Radio>
                </div>
                
                <div className={`resolution-radio-box danger ${terminationResolution === 'terminate_contract' ? 'active' : ''}`} onClick={() => setTerminationResolution('terminate_contract')} style={{ cursor: "pointer" }}>
                  <Radio value="terminate_contract" style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CloseCircleFilled style={{ color: terminationResolution === 'terminate_contract' ? "#ef4444" : "#9ca3af" }} />
                      <span style={{ fontWeight: 500, color: "#111827" }}>Chấp nhận khiếu nại (Chấm dứt & Hoàn tiền)</span>
                    </div>
                  </Radio>
                </div>
              </Radio.Group>
            </Card>

            {/* Financial Settlement */}
            {terminationResolution === "terminate_contract" && (
              <Card className="dispute-action-card border-danger" variant="borderless">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0, color: "#111827" }}>Giải quyết tài chính</Title>
                  <BankOutlined style={{ fontSize: 18, color: "#6b7280" }} />
                </div>
                
                <div style={{ background: "#f9fafb", padding: 12, borderRadius: 6, marginBottom: 16, border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#4b5563", fontSize: 13 }}>Tổng tiền cọc đang giữ</span>
                  <span style={{ fontWeight: 600, fontSize: 16, color: "#111827" }}>{money.format(selectedReport.rental?.depositAmount || 0)}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Số tiền hoàn lại cho người thuê</div>
                    <InputNumber 
                      value={depositReturnAmount} 
                      onChange={(v) => setDepositReturnAmount(v || 0)}
                      style={{ width: "100%", height: 40 }}
                      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Số tiền chủ nhà giữ lại</div>
                    <InputNumber 
                      value={amountRetained} 
                      onChange={(v) => setAmountRetained(v || 0)}
                      style={{ width: "100%", height: 40 }}
                      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Phí phạt (Áp dụng cho chủ nhà)</div>
                    <InputNumber 
                      value={penaltyAmount} 
                      onChange={(v) => setPenaltyAmount(v || 0)}
                      style={{ width: "100%", height: 40, borderColor: "#fecaca", background: "#fef2f2", color: "#dc2626" }}
                      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                    <Text style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "block" }}>
                      Phí phạt nền tảng đối với trường hợp vi phạm đã xác nhận.
                    </Text>
                  </div>
                </div>
              </Card>
            )}

            {/* Final Decision */}
            <Card className="dispute-action-card" variant="borderless">
              <Title level={4} style={{ margin: "0 0 16px 0", color: "#111827" }}>Quyết định cuối cùng</Title>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Ghi chú nội bộ (Các bên không nhìn thấy)</div>
                <Input.TextArea 
                  rows={4} 
                  placeholder="Cung cấp lý do giải quyết cuối cùng..." 
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  style={{ borderRadius: 6 }}
                />
              </div>

              <Space style={{ width: "100%" }} direction="vertical">
                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  style={{ background: "#4f46e5", height: 48, fontWeight: 600, borderRadius: 8 }}
                  onClick={confirmResolve}
                  loading={resolving}
                >
                  Xác nhận giải quyết
                </Button>
                <Button block type="text" onClick={() => setResolutionViewOpen(false)}>
                  Hủy & Quay lại
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // --- Main Page List View (Design 1) ---
  return (
    <div className="dispute-management-page">
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: "#111827" }}>Quản lý khiếu nại</Title>
          <Text style={{ color: "#6b7280", fontSize: 15 }}>Xem xét và giải quyết các khiếu nại cần sự can thiệp của quản trị viên.</Text>
        </Col>
        <Col>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
               <AlertFilled style={{ color: "#dc2626", fontSize: 20 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: 0.5, textTransform: "uppercase" }}>Yêu cầu mới</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>{stats.admin + stats.open}</div>
            </div>
          </div>
        </Col>
      </Row>

      <Card variant="borderless" className="dispute-filter-card" style={{ marginBottom: 24, borderRadius: 8, border: "1px solid #e5e7eb" }}>
        <Row gutter={16} align="bottom">
          <Col xs={24} md={8}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Tìm kiếm ID hợp đồng</div>
            <Input 
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />} 
              placeholder="VD: CTR-2023-..." 
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={fetchReports}
              size="large"
            />
          </Col>
          <Col xs={12} md={5}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Mức ưu tiên</div>
            <Select 
              style={{ width: '100%' }} 
              size="large" 
              placeholder="Tất cả mức ưu tiên"
              value={filterPriority}
              onChange={setFilterPriority}
              allowClear
              options={[
                { value: "high", label: "Cao" },
                { value: "medium", label: "Trung bình" },
                { value: "low", label: "Thấp" }
              ]}
            />
          </Col>
          <Col xs={12} md={7}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Loại khiếu nại</div>
            <Select 
              style={{ width: '100%' }} 
              size="large" 
              placeholder="Tất cả loại"
              value={filterType}
              onChange={setFilterType}
              allowClear
              options={[
                { value: "unlawful_eviction", label: "Thông báo trục xuất trái phép" },
                { value: "deposit_withholding", label: "Giữ tiền cọc sai quy định" },
                { value: "late_fee", label: "Tranh chấp phí phạt trễ" },
                { value: "property", label: "Hư hỏng tài sản" },
                { value: "contract", label: "Vi phạm hợp đồng" },
              ]}
            />
          </Col>
          <Col xs={24} md={4} style={{ textAlign: "right" }}>
             <Button size="large" icon={<FilterOutlined />} style={{ color: "#4f46e5", borderColor: "#c7d2fe", background: "#e0e7ff", width: "100%" }}>
               Bộ lọc khác
             </Button>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" className="dispute-table-card" style={{ borderRadius: 8, border: "1px solid #e5e7eb", padding: 0, overflow: "hidden" }}>
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          pagination={false}
          loading={loading}
          className="custom-dispute-table"
        />
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb" }}>
          <Text style={{ color: "#4b5563", fontSize: 13 }}>Đang hiển thị {reports.length} / {stats.total} mục</Text>
          <Space>
             <Button>Trước</Button>
             <Button>Tiếp</Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ComplaintPage;

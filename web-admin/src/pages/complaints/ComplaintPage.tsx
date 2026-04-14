import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import http from "../../utils/api";
import "../dashboard/dashboard-enterprise.css";

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
  cancelRequested?: boolean;
  cancelRequestedBy?: string;
  cancelRequestedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  resolvedAt?: string;
  histories: ReportHistory[];
  rental?: {
    rentalId: string;
    contractCode: string;
    propertyId: string;
    ownerId: string;
    tenantId: string;
    monthlyRent?: number;
    depositAmount?: number;
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

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: "red", label: "Mới tạo" },
  negotiating: { color: "orange", label: "Đang thương lượng" },
  admin: { color: "blue", label: "Gửi admin" },
  resolved: { color: "green", label: "Đã giải quyết" },
  cancel_requested: { color: "gold", label: "Đang chờ hủy" },
  cancelled: { color: "default", label: "Đã hủy" },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "default", label: "Thấp" },
  medium: { color: "orange", label: "Trung bình" },
  high: { color: "red", label: "Cao" },
};

const typeConfig: Record<string, string> = {
  payment: "Tiền thuê/Phí",
  deposit: "Tiền cọc",
  property: "Hư hỏng tài sản",
  contract: "Vi phạm hợp đồng",
  other: "Khác",
};

const ComplaintPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    open: 0,
    negotiating: 0,
    admin: 0,
    resolved: 0,
    cancelRequested: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [resolving, setResolving] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterPriority, setFilterPriority] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [searchText, setSearchText] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterPriority) params.append("priority", filterPriority);
      if (filterType) params.append("type", filterType);
      if (searchText) params.append("search", searchText);

      const queryString = params.toString();
      const url = `/contract/admin/reports${queryString ? `?${queryString}` : ""}`;
      const res = await http.get(url);
      setReports(res.data.reports || []);
      setStats(res.data.stats || {
        total: 0,
        open: 0,
        negotiating: 0,
        admin: 0,
        resolved: 0,
        cancelRequested: 0,
        cancelled: 0,
      });
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, filterType, searchText]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleViewDetail = async (report: Report) => {
    try {
      const res = await http.get(`/contract/admin/reports/${report.id}`);
      setSelectedReport(res.data);
    } catch {
      setSelectedReport(report);
    }
    setDetailModalOpen(true);
  };

  const handleResolve = (report: Report) => {
    setSelectedReport(report);
    setAdminNote("");
    setResolveModalOpen(true);
  };

  const confirmResolve = async () => {
    if (!selectedReport || !adminNote.trim()) {
      message.warning("Vui lòng nhập ghi chú xử lý");
      return;
    }
    setResolving(true);
    try {
      await http.patch(`/contract/admin/reports/${selectedReport.id}/resolve`, { adminNote });
      message.success("Đã xử lý khiếu nại thành công");
      setResolveModalOpen(false);
      fetchReports();
    } catch {
      message.error("Không thể xử lý khiếu nại");
    } finally {
      setResolving(false);
    }
  };

  const handleApproveCancel = async (report: Report) => {
    try {
      await http.put(`/contract/reports/${report.id}/status`, { status: "cancelled", adminNote: "Admin duyệt hủy" });
      message.success("Đã duyệt hủy khiếu nại");
      fetchReports();
    } catch {
      message.error("Không thể duyệt hủy khiếu nại");
    }
  };

  const columns = [
    {
      title: "Mã khiếu nại",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id: string) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id.slice(0, 8)}...</span>,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (type: string) => typeConfig[type] || type,
    },
    {
      title: "Mức ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority: string) => {
        const config = priorityConfig[priority] || { color: "default", label: priority };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: string) => {
        const config = statusConfig[status] || { color: "default", label: status };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Hợp đồng liên quan",
      key: "property",
      width: 200,
      ellipsis: true,
      render: (_: unknown, record: Report) => record.rental?.contractCode || "—",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) =>
        new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_: unknown, record: Report) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            Chi tiết
          </Button>
          {record.status !== "resolved" && record.status !== "cancelled" && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleResolve(record)}>
              Xử lý
            </Button>
          )}
          {record.status === "cancel_requested" && (
            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleApproveCancel(record)}>
              Duyệt hủy
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page-shell enterprise-dashboard">
      {/* Header */}
      <Card className="hero-surface enterprise-header-card" variant="borderless">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 12 }}>
          <div>
            <Typography.Title level={2} style={{ margin: 0 }}>Xử lý khiếu nại</Typography.Title>
            <Typography.Text type="secondary">Quản lý và xử lý các khiếu nại từ người dùng nền tảng</Typography.Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchReports}>Làm mới</Button>
        </div>
      </Card>

      {loading ? (
        <Card variant="borderless" className="enterprise-panel" style={{ marginTop: 14 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : (
        <div className="enterprise-main-stack">
          {/* Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card className="enterprise-panel" variant="borderless" style={{ textAlign: "center" }}>
                <Statistic title="Tổng khiếu nại" value={stats.total} prefix={<ExclamationCircleOutlined style={{ color: "#2563eb" }} />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="enterprise-panel" variant="borderless" style={{ textAlign: "center" }}>
                <Statistic title="Mới / Chờ xử lý" value={stats.open + stats.admin + stats.cancelRequested} styles={{ content: { color: "#dc2626" } }} prefix={<WarningOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="enterprise-panel" variant="borderless" style={{ textAlign: "center" }}>
                <Statistic title="Đang thương lượng" value={stats.negotiating} styles={{ content: { color: "#f97316" } }} prefix={<ClockCircleOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="enterprise-panel" variant="borderless" style={{ textAlign: "center" }}>
                <Statistic title="Đã giải quyết" value={stats.resolved} styles={{ content: { color: "#16a34a" } }} prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="enterprise-panel" variant="borderless">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Input
                placeholder="Tìm kiếm khiếu nại..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={fetchReports}
                style={{ width: 280 }}
                allowClear
              />
              <Select
                placeholder="Trạng thái"
                value={filterStatus}
                onChange={setFilterStatus}
                allowClear
                style={{ width: 160 }}
                options={[
                  { value: "open", label: "Mới tạo" },
                  { value: "negotiating", label: "Đang thương lượng" },
                  { value: "admin", label: "Gửi admin" },
                  { value: "resolved", label: "Đã giải quyết" },
                  { value: "cancel_requested", label: "Đang chờ hủy" },
                  { value: "cancelled", label: "Đã hủy" },
                ]}
              />
              <Select
                placeholder="Mức ưu tiên"
                value={filterPriority}
                onChange={setFilterPriority}
                allowClear
                style={{ width: 160 }}
                options={[
                  { value: "low", label: "Thấp" },
                  { value: "medium", label: "Trung bình" },
                  { value: "high", label: "Cao" },
                ]}
              />
              <Select
                placeholder="Loại khiếu nại"
                value={filterType}
                onChange={setFilterType}
                allowClear
                style={{ width: 180 }}
                options={[
                  { value: "payment", label: "Tiền thuê/Phí" },
                  { value: "deposit", label: "Tiền cọc" },
                  { value: "property", label: "Hư hỏng tài sản" },
                  { value: "contract", label: "Vi phạm hợp đồng" },
                  { value: "other", label: "Khác" },
                ]}
              />
            </div>
          </Card>

          {/* Table */}
          <Card className="enterprise-panel" variant="borderless">
            <Table
              columns={columns}
              dataSource={reports}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Tổng ${t} khiếu nại` }}
              scroll={{ x: 1100 }}
              locale={{ emptyText: "Chưa có khiếu nại nào" }}
            />
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        title="Chi tiết khiếu nại"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>Đóng</Button>,
          selectedReport?.status !== "resolved" && selectedReport?.status !== "cancelled" && (
            <Button key="resolve" type="primary" onClick={() => { setDetailModalOpen(false); handleResolve(selectedReport!); }}>
              Xử lý khiếu nại
            </Button>
          ),
          selectedReport?.status === "cancel_requested" && (
            <Button key="approve-cancel" onClick={() => { setDetailModalOpen(false); handleApproveCancel(selectedReport!); }}>
              Duyệt hủy
            </Button>
          ),
        ]}
        width={720}
      >
        {selectedReport && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>{selectedReport.title}</Typography.Title>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Tag color={statusConfig[selectedReport.status]?.color}>{statusConfig[selectedReport.status]?.label || selectedReport.status}</Tag>
                <Tag color={priorityConfig[selectedReport.priority]?.color}>{priorityConfig[selectedReport.priority]?.label || selectedReport.priority}</Tag>
                <Tag>{typeConfig[selectedReport.type] || selectedReport.type}</Tag>
              </div>
            </div>

            <Card size="small" title="Nội dung khiếu nại" variant="borderless" style={{ background: "var(--ent-surface-soft)" }}>
              <Typography.Paragraph>{selectedReport.description}</Typography.Paragraph>
            </Card>

            {selectedReport.rental && (
              <Card size="small" title="Thông tin hợp đồng liên quan" variant="borderless" style={{ background: "var(--ent-surface-soft)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><strong>Mã HĐ:</strong> {selectedReport.rental.contractCode}</div>
                  <div><strong>Mã BĐS:</strong> {selectedReport.rental.propertyId.slice(0, 8)}...</div>
                  <div><strong>Chủ nhà:</strong> {selectedReport.rental.ownerId.slice(0, 8)}...</div>
                  <div><strong>Người thuê:</strong> {selectedReport.rental.tenantId.slice(0, 8)}...</div>
                  {selectedReport.rental.monthlyRent && (
                    <div><strong>Giá thuê:</strong> {money.format(selectedReport.rental.monthlyRent)}</div>
                  )}
                  {selectedReport.rental.depositAmount && (
                    <div><strong>Tiền cọc:</strong> {money.format(selectedReport.rental.depositAmount)}</div>
                  )}
                </div>
              </Card>
            )}

            {selectedReport.adminNote && (
              <Card size="small" title="Ghi chú admin" variant="borderless" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <Typography.Paragraph>{selectedReport.adminNote}</Typography.Paragraph>
              </Card>
            )}

            {selectedReport.histories && selectedReport.histories.length > 0 && (
              <Card size="small" title="Lịch sử xử lý" variant="borderless" style={{ background: "var(--ent-surface-soft)" }}>
                {selectedReport.histories.map((h) => (
                  <div key={h.id} style={{ borderBottom: "1px dashed var(--ent-border)", padding: "8px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Tag>{h.action}</Tag>
                      <span style={{ fontSize: 12, color: "var(--ent-subtitle)" }}>
                        {new Date(h.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    {h.note && <p style={{ margin: "4px 0 0", color: "var(--ent-subtitle)", fontSize: 13 }}>{h.note}</p>}
                  </div>
                ))}
              </Card>
            )}

            <div style={{ fontSize: 12, color: "var(--ent-subtitle)" }}>
              Ngày tạo: {new Date(selectedReport.createdAt).toLocaleString("vi-VN")}
              {selectedReport.resolvedAt && ` · Ngày giải quyết: ${new Date(selectedReport.resolvedAt).toLocaleString("vi-VN")}`}
              {selectedReport.cancelledAt && ` · Ngày hủy: ${new Date(selectedReport.cancelledAt).toLocaleString("vi-VN")}`}
            </div>
          </div>
        )}
      </Modal>

      {/* Resolve Modal */}
      <Modal
        title="Xử lý khiếu nại"
        open={resolveModalOpen}
        onCancel={() => setResolveModalOpen(false)}
        onOk={confirmResolve}
        confirmLoading={resolving}
        okText="Xác nhận xử lý"
        cancelText="Hủy"
      >
        {selectedReport && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <strong>Tiêu đề:</strong> {selectedReport.title}
            </div>
            <div>
              <strong>Loại:</strong> {typeConfig[selectedReport.type] || selectedReport.type}
            </div>
            <div>
              <strong>Mức ưu tiên:</strong>{" "}
              <Tag color={priorityConfig[selectedReport.priority]?.color}>
                {priorityConfig[selectedReport.priority]?.label || selectedReport.priority}
              </Tag>
            </div>
            <div>
              <Typography.Text strong>Ghi chú xử lý của admin:</Typography.Text>
              <Input.TextArea
                rows={4}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Nhập ghi chú xử lý khiếu nại..."
                style={{ marginTop: 8 }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ComplaintPage;

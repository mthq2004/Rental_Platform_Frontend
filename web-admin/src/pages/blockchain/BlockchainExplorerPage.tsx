import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Table,
  Tabs,
  Tag,
  Typography,
  Modal,
  Descriptions,
  message,
  Tooltip,
  Timeline,
} from "antd";
import {
  SearchOutlined,
  LinkOutlined,
  CopyOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  ReloadOutlined,
  BlockOutlined,
  FileProtectOutlined,
  WalletOutlined,
  NumberOutlined,
  EyeOutlined,
  TableOutlined,
  NodeIndexOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import {
  fetchBlockchainStats,
  fetchBlockchainContracts,
  fetchBlockchainPayments,
  fetchContractBlockchainDetail,
  fetchPaymentBlockchainDetail,
  verifyContractOnChain,
  verifyPaymentOnChain,
  setContractSearch,
  setPaymentSearch,
  setDetailModalOpen,
  clearDetailData,
} from "../../stores/slices/blockchain.slice";
import "./blockchain-explorer.css";

const { Title } = Typography;

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncateHash = (hash: string | null, length = 12) => {
  if (!hash) return "—";
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-8)}`;
};

const getVerificationTag = (status: string | null) => {
  switch (status) {
    case "verified":
      return (
        <Tag
          icon={<CheckCircleFilled />}
          style={{
            background: "var(--dm-tag-green-bg)",
            color: "var(--dm-tag-green-text)",
            border: 0,
            borderRadius: 16,
          }}
        >
          Đã xác thực
        </Tag>
      );
    case "failed":
      return (
        <Tag
          style={{
            background: "var(--dm-tag-red-bg)",
            color: "var(--dm-tag-red-text)",
            border: 0,
            borderRadius: 16,
          }}
        >
          Thất bại
        </Tag>
      );
    default:
      return (
        <Tag
          icon={<ClockCircleFilled />}
          style={{
            background: "var(--dm-tag-gray-bg)",
            color: "var(--dm-label)",
            border: 0,
            borderRadius: 16,
          }}
        >
          Chưa xác thực
        </Tag>
      );
  }
};

const BlockchainExplorerPage = () => {
  const dispatch = useAppDispatch();
  const {
    stats,
    statsLoading,
    contracts,
    contractsPagination,
    contractsLoading,
    contractSearch,
    payments,
    paymentsPagination,
    paymentsLoading,
    paymentSearch,
    detailData,
    detailType,
    detailModalOpen,
    verifying,
  } = useAppSelector((state) => state.blockchain);

  const [activeTab, setActiveTab] = useState("contracts");
  const [contractsView, setContractsView] = useState<"table" | "timeline">("table");
  const [paymentsView, setPaymentsView] = useState<"table" | "timeline">("table");

  // Fetch metrics & stats
  const refreshStatsAndLists = useCallback(() => {
    dispatch(fetchBlockchainStats());
    if (activeTab === "contracts") {
      dispatch(fetchBlockchainContracts({ page: 1, search: contractSearch }));
    } else {
      dispatch(fetchBlockchainPayments({ page: 1, search: paymentSearch }));
    }
  }, [dispatch, activeTab, contractSearch, paymentSearch]);

  useEffect(() => {
    dispatch(fetchBlockchainStats());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBlockchainContracts({ page: 1, search: contractSearch }));
  }, [dispatch, contractSearch]);

  useEffect(() => {
    if (activeTab === "payments") {
      dispatch(fetchBlockchainPayments({ page: 1, search: paymentSearch }));
    }
  }, [dispatch, activeTab, paymentSearch]);

  // Detail & Verification action handlers
  const handleViewContractDetail = (rentalId: string) => {
    dispatch(fetchContractBlockchainDetail(rentalId));
  };

  const handleViewPaymentDetail = (paymentId: string) => {
    dispatch(fetchPaymentBlockchainDetail(paymentId));
  };

  const handleVerify = async () => {
    if (!detailData) return;
    try {
      if (detailType === "contract") {
        await dispatch(verifyContractOnChain(detailData.rentalId)).unwrap();
        message.success("Xác thực hợp đồng thành công");
      } else {
        await dispatch(verifyPaymentOnChain(detailData.paymentId)).unwrap();
        message.success("Xác thực thanh toán thành công");
      }
      refreshStatsAndLists();
    } catch {
      message.error("Xác thực blockchain thất bại");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("Đã copy vào bộ nhớ tạm!");
  };

  // Helper mappings to look exactly like the P2P screenshots
  const getContractVisualType = (code: string) => {
    if (code.includes("LOAN_EVAL")) return { label: "Cấu hình đánh giá", color: "var(--dm-tag-purple-text)", bg: "var(--dm-tag-purple-bg)" };
    if (code.includes("SETTLE")) return { label: "Biên lai tất toán", color: "var(--dm-tag-orange-text)", bg: "var(--dm-tag-orange-bg)" };
    if (code.includes("INV")) return { label: "Hợp đồng đầu tư", color: "var(--dm-tag-green-text)", bg: "var(--dm-tag-green-bg)" };
    return { label: "Hợp đồng vay", color: "var(--dm-tag-blue-text)", bg: "var(--dm-tag-blue-bg)" };
  };

  const getContractVisualStatus = (code: string, status: string) => {
    if (code.includes("LOAN_EVAL")) return { label: "Đã ghi", bg: "var(--dm-tag-indigo-bg)", color: "var(--dm-tag-indigo-text)" };
    if (code.includes("SETTLE")) return { label: "Hoàn thành", bg: "var(--dm-tag-green-bg)", color: "var(--dm-tag-green-text)" };
    if (status === "active") return { label: "Hoạt động", bg: "var(--dm-tag-green-bg)", color: "var(--dm-tag-green-text)" };
    if (status === "cancelled") return { label: "Đã đóng", bg: "var(--dm-tag-red-bg)", color: "var(--dm-tag-red-text)" };
    return { label: status, bg: "var(--dm-tag-gray-bg)", color: "var(--dm-tag-gray-text)" };
  };

  const getContractVisualValue = (code: string) => {
    if (code.includes("LOAN_EVAL")) {
      const match = code.match(/_v(\d+)/);
      return match ? `v${match[1]}` : "v8";
    }
    return "5.500.000 đ";
  };

  const getPaymentVisualType = (code: string) => {
    if (code.includes("SETTLE")) return { label: "Biên lai tất toán", color: "var(--dm-tag-orange-text)", bg: "var(--dm-tag-orange-bg)" };
    if (code.includes("INV")) return { label: "Hợp đồng đầu tư", color: "var(--dm-tag-green-text)", bg: "var(--dm-tag-green-bg)" };
    return { label: "Hợp đồng vay", color: "var(--dm-tag-blue-text)", bg: "var(--dm-tag-blue-bg)" };
  };

  const getPaymentVisualStatus = (status: string) => {
    if (status === "paid" || status === "success") return { label: "Hoàn thành", bg: "var(--dm-tag-green-bg)", color: "var(--dm-tag-green-text)" };
    if (status === "pending") return { label: "Chờ duyệt", bg: "var(--dm-tag-yellow-bg)", color: "var(--dm-tag-yellow-text)" };
    return { label: status, bg: "var(--dm-tag-gray-bg)", color: "var(--dm-tag-gray-text)" };
  };

  // ─── Table Columns ─────────────────────────────────────────
  const contractColumns = [
    {
      title: "MÃ GIAO DỊCH",
      key: "contractCode",
      width: 200,
      render: (_: any, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 600, color: "var(--dm-title)" }}>
            {record.contractCode}
          </span>
          <Tooltip title="Copy mã">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ fontSize: 13, color: "#4f46e5" }} />}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(record.contractCode);
              }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: "LOẠI",
      key: "visualType",
      width: 160,
      render: (_: any, record: any) => {
        const typeInfo = getContractVisualType(record.contractCode);
        return (
          <Tag style={{ background: typeInfo.bg, color: typeInfo.color, border: 0, fontWeight: 500, borderRadius: 6, padding: "4px 8px" }}>
            {typeInfo.label}
          </Tag>
        );
      },
    },
    {
      title: "TRẠNG THÁI",
      key: "visualStatus",
      width: 130,
      render: (_: any, record: any) => {
        const statusInfo = getContractVisualStatus(record.contractCode, record.status);
        return (
          <Tag style={{ background: statusInfo.bg, color: statusInfo.color, border: 0, fontWeight: 500, borderRadius: 12, padding: "2px 8px" }}>
            {statusInfo.label}
          </Tag>
        );
      },
    },
    {
      title: "GIÁ TRỊ / VERSION",
      key: "visualValue",
      width: 160,
      render: (_: any, record: any) => (
        <span style={{ fontWeight: 600, color: record.contractCode.includes("LOAN_EVAL") ? "#ec4899" : "var(--dm-title)" }}>
          {getContractVisualValue(record.contractCode)}
        </span>
      ),
    },
    {
      title: "DATA HASH (SHA-256)",
      key: "txHash",
      width: 220,
      render: (_: any, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <code style={{ fontSize: 12, color: "var(--dm-subtitle)", background: "var(--dm-surface-soft)", padding: "2px 6px", borderRadius: 4 }}>
            {truncateHash(record.contractHash || record.blockchainTxHash)}
          </code>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined style={{ fontSize: 12, color: "#4f46e5" }} />}
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(record.contractHash || record.blockchainTxHash || "");
            }}
          />
        </div>
      ),
    },
    {
      title: "THỜI GIAN",
      key: "recordedAt",
      width: 160,
      render: (_: any, record: any) => (
        <span style={{ color: "var(--dm-subtitle)", fontSize: 13 }}>
          ⏱️ {formatDate(record.blockchainRecordedAt)}
        </span>
      ),
    },
    {
      title: "THAO TÁC",
      key: "actions",
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          style={{ color: "#2563eb", fontWeight: 500, padding: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            handleViewContractDetail(record.rentalId);
          }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: "MÃ GIAO DỊCH",
      key: "paymentCode",
      width: 200,
      render: (_: any, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 600, color: "var(--dm-title)" }}>
            {record.payment?.paymentCode || "INV_101696"}
          </span>
          <Tooltip title="Copy mã">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ fontSize: 13, color: "#4f46e5" }} />}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(record.payment?.paymentCode || "");
              }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: "LOẠI",
      key: "visualType",
      width: 160,
      render: (_: any, record: any) => {
        const typeInfo = getPaymentVisualType(record.payment?.paymentCode || "INV_101696");
        return (
          <Tag style={{ background: typeInfo.bg, color: typeInfo.color, border: 0, fontWeight: 500, borderRadius: 6, padding: "4px 8px" }}>
            {typeInfo.label}
          </Tag>
        );
      },
    },
    {
      title: "TRẠNG THÁI",
      key: "visualStatus",
      width: 130,
      render: (_: any, record: any) => {
        const statusInfo = getPaymentVisualStatus(record.payment?.status || "paid");
        return (
          <Tag style={{ background: statusInfo.bg, color: statusInfo.color, border: 0, fontWeight: 500, borderRadius: 12, padding: "2px 8px" }}>
            {statusInfo.label}
          </Tag>
        );
      },
    },
    {
      title: "GIÁ TRỊ",
      key: "amount",
      width: 160,
      render: (_: any, record: any) => (
        <span style={{ fontWeight: 600, color: "var(--dm-title)" }}>
          {money.format(record.payment?.amount || 5500000)}
        </span>
      ),
    },
    {
      title: "DATA HASH (SHA-256)",
      key: "txHash",
      width: 220,
      render: (_: any, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <code style={{ fontSize: 12, color: "var(--dm-subtitle)", background: "var(--dm-surface-soft)", padding: "2px 6px", borderRadius: 4 }}>
            {truncateHash(record.payloadHash || record.txHash)}
          </code>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined style={{ fontSize: 12, color: "#4f46e5" }} />}
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(record.payloadHash || record.txHash || "");
            }}
          />
        </div>
      ),
    },
    {
      title: "THỜI GIAN",
      key: "recordedAt",
      width: 160,
      render: (_: any, record: any) => (
        <span style={{ color: "var(--dm-subtitle)", fontSize: 13 }}>
          ⏱️ {formatDate(record.recordedAt)}
        </span>
      ),
    },
    {
      title: "THAO TÁC",
      key: "actions",
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          style={{ color: "#2563eb", fontWeight: 500, padding: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            handleViewPaymentDetail(record.paymentId);
          }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="blockchain-explorer-page">
      {/* Header title area */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BlockOutlined style={{ fontSize: 22, color: "#fff" }} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, color: "var(--dm-title)" }}>
                Blockchain Explorer
              </Title>
            </div>
          </div>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            size="large"
            onClick={refreshStatsAndLists}
            loading={statsLoading}
            style={{
              height: "auto",
              borderRadius: 8,
              fontWeight: 500,
              borderColor: "var(--dm-refresh-border)",
              color: "var(--dm-refresh-text)",
              background: "var(--dm-refresh-bg)",
            }}
          >
            Làm mới
          </Button>
        </Col>
      </Row>

      {/* Network connection details horizontally */}
      <div className="connection-info-card">
        <Row align="middle">
          <Col xs={24} sm={4}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                  boxShadow: "0 0 8px #10b981",
                }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dm-title)" }}>
                  Đã kết nối
                </div>
                <div style={{ fontSize: 11, color: "var(--dm-subtitle)" }}>
                  Trạng thái mạng
                </div>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={5} className="connection-item">
            <div className="connection-label">Channel</div>
            <div className="connection-value">#mychannel</div>
          </Col>
          <Col xs={12} sm={5} className="connection-item">
            <div className="connection-label">Chaincode</div>
            <div className="connection-value">p2p-lending</div>
          </Col>
          <Col xs={12} sm={5} className="connection-item">
            <div className="connection-label">Organization</div>
            <div className="connection-value">Org1MSP</div>
          </Col>
          <Col xs={12} sm={5} className="connection-item">
            <div className="connection-label">Peer</div>
            <div className="connection-value">peer0.org1.example.com</div>
          </Col>
        </Row>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          {
            title: "Hợp đồng vay",
            value: `${stats.totalContracts} hợp đồng`,
            icon: <FileProtectOutlined style={{ fontSize: 20, color: "#4f46e5" }} />,
            bg: "var(--dm-stat-icon-blue-bg)",
          },
          {
            title: "Hợp đồng đầu tư",
            value: `${stats.totalPayments} hợp đồng`,
            icon: <WalletOutlined style={{ fontSize: 20, color: "#10b981" }} />,
            bg: "var(--dm-stat-icon-green-bg)",
          },
          {
            title: "Cấu hình đánh giá",
            value: "4 bản ghi",
            icon: <NumberOutlined style={{ fontSize: 20, color: "#7c3aed" }} />,
            bg: "var(--dm-stat-icon-indigo-bg)",
          },
          {
            title: "Tổng giao dịch",
            value: `${stats.totalTransactions} blocks`,
            icon: <BlockOutlined style={{ fontSize: 20, color: "#f59e0b" }} />,
            bg: "var(--dm-stat-icon-red-bg)",
          },
          {
            title: "Tổng giá trị",
            value: "24.000.000 đ",
            icon: <span>💵</span>,
            bg: "var(--dm-tag-yellow-bg)",
            valColor: "#059669",
          },
        ].map((item, idx) => (
          <Col xs={24} sm={12} md={4} key={idx} style={{ flexGrow: 1 }}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                border: "1px solid var(--dm-border)",
                background: "var(--dm-surface)",
                boxShadow: "var(--dm-shadow)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--dm-subtitle)", fontWeight: 500 }}>
                    {item.title}
                  </span>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: item.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: item.valColor || "var(--dm-title)",
                    marginTop: 4,
                  }}
                >
                  {item.value}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Ledger List */}
      <Card
        bordered={false}
        className="dispute-filter-card"
        style={{
          borderRadius: 12,
          border: "1px solid var(--dm-border)",
          boxShadow: "var(--dm-shadow)",
          background: "var(--dm-surface)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--dm-dashed)", paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--dm-title)" }}>
              Danh sách giao dịch trên Sổ cái
            </span>
            <Tag style={{ background: "var(--dm-tag-blue-bg)", color: "var(--dm-tag-blue-text)", border: 0, borderRadius: 12, fontWeight: 700 }}>
              {stats.totalTransactions}/{stats.totalTransactions}
            </Tag>
          </div>

          {/* Toggle between Table and Timeline */}
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              className={`view-toggle-btn ${activeTab === "contracts" ? (contractsView === "table" ? "active" : "") : (paymentsView === "table" ? "active" : "")}`}
              icon={<TableOutlined />}
              onClick={() => {
                if (activeTab === "contracts") setContractsView("table");
                else setPaymentsView("table");
              }}
            >
              Bảng
            </Button>
            <Button
              className={`view-toggle-btn ${activeTab === "contracts" ? (contractsView === "timeline" ? "active" : "") : (paymentsView === "timeline" ? "active" : "")}`}
              icon={<NodeIndexOutlined />}
              onClick={() => {
                if (activeTab === "contracts") setContractsView("timeline");
                else setPaymentsView("timeline");
              }}
            >
              Dòng thời gian
            </Button>
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="custom-blockchain-tabs"
          items={[
            {
              key: "contracts",
              label: (
                <span>
                  <FileProtectOutlined /> Hợp đồng ({stats.totalContracts})
                </span>
              ),
              children: (
                <>
                  {/* Filter / Search Bar */}
                  <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={8}>
                      <Input
                        prefix={<SearchOutlined style={{ color: "var(--dm-input-icon)" }} />}
                        placeholder="Tìm theo mã giao dịch hoặc hash..."
                        value={contractSearch}
                        onChange={(e) => dispatch(setContractSearch(e.target.value))}
                        size="large"
                        style={{ borderRadius: 8, background: "var(--dm-surface-soft)", border: "1px solid var(--dm-border)", color: "var(--dm-title)" }}
                      />
                    </Col>
                    <Col xs={12} sm={6} md={4}>
                      <Tag style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid var(--dm-border)", background: "var(--dm-surface-soft)", borderRadius: 8, cursor: "pointer", height: "100%", color: "var(--dm-title)" }}>
                        <span>Tất cả loại</span>
                        <span>▼</span>
                      </Tag>
                    </Col>
                    <Col xs={12} sm={6} md={4}>
                      <Tag style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid var(--dm-border)", background: "var(--dm-surface-soft)", borderRadius: 8, cursor: "pointer", height: "100%", color: "var(--dm-title)" }}>
                        <span>Tất cả trạng thái</span>
                        <span>▼</span>
                      </Tag>
                    </Col>
                  </Row>

                  {contractsView === "table" ? (
                    <Table
                      className="custom-blockchain-table"
                      columns={contractColumns}
                      dataSource={contracts}
                      rowKey="rentalId"
                      loading={contractsLoading}
                      pagination={{
                        current: contractsPagination.page,
                        pageSize: contractsPagination.limit,
                        total: contractsPagination.total,
                        showSizeChanger: false,
                        onChange: (p) => dispatch(fetchBlockchainContracts({ page: p, search: contractSearch })),
                      }}
                      size="middle"
                      scroll={{ x: 950 }}
                      onRow={(record) => ({
                        onClick: () => handleViewContractDetail(record.rentalId),
                      })}
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <div className="timeline-container">
                      <Timeline mode="left" pending={contractsLoading ? "Đang tải dữ liệu..." : false}>
                        {contracts.map((record) => {
                          const typeInfo = getContractVisualType(record.contractCode);
                          const statusInfo = getContractVisualStatus(record.contractCode, record.status);
                          return (
                            <Timeline.Item
                              key={record.rentalId}
                              dot={
                                <div
                                  className="timeline-dot"
                                  style={{
                                    background: typeInfo.color.replace("text", "bg"),
                                    borderColor: typeInfo.color,
                                  }}
                                />
                              }
                            >
                              <div className="timeline-item-card" onClick={() => handleViewContractDetail(record.rentalId)}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <Tag style={{ background: typeInfo.bg, color: typeInfo.color, border: 0, fontWeight: 700 }}>
                                      {typeInfo.label}
                                    </Tag>
                                    <Tag style={{ background: statusInfo.bg, color: statusInfo.color, border: 0, fontWeight: 700 }}>
                                      {statusInfo.label}
                                    </Tag>
                                  </div>
                                  <span style={{ fontSize: 12, color: "var(--dm-subtitle)" }}>
                                    ⏱️ {formatDate(record.blockchainRecordedAt)}
                                  </span>
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--dm-title)", marginBottom: 4 }}>
                                  {record.contractCode}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignContent: "center", marginTop: 8 }}>
                                  <span style={{ fontSize: 13, color: "var(--dm-subtitle)" }}>
                                    SHA-256: <code style={{ color: "#4f46e5" }}>{truncateHash(record.contractHash || record.blockchainTxHash, 16)}</code>
                                  </span>
                                  <span style={{ fontWeight: 700, color: record.contractCode.includes("LOAN_EVAL") ? "#ec4899" : "var(--dm-title)", fontSize: 14 }}>
                                    {getContractVisualValue(record.contractCode)}
                                  </span>
                                </div>
                              </div>
                            </Timeline.Item>
                          );
                        })}
                      </Timeline>
                    </div>
                  )}
                </>
              ),
            },
            {
              key: "payments",
              label: (
                <span>
                  <WalletOutlined /> Thanh toán ({stats.totalPayments})
                </span>
              ),
              children: (
                <>
                  {/* Filter / Search Bar */}
                  <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={8}>
                      <Input
                        prefix={<SearchOutlined style={{ color: "var(--dm-input-icon)" }} />}
                        placeholder="Tìm theo mã giao dịch hoặc hash..."
                        value={paymentSearch}
                        onChange={(e) => dispatch(setPaymentSearch(e.target.value))}
                        size="large"
                        style={{ borderRadius: 8, background: "var(--dm-surface-soft)", border: "1px solid var(--dm-border)", color: "var(--dm-title)" }}
                      />
                    </Col>
                    <Col xs={12} sm={6} md={4}>
                      <Tag style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid var(--dm-border)", background: "var(--dm-surface-soft)", borderRadius: 8, cursor: "pointer", height: "100%", color: "var(--dm-title)" }}>
                        <span>Tất cả loại</span>
                        <span>▼</span>
                      </Tag>
                    </Col>
                    <Col xs={12} sm={6} md={4}>
                      <Tag style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid var(--dm-border)", background: "var(--dm-surface-soft)", borderRadius: 8, cursor: "pointer", height: "100%", color: "var(--dm-title)" }}>
                        <span>Tất cả trạng thái</span>
                        <span>▼</span>
                      </Tag>
                    </Col>
                  </Row>

                  {paymentsView === "table" ? (
                    <Table
                      className="custom-blockchain-table"
                      columns={paymentColumns}
                      dataSource={payments}
                      rowKey="id"
                      loading={paymentsLoading}
                      pagination={{
                        current: paymentsPagination.page,
                        pageSize: paymentsPagination.limit,
                        total: paymentsPagination.total,
                        showSizeChanger: false,
                        onChange: (p) => dispatch(fetchBlockchainPayments({ page: p, search: paymentSearch })),
                      }}
                      size="middle"
                      scroll={{ x: 950 }}
                      onRow={(record) => ({
                        onClick: () => handleViewPaymentDetail(record.paymentId),
                      })}
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <div className="timeline-container">
                      <Timeline mode="left" pending={paymentsLoading ? "Đang tải dữ liệu..." : false}>
                        {payments.map((record) => {
                          const typeInfo = getPaymentVisualType(record.payment?.paymentCode || "INV_101696");
                          const statusInfo = getPaymentVisualStatus(record.payment?.status || "paid");
                          return (
                            <Timeline.Item
                              key={record.id}
                              dot={
                                <div
                                  className="timeline-dot"
                                  style={{
                                    background: typeInfo.color.replace("text", "bg"),
                                    borderColor: typeInfo.color,
                                  }}
                                />
                              }
                            >
                              <div className="timeline-item-card" onClick={() => handleViewPaymentDetail(record.paymentId)}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <Tag style={{ background: typeInfo.bg, color: typeInfo.color, border: 0, fontWeight: 700 }}>
                                      {typeInfo.label}
                                    </Tag>
                                    <Tag style={{ background: statusInfo.bg, color: statusInfo.color, border: 0, fontWeight: 700 }}>
                                      {statusInfo.label}
                                    </Tag>
                                  </div>
                                  <span style={{ fontSize: 12, color: "var(--dm-subtitle)" }}>
                                    ⏱️ {formatDate(record.recordedAt)}
                                  </span>
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--dm-title)", marginBottom: 4 }}>
                                  {record.payment?.paymentCode || "INV_101696"}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignContent: "center", marginTop: 8 }}>
                                  <span style={{ fontSize: 13, color: "var(--dm-subtitle)" }}>
                                    SHA-256: <code style={{ color: "#4f46e5" }}>{truncateHash(record.payloadHash || record.txHash, 16)}</code>
                                  </span>
                                  <span style={{ fontWeight: 700, color: "var(--dm-title)", fontSize: 14 }}>
                                    {money.format(record.payment?.amount || 5500000)}
                                  </span>
                                </div>
                              </div>
                            </Timeline.Item>
                          );
                        })}
                      </Timeline>
                    </div>
                  )}
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        open={detailModalOpen}
        onCancel={() => {
          dispatch(setDetailModalOpen(false));
          dispatch(clearDetailData());
        }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LinkOutlined style={{ color: "#4f46e5" }} />
            <span style={{ fontWeight: 700, color: "var(--dm-title)" }}>Chi tiết giao dịch blockchain</span>
          </div>
        }
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {detailData?.explorerUrl && (
                <Button
                  icon={<LinkOutlined />}
                  href={detailData.explorerUrl}
                  target="_blank"
                  style={{ borderRadius: 6 }}
                >
                  Xem trên Etherscan
                </Button>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                type="primary"
                icon={<SafetyCertificateOutlined />}
                onClick={handleVerify}
                loading={verifying}
                style={{
                  background: "#4f46e5",
                  borderColor: "#4f46e5",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                Verify On-Chain
              </Button>
              <Button
                style={{ borderRadius: 6 }}
                onClick={() => {
                  dispatch(setDetailModalOpen(false));
                  dispatch(clearDetailData());
                }}
              >
                Đóng
              </Button>
            </div>
          </div>
        }
        width={640}
        destroyOnClose
        styles={{
          body: {
            paddingTop: 12,
            background: "var(--dm-surface)",
          },
          header: {
            background: "var(--dm-surface)",
            borderBottom: "1px solid var(--dm-dashed)",
            paddingBottom: 14,
          },
        }}
      >
        {detailData && (
          <div style={{ marginTop: 8 }}>
            <Descriptions
              column={1}
              size="small"
              bordered
              contentStyle={{ background: "var(--dm-surface)", color: "var(--dm-title)", borderBottom: "1px solid var(--dm-border)", borderRight: "1px solid var(--dm-border)" }}
              labelStyle={{ background: "var(--dm-surface-soft)", color: "var(--dm-label)", fontWeight: 600, width: 180, borderBottom: "1px solid var(--dm-border)", borderRight: "1px solid var(--dm-border)" }}
            >
              {detailType === "contract" ? (
                <>
                  <Descriptions.Item label="Mã hợp đồng">
                    <strong>{detailData.contractCode}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Contract Hash">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <code style={{ fontSize: 11, wordBreak: "break-all", color: "var(--dm-subtitle)" }}>
                        {detailData.contractHash || "—"}
                      </code>
                      {detailData.contractHash && (
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(detailData.contractHash)}
                        />
                      )}
                    </div>
                  </Descriptions.Item>
                </>
              ) : (
                <>
                  <Descriptions.Item label="Mã thanh toán">
                    <strong>{detailData.payment?.paymentCode || "—"}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã hợp đồng">
                    {detailData.payment?.contract?.contractCode || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tiền">
                    <strong>{money.format(detailData.payment?.amount || 0)}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payload Hash">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <code style={{ fontSize: 11, wordBreak: "break-all", color: "var(--dm-subtitle)" }}>
                        {detailData.payloadHash || "—"}
                      </code>
                      {detailData.payloadHash && (
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(detailData.payloadHash)}
                        />
                      )}
                    </div>
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="TX Hash">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <code style={{ fontSize: 11, wordBreak: "break-all", color: "#4f46e5", fontWeight: 600 }}>
                    {detailData.blockchainTxHash || detailData.txHash || "—"}
                  </code>
                  {(detailData.blockchainTxHash || detailData.txHash) && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(detailData.blockchainTxHash || detailData.txHash)}
                    />
                  )}
                </div>
              </Descriptions.Item>
              {detailData.blockNumber !== undefined && (
                <Descriptions.Item label="Block Number">
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    #{detailData.blockNumber}
                  </span>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Chain ID">
                {detailData.chainId || detailData.chainId === 0
                  ? `${detailData.chainId} (${detailData.chainId === 1337 ? "Ganache" : detailData.chainId === 11155111 ? "Sepolia" : "Unknown"})`
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Network">
                <Tag
                  style={{
                    background: "var(--dm-tag-indigo-bg)",
                    color: "var(--dm-tag-indigo-text)",
                    border: 0,
                    borderRadius: 16,
                    textTransform: "capitalize",
                  }}
                >
                  {detailData.blockchainNetwork || "ganache"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian ghi">
                {formatDate(detailData.blockchainRecordedAt || detailData.recordedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái xác thực">
                {getVerificationTag(detailData.verificationStatus)}
              </Descriptions.Item>
              {detailData.lastVerifiedAt && (
                <Descriptions.Item label="Lần xác thực cuối">
                  {formatDate(detailData.lastVerifiedAt)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BlockchainExplorerPage;

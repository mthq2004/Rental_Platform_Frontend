import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReadFilled,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import http from "../../utils/api";
import "../dashboard/dashboard-enterprise.css";
import "../complaints/disputes.css";

const { Title, Text } = Typography;

interface NewsItem {
  newsId: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  category?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  viewCount: number;
  author?: { id: string; fullName: string } | null;
}

const statusLabel: Record<NewsItem["status"], string> = {
  draft: "Bản nháp",
  published: "Đã xuất bản",
  archived: "Lưu trữ",
};

const NewsListPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState("");

  const unwrapResponse = (response: any) => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  };

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (category) params.set("category", category);

      const res = await http.get(`/estate/news/admin?${params.toString()}`);
      const data = unwrapResponse(res);
      setItems(data?.items || []);
      setTotal(data?.pagination?.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, category]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const confirmDelete = (item: NewsItem) => {
    Modal.confirm({
      title: "Xóa tin tức",
      content: `Bạn chắc chắn muốn xóa: "${item.title}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await http.delete(`/estate/news/admin/${item.newsId}`);
          message.success("Đã xóa tin tức");
          fetchList();
        } catch {
          message.error("Không thể xóa tin tức");
        }
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        title: "Mã / Tiêu đề tin tức",
        dataIndex: "title",
        key: "title",
        width: 300,
        render: (_: string, record: NewsItem) => (
          <div>
            <div style={{ fontWeight: 600, color: "var(--dm-title)", fontSize: 14 }}>{record.title}</div>
            <div style={{ color: "var(--dm-subtitle)", fontSize: 12, marginTop: 4 }}>/{record.slug}</div>
          </div>
        ),
      },
      {
        title: "Danh mục",
        dataIndex: "category",
        key: "category",
        width: 160,
        render: (value: string) => (
          <Tag color="blue" style={{ borderRadius: 12, border: 0, fontWeight: 500 }}>
            {value || "Chưa phân loại"}
          </Tag>
        ),
      },
      {
        title: "Tác giả / Lượt xem",
        key: "author_views",
        width: 200,
        render: (_: unknown, record: NewsItem) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 13, color: "var(--dm-subtitle)", fontWeight: 500 }}>{record.author?.fullName || "—"}</div>
            <div style={{ fontSize: 12, color: "var(--dm-subtitle)", display: "flex", alignItems: "center", gap: 4 }}>
              <EyeOutlined /> {record.viewCount} lượt xem
            </div>
          </div>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (value: NewsItem["status"], record: NewsItem) => {
          const statusIcon: Record<string, React.ReactNode> = {
            draft: <ClockCircleOutlined style={{ fontSize: 12 }} />,
            published: <CheckCircleOutlined style={{ fontSize: 12 }} />,
            archived: <InboxOutlined style={{ fontSize: 12 }} />,
          };

          let bg = "#f3f4f6";
          let color = "#374151";
          
          if (value === "published") {
            bg = "#d1fae5"; color = "#065f46";
          } else if (value === "archived") {
            bg = "#fef3c7"; color = "#92400e";
          }

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: bg, padding: "4px 12px", borderRadius: 100 }}>
                {statusIcon[value]}
                <span style={{ fontSize: 12, fontWeight: 600, color }}>{statusLabel[value]}</span>
              </div>
              {record.isFeatured && (
                <Tag color="gold" style={{ border: 0, borderRadius: 12, margin: 0, fontSize: 11 }}>
                  <StarFilled /> Nổi bật
                </Tag>
              )}
            </div>
          );
        },
      },
      {
        title: "Hành động",
        key: "actions",
        width: 150,
        render: (_: unknown, record: NewsItem) => (
          <Space size="middle">
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              style={{ background: "var(--dm-tag-blue-bg)", borderColor: "transparent", color: "#2563eb", borderRadius: 6 }}
              onClick={() => navigate(`/dashboard/news/${record.newsId}`)}
            />
            <Button
              type="primary"
              danger
              ghost
              icon={<DeleteOutlined />}
              style={{ background: "var(--dm-tag-red-bg)", borderColor: "transparent", color: "#ef4444", borderRadius: 6 }}
              onClick={() => confirmDelete(record)}
            />
          </Space>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="dispute-management-page">
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: "var(--dm-title)" }}>Quản lý tin tức</Title>
          <Text style={{ color: "var(--dm-subtitle)", fontSize: 15 }}>Quản trị toàn bộ nội dung tin tức, chiến dịch và chuyên mục.</Text>
        </Col>
        <Col>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ border: "1px solid var(--dm-border)", borderRadius: 8, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", background: "var(--dm-stat-bg)", boxShadow: "var(--dm-shadow)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--dm-stat-icon-blue-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                 <ReadFilled style={{ color: "#2563eb", fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, textTransform: "uppercase" }}>Tổng bài viết</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "var(--dm-title)", lineHeight: 1.2 }}>{total}</div>
              </div>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              style={{ height: "auto", background: "#4f46e5", borderRadius: 8, fontWeight: 500 }}
              onClick={() => navigate("/dashboard/news/create")}
            >
              Tạo bài viết
            </Button>
            <Button
              icon={<ReloadOutlined />}
              size="large"
              onClick={fetchList}
              loading={loading}
              style={{ height: "auto", borderRadius: 8, fontWeight: 500, borderColor: "var(--dm-refresh-border)", color: "var(--dm-refresh-text)", background: "var(--dm-refresh-bg)" }}
            >
              Làm mới
            </Button>
          </div>
        </Col>
      </Row>

      <Card variant="borderless" className="dispute-filter-card" style={{ marginBottom: 24, borderRadius: 8, border: "1px solid var(--dm-border)" }}>
        <Row gutter={16} align="bottom">
          <Col xs={24} md={8}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)", marginBottom: 6 }}>Tìm kiếm bài viết</div>
            <Input
              prefix={<SearchOutlined style={{ color: "var(--dm-input-icon)" }} />}
              placeholder="VD: Cẩm nang bất động sản..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={fetchList}
              size="large"
            />
          </Col>
          <Col xs={12} md={5}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)", marginBottom: 6 }}>Trạng thái</div>
            <Select
              style={{ width: "100%" }}
              size="large"
              placeholder="Tất cả trạng thái"
              value={status}
              onChange={(val) => setStatus(val)}
              allowClear
              options={[
                { value: "published", label: "Đã xuất bản" },
                { value: "draft", label: "Bản nháp" },
                { value: "archived", label: "Lưu trữ" },
              ]}
            />
          </Col>
          <Col xs={12} md={7}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)", marginBottom: 6 }}>Danh mục</div>
            <Input
              placeholder="Nhập tên danh mục"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onPressEnter={fetchList}
              size="large"
            />
          </Col>
          <Col xs={24} md={4} style={{ textAlign: "right" }}>
             <Button size="large" onClick={fetchList} icon={<FilterOutlined />} style={{ color: "var(--dm-refresh-text)", borderColor: "var(--dm-refresh-border)", background: "var(--dm-refresh-bg)", width: "100%" }}>
               Lọc dữ liệu
             </Button>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" className="dispute-table-card" style={{ borderRadius: 8, border: "1px solid var(--dm-border)", padding: 0, overflow: "hidden" }}>
        <Table
          columns={columns}
          dataSource={items}
          rowKey="newsId"
          pagination={false}
          loading={loading}
          className="custom-dispute-table"
        />
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--dm-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--dm-surface-soft)" }}>
          <Text style={{ color: "var(--dm-subtitle)", fontSize: 13 }}>Đang hiển thị {items.length} / {total} mục</Text>
          <Space>
             <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</Button>
             <Button disabled={items.length < limit} onClick={() => setPage(page + 1)}>Tiếp</Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default NewsListPage;

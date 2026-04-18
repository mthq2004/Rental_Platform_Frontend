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
  Switch,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import http from "../../utils/api";
import "../dashboard/dashboard-enterprise.css";

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

const statusColor: Record<NewsItem["status"], string> = {
  draft: "default",
  published: "green",
  archived: "gold",
};

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
  const [limit, setLimit] = useState(10);
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

  const onPublishToggle = async (item: NewsItem, nextPublished: boolean) => {
    try {
      if (nextPublished) {
        await http.put(`/estate/news/admin/${item.newsId}/publish`);
        message.success("Đã xuất bản tin tức");
      } else {
        await http.put(`/estate/news/admin/${item.newsId}/unpublish`);
        message.success("Đã chuyển về bản nháp");
      }
      fetchList();
    } catch {
      message.error("Không thể cập nhật trạng thái");
    }
  };

  const onFeatureToggle = async (item: NewsItem, next: boolean) => {
    try {
      await http.put(`/estate/news/admin/${item.newsId}/feature`, { isFeatured: next });
      message.success("Đã cập nhật nổi bật");
      fetchList();
    } catch {
      message.error("Không thể cập nhật nổi bật");
    }
  };

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
        title: "Tiêu đề",
        dataIndex: "title",
        key: "title",
        render: (_: string, record: NewsItem) => (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 600 }}>{record.title}</span>
            <span style={{ color: "#6b7280", fontSize: 12 }}>/{record.slug}</span>
          </div>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (value: NewsItem["status"]) => (
          <Tag color={statusColor[value]}>{statusLabel[value]}</Tag>
        ),
      },
      {
        title: "Nổi bật",
        dataIndex: "isFeatured",
        key: "isFeatured",
        width: 120,
        render: (_: boolean, record: NewsItem) => (
          <Space>
            {record.isFeatured ? <StarFilled style={{ color: "#f59e0b" }} /> : <StarOutlined />}
            <Switch
              size="small"
              checked={record.isFeatured}
              onChange={(val) => onFeatureToggle(record, val)}
            />
          </Space>
        ),
      },
      {
        title: "Danh mục",
        dataIndex: "category",
        key: "category",
        width: 160,
        render: (value: string) => value || "—",
      },
      {
        title: "Lượt xem",
        dataIndex: "viewCount",
        key: "viewCount",
        width: 120,
        render: (value: number) => (
          <Space>
            <EyeOutlined />
            {value}
          </Space>
        ),
      },
      {
        title: "Tác giả",
        dataIndex: "author",
        key: "author",
        width: 160,
        render: (value: NewsItem["author"]) => value?.fullName || "—",
      },
      {
        title: "Xuất bản",
        dataIndex: "publishedAt",
        key: "publishedAt",
        width: 160,
        render: (value?: string | null) => value ? new Date(value).toLocaleDateString("vi-VN") : "—",
      },
      {
        title: "Hành động",
        key: "actions",
        width: 200,
        render: (_: unknown, record: NewsItem) => (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => navigate(`/dashboard/news/${record.newsId}`)}
            >
              Sửa
            </Button>
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
              onClick={() => confirmDelete(record)}
            >
              Xóa
            </Button>
            <Switch
              checked={record.status === "published"}
              onChange={(val) => onPublishToggle(record, val)}
            />
          </Space>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Typography.Title level={3} style={{ margin: 0 }}>
            Quản lý tin tức
          </Typography.Title>
          <Typography.Text type="secondary">
            Quản trị toàn bộ nội dung tin tức, chiến dịch và chuyên mục.
          </Typography.Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/dashboard/news/create")}
          >
            Tạo tin mới
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tiêu đề hoặc tóm tắt"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              value={status}
              onChange={(val) => setStatus(val)}
              allowClear
              placeholder="Trạng thái"
              style={{ width: "100%" }}
              options={[
                { value: "draft", label: "Bản nháp" },
                { value: "published", label: "Đã xuất bản" },
                { value: "archived", label: "Lưu trữ" },
              ]}
            />
          </Col>
          <Col xs={24} md={6}>
            <Input
              placeholder="Danh mục"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={5}>
            <Button type="default" onClick={() => fetchList()}>
              Lọc dữ liệu
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey="newsId"
          loading={loading}
          dataSource={items}
          columns={columns}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setLimit(nextSize || 10);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default NewsListPage;

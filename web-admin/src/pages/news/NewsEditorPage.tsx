import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  message,
  Upload,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import http from "../../utils/api";
import "../dashboard/dashboard-enterprise.css";

interface NewsFormValues {
  title: string;
  summary?: string;
  content: string;
  coverImageUrl?: string;
  category?: string;
  tags?: string[];
  status?: "draft" | "published" | "archived";
  isFeatured?: boolean;
  slug?: string;
}

const NewsEditorPage = () => {
  const [form] = Form.useForm<NewsFormValues>();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isCreate = location.pathname.endsWith("/create");
  const [loading, setLoading] = useState(false);
  const [initialSlug, setInitialSlug] = useState<string | undefined>(undefined);
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);

  const unwrapResponse = (response: any) => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  };

  const parseUploadResponse = (response: any) => {
    const data = unwrapResponse(response);
    if (data?.success && data?.data) return data.data;
    if (data?.publicId && (data?.secureUrl || data?.url)) return data;
    return null;
  };

  useEffect(() => {
    const fetchDetail = async () => {
      if (isCreate || !id) return;
      setLoading(true);
      try {
        const res = await http.get(`/estate/news/admin/${id}`);
        const data = unwrapResponse(res);
        form.setFieldsValue({
          title: data.title,
          summary: data.summary,
          content: data.content,
          coverImageUrl: data.coverImageUrl,
          category: data.category,
          tags: data.tags || [],
          status: data.status,
          isFeatured: data.isFeatured,
        });
        setInitialSlug(data.slug);
        if (data.coverImageUrl) {
          setCoverFileList([
            {
              uid: data.newsId || "cover",
              name: "cover",
              status: "done",
              url: data.coverImageUrl,
            },
          ]);
        }
      } catch {
        message.error("Không thể tải tin tức");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [form, id, isCreate]);

  const handleSubmit = async (values: NewsFormValues) => {
    setLoading(true);
    try {
      if (isCreate) {
        await http.post("/estate/news/admin", values);
        message.success("Đã tạo tin tức");
      } else if (id) {
        await http.put(`/estate/news/admin/${id}`, values);
        message.success("Đã cập nhật tin tức");
      }
      navigate("/dashboard/news");
    } catch {
      message.error("Không thể lưu tin tức");
    } finally {
      setLoading(false);
    }
  };

  const handleCoverUpload: UploadProps["customRequest"] = async (options) => {
    const { file, onError, onSuccess } = options;
    try {
      const formData = new FormData();
      formData.append("file", file as File);
      const res = await http.post("/estate/upload/image", formData);
      const uploaded = parseUploadResponse(res);
      if (!uploaded || Array.isArray(uploaded)) {
        throw new Error("Upload failed");
      }

      const url = uploaded.secureUrl || uploaded.url;
      form.setFieldValue("coverImageUrl", url);
      setCoverFileList([
        {
          uid: `${Date.now()}`,
          name: (file as File).name,
          status: "done",
          url,
        },
      ]);

      onSuccess?.(uploaded, new XMLHttpRequest());
      message.success("Đã tải ảnh lên Cloud");
    } catch (error) {
      onError?.(error as Error);
      message.error("Upload ảnh thất bại");
    }
  };

  const watchedValues = Form.useWatch([], form);

  const preview = useMemo(() => {
    const values = watchedValues || {};
    return {
      title: values.title || "Tiêu đề tin tức",
      summary: values.summary || "Tóm tắt nội dung sẽ hiển thị ở trang danh sách.",
      coverImageUrl: values.coverImageUrl,
      category: values.category || "Chưa phân loại",
      tags: values.tags || [],
    };
  }, [watchedValues]);

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Typography.Title level={3} style={{ margin: 0 }}>
            {isCreate ? "Tạo tin tức" : "Chỉnh sửa tin tức"}
          </Typography.Title>
          <Typography.Text type="secondary">
            Xây dựng nội dung chuẩn doanh nghiệp với quy trình phê duyệt rõ ràng.
          </Typography.Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => navigate("/dashboard/news")}>Quay lại</Button>
            <Button type="primary" onClick={() => form.submit()} loading={loading}>
              Lưu tin
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Nội dung chính" loading={loading}>
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
              <Form.Item
                label="Tiêu đề"
                name="title"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
              >
                <Input placeholder="Nhập tiêu đề tin tức" />
              </Form.Item>

              {!isCreate && initialSlug ? (
                <Form.Item label="Slug hiện tại">
                  <Input value={initialSlug} disabled />
                </Form.Item>
              ) : null}

              <Form.Item label="Tóm tắt" name="summary">
                <Input.TextArea rows={3} placeholder="Tóm tắt ngắn gọn cho trang danh sách" />
              </Form.Item>

              <Form.Item
                label="Nội dung chi tiết"
                name="content"
                rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
              >
                <Input.TextArea
                  rows={12}
                  placeholder="Viết nội dung bài viết tại đây. Có thể dùng Markdown nếu cần."
                />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Thiết lập hiển thị" loading={loading}>
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
              <Form.Item label="Ảnh bìa">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Upload
                    listType="picture-card"
                    maxCount={1}
                    accept="image/*"
                    fileList={coverFileList}
                    customRequest={handleCoverUpload}
                    onChange={({ fileList }) => setCoverFileList(fileList)}
                    onRemove={() => {
                      form.setFieldValue("coverImageUrl", undefined);
                      setCoverFileList([]);
                    }}
                  >
                    {coverFileList.length >= 1 ? null : "+"}
                  </Upload>
                  <Form.Item name="coverImageUrl" noStyle>
                    <Input placeholder="Hoặc dán URL ảnh bìa" />
                  </Form.Item>
                </Space>
              </Form.Item>
              <Form.Item label="Danh mục" name="category">
                <Input placeholder="Ví dụ: Thị trường, Pháp lý, Đầu tư" />
              </Form.Item>
              <Form.Item label="Thẻ" name="tags">
                <Select mode="tags" placeholder="Nhập tag và nhấn Enter" />
              </Form.Item>
              <Form.Item label="Trạng thái" name="status" initialValue="draft">
                <Select
                  options={[
                    { value: "draft", label: "Bản nháp" },
                    { value: "published", label: "Xuất bản" },
                    { value: "archived", label: "Lưu trữ" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Tin nổi bật" name="isFeatured" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Form>
          </Card>

          <Card style={{ marginTop: 16 }} title="Xem trước">
            {preview.coverImageUrl ? (
              <img
                src={preview.coverImageUrl}
                alt="cover"
                style={{ width: "100%", borderRadius: 12, marginBottom: 12 }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 140,
                  borderRadius: 12,
                  background: "#f5f5f5",
                  marginBottom: 12,
                }}
              />
            )}
            <Typography.Text type="secondary">{preview.category}</Typography.Text>
            <Typography.Title level={5} style={{ marginTop: 8 }}>
              {preview.title}
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              {preview.summary}
            </Typography.Paragraph>
            <Space wrap>
              {preview.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: "#e0f2fe",
                    padding: "4px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                  }}
                >
                  {tag}
                </span>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NewsEditorPage;

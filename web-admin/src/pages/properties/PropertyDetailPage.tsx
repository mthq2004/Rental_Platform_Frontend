import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Image,
  Input,
  List,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { approveProperty, getPropertyDetailForAdmin, updatePropertyVisibilityForAdmin } from "../../stores/slices/property.slice";

const PropertyDetailPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [messageApi, contextHolder] = message.useMessage();
  const { loading, propertyDetail } = useAppSelector((state) => state.property);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }
    dispatch(getPropertyDetailForAdmin(id));
  }, [dispatch, id]);

  const canToggleVisibility = useMemo(() => {
    if (!propertyDetail) {
      return false;
    }
    return propertyDetail.approvalStatus === "approved";
  }, [propertyDetail]);

  const isPending = propertyDetail?.approvalStatus === "pending";

  const handleApprove = async () => {
    if (!propertyDetail?.id) return;
    try {
      await dispatch(approveProperty({ propertyId: propertyDetail.id, data: { approve: true } })).unwrap();
      messageApi.success("Đã duyệt bất động sản thành công");
      dispatch(getPropertyDetailForAdmin(propertyDetail.id));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không thể duyệt bất động sản");
    }
  };

  const handleReject = async () => {
    if (!propertyDetail?.id) return;
    if (!rejectReason.trim()) {
      messageApi.warning("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await dispatch(approveProperty({ propertyId: propertyDetail.id, data: { approve: false, reason: rejectReason } })).unwrap();
      messageApi.success("Đã từ chối bất động sản");
      setRejectModalOpen(false);
      setRejectReason("");
      dispatch(getPropertyDetailForAdmin(propertyDetail.id));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không thể từ chối bất động sản");
    }
  };

  const handleToggleVisibility = async () => {
    if (!propertyDetail?.id) {
      return;
    }

    try {
      const visible = propertyDetail.status !== "active";
      await dispatch(updatePropertyVisibilityForAdmin({ propertyId: propertyDetail.id, visible })).unwrap();
      messageApi.success(visible ? "Đã hiển thị lại tin" : "Đã ẩn tin thành công");
      await dispatch(getPropertyDetailForAdmin(propertyDetail.id)).unwrap();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái hiển thị");
    }
  };

  if (loading && !propertyDetail) {
    return <Spin size="large" />;
  }

  if (!propertyDetail) {
    return <Empty description="Không tìm thấy thông tin bất động sản" />;
  }

  return (
    <div className="admin-page-shell">
      {contextHolder}
      <Card className="hero-surface" variant="borderless">
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Space>
              {isPending && (
                <>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleApprove}
                    loading={loading}
                  >
                    Duyệt
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => setRejectModalOpen(true)}
                    loading={loading}
                  >
                    Từ chối
                  </Button>
                </>
              )}
              {canToggleVisibility && (
                <Button
                  type={propertyDetail.status === "active" ? "default" : "primary"}
                  danger={propertyDetail.status === "active"}
                  icon={propertyDetail.status === "active" ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={handleToggleVisibility}
                >
                  {propertyDetail.status === "active" ? "Ẩn tin" : "Hiện tin"}
                </Button>
              )}
            </Space>
          </Space>

          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            {propertyDetail.title}
          </Typography.Title>

          <Space wrap>
            <Tag color="blue">{propertyDetail.propertyType}</Tag>
            <Tag color={propertyDetail.approvalStatus === "approved" ? "success" : "processing"}>
              Duyệt: {propertyDetail.approvalStatus}
            </Tag>
            <Tag color={propertyDetail.status === "active" ? "success" : "default"}>Trạng thái: {propertyDetail.status}</Tag>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Hình ảnh" variant="borderless">
            {propertyDetail.images?.length ? (
              <Image.PreviewGroup>
                <Row gutter={[8, 8]}>
                  {propertyDetail.images.map((image: { id: string; uri: string; isPrimary: boolean }) => (
                    <Col xs={12} sm={8} md={6} key={image.id}>
                      <Image
                        src={image.uri}
                        alt={propertyDetail.title}
                        style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
                      />
                    </Col>
                  ))}
                </Row>
              </Image.PreviewGroup>
            ) : (
              <Empty description="Chưa có hình ảnh" />
            )}
          </Card>

          <Card title="Thông tin mô tả" variant="borderless" style={{ marginTop: 16 }}>
            <Typography.Paragraph>{propertyDetail.description || "Không có mô tả"}</Typography.Paragraph>
            <Divider />
            <Typography.Text strong>Địa chỉ:</Typography.Text>
            <Typography.Paragraph style={{ marginTop: 4 }}>
              {propertyDetail.address}, {propertyDetail.ward}, {propertyDetail.district}, {propertyDetail.city}
            </Typography.Paragraph>
          </Card>

          <Card title="Tiện ích và quy định" variant="borderless" style={{ marginTop: 16 }}>
            <Typography.Title level={5}>Tiện ích</Typography.Title>
            <Space wrap>
              {propertyDetail.amenities?.length
                ? propertyDetail.amenities.map((amenity: string) => <Tag key={amenity}>{amenity}</Tag>)
                : "Không có tiện ích"}
            </Space>

            <Divider />

            <Typography.Title level={5}>Quy định</Typography.Title>
            {propertyDetail.rules?.length ? (
              <List
                size="small"
                dataSource={propertyDetail.rules}
                renderItem={(rule: { text: string; order: number }) => <List.Item>{rule.order}. {rule.text}</List.Item>}
              />
            ) : (
              <Typography.Text type="secondary">Không có quy định</Typography.Text>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Thông tin chi tiết" variant="borderless">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Giá thuê">{Number(propertyDetail.pricePerMonth || 0).toLocaleString("vi-VN")} VND/tháng</Descriptions.Item>
              <Descriptions.Item label="Diện tích">{propertyDetail.areaSqm} m²</Descriptions.Item>
              <Descriptions.Item label="Phòng ngủ">{propertyDetail.bedrooms}</Descriptions.Item>
              <Descriptions.Item label="Phòng tắm">{propertyDetail.bathrooms}</Descriptions.Item>
              <Descriptions.Item label="Phòng khách">{propertyDetail.livingRooms}</Descriptions.Item>
              <Descriptions.Item label="Bếp">{propertyDetail.kitchens}</Descriptions.Item>
              <Descriptions.Item label="Ban công">{propertyDetail.balconies}</Descriptions.Item>
              <Descriptions.Item label="Nội thất">{propertyDetail.furnitureStatus || "-"}</Descriptions.Item>
              <Descriptions.Item label="Phí quản lý">{Number(propertyDetail.managementFee || 0).toLocaleString("vi-VN")} VND</Descriptions.Item>
              <Descriptions.Item label="Tiền điện">{Number(propertyDetail.electricityCostPerKwh || 0).toLocaleString("vi-VN")} VND/kWh</Descriptions.Item>
              <Descriptions.Item label="Tiền nước">{Number(propertyDetail.waterCostPerM3 || 0).toLocaleString("vi-VN")} VND/m³</Descriptions.Item>
              <Descriptions.Item label="Lượt xem">{propertyDetail.viewCount || 0}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Chủ tin" variant="borderless" style={{ marginTop: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Họ tên">{propertyDetail.user?.fullName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{propertyDetail.user?.phoneRaw || "-"}</Descriptions.Item>
              <Descriptions.Item label="Tổng tin đăng">{propertyDetail.user?.totalListings || 0}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Từ chối bất động sản"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setRejectReason(""); }}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading }}
      >
        <Typography.Paragraph>
          Vui lòng nhập lý do từ chối để thông báo cho chủ tin:
        </Typography.Paragraph>
        <Input.TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Ví dụ: Hình ảnh không rõ ràng, thông tin không đầy đủ..."
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default PropertyDetailPage;

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Image,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HomeFilled,
  BankOutlined,
  PictureOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { approveProperty, getPropertyDetailForAdmin, updatePropertyVisibilityForAdmin } from "../../stores/slices/property.slice";
import "../complaints/disputes.css";

const { Title, Text, Paragraph } = Typography;

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const PropertyDetailPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [messageApi, contextHolder] = message.useMessage();
  const { loading, propertyDetail } = useAppSelector((state) => state.property);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!id) return;
    dispatch(getPropertyDetailForAdmin(id));
  }, [dispatch, id]);

  const canToggleVisibility = useMemo(() => {
    if (!propertyDetail) return false;
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
    if (!rejectReason.trim()) { messageApi.warning("Vui lòng nhập lý do từ chối"); return; }
    try {
      await dispatch(approveProperty({ propertyId: propertyDetail.id, data: { approve: false, reason: rejectReason } })).unwrap();
      messageApi.success("Đã từ chối bất động sản");
      setRejectModalOpen(false); setRejectReason("");
      dispatch(getPropertyDetailForAdmin(propertyDetail.id));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không thể từ chối bất động sản");
    }
  };

  const handleToggleVisibility = async () => {
    if (!propertyDetail?.id) return;
    try {
      const visible = propertyDetail.status !== "active";
      await dispatch(updatePropertyVisibilityForAdmin({ propertyId: propertyDetail.id, visible })).unwrap();
      messageApi.success(visible ? "Đã hiển thị lại tin" : "Đã ẩn tin thành công");
      await dispatch(getPropertyDetailForAdmin(propertyDetail.id)).unwrap();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái hiển thị");
    }
  };

  if (loading && !propertyDetail) return <div className="dispute-management-page"><Spin size="large" /></div>;
  if (!propertyDetail) return <div className="dispute-management-page"><Empty description="Không tìm thấy thông tin bất động sản" /></div>;

  const approvalStyle: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "var(--dm-tag-yellow-bg)", color: "var(--dm-tag-yellow-text)", label: "CHỜ DUYỆT" },
    approved: { bg: "var(--dm-tag-green-bg)", color: "var(--dm-tag-green-text)", label: "ĐÃ DUYỆT" },
    rejected: { bg: "var(--dm-tag-red-bg)", color: "var(--dm-tag-red-text)", label: "TỪ CHỐI" },
  };
  const approval = approvalStyle[propertyDetail.approvalStatus] || approvalStyle.pending;
  const isActive = propertyDetail.status === "active";

  return (
    <div className="dispute-resolution-page">
      {contextHolder}

      {/* Header Tags */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <span style={{ background: approval.bg, color: approval.color, padding: "4px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600 }}>{approval.label}</span>
        <span style={{ background: "var(--dm-stat-icon-blue-bg)", color: "var(--dm-tag-blue-text)", padding: "4px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600 }}>{propertyDetail.propertyType?.toUpperCase()}</span>
        {canToggleVisibility && (
          <span style={{ background: isActive ? "#d1fae5" : "#f3f4f6", color: isActive ? "#065f46" : "#374151", padding: "4px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600 }}>
            {isActive ? "ĐANG HIỂN THỊ" : "ĐÃ ẨN"}
          </span>
        )}
      </div>

      <Title level={2} style={{ margin: "0 0 8px 0", color: "var(--dm-title)" }}>{propertyDetail.title}</Title>
      <Text style={{ color: "var(--dm-subtitle)", fontSize: 15 }}>{propertyDetail.address}, {propertyDetail.ward}, {propertyDetail.district}, {propertyDetail.city}</Text>

      <Row gutter={24} style={{ marginTop: 24 }}>
        {/* Left Column */}
        <Col xs={24} lg={16} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Images */}
          <Card className="dispute-info-card" variant="borderless">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <PictureOutlined style={{ fontSize: 20, color: "#4f46e5" }} />
              <Title level={4} style={{ margin: 0, color: "var(--dm-title)" }}>Hình ảnh</Title>
              <Text style={{ color: "var(--dm-subtitle)", fontSize: 13, marginLeft: "auto" }}>{propertyDetail.images?.length || 0} ảnh</Text>
            </div>
            {propertyDetail.images?.length ? (
              <Image.PreviewGroup>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                  {propertyDetail.images.map((image: { id: string; uri: string; isPrimary: boolean }) => (
                    <div key={image.id} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--dm-border)" }}>
                      <Image src={image.uri} alt={propertyDetail.title} style={{ width: "100%", height: 120, objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            ) : (
              <div style={{ background: "var(--dm-surface-soft)", border: "1px dashed #d1d5db", borderRadius: 8, padding: 32, textAlign: "center", color: "var(--dm-input-icon)" }}>Chưa có hình ảnh</div>
            )}
          </Card>

          {/* Description */}
          <Card className="dispute-info-card" variant="borderless">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <HomeFilled style={{ fontSize: 20, color: "#4f46e5" }} />
              <Title level={4} style={{ margin: 0, color: "var(--dm-title)" }}>Thông tin mô tả</Title>
            </div>
            <div style={{ background: "var(--dm-surface-soft)", border: "1px solid var(--dm-border)", borderRadius: 8, padding: 16 }}>
              <Paragraph style={{ margin: 0, color: "var(--dm-label)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {propertyDetail.description || "Không có mô tả"}
              </Paragraph>
            </div>
          </Card>

          {/* Amenities & Rules */}
          <Card className="dispute-info-card" variant="borderless">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <UnorderedListOutlined style={{ fontSize: 20, color: "#4f46e5" }} />
              <Title level={4} style={{ margin: 0, color: "var(--dm-title)" }}>Tiện ích và quy định</Title>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Tiện ích</div>
            <Space wrap style={{ marginBottom: 20 }}>
              {propertyDetail.amenities?.length
                ? propertyDetail.amenities.map((amenity: string) => (
                    <span key={amenity} style={{ background: "var(--dm-tag-indigo-bg)", color: "var(--dm-tag-indigo-text)", padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 500 }}>{amenity}</span>
                  ))
                : <Text style={{ color: "var(--dm-input-icon)", fontStyle: "italic" }}>Không có tiện ích</Text>}
            </Space>
            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Quy định</div>
              {propertyDetail.rules?.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {propertyDetail.rules.map((rule: { text: string; order: number }) => (
                    <div key={rule.order} style={{ background: "var(--dm-surface-soft)", border: "1px solid var(--dm-border)", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "var(--dm-label)" }}>
                      {rule.order}. {rule.text}
                    </div>
                  ))}
                </div>
              ) : (
                <Text style={{ color: "var(--dm-input-icon)", fontStyle: "italic" }}>Không có quy định</Text>
              )}
            </div>
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={8} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Details */}
          <Card className="dispute-action-card" variant="borderless">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <BankOutlined style={{ fontSize: 20, color: "#4f46e5" }} />
              <Title level={4} style={{ margin: 0, color: "var(--dm-title)" }}>Thông tin chi tiết</Title>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Giá thuê", value: money.format(propertyDetail.pricePerMonth || 0) + "/tháng" },
                { label: "Diện tích", value: `${propertyDetail.areaSqm} m²` },
                { label: "Phòng ngủ", value: propertyDetail.bedrooms },
                { label: "Phòng tắm", value: propertyDetail.bathrooms },
                { label: "Phòng khách", value: propertyDetail.livingRooms },
                { label: "Bếp", value: propertyDetail.kitchens },
                { label: "Ban công", value: propertyDetail.balconies },
                { label: "Nội thất", value: propertyDetail.furnitureStatus || "—" },
                { label: "Phí quản lý", value: money.format(propertyDetail.managementFee || 0) },
                { label: "Tiền điện", value: `${Number(propertyDetail.electricityCostPerKwh || 0).toLocaleString("vi-VN")} VND/kWh` },
                { label: "Tiền nước", value: `${Number(propertyDetail.waterCostPerM3 || 0).toLocaleString("vi-VN")} VND/m³` },
                { label: "Lượt xem", value: propertyDetail.viewCount || 0 },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px dashed var(--dm-dashed)" }}>
                  <span style={{ color: "var(--dm-subtitle)", fontSize: 13 }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: "var(--dm-title)", fontSize: 14 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Owner Info */}
          <Card className="dispute-action-card" variant="borderless">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <UserOutlined style={{ fontSize: 20, color: "#4f46e5" }} />
              <Title level={4} style={{ margin: 0, color: "var(--dm-title)" }}>Chủ tin</Title>
            </div>
            <div style={{ border: "1px solid var(--dm-border)", borderRadius: 8, padding: 16 }}>
              {[
                { label: "Họ tên", value: propertyDetail.user?.fullName || "—" },
                { label: "Số điện thoại", value: propertyDetail.user?.phoneRaw || "—" },
                { label: "Tổng tin đăng", value: propertyDetail.user?.totalListings || 0 },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, marginBottom: 8, borderBottom: "1px dashed #f3f4f6" }}>
                  <span style={{ color: "var(--dm-subtitle)", fontSize: 13 }}>{item.label}</span>
                  <span style={{ fontWeight: 500, color: "var(--dm-title)" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <Card className="dispute-action-card" variant="borderless">
            <Title level={4} style={{ margin: "0 0 16px 0", color: "var(--dm-title)" }}>Hành động</Title>
            <Space direction="vertical" style={{ width: "100%" }}>
              {isPending && (
                <>
                  <Button type="primary" size="large" block icon={<CheckOutlined />} style={{ background: "#4f46e5", height: 48, fontWeight: 600, borderRadius: 8 }} onClick={handleApprove} loading={loading}>
                    Duyệt bất động sản
                  </Button>
                  <Button danger size="large" block icon={<CloseOutlined />} style={{ height: 48, fontWeight: 600, borderRadius: 8 }} onClick={() => setRejectModalOpen(true)} loading={loading}>
                    Từ chối
                  </Button>
                </>
              )}
              {canToggleVisibility && (
                <Button size="large" block icon={isActive ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  style={{ height: 48, fontWeight: 600, borderRadius: 8, background: isActive ? "#fef2f2" : "#d1fae5", borderColor: "transparent", color: isActive ? "#ef4444" : "#065f46" }}
                  onClick={handleToggleVisibility}>
                  {isActive ? "Ẩn tin" : "Hiện tin"}
                </Button>
              )}
              <Button block type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal title="Từ chối bất động sản" open={rejectModalOpen} onOk={handleReject} onCancel={() => { setRejectModalOpen(false); setRejectReason(""); }} okText="Xác nhận từ chối" cancelText="Hủy" okButtonProps={{ danger: true, loading }}>
        <Paragraph>Vui lòng nhập lý do từ chối để thông báo cho chủ tin:</Paragraph>
        <Input.TextArea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Ví dụ: Hình ảnh không rõ ràng, thông tin không đầy đủ..." rows={4} />
      </Modal>
    </div>
  );
};

export default PropertyDetailPage;

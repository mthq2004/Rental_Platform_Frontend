"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Button,
  Col,
  DatePicker,
  Form,
  Image,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Tooltip,
} from "antd";
import {
  CameraOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CloseOutlined,
  EditOutlined,
  LoadingOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import provinceService from "@/services/province.service";
import { District, Province, Ward } from "@/types/province.type";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getProfileUser,
  requestEmailVerificationOtp,
  requestPhoneUpdateOtp,
  updateAvatar,
  updateProfile,
  verifyEmailOtp,
  verifyPhoneUpdateOtp,
} from "@/stores/slices/auth.slice";

const { Option } = Select;

const GENDER_MAP: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

const KYC_STATUS_MAP: Record<string, string> = {
  pending: "Chờ xác thực",
  in_review: "Đang thẩm định",
  verified: "Đã xác thực",
  rejected: "Từ chối",
  expired: "Hết hạn",
};

const WALLET_TYPE_MAP: Record<string, string> = {
  metamask: "Metamask",
  trust_wallet: "Trust Wallet",
  coinbase: "Coinbase",
  other: "Khác",
};

const normalize = (value?: string | null) => (value || "").trim().toLowerCase();

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return dayjs(value).isValid() ? dayjs(value).format("DD/MM/YYYY HH:mm") : value;
};

type ProfileFormValues = {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  walletAddress?: string | null;
  walletType?: "metamask" | "trust_wallet" | "coinbase" | "other" | null;
  dateOfBirth?: dayjs.Dayjs | null;
  profileFullName?: string;
  idCardNumber?: string | null;
  currentAddress?: string | null;
  currentWard?: string | null;
  currentDistrict?: string | null;
  currentCity?: string | null;
  currentWardCode?: number;
  currentDistrictCode?: number;
  currentCityCode?: number;
  occupation?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

export default function ClientProfilePage() {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);

  const [form] = Form.useForm<ProfileFormValues>();
  const [editing, setEditing] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const hasFetchedProfileRef = useRef(false);
  const [emailOtpModalOpen, setEmailOtpModalOpen] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const currentPhone = Form.useWatch("phone", form);
  const currentEmail = Form.useWatch("email", form);
  const phoneChanged = currentPhone !== user?.phone;
  const emailChanged = (currentEmail || "") !== (user?.email || "");
  const canShowEmailVerifyAction = !!currentEmail && (emailChanged || !user?.isEmailVerified) && !emailVerified;

  const roleLabel = user?.role === "admin" ? "Quản trị viên" : "Người dùng";
  const initials = useMemo(
    () =>
      user?.fullName
        ?.split(" ")
        .map((part) => part[0])
        .slice(-2)
        .join("")
        .toUpperCase(),
    [user?.fullName]
  );

  useEffect(() => {
    if (hasFetchedProfileRef.current) return;
    hasFetchedProfileRef.current = true;

    if (!user) {
      dispatch(getProfileUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!user) return;

    if (editing) return;

    form.setFieldsValue({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      walletAddress: user.walletAddress,
      walletType: user.walletType,
      dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      profileFullName: user.profile?.fullName,
      idCardNumber: user.profile?.idCardNumber,
      currentAddress: user.profile?.currentAddress,
      currentWard: user.profile?.currentWard,
      currentDistrict: user.profile?.currentDistrict,
      currentCity: user.profile?.currentCity,
      currentWardCode: undefined,
      currentDistrictCode: undefined,
      currentCityCode: undefined,
      occupation: user.profile?.occupation,
      emergencyContactName: user.profile?.emergencyContactName,
      emergencyContactPhone: user.profile?.emergencyContactPhone,
    });

    setPhoneVerified(false);
    setEmailVerified(false);
  }, [editing, form, user]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (emailCountdown <= 0) return;
    const timer = setTimeout(() => setEmailCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  const resetOtpState = useCallback(() => {
    setOtp("");
    setOtpModalOpen(false);
    setPendingPhone("");
    setCountdown(0);
  }, []);

  const bootstrapAddressOptions = useCallback(async () => {
    if (!editing) return;

    try {
      setLocationLoading(true);
      const provinceData = await provinceService.getProvinces();
      setProvinces(provinceData);

      const cityName = user?.profile?.currentCity;
      const districtName = user?.profile?.currentDistrict;
      const wardName = user?.profile?.currentWard;

      if (!cityName) return;

      const currentProvince = provinceData.find(
        (province) => normalize(province.name) === normalize(cityName)
      );

      if (!currentProvince) return;

      form.setFieldValue("currentCityCode", currentProvince.code);

      const provinceDetail = await provinceService.getProvinceWithDistricts(currentProvince.code);
      const districtData = provinceDetail.districts || [];
      setDistricts(districtData);

      if (!districtName) return;

      const currentDistrict = districtData.find(
        (district) => normalize(district.name) === normalize(districtName)
      );

      if (!currentDistrict) return;

      form.setFieldValue("currentDistrictCode", currentDistrict.code);

      const districtDetail = await provinceService.getDistrictWithWards(currentDistrict.code);
      const wardData = districtDetail.wards || [];
      setWards(wardData);

      if (!wardName) return;

      const currentWard = wardData.find((ward) => normalize(ward.name) === normalize(wardName));
      if (currentWard) {
        form.setFieldValue("currentWardCode", currentWard.code);
      }
    } catch {
      message.error("Không thể tải danh mục địa chỉ");
    } finally {
      setLocationLoading(false);
    }
  }, [editing, form, message, user?.profile?.currentCity, user?.profile?.currentDistrict, user?.profile?.currentWard]);

  useEffect(() => {
    if (!editing) return;
    bootstrapAddressOptions();
  }, [bootstrapAddressOptions, editing]);

  const handleProvinceChange = async (code: number) => {
    const province = provinces.find((item) => item.code === code);

    form.setFieldsValue({
      currentCityCode: code,
      currentCity: province?.name || null,
      currentDistrictCode: undefined,
      currentDistrict: null,
      currentWardCode: undefined,
      currentWard: null,
    });

    setDistricts([]);
    setWards([]);

    try {
      setLocationLoading(true);
      const data = await provinceService.getProvinceWithDistricts(code);
      setDistricts(data.districts || []);
    } catch {
      message.error("Không thể tải quận/huyện");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleDistrictChange = async (code: number) => {
    const district = districts.find((item) => item.code === code);

    form.setFieldsValue({
      currentDistrictCode: code,
      currentDistrict: district?.name || null,
      currentWardCode: undefined,
      currentWard: null,
    });

    setWards([]);

    try {
      setLocationLoading(true);
      const data = await provinceService.getDistrictWithWards(code);
      setWards(data.wards || []);
    } catch {
      message.error("Không thể tải xã/phường");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleWardChange = (code: number) => {
    const ward = wards.find((item) => item.code === code);
    form.setFieldsValue({
      currentWardCode: code,
      currentWard: ward?.name || null,
    });
  };

  const handleSendOtp = async (phone: string) => {
    if (!phone || !/^[0-9]{9,11}$/.test(phone)) {
      message.error("Số điện thoại không hợp lệ");
      return;
    }

    try {
      setOtpLoading(true);
      await dispatch(requestPhoneUpdateOtp(phone)).unwrap();
      setPendingPhone(phone);
      setOtp("");
      setCountdown(120);
      setOtpModalOpen(true);
      message.success("Mã OTP đã được gửi");
    } catch (error: unknown) {
      message.error((error as string) || "Gửi OTP thất bại");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    try {
      setOtpLoading(true);
      await dispatch(verifyPhoneUpdateOtp({ phone: pendingPhone, otp })).unwrap();
      setPhoneVerified(true);
      setOtpModalOpen(false);
      message.success("Xác thực số điện thoại thành công");
    } catch (error: unknown) {
      message.error((error as string) || "Mã OTP không chính xác");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    try {
      setOtpLoading(true);
      await dispatch(requestPhoneUpdateOtp(pendingPhone)).unwrap();
      setCountdown(120);
      setOtp("");
      message.success("Đã gửi lại OTP");
    } catch (error: unknown) {
      message.error((error as string) || "Không thể gửi lại OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRequestEmailOtp = async (email?: string | null) => {
    const targetEmail = (email || currentEmail || user?.email || "").trim().toLowerCase();

    if (!targetEmail) {
      message.error("Bạn cần cập nhật email trước khi xác thực");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      message.error("Email không hợp lệ");
      return;
    }

    try {
      setEmailOtpLoading(true);
      const response = await dispatch(requestEmailVerificationOtp(targetEmail)).unwrap();
      setEmailOtpModalOpen(true);
      setEmailOtp("");
      setEmailCountdown(300);
      setPendingEmail(targetEmail);

      const devOtp = response?.data?.devOtp;
      if (devOtp) {
        message.success(`OTP dev: ${devOtp}`);
      } else {
        message.success("Đã gửi OTP xác thực email");
      }
    } catch (error: unknown) {
      message.error((error as string) || "Không thể gửi OTP email");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtp.length !== 6) {
      message.error("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    try {
      setEmailOtpLoading(true);
      await dispatch(verifyEmailOtp({ otp: emailOtp, email: pendingEmail || currentEmail || undefined })).unwrap();
      setEmailOtpModalOpen(false);
      setEmailOtp("");
      setEmailCountdown(0);
      setEmailVerified(true);
      message.success("Xác thực email thành công");
      dispatch(getProfileUser());
    } catch (error: unknown) {
      message.error((error as string) || "OTP email không hợp lệ");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (emailCountdown > 0 || !pendingEmail) {
      return;
    }

    try {
      setEmailOtpLoading(true);
      const response = await dispatch(requestEmailVerificationOtp(pendingEmail)).unwrap();
      setEmailOtp("");
      setEmailCountdown(300);
      const devOtp = response?.data?.devOtp;
      if (devOtp) {
        message.success(`OTP dev: ${devOtp}`);
      } else {
        message.success("Đã gửi lại OTP email");
      }
    } catch (error: unknown) {
      message.error((error as string) || "Không thể gửi lại OTP email");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "");
    if (digit.length > 1) return;

    const values = otp.split("");
    while (values.length < 6) values.push("");
    values[index] = digit;
    setOtp(values.join(""));

    if (digit && index < 5) {
      document.getElementById(`profile-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`profile-otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setOtp(pasted);
    document.getElementById(`profile-otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  const handleSubmit = async (values: ProfileFormValues) => {
    const isPhoneChanged = values.phone !== user?.phone;
    const isEmailChanged = (values.email || "") !== (user?.email || "");

    if (isPhoneChanged && !phoneVerified) {
      await handleSendOtp(String(values.phone || ""));
      return;
    }

    if (isEmailChanged && !emailVerified) {
      await handleRequestEmailOtp(values.email);
      return;
    }

    try {
      const payload = {
        fullName: values.fullName,
        email: values.email,
        phone: isPhoneChanged ? values.phone : user?.phone,
        gender: values.gender,
        walletAddress: values.walletAddress || null,
        walletType: values.walletType || null,
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
          : undefined,
        profile: {
          fullName: values.profileFullName || values.fullName,
          idCardNumber: values.idCardNumber || null,
          currentAddress: values.currentAddress || null,
          currentWard: values.currentWard || null,
          currentDistrict: values.currentDistrict || null,
          currentCity: values.currentCity || null,
          occupation: values.occupation || null,
          emergencyContactName: values.emergencyContactName || null,
          emergencyContactPhone: values.emergencyContactPhone || null,
        },
      };

      await dispatch(updateProfile(payload as any)).unwrap();
      message.success("Cập nhật hồ sơ thành công");
      setEditing(false);
      setPhoneVerified(false);
      setEmailVerified(false);
      dispatch(getProfileUser());
    } catch (error: unknown) {
      message.error((error as string) || "Cập nhật hồ sơ thất bại");
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      message.error("Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error("Kích thước ảnh tối đa 5MB");
      return;
    }

    try {
      setAvatarUploading(true);
      await dispatch(updateAvatar(file)).unwrap();
      message.success("Cập nhật ảnh đại diện thành công");
      dispatch(getProfileUser());
    } catch (error: unknown) {
      message.error((error as string) || "Không thể cập nhật ảnh đại diện");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setPhoneVerified(false);
    setEmailVerified(false);
    resetOtpState();
    form.resetFields();

    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        walletAddress: user.walletAddress,
        walletType: user.walletType,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
        profileFullName: user.profile?.fullName,
        idCardNumber: user.profile?.idCardNumber,
        currentAddress: user.profile?.currentAddress,
        currentWard: user.profile?.currentWard,
        currentDistrict: user.profile?.currentDistrict,
        currentCity: user.profile?.currentCity,
        occupation: user.profile?.occupation,
        emergencyContactName: user.profile?.emergencyContactName,
        emergencyContactPhone: user.profile?.emergencyContactPhone,
      });
    }
  };

  const displayAddress = [
    user?.profile?.currentAddress,
    user?.profile?.currentWard,
    user?.profile?.currentDistrict,
    user?.profile?.currentCity,
  ]
    .filter(Boolean)
    .join(", ");

  if (!user && loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.sidebar} />
      <div style={styles.content}>
        <div style={styles.pageHeader}>
          <div>
            <p style={styles.breadcrumb}>Tài khoản</p>
            <h1 style={styles.pageTitle}>Hồ sơ cá nhân</h1>
          </div>

          {!editing ? (
            <button style={styles.btnOutline} onClick={() => setEditing(true)}>
              <EditOutlined style={{ fontSize: 13 }} />
              Chỉnh sửa
            </button>
          ) : (
            <Space size={12}>
              <button style={styles.btnGhost} onClick={handleCancelEdit}>
                <CloseOutlined style={{ fontSize: 13 }} />
                Hủy
              </button>
              <button
                style={styles.btnPrimary}
                onClick={() => form.submit()}
                disabled={loading}
              >
                <SaveOutlined style={{ fontSize: 13 }} />
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </Space>
          )}
        </div>

        <div style={styles.grid}>
          <div style={styles.identityCard}>
            <div style={styles.avatarSection}>
              <div style={styles.avatarRing}>
                {user?.avatarUrl ? (
                  <>
                    <img
                      src={user.avatarUrl}
                      alt="avatar"
                      style={styles.avatarImg}
                      onClick={() => setPreviewOpen(true)}
                    />
                    <Image
                      src={user.avatarUrl}
                      alt="avatar-preview"
                      style={{ display: "none" }}
                      preview={{
                        open: previewOpen,
                        onOpenChange: (open) => setPreviewOpen(open),
                      }}
                    />
                  </>
                ) : (
                  <div style={styles.avatarFallback}>{initials || <UserOutlined />}</div>
                )}
                {avatarUploading && (
                  <div style={styles.avatarOverlay}>
                    <LoadingOutlined style={{ color: "#fff" }} />
                  </div>
                )}
              </div>

              <Tooltip title="Đổi ảnh đại diện">
                <button style={styles.cameraBtn} onClick={handleAvatarClick}>
                  <CameraOutlined style={{ fontSize: 12 }} />
                </button>
              </Tooltip>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </div>

            <div style={styles.identityInfo}>
              <h2 style={styles.userName}>{user?.fullName || "—"}</h2>
              <div style={styles.roleBadge}>
                <SafetyCertificateOutlined style={{ fontSize: 10 }} />
                {roleLabel}
              </div>
              <div style={styles.verifyStack}>
                <VerificationBadge
                  ok={!!user?.phoneVerified}
                  label={user?.phoneVerified ? "SĐT đã xác thực" : "SĐT chưa xác thực"}
                />
                <VerificationBadge
                  ok={!!user?.isEmailVerified}
                  label={user?.isEmailVerified ? "Email đã xác thực" : "Email chưa xác thực"}
                />
              </div>
              {!user?.isEmailVerified && user?.email && !editing && (
                <button
                  style={styles.verifyActionBtn}
                  onClick={() => handleRequestEmailOtp(user.email)}
                  disabled={emailOtpLoading}
                >
                  <SafetyOutlined style={{ fontSize: 12 }} />
                  {emailOtpLoading ? "Đang gửi OTP..." : "Xác thực email"}
                </button>
              )}
            </div>

            <div style={styles.divider} />

            <div style={styles.metaList}>
              <MetaRow icon={<MailOutlined />} label={user?.email || "—"} />
              <MetaRow icon={<PhoneOutlined />} label={user?.phone || "—"} />
              <MetaRow icon={<LockOutlined />} label={roleLabel} muted />
            </div>
          </div>

          <div style={styles.detailCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardLabel}>Thông tin tài khoản</span>
              <span style={styles.cardSublabel}>
                {editing
                  ? "Đang chỉnh sửa hồ sơ của bạn"
                  : "Xem và quản lý thông tin cá nhân"}
              </span>
            </div>

            <div style={styles.detailScrollable}>
              {!editing ? (
                <div style={styles.infoGrid}>
                  <InfoField label="Họ và tên" value={user?.fullName} />
                  <InfoField label="Email" value={user?.email || "-"} />
                  <InfoField label="Số điện thoại" value={user?.phone || "-"} />
                  <InfoField
                    label="Xác thực email"
                    value={user?.isEmailVerified ? "Đã xác thực" : "Chưa xác thực"}
                  />
                  <InfoField
                    label="Xác thực số điện thoại"
                    value={user?.phoneVerified ? "Đã xác thực" : "Chưa xác thực"}
                  />
                  <InfoField
                    label="Trạng thái KYC"
                    value={KYC_STATUS_MAP[user?.kycStatus || ""] || "-"}
                  />
                  <InfoField label="Giới tính" value={GENDER_MAP[user?.gender || ""] || "-"} />
                  <InfoField
                    label="Ngày sinh"
                    value={
                      user?.dateOfBirth ? dayjs(user.dateOfBirth).format("DD/MM/YYYY") : "-"
                    }
                  />
                  <InfoField label="Ví điện tử" value={user?.walletAddress || "-"} />
                  <InfoField
                    label="Loại ví"
                    value={user?.walletType ? WALLET_TYPE_MAP[user.walletType] : "-"}
                  />
                  <InfoField label="CCCD/CMND" value={user?.profile?.idCardNumber || "-"} />
                  <InfoField label="Nghề nghiệp" value={user?.profile?.occupation || "-"} />
                  <InfoField label="Địa chỉ hiện tại" value={displayAddress || "-"} spanFull />
                  <InfoField
                    label="Liên hệ khẩn cấp"
                    value={user?.profile?.emergencyContactName || "-"}
                  />
                  <InfoField
                    label="SĐT khẩn cấp"
                    value={user?.profile?.emergencyContactPhone || "-"}
                  />
                  <InfoField label="KYC gửi lúc" value={formatDate(user?.kycSubmittedAt)} />
                  <InfoField label="KYC duyệt lúc" value={formatDate(user?.kycVerifiedAt)} />
                  <InfoField label="Lý do từ chối KYC" value={user?.kycRejectionReason || "-"} />
                  <InfoField label="Đăng nhập gần nhất" value={formatDate(user?.lastLoginAt)} />
                </div>
              ) : (
                <Spin spinning={locationLoading}>
                  <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSubmit}>
                  <Row gutter={[20, 0]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="fullName"
                        label={<FieldLabel>Họ và tên</FieldLabel>}
                        rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                      >
                        <Input size="large" prefix={<UserOutlined style={styles.inputIcon} />} />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="profileFullName"
                        label={<FieldLabel>Tên trên hồ sơ</FieldLabel>}
                      >
                        <Input size="large" prefix={<UserOutlined style={styles.inputIcon} />} />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="email"
                        label={<FieldLabel>Email</FieldLabel>}
                        rules={[
                          { required: true, message: "Vui lòng nhập email" },
                          { type: "email", message: "Email không hợp lệ" },
                        ]}
                      >
                        <Input
                          size="large"
                          prefix={<MailOutlined style={styles.inputIcon} />}
                          suffix={
                            canShowEmailVerifyAction ? (
                              <Button
                                type="link"
                                size="small"
                                loading={emailOtpLoading}
                                className="!p-0"
                                onClick={() => handleRequestEmailOtp(String(form.getFieldValue("email") || ""))}
                              >
                                Xác thực
                              </Button>
                            ) : emailVerified || (!!user?.isEmailVerified && !emailChanged) ? (
                              <span className="text-green-600 text-xs">Đã xác thực</span>
                            ) : null
                          }
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="phone"
                        label={<FieldLabel>Số điện thoại</FieldLabel>}
                        rules={[{ pattern: /^[0-9]{9,11}$/, message: "Số điện thoại không hợp lệ" }]}
                      >
                        <Input
                          size="large"
                          prefix={<PhoneOutlined style={styles.inputIcon} />}
                          suffix={
                            phoneChanged && !phoneVerified ? (
                              <Button
                                type="link"
                                size="small"
                                loading={otpLoading}
                                className="!p-0"
                                onClick={() => handleSendOtp(String(form.getFieldValue("phone") || ""))}
                              >
                                Xác thực
                              </Button>
                            ) : phoneChanged && phoneVerified ? (
                              <span className="text-green-600 text-xs">Đã xác thực</span>
                            ) : null
                          }
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="dateOfBirth" label={<FieldLabel>Ngày sinh</FieldLabel>}>
                        <DatePicker size="large" format="DD/MM/YYYY" className="w-full" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="gender" label={<FieldLabel>Giới tính</FieldLabel>}>
                        <Radio.Group>
                          <Radio value="male">Nam</Radio>
                          <Radio value="female">Nữ</Radio>
                          <Radio value="other">Khác</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="idCardNumber" label={<FieldLabel>CCCD/CMND</FieldLabel>}>
                        <Input size="large" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="occupation" label={<FieldLabel>Nghề nghiệp</FieldLabel>}>
                        <Input size="large" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="walletAddress" label={<FieldLabel>Địa chỉ ví</FieldLabel>}>
                        <Input size="large" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="walletType" label={<FieldLabel>Loại ví</FieldLabel>}>
                        <Select size="large" allowClear placeholder="Chọn loại ví">
                          {Object.entries(WALLET_TYPE_MAP).map(([value, label]) => (
                            <Option key={value} value={value}>
                              {label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24}>
                      <Form.Item
                        name="currentAddress"
                        label={<FieldLabel>Số nhà, tên đường</FieldLabel>}
                        rules={[{ required: true, message: "Vui lòng nhập số nhà, tên đường" }]}
                      >
                        <Input size="large" placeholder="Ví dụ: 12 Nguyễn Trãi" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        name="currentCityCode"
                        label={<FieldLabel>Tỉnh/Thành phố</FieldLabel>}
                        rules={[{ required: true, message: "Chọn tỉnh/thành phố" }]}
                      >
                        <Select
                          size="large"
                          placeholder="Chọn tỉnh/thành"
                          onChange={handleProvinceChange}
                          showSearch
                          filterOption={(input, option) =>
                            String(option?.children || "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                        >
                          {provinces.map((province) => (
                            <Option key={province.code} value={province.code}>
                              {province.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        name="currentDistrictCode"
                        label={<FieldLabel>Quận/Huyện</FieldLabel>}
                        rules={[{ required: true, message: "Chọn quận/huyện" }]}
                      >
                        <Select
                          size="large"
                          placeholder="Chọn quận/huyện"
                          disabled={districts.length === 0}
                          onChange={handleDistrictChange}
                          showSearch
                          filterOption={(input, option) =>
                            String(option?.children || "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                        >
                          {districts.map((district) => (
                            <Option key={district.code} value={district.code}>
                              {district.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        name="currentWardCode"
                        label={<FieldLabel>Phường/Xã</FieldLabel>}
                        rules={[{ required: true, message: "Chọn phường/xã" }]}
                      >
                        <Select
                          size="large"
                          placeholder="Chọn phường/xã"
                          disabled={wards.length === 0}
                          onChange={handleWardChange}
                          showSearch
                          filterOption={(input, option) =>
                            String(option?.children || "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                        >
                          {wards.map((ward) => (
                            <Option key={ward.code} value={ward.code}>
                              {ward.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="emergencyContactName" label={<FieldLabel>Người liên hệ khẩn cấp</FieldLabel>}>
                        <Input size="large" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="emergencyContactPhone" label={<FieldLabel>SĐT khẩn cấp</FieldLabel>}>
                        <Input size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                    <Form.Item name="currentCity" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name="currentDistrict" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name="currentWard" hidden>
                      <Input />
                    </Form.Item>
                  </Form>
                </Spin>
              )}
            </div>

            {!editing && (
              <div style={styles.securityRow}>
                <LockOutlined style={{ fontSize: 13, color: "#94a3b8" }} />
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Thông tin được bảo mật và mã hóa an toàn.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={otpModalOpen}
        onCancel={() => {
          resetOtpState();
          setPhoneVerified(false);
        }}
        footer={null}
        centered
        width={400}
        destroyOnHidden
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <SafetyOutlined className="text-2xl text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Xác thực số điện thoại</h3>
          <p className="text-sm text-gray-500 mb-6">
            Mã OTP đã gửi đến số <strong>{pendingPhone}</strong>
          </p>

          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                id={`profile-otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[index] || ""}
                onChange={(event) => handleOtpChange(index, event.target.value)}
                onKeyDown={(event) => handleOtpKeyDown(index, event)}
                onPaste={handleOtpPaste}
                onFocus={(event) => event.target.select()}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            ))}
          </div>

          <div className="text-sm text-gray-500 mb-5">
            {countdown > 0 ? (
              <span>
                Gửi lại OTP sau <span className="text-blue-500 font-semibold">{countdown}s</span>
              </span>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={otpLoading}
                className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer font-medium"
              >
                Gửi lại OTP
              </button>
            )}
          </div>

          <Button
            type="primary"
            size="large"
            block
            loading={otpLoading}
            disabled={otp.length !== 6}
            onClick={handleVerifyOtp}
            className="!rounded-lg !h-12"
          >
            Xác nhận
          </Button>
        </div>
      </Modal>

      <Modal
        open={emailOtpModalOpen}
        onCancel={() => {
          setEmailOtpModalOpen(false);
          setEmailOtp("");
          setPendingEmail("");
        }}
        footer={null}
        centered
        width={400}
        destroyOnHidden
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <MailOutlined className="text-2xl text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Xác thực email</h3>
          <p className="text-sm text-gray-500 mb-6">
            Nhập OTP 6 số đã gửi tới <strong>{pendingEmail || currentEmail || user?.email || "email của bạn"}</strong>
          </p>

          <Input
            value={emailOtp}
            onChange={(event) => setEmailOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Nhập OTP"
            maxLength={6}
            size="large"
            style={{ textAlign: "center", letterSpacing: 6, marginBottom: 16, height: 44 }}
          />

          <div className="text-sm text-gray-500 mb-5">
            {emailCountdown > 0 ? (
              <span>
                Gửi lại OTP sau <span className="text-emerald-600 font-semibold">{emailCountdown}s</span>
              </span>
            ) : (
              <button
                onClick={handleResendEmailOtp}
                disabled={emailOtpLoading}
                className="text-emerald-600 hover:underline bg-transparent border-none cursor-pointer font-medium"
              >
                Gửi lại OTP email
              </button>
            )}
          </div>

          <Button
            type="primary"
            size="large"
            block
            loading={emailOtpLoading}
            disabled={emailOtp.length !== 6}
            onClick={handleVerifyEmailOtp}
            className="!rounded-lg !h-12"
          >
            Xác nhận email
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const VerificationBadge = ({ ok, label }: { ok: boolean; label: string }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      border: ok ? "1px solid #bbf7d0" : "1px solid #fecaca",
      background: ok ? "#f0fdf4" : "#fff1f2",
      color: ok ? "#166534" : "#b91c1c",
      fontSize: 12,
      fontWeight: 600,
      padding: "4px 10px",
    }}
  >
    {ok ? <CheckCircleFilled style={{ fontSize: 11 }} /> : <CloseCircleFilled style={{ fontSize: 11 }} />}
    {label}
  </span>
);

const MetaRow = ({
  icon,
  label,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  muted?: boolean;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
    <span style={{ fontSize: 13, color: "#64748b", minWidth: 16 }}>{icon}</span>
    <span
      style={{
        fontSize: 13,
        color: muted ? "#64748b" : "#0f172a",
        fontStyle: muted ? "italic" : "normal",
      }}
    >
      {label || "—"}
    </span>
  </div>
);

const InfoField = ({
  label,
  value,
  spanFull,
}: {
  label: string;
  value?: string | number | null;
  spanFull?: boolean;
}) => (
  <div style={{ ...styles.infoField, gridColumn: spanFull ? "1 / -1" : "auto" }}>
    <span style={styles.infoLabel}>{label}</span>
    <span style={styles.infoValue}>{value || "—"}</span>
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 600,
      color: "#64748b",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </span>
);

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    height: "100%",
    minHeight: "100%",
    background: "#f8fafc",
    display: "flex",
    overflow: "hidden",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  sidebar: {
    width: 4,
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0f172a 0%, #2563eb 100%)",
    flexShrink: 0,
  },
  content: {
    flex: 1,
    width: "100%",
    margin: "0 auto",
    minHeight: 0,
    overflow: "hidden",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    padding: "36px 24px",
  },
  pageHeader: {
    display: "flex",
    width: "100%",
    maxWidth: 1080,
    margin: "0 auto 28px",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  breadcrumb: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: "#2563eb",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  pageTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.4px",
  },
  grid: {
    display: "grid",
    width: "100%",
    maxWidth: 1080,
    margin: "0 auto",
    gridTemplateColumns: "minmax(260px, 3fr) minmax(0, 7fr)",
    gap: 24,
    alignItems: "start",
    minHeight: 0,
  },
  identityCard: {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: "28px 22px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatarSection: {
    position: "relative",
    marginBottom: 20,
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: "50%",
    border: "3px solid #e2e8f0",
    overflow: "hidden",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    cursor: "zoom-in",
  },
  avatarFallback: {
    fontSize: 30,
    fontWeight: 700,
    color: "#2563eb",
    userSelect: "none",
  },
  avatarOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBtn: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    position: "absolute",
    right: -4,
    bottom: -2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  identityInfo: {
    textAlign: "center",
  },
  userName: {
    margin: 0,
    fontSize: 21,
    fontWeight: 700,
    color: "#0f172a",
  },
  roleBadge: {
    marginTop: 8,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    background: "#eff6ff",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  verifiedTag: {
    marginTop: 10,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "#166534",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 600,
  },
  verifyStack: {
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  verifyActionBtn: {
    marginTop: 12,
    border: "1px solid #10b981",
    background: "#ecfdf5",
    color: "#065f46",
    borderRadius: 999,
    height: 32,
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  divider: {
    width: "100%",
    height: 1,
    background: "#e2e8f0",
    margin: "18px 0 12px",
  },
  metaList: {
    width: "100%",
  },
  detailCard: {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: "24px 24px 18px",
    height: "calc(100vh - 180px)",
    minHeight: 520,
    display: "flex",
    flexDirection: "column",
  },
  detailScrollable: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingRight: 4,
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#2563eb",
  },
  cardSublabel: {
    color: "#64748b",
    fontSize: 13,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  infoField: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "#f8fafc",
  },
  infoLabel: {
    fontSize: 11,
    letterSpacing: "0.05em",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  securityRow: {
    marginTop: 16,
    borderTop: "1px dashed #cbd5e1",
    paddingTop: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 36,
    border: "none",
    padding: "0 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    background: "#2563eb",
    cursor: "pointer",
  },
  btnOutline: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 36,
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
    background: "#fff",
    cursor: "pointer",
  },
  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 36,
    border: "1px solid #e2e8f0",
    padding: "0 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    background: "#fff",
    cursor: "pointer",
  },
  inputIcon: {
    color: "#94a3b8",
  },
};

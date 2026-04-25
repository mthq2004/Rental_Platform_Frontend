"use client";

import React, { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Image,
  Input,
  Select,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileOutlined,
  InfoCircleOutlined,
  PaperClipOutlined,
  SendOutlined,
} from "@ant-design/icons";
import type { ReportType, ReportPriority, ReportItem } from "@/types/contract.type";
import { uploadMixedFiles } from "@/services/upload.service";

const { Text, Title, Paragraph } = Typography;
const { Dragger } = Upload;

// ── Constants matching DB schema enums ─────────────────

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string; description: string }[] = [
  { value: "payment", label: "Tiền thuê / Phí", description: "Tranh chấp liên quan đến thanh toán tiền thuê, phí dịch vụ" },
  { value: "deposit", label: "Tiền cọc", description: "Tranh chấp về tiền cọc, hoàn trả cọc" },
  { value: "property", label: "Hư hỏng tài sản", description: "Hư hỏng, mất mát tài sản trong bất động sản" },
  { value: "contract", label: "Vi phạm hợp đồng", description: "Vi phạm điều khoản, điều kiện hợp đồng" },
  { value: "other", label: "Khác", description: "Các vấn đề khác không thuộc loại trên" },
];

const REPORT_PRIORITY_OPTIONS: { value: ReportPriority; label: string; color: string }[] = [
  { value: "low", label: "Thấp", color: "default" },
  { value: "medium", label: "Trung bình", color: "orange" },
  { value: "high", label: "Cao", color: "red" },
];

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 10;

function getFileIcon(file: UploadFile) {
  const name = file.name?.toLowerCase() || "";
  if (name.endsWith(".pdf")) return <FilePdfOutlined className="text-red-500" />;
  if (/\.(docx?|rtf)$/i.test(name)) return <FileOutlined className="text-blue-600" />;
  if (/\.(xlsx?|csv)$/i.test(name)) return <FileOutlined className="text-green-600" />;
  if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name)) return <FileImageOutlined className="text-blue-500" />;
  return <FileOutlined className="text-slate-400" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(file: UploadFile): boolean {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file.name || "") || (file.type || "").startsWith("image/");
}

// ── Props ──────────────────────────────────────────────

interface DisputeFormSectionProps {
  rentalId: string;
  contractCode?: string;
  ownerId: string;
  tenantId: string;
  userId?: string;
  terminationRequestId?: string;
  prefill?: {
    title?: string;
    description?: string;
    type?: ReportType | string;
  };
  onSubmit: (payload: {
    rentalId: string;
    againstId: string;
    terminationRequestId?: string;
    type: string;
    priority: string;
    title: string;
    description: string;
    attachments?: { url: string; type: string; fileName?: string; fileSize?: number }[];
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  existingReports?: ReportItem[];
}

// ── Component ──────────────────────────────────────────

export default function DisputeFormSection({
  rentalId,
  contractCode,
  ownerId,
  tenantId,
  userId,
  terminationRequestId,
  prefill,
  onSubmit,
  onCancel,
  loading = false,
  existingReports = [],
}: DisputeFormSectionProps) {
  const [form] = Form.useForm();
  const [evidenceFiles, setEvidenceFiles] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isOwner = userId === ownerId;
  const againstId = isOwner ? tenantId : ownerId;

  const handleBeforeUpload = (file: File) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      message.error(`Tệp "${file.name}" vượt quá ${MAX_FILE_SIZE_MB}MB`);
      return Upload.LIST_IGNORE;
    }
    // Don't auto-upload
    return false;
  };

  const handleFilesChange = (info: { fileList: UploadFile[] }) => {
    const newList = info.fileList.slice(0, MAX_FILES);
    setEvidenceFiles(newList);
  };

  const handleRemoveFile = (uid: string) => {
    setEvidenceFiles((prev) => prev.filter((f) => f.uid !== uid));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Require evidence for property type reports
      if (values.type === "property" && evidenceFiles.length === 0) {
        message.error("Bắt buộc tải lên hình ảnh minh chứng cho khiếu nại hư hỏng tài sản");
        return;
      }

      setSubmitting(true);

      // Upload evidence files (images → Cloudinary, documents → S3)
      let attachments: { url: string; type: string; fileName?: string; fileSize?: number }[] = [];
      if (evidenceFiles.length > 0) {
        try {
          const files = evidenceFiles
            .filter((f) => f.originFileObj)
            .map((f) => f.originFileObj as File);
          if (files.length > 0) {
            attachments = await uploadMixedFiles(files);
          }
        } catch (uploadErr: any) {
          message.error("Upload tệp thất bại: " + (uploadErr?.message || ""));
          setSubmitting(false);
          return;
        }
      }

      await onSubmit({
        rentalId,
        againstId,
        terminationRequestId: terminationRequestId || undefined,
        type: values.type,
        priority: values.priority,
        title: values.title,
        description: values.description,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      form.resetFields();
      setEvidenceFiles([]);
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.message || "Gửi khiếu nại thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = Form.useWatch("type", form);
  const isPropertyType = selectedType === "property";
  const imageFiles = evidenceFiles.filter(isImageFile);
  const docFiles = evidenceFiles.filter((f) => !isImageFile(f));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onCancel}
          className="mb-3 text-slate-500 hover:text-slate-700 -ml-2"
        >
          Quay lại
        </Button>
        <Title level={3} className="!mb-1 !text-slate-900">
          Khiếu nại chính thức
        </Title>
        <Text className="text-slate-500">
          Vui lòng cung cấp thông tin chi tiết và chính xác. Tất cả nội dung sẽ được ghi nhận và admin trực tiếp xem xét.
        </Text>
      </div>

      {/* Important Notice */}
      <Alert
        icon={<InfoCircleOutlined />}
        type="info"
        showIcon
        className="!rounded-xl !mb-6 !border-blue-200 !bg-blue-50"
        message={
          <Text className="text-sm font-semibold text-blue-800">Lưu ý quan trọng</Text>
        }
        description={
          <Text className="text-xs text-blue-700">
            Gửi khiếu nại sai sự thật có thể dẫn đến xử phạt tài khoản. Đảm bảo bằng chứng là xác thực và liên quan trực tiếp đến vấn đề.
          </Text>
        }
      />

      {/* Form Card */}
      <Card className="!rounded-2xl !border-slate-200 !shadow-sm">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: prefill?.type || (terminationRequestId ? "contract" : undefined),
            title: prefill?.title,
            description: prefill?.description,
            priority: "medium",
          }}
          className="space-y-1"
        >
          {/* Subject */}
          <Form.Item
            name="title"
            label={<Text className="text-sm font-semibold text-slate-700">Tiêu đề khiếu nại <span className="text-red-500">*</span></Text>}
            rules={[
              { required: true, message: "Vui lòng nhập tiêu đề" },
              { max: 200, message: "Tiêu đề tối đa 200 ký tự" },
            ]}
          >
            <Input
              placeholder="Ví dụ: Chủ nhà không sửa chữa trang thiết bị bị hỏng"
              className="!rounded-lg !h-11"
              size="large"
              maxLength={200}
              showCount
            />
          </Form.Item>

          {/* Type + Priority row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="type"
              label={<Text className="text-sm font-semibold text-slate-700">Loại khiếu nại <span className="text-red-500">*</span></Text>}
              rules={[{ required: true, message: "Vui lòng chọn loại" }]}
            >
              <Select
                placeholder="Chọn loại khiếu nại..."
                className="!rounded-lg"
                size="large"
                optionRender={(option) => {
                  const item = REPORT_TYPE_OPTIONS.find((t) => t.value === option.value);
                  return (
                    <div className="py-1">
                      <div className="font-medium text-slate-800">{item?.label}</div>
                      <div className="text-xs text-slate-500">{item?.description}</div>
                    </div>
                  );
                }}
                options={REPORT_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
              />
            </Form.Item>

            <Form.Item
              name="priority"
              label={<Text className="text-sm font-semibold text-slate-700">Mức độ ưu tiên <span className="text-red-500">*</span></Text>}
              rules={[{ required: true, message: "Vui lòng chọn mức độ" }]}
            >
              <Select
                placeholder="Chọn mức độ..."
                className="!rounded-lg"
                size="large"
                options={REPORT_PRIORITY_OPTIONS.map((p) => ({
                  value: p.value,
                  label: (
                    <div className="flex items-center gap-2">
                      <Tag color={p.color} className="!m-0">{p.label}</Tag>
                    </div>
                  ),
                }))}
              />
            </Form.Item>
          </div>

          {/* Related Contract Info */}
          {contractCode && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-4">
              <div className="flex items-center gap-2">
                <Text className="text-xs text-slate-500">Hợp đồng liên quan:</Text>
                <Tag className="!m-0 !text-xs">{contractCode}</Tag>
                {terminationRequestId && (
                  <>
                    <Text className="text-xs text-slate-500">·</Text>
                    <Tag color="red" className="!m-0 !text-xs">Có yêu cầu chấm dứt liên quan</Tag>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <Form.Item
            name="description"
            label={<Text className="text-sm font-semibold text-slate-700">Mô tả chi tiết <span className="text-red-500">*</span></Text>}
            rules={[
              { required: true, message: "Vui lòng nhập mô tả chi tiết" },
              { min: 20, message: "Mô tả cần tối thiểu 20 ký tự" },
            ]}
          >
            <Input.TextArea
              rows={6}
              placeholder="Cung cấp mô tả chi tiết về sự việc, bao gồm thời gian, địa điểm, thiệt hại cụ thể hoặc điều khoản hợp đồng bị vi phạm..."
              className="!rounded-lg"
              maxLength={2000}
              showCount
            />
          </Form.Item>

          <Divider className="!my-4" />

          {/* Evidence Upload */}
          <div className={`rounded-xl border-2 border-dashed p-5 transition-colors ${isPropertyType ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-slate-50/50"}`}>
            <div className="flex items-center gap-2 mb-2">
              <PaperClipOutlined className={`text-lg ${isPropertyType ? "text-red-500" : "text-slate-500"}`} />
              <Text className={`text-sm font-semibold ${isPropertyType ? "text-red-700" : "text-slate-700"}`}>
                Bằng chứng / Tài liệu đính kèm
              </Text>
              {isPropertyType && (
                <Tag color="red" className="!text-[10px] !px-2 !py-0 !m-0 uppercase font-bold">Bắt buộc</Tag>
              )}
            </div>
            <Paragraph className={`!text-xs !mb-3 ${isPropertyType ? "!text-red-600" : "!text-slate-500"}`}>
              {isPropertyType
                ? "Bắt buộc tải lên hình ảnh minh chứng cho khiếu nại hư hỏng tài sản."
                : "Tải lên hình ảnh, tài liệu để minh chứng cho khiếu nại."
              }
              {" "}Hỗ trợ PNG, JPG, PDF, DOC, DOCX, XLS (tối đa {MAX_FILE_SIZE_MB}MB/tệp). Có thể chọn nhiều tệp cùng lúc.
            </Paragraph>

            {/* Drag & Drop area */}
            <Dragger
              fileList={evidenceFiles}
              onChange={handleFilesChange}
              beforeUpload={handleBeforeUpload}
              accept={ACCEPTED_TYPES}
              multiple
              maxCount={MAX_FILES}
              showUploadList={false}
              className="!border-slate-300 !bg-white/60 hover:!border-indigo-400 !rounded-xl !transition-colors"
              style={{ padding: "16px 0" }}
            >
              <div className="flex flex-col items-center py-3">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                  <CloudUploadOutlined className="text-2xl text-indigo-500" />
                </div>
                <Text className="text-sm text-slate-600">
                  Kéo thả tệp vào đây hoặc <span className="text-indigo-600 font-semibold cursor-pointer">tải lên</span>
                </Text>
                <Text className="text-xs text-slate-400 mt-1">
                  PNG, JPG, PDF, DOC, DOCX (tối đa {MAX_FILE_SIZE_MB}MB)
                </Text>
              </div>
            </Dragger>

            {/* File list */}
            {evidenceFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {/* Image thumbnails */}
                {imageFiles.length > 0 && (
                  <div className="mb-3">
                    <Text className="text-xs text-slate-500 font-medium mb-2 block">
                      Hình ảnh ({imageFiles.length})
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      <Image.PreviewGroup>
                        {imageFiles.map((file) => {
                          const thumbUrl = file.thumbUrl || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : "");
                          return (
                            <div key={file.uid} className="relative group">
                              <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                <Image
                                  src={thumbUrl}
                                  alt={file.name}
                                  width={80}
                                  height={80}
                                  className="object-cover"
                                  preview={{ src: thumbUrl }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.uid); }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                              >
                                ×
                              </button>
                              <Text className="text-[10px] text-slate-500 block mt-0.5 max-w-[80px] truncate text-center">
                                {file.name}
                              </Text>
                            </div>
                          );
                        })}
                      </Image.PreviewGroup>
                    </div>
                  </div>
                )}

                {/* Document files list */}
                {docFiles.length > 0 && (
                  <div>
                    <Text className="text-xs text-slate-500 font-medium mb-2 block">
                      Tài liệu ({docFiles.length})
                    </Text>
                    <div className="space-y-1.5">
                      {docFiles.map((file) => (
                        <div
                          key={file.uid}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 group hover:border-slate-300 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Text className="text-sm text-slate-700 block truncate">{file.name}</Text>
                            <Text className="text-[11px] text-slate-400">{formatFileSize(file.size)}</Text>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.uid)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <DeleteOutlined className="text-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File count info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Text className="text-xs text-slate-500">
                    {evidenceFiles.length} tệp đã chọn
                  </Text>
                  <Text className="text-xs text-slate-400">
                    Tối đa {MAX_FILES} tệp
                  </Text>
                </div>
              </div>
            )}
          </div>
        </Form>
      </Card>

      {/* Existing reports info */}
      {existingReports.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          className="!rounded-xl !mt-4"
          message={
            <Text className="text-sm font-medium text-amber-800">
              Đã có {existingReports.length} khiếu nại cho hợp đồng này
            </Text>
          }
          description={
            <Text className="text-xs text-amber-700">
              Kiểm tra danh sách khiếu nại hiện tại trước khi gửi mới để tránh trùng lặp.
            </Text>
          }
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-6">
        <Button size="large" onClick={onCancel} className="!rounded-lg !h-11 !px-6">
          Hủy
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={submitting || loading}
          className="!rounded-lg !h-11 !px-8 !bg-indigo-600 hover:!bg-indigo-700 !border-indigo-600"
        >
          Yêu cầu Admin can thiệp
        </Button>
      </div>

      {/* Image Preview */}
      {previewImage && (
        <Image
          wrapperStyle={{ display: "none" }}
          preview={{
            visible: !!previewImage,
            onVisibleChange: (vis) => { if (!vis) setPreviewImage(null); },
            src: previewImage,
          }}
          src={previewImage}
          alt="preview"
        />
      )}
    </div>
  );
}

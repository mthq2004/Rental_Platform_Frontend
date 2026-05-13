"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Button, Tag, Space, Typography, Spin, Alert, Progress, Empty,
  Card, Tooltip, Modal, App, Divider, Result,
} from "antd";
import {
  DownloadOutlined, UploadOutlined, ReloadOutlined, FileExcelOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  HistoryOutlined, ArrowLeftOutlined, EyeOutlined, ExportOutlined,
  InboxOutlined, InfoCircleOutlined, LoadingOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  useReactTable, getCoreRowModel, flexRender,
  createColumnHelper, type ColumnDef,
} from "@tanstack/react-table";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  checkEligibility, uploadBulkExcel, getImportSessions,
  getSessionErrors, resetUploadResult, resetSessionDetail,
} from "@/stores/slices/bulk-import.slice";
import type { ImportSession, ImportRowError } from "@/types/bulk-import.type";
import envConfig from "@/config";
import Cookies from "js-cookie";

const { Title, Text, Paragraph } = Typography;

// ========== STATUS CONFIG ==========
const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  COMPLETED: { color: "success", label: "Hoàn tất", icon: <CheckCircleOutlined /> },
  PARTIAL_FAILED: { color: "warning", label: "Hoàn tất (có lỗi)", icon: <ExclamationCircleOutlined /> },
  FAILED: { color: "error", label: "Thất bại", icon: <CloseCircleOutlined /> },
  PROCESSING: { color: "processing", label: "Đang xử lý", icon: <LoadingOutlined /> },
  PENDING: { color: "default", label: "Chờ xử lý", icon: <LoadingOutlined /> },
};

// ========== MAIN PAGE ==========
export default function BulkImportPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    eligibility, eligibilityLoading, uploading, uploadResult,
    sessions, sessionsLoading, errors, errorsLoading, error: uploadError,
  } = useAppSelector((s) => s.bulkImport);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(checkEligibility());
    dispatch(getImportSessions());
  }, [dispatch]);

  // After upload completes, refresh sessions
  useEffect(() => {
    if (uploadResult) {
      dispatch(getImportSessions());
    }
  }, [uploadResult, dispatch]);

  // ========== DOWNLOAD TEMPLATE ==========
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const token = Cookies.get("accessToken");
      const res = await fetch(
        `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/estate/properties/bulk-import/template`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_bulk_import.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      message.success("Đã tải template thành công!");
    } catch {
      message.error("Không thể tải template");
    }
  }, [message]);

  // ========== UPLOAD ==========
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    if (file.size > 5 * 1024 * 1024) {
      message.error("File không được vượt quá 5MB");
      return;
    }
    dispatch(resetUploadResult());
    dispatch(uploadBulkExcel(file));
  }, [dispatch, message]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    maxFiles: 1,
    disabled: uploading,
  });

  // ========== VIEW ERRORS ==========
  const handleViewErrors = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    dispatch(getSessionErrors(sessionId));
  }, [dispatch]);

  const handleExportErrors = useCallback(async (sessionId: string) => {
    try {
      const token = Cookies.get("accessToken");
      const res = await fetch(
        `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/estate/properties/bulk-import/sessions/${sessionId}/export-errors`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `errors_${sessionId.slice(0, 8)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      message.success("Đã xuất file lỗi!");
    } catch {
      message.error("Không thể xuất file lỗi");
    }
  }, [message]);

  // ========== NOT ELIGIBLE ==========
  if (eligibilityLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Đang kiểm tra điều kiện..." />
      </div>
    );
  }

  if (eligibility && !eligibility.eligible) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/dashboard/posts")} className="mb-6">
          Quay lại
        </Button>
        <Result
          status="warning"
          title="Chưa đủ điều kiện sử dụng tính năng này"
          subTitle="Bạn cần đáp ứng các điều kiện dưới đây:"
          extra={
            <div className="text-left space-y-2 max-w-md mx-auto">
              {eligibility.reasons.map((r, i) => (
                <Alert key={i} message={r} type="warning" showIcon className="text-sm" />
              ))}
              <div className="pt-4">
                <Text type="secondary">
                  Thống kê: eKYC: <Tag>{eligibility.stats.kycStatus}</Tag>
                  | BĐS hoạt động: <Tag>{eligibility.stats.activePropertyCount}</Tag>
                  | Số ngày hoạt động: <Tag>{eligibility.stats.accountAgeDays}</Tag>
                </Text>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  // ========== ELIGIBLE - MAIN UI ==========
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/dashboard/posts")} />
          <div>
            <Title level={4} className="!mb-0">Nhập hàng loạt từ Excel</Title>
            <Text type="secondary">Upload file Excel để tạo nhiều tin đăng cùng lúc</Text>
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => { dispatch(checkEligibility()); dispatch(getImportSessions()); }}>
          Làm mới
        </Button>
      </div>

      {/* Step 1: Download Template */}
      <Card
        title={<span><FileExcelOutlined className="mr-2 text-green-600" />Bước 1: Tải mẫu Excel</span>}
        className="shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <Paragraph className="!mb-1">
              Tải file mẫu Excel với đầy đủ cột và dropdown hướng dẫn.
            </Paragraph>
            <Text type="secondary" className="text-xs">
              File mẫu bao gồm sheet dữ liệu và sheet hướng dẫn chi tiết.
            </Text>
          </div>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadTemplate} size="large">
            Tải Template
          </Button>
        </div>
      </Card>

      {/* Step 2: Upload */}
      <Card
        title={<span><UploadOutlined className="mr-2 text-blue-600" />Bước 2: Upload file Excel</span>}
        className="shadow-sm"
      >
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}
            ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="space-y-3">
              <LoadingOutlined className="text-4xl text-blue-500" />
              <p className="text-gray-600 font-medium">Đang xử lý file...</p>
              <Progress percent={99} status="active" showInfo={false} className="max-w-xs mx-auto" />
            </div>
          ) : (
            <div className="space-y-2">
              <InboxOutlined className="text-5xl text-gray-300" />
              <p className="text-gray-600 font-medium">
                {isDragActive ? "Thả file vào đây..." : "Kéo thả file Excel hoặc click để chọn"}
              </p>
              <p className="text-gray-400 text-xs">Chỉ chấp nhận file .xlsx, tối đa 5MB, tối đa 100 dòng</p>
            </div>
          )}
        </div>

        {/* Upload Error */}
        {uploadError && (
          <Alert message={uploadError} type="error" showIcon className="mt-4" closable onClose={() => dispatch(resetUploadResult())} />
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 border">
            <div className="flex items-center gap-2 mb-3">
              {uploadResult.status === "COMPLETED" ? (
                <CheckCircleOutlined className="text-green-500 text-xl" />
              ) : uploadResult.status === "FAILED" ? (
                <CloseCircleOutlined className="text-red-500 text-xl" />
              ) : (
                <ExclamationCircleOutlined className="text-orange-500 text-xl" />
              )}
              <Text strong>{STATUS_MAP[uploadResult.status]?.label || uploadResult.status}</Text>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-800">{uploadResult.totalRows}</div>
                <div className="text-xs text-gray-500">Tổng dòng</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{uploadResult.successRows}</div>
                <div className="text-xs text-gray-500">Thành công</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{uploadResult.failedRows}</div>
                <div className="text-xs text-gray-500">Thất bại</div>
              </div>
            </div>
            {uploadResult.failedRows > 0 && (
              <div className="mt-3 flex gap-2 justify-center">
                <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewErrors(uploadResult.id)}>
                  Xem lỗi
                </Button>
                <Button size="small" icon={<ExportOutlined />} onClick={() => handleExportErrors(uploadResult.id)}>
                  Xuất Excel lỗi
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Import History */}
      <Card
        title={<span><HistoryOutlined className="mr-2" />Lịch sử Import</span>}
        className="shadow-sm"
        loading={sessionsLoading}
      >
        {sessions.length === 0 ? (
          <Empty description="Chưa có lịch sử import" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">File</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Tổng</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Thành công</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Lỗi</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Trạng thái</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Thời gian</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const cfg = STATUS_MAP[s.status] || STATUS_MAP.PENDING;
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FileExcelOutlined className="text-green-600" />
                          <Text className="text-sm truncate max-w-[200px]">{s.fileName}</Text>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">{s.totalRows}</td>
                      <td className="px-3 py-2 text-center text-green-600 font-medium">{s.successRows}</td>
                      <td className="px-3 py-2 text-center text-red-500 font-medium">{s.failedRows}</td>
                      <td className="px-3 py-2 text-center">
                        <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-500 text-xs">
                        {new Date(s.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Space size={4}>
                          {s.failedRows > 0 && (
                            <>
                              <Tooltip title="Xem lỗi">
                                <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => handleViewErrors(s.id)} />
                              </Tooltip>
                              <Tooltip title="Xuất Excel lỗi">
                                <Button size="small" type="text" icon={<ExportOutlined />} onClick={() => handleExportErrors(s.id)} />
                              </Tooltip>
                            </>
                          )}
                        </Space>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Error Detail Modal */}
      <Modal
        title="Chi tiết lỗi Import"
        open={!!selectedSessionId}
        onCancel={() => { setSelectedSessionId(null); dispatch(resetSessionDetail()); }}
        footer={
          selectedSessionId ? (
            <Button icon={<ExportOutlined />} onClick={() => handleExportErrors(selectedSessionId)}>
              Xuất Excel lỗi
            </Button>
          ) : null
        }
        width={800}
      >
        {errorsLoading ? (
          <div className="flex justify-center py-8"><Spin /></div>
        ) : errors.length === 0 ? (
          <Empty description="Không có lỗi" />
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">Dòng</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Trường</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-40">Giá trị</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Lỗi</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((e, i) => (
                  <tr key={e.id || i} className="border-b hover:bg-red-50">
                    <td className="px-3 py-2 font-mono text-xs">{e.rowNumber}</td>
                    <td className="px-3 py-2"><Tag color="red" className="text-xs">{e.field}</Tag></td>
                    <td className="px-3 py-2 text-gray-500 text-xs truncate max-w-[200px]">{e.value || "—"}</td>
                    <td className="px-3 py-2 text-red-600 text-xs">{e.errorMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

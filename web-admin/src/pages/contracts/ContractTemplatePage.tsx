import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Input, Row, Select, Space, Typography, message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import TemplateModal from "../../components/contract/TemplateModal";
import TemplateTable from "../../components/contract/TemplateTable";
import type { ContractTemplate, TemplateFormValues, TemplateStatus, TemplateType } from "../../types/contract.type";
import http from "../../utils/api";

const parseJsonText = (value: unknown) => {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  return JSON.stringify(value, null, 2);
};

const unwrapResponse = (response: any) => response?.data ?? response;

const mapApiTemplateToUi = (item: any): ContractTemplate => ({
  id: item.templateId,
  templateName: item.templateName,
  templateType: item.templateType,
  templateCategory: item.templateCategory ?? "",
  templateContent: item.templateContent ?? "",
  templateVariables: parseJsonText(item.templateVariables) || "{}",
  defaultTerms: parseJsonText(item.defaultTerms),
  version: Number(item.version ?? 1),
  isDefault: Boolean(item.isDefault),
  status: item.isActive ? "active" : "inactive",
  updatedAt: item.updatedAt ?? new Date().toISOString(),
});

const buildApiPayload = (
  values: TemplateFormValues,
  options?: { isDefault?: boolean; isActive?: boolean; version?: number },
) => ({
  templateName: values.templateName,
  templateType: values.templateType,
  templateCategory: values.templateCategory,
  templateContent: values.templateContent,
  templateVariables: JSON.parse(values.templateVariables),
  defaultTerms: values.defaultTerms,
  isDefault: options?.isDefault ?? false,
  isActive: options?.isActive ?? true,
  version: options?.version,
});

const postContractTemplate = async (payload: any): Promise<ContractTemplate> => {
  const response = await http.post("/contract/contract-templates", payload);
  const created = unwrapResponse(response);
  return mapApiTemplateToUi(created);
};

const patchTemplateStatus = async (templateId: string, nextStatus: TemplateStatus) => {
  const response = await http.put(`/contract/contract-templates/${templateId}/status`, {
    isActive: nextStatus === "active",
  });

  return mapApiTemplateToUi(unwrapResponse(response));
};

const patchTemplateDefault = async (templateId: string) => {
  const response = await http.put(`/contract/contract-templates/${templateId}/default`, {});
  return mapApiTemplateToUi(unwrapResponse(response));
};

const ContractTemplatePage = () => {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableScrollY, setTableScrollY] = useState(320);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<ContractTemplate | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [typeFilter, setTypeFilter] = useState<TemplateType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | "all">("all");

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const response = await http.get("/contract/contract-templates");
        const payload = unwrapResponse(response);
        const rows = Array.isArray(payload) ? payload : [];
        setTemplates(rows.map(mapApiTemplateToUi));
      } catch {
        message.warning("Không tải được dữ liệu thật, đang hiển thị dữ liệu mẫu.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    const updateTableScrollY = () => {
      const top = tableContainerRef.current?.getBoundingClientRect().top;
      if (typeof top !== "number") {
        return;
      }

      setTableScrollY(Math.max(window.innerHeight - top - 120, 160));
    };

    const frameId = window.requestAnimationFrame(updateTableScrollY);
    window.addEventListener("resize", updateTableScrollY);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateTableScrollY);
    };
  }, [searchValue, typeFilter, statusFilter]);

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return templates.filter((template) => {
      const matchSearch =
        !normalizedSearch ||
        template.templateName.toLowerCase().includes(normalizedSearch) ||
        template.templateCategory.toLowerCase().includes(normalizedSearch);

      const matchType = typeFilter === "all" || template.templateType === typeFilter;
      const matchStatus = statusFilter === "all" || template.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [searchValue, statusFilter, templates, typeFilter]);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setActiveTemplate(null);
    setOpenModal(true);
  };

  const handleOpenEditModal = (template: ContractTemplate) => {
    setModalMode("edit");
    setActiveTemplate(template);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setActiveTemplate(null);
  };

  const handleSubmitTemplate = async (values: TemplateFormValues) => {
    setSaving(true);

    try {
      if (modalMode === "create") {
        const created = await postContractTemplate(buildApiPayload(values));
        setTemplates((prev) => [created, ...prev]);
        message.success("Tạo mẫu hợp đồng thành công");
      } else {
        if (!activeTemplate) {
          message.error("Không tìm thấy mẫu cần cập nhật");
          return;
        }

        const clonedVersion = await postContractTemplate(
          buildApiPayload(values, {
            version: activeTemplate.version + 1,
            isActive: activeTemplate.status === "active",
            isDefault: activeTemplate.isDefault,
          }),
        );

        setTemplates((prev) => [clonedVersion, ...prev]);
        message.success("Đã tạo phiên bản mới từ mẫu cũ");
      }

      handleCloseModal();
    } catch {
      message.error("Có lỗi xảy ra khi lưu mẫu hợp đồng");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (template: ContractTemplate) => {
    const nextStatus: TemplateStatus = template.status === "active" ? "inactive" : "active";

    try {
      const updated = await patchTemplateStatus(template.id, nextStatus);
      setTemplates((prev) => prev.map((item) => (item.id === template.id ? updated : item)));
      message.success("Cập nhật trạng thái thành công");
    } catch {
      message.error("Không thể cập nhật trạng thái mẫu");
    }
  };

  const handleSetDefault = async (template: ContractTemplate) => {
    try {
      const updated = await patchTemplateDefault(template.id);
      setTemplates((prev) =>
        prev.map((item) => ({
          ...item,
          isDefault: item.id === updated.id,
          updatedAt: item.id === updated.id ? updated.updatedAt : item.updatedAt,
        })),
      );
      message.success("Đã đặt mẫu mặc định");
    } catch {
      message.error("Không thể đặt mẫu mặc định");
    }
  };

  const initialFormValues: TemplateFormValues | undefined = activeTemplate
    ? {
      templateName: activeTemplate.templateName,
      templateType: activeTemplate.templateType,
      templateCategory: activeTemplate.templateCategory,
      templateContent: activeTemplate.templateContent,
      templateVariables: activeTemplate.templateVariables,
      defaultTerms: activeTemplate.defaultTerms,
    }
    : undefined;

  return (
    <div className="admin-page-shell">
      <Card className="hero-surface" variant="borderless">
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col>
            <Typography.Title level={2} style={{ marginBottom: 4 }}>
              Quản lý mẫu hợp đồng
            </Typography.Title>
            <Typography.Text type="secondary">
              Quản trị phiên bản mẫu hợp đồng, trạng thái hoạt động và mẫu mặc định cho toàn hệ thống.
            </Typography.Text>
          </Col>

          <Col>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleOpenCreateModal}>
              Tạo mẫu
            </Button>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" style={{ marginTop: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tên mẫu hoặc danh mục"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </Col>

          <Col xs={24} md={7}>
            <Select
              style={{ width: "100%" }}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value)}
              options={[
                { label: "Tất cả loại mẫu", value: "all" },
                { label: "Chuẩn", value: "standard" },
                { label: "Tùy chỉnh", value: "custom" },
                { label: "Cơ quan NN", value: "government" },
              ]}
            />
          </Col>

          <Col xs={24} md={7}>
            <Select
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { label: "Tất cả trạng thái", value: "all" },
                { label: "Đang hoạt động", value: "active" },
                { label: "Tạm ngưng", value: "inactive" },
              ]}
            />
          </Col>
        </Row>

        <Space style={{ marginTop: 12, marginBottom: 8 }}>
          <Typography.Text type="secondary">Tổng số mẫu: {filteredTemplates.length}</Typography.Text>
        </Space>

        <div ref={tableContainerRef}>
          <TemplateTable
            data={filteredTemplates}
            loading={loading}
            scrollY={tableScrollY}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
            onSetDefault={handleSetDefault}
          />
        </div>
      </Card>

      <TemplateModal
        open={openModal}
        mode={modalMode}
        initialValues={initialFormValues}
        confirmLoading={saving}
        onCancel={handleCloseModal}
        onSubmit={handleSubmitTemplate}
      />
    </div>
  );
};

export default ContractTemplatePage;
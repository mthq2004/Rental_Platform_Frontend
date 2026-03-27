import { Col, Form, Input, Modal, Row, Select } from "antd";
import { useEffect } from "react";
import type { TemplateFormValues } from "../../types/contract.type";

interface TemplateModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: TemplateFormValues;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (values: TemplateFormValues) => void;
}

const defaultValues: TemplateFormValues = {
  templateName: "",
  templateType: "standard",
  templateCategory: "",
  templateContent: "",
  templateVariables: "{}",
  defaultTerms: "",
};

const validateJson = async (_: unknown, value?: string) => {
  if (!value) {
    return Promise.resolve();
  }

  try {
    JSON.parse(value);
    return Promise.resolve();
  } catch {
    return Promise.reject(new Error("JSON không hợp lệ"));
  }
};

const TemplateModal = ({
  open,
  mode,
  initialValues,
  confirmLoading,
  onCancel,
  onSubmit,
}: TemplateModalProps) => {
  const [form] = Form.useForm<TemplateFormValues>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues ?? defaultValues);
    }
  }, [form, initialValues, open]);

  return (
    <Modal
      title={mode === "create" ? "Tạo mẫu hợp đồng" : "Tạo phiên bản mới từ mẫu hiện tại"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={mode === "create" ? "Lưu mẫu" : "Lưu phiên bản mới"}
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      width={820}
      destroyOnClose
      centered
      maskClosable={false}
      styles={{ body: { maxHeight: "70vh", overflowY: "auto", paddingTop: 10 } }}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item
          label="Tên mẫu hợp đồng"
          name="templateName"
          rules={[{ required: true, message: "Vui lòng nhập tên mẫu" }]}
        >
          <Input placeholder="VD: Hợp đồng thuê căn hộ tiêu chuẩn" />
        </Form.Item>

        <Row gutter={12}>
          <Col xs={24} md={10}>
            <Form.Item
              label="Loại mẫu"
              name="templateType"
              rules={[{ required: true, message: "Vui lòng chọn loại mẫu" }]}
            >
              <Select
                options={[
                  { label: "Chuẩn", value: "standard" },
                  { label: "Tùy chỉnh", value: "custom" },
                  { label: "Theo cơ quan nhà nước", value: "government" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={14}>
            <Form.Item
              label="Danh mục mẫu"
              name="templateCategory"
              rules={[{ required: true, message: "Vui lòng nhập danh mục" }]}
            >
              <Input placeholder="VD: Hợp đồng thuê nhà ở" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Nội dung mẫu hợp đồng"
          name="templateContent"
          rules={[{ required: true, message: "Vui lòng nhập nội dung mẫu" }]}
          extra="Có thể dán nội dung HTML hoặc nội dung văn bản thường."
        >
          <Input.TextArea rows={7} placeholder="Nhập nội dung mẫu hợp đồng..." />
        </Form.Item>

        <Form.Item
          label="Biến mẫu (JSON)"
          name="templateVariables"
          rules={[{ required: true, message: "Vui lòng nhập JSON biến" }, { validator: validateJson }]}
          extra="Ví dụ: tenantName, propertyAddress, rentAmount..."
        >
          <Input.TextArea rows={5} placeholder='{"tenantName": "", "propertyAddress": ""}' />
        </Form.Item>

        <Form.Item
          label="Điều khoản mặc định"
          name="defaultTerms"
          rules={[{ required: true, message: "Vui lòng nhập điều khoản mặc định" }]}
        >
          <Input.TextArea rows={5} placeholder="Nhập điều khoản mặc định hoặc dữ liệu JSON..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TemplateModal;
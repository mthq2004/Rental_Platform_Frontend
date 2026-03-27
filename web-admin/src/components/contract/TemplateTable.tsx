import { Button, Popconfirm, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ContractTemplate } from "../../types/contract.type";

interface TemplateTableProps {
  data: ContractTemplate[];
  loading?: boolean;
  scrollY?: number;
  onEdit: (template: ContractTemplate) => void;
  onToggleStatus: (template: ContractTemplate) => void;
  onSetDefault: (template: ContractTemplate) => void;
}

const typeColorMap: Record<ContractTemplate["templateType"], string> = {
  standard: "blue",
  custom: "gold",
  government: "purple",
};

const statusColorMap: Record<ContractTemplate["status"], string> = {
  active: "green",
  inactive: "default",
};

const typeLabelMap: Record<ContractTemplate["templateType"], string> = {
  standard: "Chuẩn",
  custom: "Tùy chỉnh",
  government: "Cơ quan NN",
};

const statusLabelMap: Record<ContractTemplate["status"], string> = {
  active: "Đang hoạt động",
  inactive: "Tạm ngưng",
};

const TemplateTable = ({ data, loading, scrollY, onEdit, onToggleStatus, onSetDefault }: TemplateTableProps) => {
  const columns: ColumnsType<ContractTemplate> = [
    {
      title: "Tên mẫu",
      dataIndex: "templateName",
      key: "templateName",
      width: 240,
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong ellipsis={{ tooltip: value }}>
            {value}
          </Typography.Text>
          <Typography.Text type="secondary" ellipsis={{ tooltip: record.templateCategory }}>
            {record.templateCategory}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Loại mẫu",
      dataIndex: "templateType",
      key: "templateType",
      width: 140,
      render: (value: ContractTemplate["templateType"]) => <Tag color={typeColorMap[value]}>{typeLabelMap[value]}</Tag>,
    },
    {
      title: "Phiên bản",
      dataIndex: "version",
      key: "version",
      width: 100,
      render: (value: number) => `v${value}`,
    },
    {
      title: "Mặc định",
      dataIndex: "isDefault",
      key: "isDefault",
      width: 120,
      render: (value: boolean) => <Tag color={value ? "success" : "default"}>{value ? "Mặc định" : "Không"}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (value: ContractTemplate["status"]) => <Tag color={statusColorMap[value]}>{statusLabelMap[value]}</Tag>,
    },
    {
      title: "Cập nhật lúc",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (value: string) => new Date(value).toLocaleString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 220,
      render: (_, record) => {
        const nextStatus = record.status === "active" ? "Tạm ngưng" : "Kích hoạt";

        return (
          <Space wrap size={[8, 8]}>
            <Button size="small" onClick={() => onEdit(record)}>
              Chỉnh sửa
            </Button>

            <Popconfirm
              title={`${nextStatus} mẫu hợp đồng?`}
              description="Thao tác này sẽ cập nhật trạng thái mẫu hợp đồng."
              onConfirm={() => onToggleStatus(record)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button size="small">{nextStatus}</Button>
            </Popconfirm>

            <Popconfirm
              title="Đặt làm mẫu mặc định?"
              description="Mẫu mặc định hiện tại sẽ bị thay thế."
              onConfirm={() => onSetDefault(record)}
              okText="Đồng ý"
              cancelText="Hủy"
              disabled={record.isDefault}
            >
              <Button size="small" type="primary" ghost disabled={record.isDefault}>
                Đặt mặc định
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Table<ContractTemplate>
      rowKey="id"
      className="management-table-no-x"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 8, showSizeChanger: false }}
      scroll={{ y: scrollY }}
      tableLayout="fixed"
    />
  );
};

export default TemplateTable;
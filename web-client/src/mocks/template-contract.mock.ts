import type {
  ContractRequestData,
  ContractTemplate,
  ContractTemplateDetail,
} from "@/types/template.type";

const templateVariables = [
  { name: "contract.contractNumber", type: "string", label: "Số hợp đồng", required: true },
  { name: "contract.contractDate", type: "date", label: "Ngày ký", required: true },
  { name: "owner.name", type: "string", label: "Bên cho thuê", required: true },
  { name: "tenant.name", type: "string", label: "Bên thuê", required: true },
  { name: "property.address", type: "string", label: "Địa chỉ tài sản", required: true },
  { name: "contract.startDate", type: "date", label: "Ngày bắt đầu", required: true },
  { name: "contract.endDate", type: "date", label: "Ngày kết thúc", required: true },
  { name: "property.monthlyRent", type: "number", label: "Giá thuê hàng tháng", required: true },
  { name: "property.depositAmount", type: "number", label: "Tiền cọc", required: true },
  { name: "custom.generalTerms", type: "string", label: "Điều khoản chung", required: false },
] as const;

const templateContent = `
<h1 style="text-align:center; font-weight:700; margin:0 0 20px;">HOP DONG THUE NHA</h1>
<p><strong>So hop dong:</strong> {{contract.contractNumber}}</p>
<p><strong>Ngay ky:</strong> {{contract.contractDate}}</p>
<p><strong>Ben cho thue:</strong> {{owner.name}}</p>
<p><strong>Ben thue:</strong> {{tenant.name}}</p>
<p><strong>Dia chi nha:</strong> {{property.address}}</p>
<p><strong>Thoi han thue:</strong> tu {{contract.startDate}} den {{contract.endDate}}</p>
<p><strong>Gia thue:</strong> {{property.monthlyRent}} VND/thang</p>
<p><strong>Tien coc:</strong> {{property.depositAmount}} VND</p>
<p><strong>Dieu khoan chung:</strong> {{custom.generalTerms}}</p>
`;

export const MOCK_CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    templateId: "tpl-standard-001",
    templateName: "Mau hop dong nha o tieu chuan",
    templateType: "standard",
    description: "Mau hop dong pho bien cho nha o, can ho, phong tro.",
    isDefault: true,
    version: 1,
  },
  {
    templateId: "tpl-government-001",
    templateName: "Mau hop dong theo thong tu huong dan",
    templateType: "government",
    description: "Bo cuc chat che, phu hop giao dich can tinh phap ly cao.",
    isDefault: false,
    version: 1,
  },
  {
    templateId: "tpl-custom-001",
    templateName: "Mau hop dong linh hoat cho chu tro",
    templateType: "custom",
    description: "Toi uu cho chu nha can them dieu khoan rieng va phu luc.",
    isDefault: false,
    version: 2,
  },
];

export const MOCK_TEMPLATE_DETAILS: Record<string, ContractTemplateDetail> = {
  "tpl-standard-001": {
    ...MOCK_CONTRACT_TEMPLATES[0],
    templateContent,
    templateVariables: [...templateVariables],
    defaultTerms: {
      notice: "Thong bao truoc 30 ngay khi cham dut hop dong.",
      payment: "Thanh toan vao ngay 5 hang thang.",
    },
    isActive: true,
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
  "tpl-government-001": {
    ...MOCK_CONTRACT_TEMPLATES[1],
    templateContent,
    templateVariables: [...templateVariables],
    defaultTerms: {
      notice: "Thong bao truoc 45 ngay khi cham dut hop dong.",
      payment: "Thanh toan vao ngay 1 hang thang.",
    },
    isActive: true,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-03-05T00:00:00.000Z",
  },
  "tpl-custom-001": {
    ...MOCK_CONTRACT_TEMPLATES[2],
    templateContent,
    templateVariables: [...templateVariables],
    defaultTerms: {
      notice: "Thong bao truoc 20 ngay khi cham dut hop dong.",
      payment: "Thanh toan vao ngay 10 hang thang.",
    },
    isActive: true,
    createdAt: "2026-02-02T00:00:00.000Z",
    updatedAt: "2026-03-20T00:00:00.000Z",
  },
};

export const MOCK_REQUEST_TEMPLATE_DATA: ContractRequestData = {
  tenant: {
    id: "tenant-001",
    name: "Nguyen Van A",
    email: "tenant@example.com",
    phone: "0901234567",
    idNumber: "012345678901",
  },
  owner: {
    id: "owner-001",
    name: "Tran Thi B",
    email: "owner@example.com",
    phone: "0987654321",
    idNumber: "123456789012",
  },
  property: {
    id: "property-001",
    title: "Can ho 2PN trung tam",
    address: "123 Duong ABC, Quan Hai Chau, Da Nang",
    description: "Can ho day du noi that, vao o ngay.",
    type: "apartment",
    area: 68,
    monthlyRent: 12000000,
    depositAmount: 24000000,
    electricityCostPerKwh: 3500,
    waterCostPerM3: 18000,
    internetFee: 200000,
    parkingFee: 150000,
    managementFee: 350000,
  },
  contract: {
    id: "request-001",
    startDate: "2026-04-01",
    endDate: "2027-04-01",
    status: "approved",
  },
};

export function getMockTemplateDetailById(templateId: string): ContractTemplateDetail {
  return MOCK_TEMPLATE_DETAILS[templateId] ?? MOCK_TEMPLATE_DETAILS["tpl-standard-001"];
}

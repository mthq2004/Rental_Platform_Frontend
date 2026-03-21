export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "date";
  label: string;
  required: boolean;
}

export interface ContractTemplate {
  templateId: string;
  templateName: string;
  templateType: string;
  description: string;
  isDefault: boolean;
  version: number;
}

export interface ContractTemplateDetail extends ContractTemplate {
  templateContent: string;

  templateVariables: TemplateVariable[];

  defaultTerms?: Record<string, string>;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface ContractRequestData {
  tenant: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    idNumber: string | null;
  };
  owner: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    idNumber: string | null;
  };
  property: {
    id: string;
    title: string;
    address: string;
    description: string;
    type: string;
    area: number;
    monthlyRent: number;
    depositAmount: number;
    electricityCostPerKwh: number;
    waterCostPerM3: number;
    internetFee: number;
    parkingFee: number;
    managementFee: number;
  };
  contract: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
  }
}


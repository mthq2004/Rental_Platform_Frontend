export type TemplateType = "standard" | "custom" | "government";

export type TemplateStatus = "active" | "inactive";

export interface ContractTemplate {
  id: string;
  templateName: string;
  templateType: TemplateType;
  templateCategory: string;
  templateContent: string;
  templateVariables: string;
  defaultTerms: string;
  version: number;
  isDefault: boolean;
  status: TemplateStatus;
  updatedAt: string;
}

export interface TemplateFormValues {
  templateName: string;
  templateType: TemplateType;
  templateCategory: string;
  templateContent: string;
  templateVariables: string;
  defaultTerms: string;
}
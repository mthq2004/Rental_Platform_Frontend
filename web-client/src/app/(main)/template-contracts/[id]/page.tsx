"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  SaveOutlined,
  SendOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { getRequestTemplateData, getTemplateDetail } from "@/stores/slices/template-contract.slice";
import { createContract, getContractDetail, sendContractToTenant } from "@/stores/slices/contract.slice";
import { FIELD_STANDARD } from "@/constants/fieldDefinitions";
import { CreateContractPayload } from "@/types/contract.type";
import { CONTRACT_EDITOR_STYLES } from "./contract-styles";

const Editor = dynamic(() => import("@/components/contracts/CKEditorWrapper"), { ssr: false });


// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface TemplateVariable {
  name: string;
  type: string;
  label: string;
  required: boolean;
  source?: string;
  readonly?: boolean;
}

interface ContractTemplateRaw {
  templateId: string;
  templateName: string;
  templateType: string;
  templateCategory?: string;
  description: string;
  templateContent: string;
  templateVariables: Record<string, string>;
  defaultTerms?: Record<string, unknown>;
  version?: number;
  isActive?: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ContractTemplate extends Omit<ContractTemplateRaw, "templateVariables"> {
  templateVariables: TemplateVariable[];
}

const TERM_VARIABLES: TemplateVariable[] = [
  {
    name: "custom.generalTerms",
    type: "string",
    label: "Điều khoản chung",
    required: false,
    source: "custom",
    readonly: false,
  },
  {
    name: "custom.specialTerms",
    type: "string",
    label: "Điều khoản riêng / Thỏa thuận đặc biệt",
    required: false,
    source: "custom",
    readonly: false,
  },
];

interface FormErrors {
  [key: string]: string;
}

type ContractStatus = "draft" | "ready-to-send" | "sent" | "signed";

// ─────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────
function buildPlaceholderMap(
  formData: Record<string, unknown>
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [fullKey, value] of Object.entries(formData)) {
    const strVal = value != null ? String(value) : "";
    map[fullKey] = strVal;
    const prefixes = ["contract.", "owner.", "tenant.", "property.", "custom."];
    for (const prefix of prefixes) {
      if (fullKey.startsWith(prefix)) {
        const shortKey = fullKey.slice(prefix.length);
        if (!(shortKey in map)) map[shortKey] = strVal;
        break;
      }
    }
  }
  return map;
}

function generateContractCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'HD-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function formatDate(val: any): string {
  if (!val) return "";
  const date = new Date(val);
  if (isNaN(date.getTime()) || typeof val === "number") return String(val);
  // Basic heuristic: if it's a string that looks like a date (ISO or YYYY-MM-DD)
  if (typeof val === "string" && (val.includes("-") || val.includes("T"))) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return String(val);
}

function normalizeTemplateDocumentHtml(html: string): string {
  return html
    .replace(/overflow-y\s*:\s*auto\s*;?/gi, "")
    .replace(/overflow-x\s*:\s*auto\s*;?/gi, "")
    .replace(/overflow\s*:\s*auto\s*;?/gi, "")
    .replace(/max-height\s*:\s*[^;\"]+;?/gi, "")
    .replace(/height\s*:\s*(?:\d+(?:\.\d+)?vh|calc\([^)]*\))\s*;?/gi, "");
}

function renderTemplate(html: string, formData: Record<string, unknown>): string {
  const map = buildPlaceholderMap(formData);
  // First pass: replace placeholders with values
  let result = html.replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    if (key in map) {
      const val = map[key];
      if (val === "" || val == null) return "";
      // Auto-format dates
      if (key.toLowerCase().includes("date") || key.toLowerCase().includes("day")) {
        return formatDate(val);
      }
      return String(val);
    }
    // Field not filled → return empty string to hide it
    return "";
  });

  // Second pass: remove table rows or list items that contain ONLY empty values
  // This handles rows like "<tr>...<td>{{field}}</td>...</tr>" where field is empty
  result = result.replace(/<tr[^>]*>(?:(?!<tr).)*<\/tr>/gi, (row) => {
    // If all td cells in the row are empty (after trimming HTML tags)
    const cellContents = row.match(/<td[^>]*>(.*?)<\/td>/gi) || [];
    const allEmpty = cellContents.length > 0 && cellContents.every(cell => {
      const content = cell.replace(/<[^>]+>/g, "").trim();
      return content === "" || content === "0" || content === "null";
    });
    if (allEmpty) return "";
    return row;
  });

  return result;
}

function normaliseTemplateVariables(
  raw: Record<string, string>
): TemplateVariable[] {
  return Object.entries(raw)
    .map(([name, type]): TemplateVariable => {
      const standard = FIELD_STANDARD.find((f) => f.name === name);
      return {
        name,
        type: standard?.type ?? type,
        label: standard?.label ?? nameToLabel(name),
        required: standard?.source === "computed" ? false : (standard?.required ?? false),
        source: standard?.source ?? "custom",
        readonly: standard?.source === "computed" ? true : (standard?.readonly ?? false),
      };
    });
}

function nameToLabel(name: string): string {
  const part = name.includes(".") ? name.split(".").pop()! : name;
  return part
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function flattenObject(obj: any, prefix = ""): Record<string, any> {
  let res: Record<string, any> = {};
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      Object.assign(res, flattenObject(value, newKey));
    } else {
      res[newKey] = value;
    }
  }
  return res;
}

function escapeHtmlAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getFieldSizeClass(field: TemplateVariable): string {
  const longFields = ["address", "terms", "description", "generalTerms", "specialTerms"];
  const shortFields = ["idNumber", "phone", "paymentDueDay", "gracePeriodDays", "renewalNoticeDays"];
  const name = field.name.split(".").pop() || "";
  if (longFields.some((f) => name.toLowerCase().includes(f.toLowerCase()))) return "field-long";
  if (shortFields.some((f) => name.toLowerCase().includes(f.toLowerCase()))) return "field-short";
  return "";
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

const RentalContractContent = () => {
  const dispatch = useAppDispatch();
  const { templateDetail, templateDetailLoading, error } = useAppSelector(
    (state) => state.template
  );
  const { requestData } = useAppSelector((state) => state.template);

  const { contractDetail } = useAppSelector(state => state.contract)

  const params = useParams();
  const templateId = params?.id?.toString();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestId = searchParams.get("requestId");
  const contractID = searchParams.get("contractId");


  // ──── State ────
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [editorContent, setEditorContent] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [contractStatus, setContractStatus] = useState<ContractStatus>("draft");
  const [contractId, setContractId] = useState<string | null>(null);
  const [isSendingContract, setIsSendingContract] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Refs for DOM manipulation (edit mode)
  const paperRef = useRef<HTMLDivElement>(null);
  const formDataRef = useRef<Record<string, unknown>>({});
  formDataRef.current = formData;
  const [ckeditorPortals, setCkeditorPortals] = useState<{ id: string; key: string; el: HTMLElement }[]>([]);

  const syncCkeditorPortals = useCallback((tmpl: ContractTemplate) => {
    if (!paperRef.current) {
      setCkeditorPortals([]);
      return;
    }

    const foundPortals: { id: string; key: string; el: HTMLElement }[] = [];
    tmpl.templateVariables.forEach((v) => {
      if (v.name.toLowerCase().includes("terms")) {
        const elId = `ckeditor-placeholder-${v.name.replace(/\./g, "-")}`;
        const el = paperRef.current?.querySelector(`#${elId}`) as HTMLElement | null;
        if (el) {
          foundPortals.push({ id: elId, key: v.name, el });
        }
      }
    });

    setCkeditorPortals(foundPortals);
  }, []);

  // ──── Computed Template ────
  const template = useMemo<ContractTemplate | null>(() => {
    if (!templateDetail) return null;
    const raw = templateDetail as unknown as ContractTemplateRaw;
    if (!raw.templateVariables || typeof raw.templateVariables !== "object") return null;
    const normalizedVariables = normaliseTemplateVariables(raw.templateVariables);

    for (const termField of TERM_VARIABLES) {
      if (!normalizedVariables.some((v) => v.name === termField.name)) {
        normalizedVariables.push(termField);
      }
    }

    return { ...raw, templateVariables: normalizedVariables };
  }, [templateDetail]);

  const normalizedTemplateContent = useMemo(() => {
    if (!template) return "";
    return normalizeTemplateDocumentHtml(template.templateContent);
  }, [template]);

  useEffect(() => {
    if (requestId) {
      dispatch(getRequestTemplateData(requestId));
    }
  }, [requestId]);

  useEffect(() => {
    if (contractID) {
      console.log(contractID);
      dispatch(getContractDetail(contractID))
    }
  }, [contractID, dispatch])

  useEffect(() => {
    if (contractDetail?.contractData) {
      setFormData(contractDetail.contractData as Record<string, unknown>);
    }
  }, [contractDetail]);

  // ──── Load Template ────
  useEffect(() => {
    if (templateId) dispatch(getTemplateDetail(templateId));
  }, [templateId, dispatch]);

  // ──── Init Editor Content ────
  useEffect(() => {
    if (template) setEditorContent(normalizedTemplateContent);
  }, [template, normalizedTemplateContent]);

  // ──── Load Request Data ────
  useEffect(() => {
    if (!template) return;

    const allowedKeys = template.templateVariables.map((v) => v.name);
    let initialFormData: Record<string, unknown> = {};

    if (requestData) {
      // 1. Initialize logic
      const mapped = { ...requestData, contract: requestData.contract };
      const flatData = flattenObject(mapped);

      initialFormData = Object.fromEntries(
        Object.entries(flatData).filter(([key]) => allowedKeys.includes(key))
      );

      // Property type localization
      if (initialFormData["property.type"]) {
        const typeMap: Record<string, string> = {
          apartment: "Căn hộ chung cư",
          house: "Nhà nguyên căn",
          room: "Phòng trọ",
          office: "Văn phòng",
          shop: "Mặt bằng kinh doanh",
        };
        const propertyTypeValue = String(initialFormData["property.type"]);
        initialFormData["property.type"] = typeMap[propertyTypeValue] || propertyTypeValue;
      }

      // 🔥 SMART MAPPING: Map property defaults to contract fields if empty
      // This ensures the form is pre-filled with property's prices if no draft exists yet
      const propertyToContractMap: Record<string, string> = {
        "property.monthlyRent": "contract.monthlyRent",
        "property.depositAmount": "contract.depositAmount",
        "property.electricityCostPerKwh": "contract.electricityCostPerKwh",
        "property.waterCostPerM3": "contract.waterCostPerM3",
        "property.parkingFee": "contract.parkingFee",
        "property.managementFee": "contract.managementFee",
        "property.internetFee": "contract.internetFee",
        "property.area": "contract.usableArea",
      };

      for (const [propKey, constKey] of Object.entries(propertyToContractMap)) {
        if (flatData[propKey] != null && (initialFormData[constKey] == null || initialFormData[constKey] === "")) {
          if (allowedKeys.includes(constKey)) {
            initialFormData[constKey] = flatData[propKey];
          }
        }
      }

      // 🏠 Default signing location: use owner's address if not provided
      // Support both "contract.signingLocation" and "contract.location" (used by different templates)
      const signingLocationKeys = ["contract.signingLocation", "contract.location"];
      for (const locKey of signingLocationKeys) {
        if (allowedKeys.includes(locKey) && !initialFormData[locKey]) {
          const ownerAddress = flatData["owner.address"];
          if (ownerAddress) {
            initialFormData[locKey] = ownerAddress;
          }
        }
      }

      // Compute durationMonths from startDate and endDate
      if (
        initialFormData["contract.startDate"] &&
        initialFormData["contract.endDate"] &&
        (!initialFormData["contract.durationMonths"] || initialFormData["contract.durationMonths"] === "")
      ) {
        const start = new Date(String(initialFormData["contract.startDate"]));
        const end = new Date(String(initialFormData["contract.endDate"]));
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
          if (months < 1) months = 1;
          initialFormData["contract.durationMonths"] = months;
        }
      }
    }

    // Apply template default terms (supports both prefixed and short keys)
    const defaultTerms =
      template.defaultTerms && typeof template.defaultTerms === "object"
        ? (template.defaultTerms as Record<string, unknown>)
        : {};

    const defaultTermKeyMap: Record<string, string> = {
      paymentDueDay: "contract.paymentDueDay",
      gracePeriodDays: "contract.gracePeriodDays",
      lateFeePerDay: "contract.lateFeePerDay",
      autoRenewal: "contract.autoRenewal",
      renewalNoticeDays: "contract.renewalNoticeDays",
      earlyTerminationFee: "contract.earlyTerminationFee",
    };

    Object.entries(defaultTerms).forEach(([key, val]) => {
      const mappedKey = defaultTermKeyMap[key] ?? key;
      if (
        allowedKeys.includes(mappedKey) &&
        (initialFormData[mappedKey] == null || initialFormData[mappedKey] === "")
      ) {
        // Convert \n to <br> for terms fields (stored as literal \n in DB)
        if (typeof val === "string" && mappedKey.toLowerCase().includes("terms")) {
          initialFormData[mappedKey] = val.replace(/\\n/g, "\n").replace(/\n/g, "<br>");
        } else {
          initialFormData[mappedKey] = val;
        }
      }
    });

    for (const termField of TERM_VARIABLES) {
      if (allowedKeys.includes(termField.name) && initialFormData[termField.name] == null) {
        initialFormData[termField.name] = "";
      }
    }

    // 2. Add New Requirements: Contract Number & Signature Date if not already present
    if (!initialFormData["contract.contractNumber"]) {
      initialFormData["contract.contractNumber"] = generateContractCode();
    }
    if (!initialFormData["contract.contractDate"]) {
      initialFormData["contract.contractDate"] = new Date().toISOString().split('T')[0];
    }

    // 3. Override with existing contract draft data if present (nested contract)
    const existingContract = (requestData?.contract as any)?.contract || (requestData as any)?.draftContract || contractDetail;

    if (existingContract) {
      if (existingContract.rentalId) setContractId(existingContract.rentalId);
      if (existingContract.status) setContractStatus(existingContract.status);

      if (existingContract.contractData) {
        initialFormData = { ...initialFormData, ...existingContract.contractData };
      }

      if (existingContract.contractHtml) {
        setEditorContent(existingContract.contractHtml);
      }
    } else {
      setContractStatus("draft");
    }

    // Re-apply template defaults for fields that still end up empty after draft merge.
    Object.entries(defaultTerms).forEach(([key, val]) => {
      const mappedKey = defaultTermKeyMap[key] ?? key;
      if (
        allowedKeys.includes(mappedKey) &&
        (initialFormData[mappedKey] == null || String(initialFormData[mappedKey]).trim() === "")
      ) {
        if (typeof val === "string" && mappedKey.toLowerCase().includes("terms")) {
          initialFormData[mappedKey] = val.replace(/\\n/g, "\n").replace(/\n/g, "<br>");
        } else {
          initialFormData[mappedKey] = val;
        }
      }
    });

    setFormData(initialFormData);

    // Re-render editor content if not using existing HTML
    if (!existingContract?.contractHtml) {
      setEditorContent(renderTemplate(normalizedTemplateContent, initialFormData));
    }

    // Directly apply HTML with the mapped data to the paperRef
    if (paperRef.current && isEditMode) {
      paperRef.current.innerHTML = generateEditableHtml(initialFormData, template);
      syncCkeditorPortals(template);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestData, template, isEditMode, contractDetail, syncCkeditorPortals]);

  // ──── Required Fields Logic ────
  const requiredFields = useMemo(
    () => template?.templateVariables.filter((v) => v.required) ?? [],
    [template]
  );

  const filledRequiredCount = useMemo(
    () =>
      requiredFields.filter(
        (v) => formData[v.name] != null && String(formData[v.name]).trim() !== ""
      ).length,
    [requiredFields, formData]
  );

  const areAllRequiredFieldsFilled = useCallback(
    () => filledRequiredCount === requiredFields.length && requiredFields.length > 0,
    [filledRequiredCount, requiredFields.length]
  );

  // ──── Generate Editable HTML ────
  function generateEditableHtml(data: Record<string, unknown>, tmpl: ContractTemplate): string {
    return normalizeTemplateDocumentHtml(tmpl.templateContent).replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
      const key = rawKey.trim();
      const field = tmpl.templateVariables.find((v) => v.name === key);
      if (!field) return `{{${key}}}`;

      if (key.toLowerCase().includes("terms")) {
        return `<div id="ckeditor-placeholder-${key.replace(/\./g, '-')}" data-field-name="${escapeHtmlAttr(key)}" class="mt-2 mb-4"></div>`;
      }

      let value = data[key] != null ? String(data[key]) : "";
      
      // Format date for <input type="date">
      if (field.type === "date" && value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = date.toISOString().split("T")[0];
          }
        } catch (e) {
          console.error("Date formatting error:", e);
        }
      }

      const label = field.label;
      const isReadonly = field.readonly || field.source === "system";
      const inputType = field.type === "number" ? "number" : field.type === "date" ? "date" : "text";
      const sizeClass = getFieldSizeClass(field);
      const valueClass = value ? " has-value" : "";
      const readonlyClass = isReadonly ? " contract-readonly" : "";
      const readonlyAttr = isReadonly ? " readonly" : "";

      return `<input type="${inputType}" data-field-name="${escapeHtmlAttr(key)}" value="${escapeHtmlAttr(value)}" placeholder="${escapeHtmlAttr(label)}" ${readonlyAttr} class="contract-inline-input${readonlyClass}${valueClass} ${sizeClass}" />`;
    });
  }

  // ──── Generate Preview HTML ────
  function generatePreviewHtml(data: Record<string, unknown>, tmpl: ContractTemplate): string {
    return normalizeTemplateDocumentHtml(tmpl.templateContent).replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
      const key = rawKey.trim();
      const field = tmpl.templateVariables.find((v) => v.name === key);
      let value = data[key] != null ? String(data[key]) : "";

      if (key.toLowerCase().includes("terms")) {
        if (value) {
          return `<div class="contract-html-value mt-2 mb-4 p-4 bg-gray-50 border border-gray-100 rounded">${value}</div>`;
        }
        return `<div class="contract-field-empty mt-2 mb-4">${escapeHtmlAttr(field?.label || nameToLabel(key))}</div>`;
      }

      if (value) {
        // Format date in preview
        if (key.toLowerCase().includes("date") || key.toLowerCase().includes("day")) {
          value = formatDate(value);
        }
        return `<span class="contract-field-value">${escapeHtmlAttr(value)}</span>`;
      }
      const label = field?.label || nameToLabel(key);
      return `<span class="contract-field-empty">${escapeHtmlAttr(label)}</span>`;
    });
  }

  // ──── Apply Edit HTML to DOM ────
  useEffect(() => {
    if (!paperRef.current || !isEditMode || !template) return;
    paperRef.current.innerHTML = generateEditableHtml(formDataRef.current, template);
    syncCkeditorPortals(template);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, template, syncCkeditorPortals]);

  // ──── Sync Data to DOM (Handle Late Loading) ────
  useEffect(() => {
    if (!paperRef.current || !isEditMode) return;
    const container = paperRef.current;

    // Update regular inputs
    const inputs = container.querySelectorAll('input[data-field-name]');
    inputs.forEach(el => {
      const input = el as HTMLInputElement;
      const fieldName = input.dataset.fieldName;
      if (fieldName && formData[fieldName] !== undefined) {
        const newVal = String(formData[fieldName] || '');
        if (input.value !== newVal) {
          input.value = newVal;
          if (newVal) input.classList.add("has-value");
          else input.classList.remove("has-value");
        }
      }
    });
  }, [formData, isEditMode]);

  // ──── Event Delegation for Inline Inputs ────
  useEffect(() => {
    const container = paperRef.current;
    if (!container) return;

    const handleInput = (e: Event) => {
      const input = e.target as HTMLInputElement;
      const fieldName = input.dataset.fieldName;
      if (!fieldName) return;

      // Update has-value class
      if (input.value) {
        input.classList.add("has-value");
      } else {
        input.classList.remove("has-value");
      }

      setFormData((prev) => {
        const next = { ...prev, [fieldName]: input.value };
        formDataRef.current = next;
        return next;
      });

      // Update editor content for save/download
      if (template) {
        setEditorContent((prev) => {
          const updated = { ...formDataRef.current, [fieldName]: input.value };
          return renderTemplate(normalizedTemplateContent, updated);
        });
      }

      // Clear field error
      setFormErrors((prev) => {
        if (prev[fieldName]) {
          const updated = { ...prev };
          delete updated[fieldName];
          return updated;
        }
        return prev;
      });
    };

    container.addEventListener("input", handleInput);
    return () => container.removeEventListener("input", handleInput);
  }, [template, normalizedTemplateContent]);

  // ──── Dynamic Error CSS ────
  const errorCss = useMemo(() => {
    return Object.keys(formErrors)
      .map(
        (name) =>
          `input.contract-inline-input[data-field-name="${name}"] { border-bottom: 2px solid #dc2626 !important; background: rgba(220,38,38,0.04) !important; }`
      )
      .join("\n");
  }, [formErrors]);

  // ──── Preview HTML (memo) ────
  const previewHtml = useMemo(() => {
    if (!template) return "";
    return generatePreviewHtml(formData, template);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, formData]);

  // ──── Validation ────
  const validateForm = useCallback((): boolean => {
    if (!template?.templateVariables) return true;
    const errors: FormErrors = {};
    template.templateVariables.forEach((field) => {
      if (field.required && !formData[field.name]) {
        errors[field.name] = `${field.label} là bắt buộc`;
      } else if (formData[field.name]) {
        const val = formData[field.name];
        if (field.type === "number" && isNaN(Number(val))) errors[field.name] = `${field.label} phải là số`;
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [template, formData]);

  const parseSafeNumber = (val: any) => {
    if (val === null || val === undefined || val === "") return 0;
    const clean = String(val).replace(/[.,]/g, "");
    const num = Number(clean);
    return isNaN(num) ? 0 : num;
  };

  // ──── Handlers ────
  const handleSaveDraft = useCallback(async () => {
    setSaveError(null);
    setIsSaving(true);

    try {
      if (!requestData?.property?.id || !requestData?.owner?.id || !requestData?.tenant?.id) {
        throw new Error("Thiếu thông tin bất động sản hoặc người dùng để tạo hợp đồng");
      }

      const payload: CreateContractPayload = {
        templateId: template?.templateId,
        propertyId: requestData.property.id,
        ownerId: requestData.owner.id,
        tenantId: requestData.tenant.id,
        fromRequestId: requestData?.contract.id,
        startDate: String(formData["contract.startDate"] || requestData!.contract.startDate),
        endDate: String(formData["contract.endDate"] || requestData!.contract.endDate),
        monthlyRent: parseSafeNumber(formData["property.monthlyRent"]),
        depositAmount: parseSafeNumber(formData["property.depositAmount"]), 
        electricityCostPerKwh: parseSafeNumber(formData["contract.electricityCostPerKwh"]),
        waterCostPerM3: parseSafeNumber(formData["contract.waterCostPerM3"]),
        managementFee: parseSafeNumber(formData["contract.managementFee"]),
        parkingFee: parseSafeNumber(formData["contract.parkingFee"]),
        internetFee: parseSafeNumber(formData["contract.internetFee"]),
        paymentDueDay: parseSafeNumber(formData["contract.paymentDueDay"] || 5),
        lateFeePerDay: parseSafeNumber(formData["contract.lateFeePerDay"]),
        gracePeriodDays: parseSafeNumber(formData["contract.gracePeriodDays"]),
        earlyTerminationFee: parseSafeNumber(formData["contract.earlyTerminationFee"]),
        autoRenewal: formData["contract.autoRenewal"] === "true" || formData["contract.autoRenewal"] === true,
        renewalNoticeDays: parseSafeNumber(formData["contract.renewalNoticeDays"] || 30),
        notes: String(formData["contract.notes"] || ""),
        contractData: formData,
        contractHtml: editorContent,
      };
      
      const resultAction = await dispatch(createContract(payload));
      if (createContract.fulfilled.match(resultAction)) {
        const contract = resultAction.payload.data;
        setContractId(contract.rentalId);
        setSaveSuccess(true);
        // We stay on the page so they can click "Send" next, or redirect after delay
        setTimeout(() => {
          router.push("/dashboard/contracts");
        }, 2000);
      } else {
        throw new Error("Lưu hợp đồng thất bại");
      }
    } catch (err: any) {
      setSaveError(err.message || "Lỗi khi lưu hợp đồng");
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, template, requestData, formData, editorContent]);

  const handleSendContract = useCallback(async () => {
    setSendError(null);
    setSaveError(null);
    if (!validateForm()) {
      setSaveError("Vui lòng điền tất cả các trường bắt buộc");
      return;
    }
    setIsSaving(true);
    setIsSendingContract(true);
    try {
      if (!requestData?.property?.id || !requestData?.owner?.id || !requestData?.tenant?.id) {
        throw new Error("Thiếu thông tin bất động sản hoặc người dùng để tạo hợp đồng");
      }

      // 1. First ensure contract is created/saved as draft
      const payload: CreateContractPayload = {
        templateId: template?.templateId,
        propertyId: requestData.property.id,
        ownerId: requestData.owner.id,
        tenantId: requestData.tenant.id,
        fromRequestId: requestData?.contract.id,
        startDate: String(formData["contract.startDate"] || requestData!.contract.startDate),
        endDate: String(formData["contract.endDate"] || requestData!.contract.endDate),
        monthlyRent: parseSafeNumber(formData["contract.monthlyRent"]),
        depositAmount: parseSafeNumber(formData["contract.depositAmount"]),
        electricityCostPerKwh: parseSafeNumber(formData["contract.electricityCostPerKwh"]),
        waterCostPerM3: parseSafeNumber(formData["contract.waterCostPerM3"]),
        managementFee: parseSafeNumber(formData["contract.managementFee"]),
        parkingFee: parseSafeNumber(formData["contract.parkingFee"]),
        internetFee: parseSafeNumber(formData["contract.internetFee"]),
        paymentDueDay: parseSafeNumber(formData["contract.paymentDueDay"] || 5),
        lateFeePerDay: parseSafeNumber(formData["contract.lateFeePerDay"]),
        gracePeriodDays: parseSafeNumber(formData["contract.gracePeriodDays"]),
        earlyTerminationFee: parseSafeNumber(formData["contract.earlyTerminationFee"]),
        autoRenewal: formData["contract.autoRenewal"] === "true" || formData["contract.autoRenewal"] === true,
        renewalNoticeDays: parseSafeNumber(formData["contract.renewalNoticeDays"] || 30),
        notes: String(formData["contract.notes"] || ""),
        contractData: formData,
        contractHtml: editorContent,
      };

      const saveAction = await dispatch(createContract(payload));
      if (!createContract.fulfilled.match(saveAction)) {
        throw new Error("Lỗi khi lưu hợp đồng trước khi gửi");
      }

      const createdContract = saveAction.payload.data;
      const contractIdToUse = createdContract.rentalId;

      // 2. Call send API
      const resultAction = await dispatch(sendContractToTenant(contractIdToUse));

      if (sendContractToTenant.fulfilled.match(resultAction)) {
        setContractStatus("sent");
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          router.replace("/dashboard/contracts");
        }, 2000);
      } else {
        throw new Error("Không thể gửi hợp đồng. Vui lòng kiểm tra lại trạng thái hợp đồng.");
      }
    } catch (err: any) {
      setSendError(err.message || "Lỗi khi gửi hợp đồng");
    } finally {
      setIsSendingContract(false);
      setIsSaving(false);
    }
  }, [validateForm, template, requestData, formData, editorContent, dispatch, router]);

  const handleDownloadPDF = useCallback(() => {
    try {
      const finalHtml = template ? renderTemplate(normalizedTemplateContent, formData) : editorContent;
      const printWindow = window.open("", "", "height=800,width=900");
      if (printWindow) {
        printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${template?.templateName ?? "Hợp đồng"}</title>
          <style>body{font-family:'Times New Roman',Times,serif;line-height:1.6;color:#333;padding:25mm 20mm;max-width:210mm;margin:0 auto}
          @media print{body{margin:0;padding:20px}@page{margin:1cm;size:A4}}
          h1,h2,h3{margin-top:20px;margin-bottom:10px}p{margin-bottom:8px}
          table{width:100%;border-collapse:collapse;margin:20px 0}table td,table th{border:1px solid #555;padding:8px}
          .contract-field-value{font-weight:500}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#666}</style>
          </head><body>${finalHtml}<div class="footer"><p>Lập ngày: ${new Date().toLocaleDateString("vi-VN")}</p><p>Bản điện tử tạo lúc ${new Date().toLocaleString("vi-VN")}</p></div></body></html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
      }
    } catch { setSaveError("Lỗi khi tạo file PDF"); }
  }, [editorContent, template, formData]);

  const handleToggleMode = useCallback(() => {
    if (isEditMode) {
      // Switching to preview — validate first
      if (!validateForm()) {
        setSaveError("Vui lòng kiểm tra lại các trường bắt buộc");
        // Still allow preview but show warning
      }
      setSaveError(null);
    }
    setIsEditMode((prev) => !prev);
  }, [isEditMode, validateForm]);

  // ──── Render Guards ────
  if (templateDetailLoading) return <LoadingState />;
  if (!template || error) return <ErrorState message={error ?? "Không thể tải template. Vui lòng thử lại sau."} />;

  const progressPercent = requiredFields.length > 0 ? Math.round((filledRequiredCount / requiredFields.length) * 100) : 0;

  return (
    <div className="contract-editor-page">
      <style>{CONTRACT_EDITOR_STYLES}{"\n"}{errorCss}</style>

      {/* ──── TOOLBAR ──── */}
      <header className="contract-toolbar">
        <div className="toolbar-inner">
          <div className="toolbar-left">
            <button onClick={() => router.back()} className="toolbar-back-btn" type="button">
              <ArrowLeftOutlined />
              Quay lại
            </button>
            <div className="toolbar-divider" />
            <div className="toolbar-title-group">
              <div className="toolbar-title">{template.templateName}</div>
              <div className="toolbar-subtitle">{template.description}</div>
            </div>
            <StatusBadge status={contractStatus} />
          </div>

          <div className="toolbar-right">
            {/* Edit/Preview Toggle */}
            <div className="mode-toggle" role="tablist">
              <button
                onClick={() => setIsEditMode(true)}
                role="tab"
                aria-selected={isEditMode}
                className={`mode-toggle-btn ${isEditMode ? "active" : ""}`}
                type="button"
              >
                <EditOutlined /> Chỉnh sửa
              </button>
              <button
                onClick={handleToggleMode}
                role="tab"
                aria-selected={!isEditMode}
                className={`mode-toggle-btn ${!isEditMode ? "active" : ""}`}
                type="button"
              >
                <EyeOutlined /> Xem trước
              </button>
            </div>

            {/* Progress */}
            <div className="progress-container">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${progressPercent}%`,
                    background: progressPercent === 100
                      ? "linear-gradient(90deg, #22c55e, #16a34a)"
                      : "linear-gradient(90deg, #60a5fa, #3b82f6)",
                  }}
                />
              </div>
              <span className="progress-label">
                {filledRequiredCount}/{requiredFields.length} trường
              </span>
            </div>

            {/* Actions */}
            <button onClick={handleDownloadPDF} disabled={isSaving} className="action-btn" type="button">
              <DownloadOutlined /> PDF
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || !areAllRequiredFieldsFilled()}
              className="action-btn"
              type="button"
            >
              {isSaving ? "Đang lưu..." : <><SaveOutlined /> Lưu hợp đồng</>}
            </button>
            <button
              onClick={handleSendContract}
              disabled={isSaving || !areAllRequiredFieldsFilled()}
              className="action-btn action-btn-primary"
              type="button"
            >
              {isSaving ? "Đang xử lý..." : <><SendOutlined /> Gửi ký</>}
            </button>
          </div>
        </div>

        {/* Alert Messages */}
        {(saveSuccess || saveError) && (
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
            {saveSuccess && (
              <div className="alert-bar alert-success" role="alert">
                <CheckCircleOutlined /> {contractStatus === "sent" ? "Hợp đồng đã được gửi thành công!" : "Hợp đồng đã được lưu thành công!"}
              </div>
            )}
            {saveError && (
              <div className="alert-bar alert-error" role="alert">
                <CloseCircleOutlined /> {saveError}
              </div>
            )}
          </div>
        )}
      </header>

      {/* ──── A4 PAPER ──── */}
      <main className="a4-paper-wrapper">
        <div className="a4-paper-container">
          {isEditMode ? (
            <div ref={paperRef} className="contract-content" />
          ) : (
            <div className="contract-content" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          )}

          {/* Render Portals */}
          {isEditMode && ckeditorPortals.map(p => createPortal(
            <div key={p.id} onPointerDownCapture={(e) => e.stopPropagation()}>
              <Editor
                value={String(formData[p.key] || '')}
                onChange={(val) => {
                  setFormData(prev => {
                    const next = { ...prev, [p.key]: val };
                    formDataRef.current = next;
                    return next;
                  });
                  if (template) {
                    setEditorContent(renderTemplate(normalizedTemplateContent, { ...formDataRef.current, [p.key]: val }));
                  }
                }}
              />
            </div>,
            p.el
          ))}
        </div>
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, { label: string; bg: string; color: string }> = {
    draft: { label: "Nháp", bg: "#eff6ff", color: "#1d4ed8" },
    "ready-to-send": { label: "Sẵn sàng gửi", bg: "#fffbeb", color: "#b45309" },
    sent: { label: "Đã gửi", bg: "#ecfdf5", color: "#059669" },
    signed: { label: "Đã ký", bg: "#f0fdf4", color: "#15803d" },
    pending_tenant: { label: "Chờ người thuê ký", bg: "#fffbeb", color: "#d97706" },
  };
  const c = cfg[status] || cfg.draft;
  return (
    <span className="status-badge" style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
};
const LoadingState = () => (
  <div className="contract-editor-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <p style={{ marginTop: 16, fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Đang tải template...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="contract-editor-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 20 }}>
    <div style={{ fontSize: 48, marginBottom: 16, color: '#d97706', lineHeight: 1 }}><ExclamationCircleOutlined /></div>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Có lỗi xảy ra</h2>
    <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', maxWidth: 320 }}>{message}</p>
  </div>
);

const RentalContractPage = () => {
  return (
    <React.Suspense fallback={<LoadingState />}>
      <RentalContractContent />
    </React.Suspense>
  );
};

export default RentalContractPage;
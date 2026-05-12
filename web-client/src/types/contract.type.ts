// Rental Request Types
export type RentalRequestStatus =
  'pending'
  | 'under_review'
  | 'approved'
  | 'holding_deposit_open'
  | 'holding_deposit_paid'
  | 'holding_deposit_locked'
  | 'holding_deposit_expired'
  | 'holding_deposit_refunded'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'contract_created';

export interface RentalRequest {
  requestId: string;
  requestCode: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  proposedRent: number;
  message?: string;
  status: RentalRequestStatus;
  reviewedAt?: string;
  rejectionReason?: string;
  landlordNotes?: string;
  holdingDepositStatus?: 'open' | 'paid' | 'locked' | 'expired' | 'refunded';
  holdingDepositPaymentId?: string;
  holdingDepositAmount?: number;
  holdingDepositExpiresAt?: string;
  holdingDepositPaidAt?: string;
  contractId?: string;
  createdAt: string;
  updatedAt: string;
  property?: {
    id?: string;
    title?: string;
    address?: string;
    imageUrl?: string;
  };
  contract?: {
    rentalId: string;
    contractCode: string;
    status: string;
    templateId: string;
  };
}

export interface ContractTerm {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Contract Types
export type RentalContractStatus =
  'draft' | 'pending_tenant' | 'tenant_signed' | 'pending_landlord' | 'owner_signed' |
  'fully_signed' | 'active' | 'near_expiration' | 'expired' | 'terminated' | 'renewed' | 'cancelled';

export interface RentalContract {
  rentalId: string;
  propertyId: string;
  ownerId: string;
  tenantId: string;
  fromRequestId?: string;
  contractCode: string;
  contractType: string;
  startDate: string;
  endDate: string;
  signedDate?: string;
  monthlyRent: number;
  depositAmount: number;
  electricityCostPerKwh?: number;
  waterCostPerM3?: number;
  managementFee?: number;
  parkingFee?: number;
  internetFee?: number;
  paymentDueDay: number;
  lateFeePerDay?: number;
  earlyTerminationFee?: number;
  gracePeriodDays: number;
  autoRenewal: boolean;
  renewalNoticeDays?: number;
  renewalStatus?: 'not_applicable' | 'pending' | 'approved' | 'declined' | 'auto_renewed';
  renewedToContractId?: string;
  renewedFromContractId?: string;
  maxAutoRenewCount?: number;
  autoRenewCount?: number;
  status: RentalContractStatus;
  isActive: boolean;
  notes?: string;
  contractPdfUrl?: string;
  signedContractUrl?: string;
  ownerSignedAt?: string;
  tenantSignedAt?: string;
  ownerTransactionId?: string;
  tenantTransactionId?: string;
  signHash?: string;
  blockchainTxHash?: string;
  blockchainNetwork?: string;
  contractData?: Record<string, unknown>;
  contractHtml?: string;
  createdAt: string;
  updatedAt: string;
  terms?: ContractTerm[];
  templateId?: string;
  signatureLog?: SignatureLog[];
  payments?: Payment[];
  rentalRequest?: RentalRequest;
  owner?: { name?: string; fullName?: string; email?: string; phone?: string; phoneRaw?: string; avatarUrl?: string };
  tenant?: { name?: string; fullName?: string; email?: string; phone?: string; phoneRaw?: string; avatarUrl?: string };
  _count?: { payments: number };
}

export interface SignatureLog {
  logId: string;
  rentalId: string;
  action: string;
  actor?: string;
  actorRole: string;
  createdAt: string;
}

// Payment Types
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled' | 'refunded';
export type PaymentType = 'rent' | 'deposit' | 'electricity' | 'water' | 'internet' | 'parking' | 'management_fee' | 'service_fee' | 'late_fee' | 'damage_fee' | 'early_termination' | 'other';

export interface Payment {
  paymentId: string;
  rentalId: string;
  paymentCode: string;
  paymentType: PaymentType;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  lateFee: number;
  status: PaymentStatus;
  paymentMethod?: string;
  paidAt?: string;
  confirmedAt?: string;
  createdAt: string;
  contract?: {
    rentalId: string;
    contractCode: string;
    propertyId: string;
    ownerId: string;
    tenantId: string;
  };
}

// Termination Types
export type TerminationReason =
  | 'unilateral_termination'
  | 'mutual_agreement'
  | 'breach_of_contract'
  | 'force_majeure';

export interface TerminationRequest {
  terminationRequestId: string;
  rentalId: string;
  requestedBy: string;
  requesterRole: string;
  reason: TerminationReason;
  note?: string;
  requestedTerminationDate: string;
  earlyTerminationFee?: number;
  status: 'pending' | 'approved' | 'rejected' | 'negotiating' | 'admin_review' | 'admin_processing' | 'resolved' | 'cancelled';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  resolution?: 'continue_contract' | 'terminate_contract';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

// Report / Dispute Types
export type ReportType = 'payment' | 'deposit' | 'property' | 'contract' | 'other';
export type ReportPriority = 'low' | 'medium' | 'high';
export type ReportStatus = 'open' | 'admin' | 'resolved' | 'cancel_requested' | 'cancelled' | 'negotiating';
export type ReportAction = 'CREATED' | 'SENT_TO_ADMIN' | 'RESOLVED' | 'CANCEL_REQUESTED' | 'CANCELLED' | 'NEGOTIATING';

export interface ReportHistory {
  id: string;
  reportId: string;
  action: ReportAction;
  oldStatus?: ReportStatus;
  newStatus?: ReportStatus;
  performedBy?: string;
  note?: string;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  rentalId: string;
  createdBy: string;
  againstId: string;
  type: ReportType;
  priority: ReportPriority;
  status: ReportStatus;
  title: string;
  description: string;
  adminNote?: string;
  cancelRequested?: boolean;
  cancelRequestedBy?: string;
  cancelRequestedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  resolvedAt?: string;
  histories?: ReportHistory[];
  attachments?: ReportAttachment[];
  terminationRequestId?: string;
}

export interface ReportAttachment {
  id: string;
  reportId: string;
  url: string;
  type: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
}

// Status count
export interface StatusCount {
  id: string;
  label: string;
  count: number;
}

export interface CreateContractPayload {
  templateId?: string;
  propertyId?: string;
  ownerId?: string;
  tenantId?: string;
  fromRequestId?: string;

  startDate?: string;
  endDate?: string;

  monthlyRent?: number;
  depositAmount?: number;

  electricityCostPerKwh?: number;
  waterCostPerM3?: number;
  managementFee?: number;
  parkingFee?: number;
  internetFee?: number;

  paymentDueDay?: number;
  lateFeePerDay?: number;
  gracePeriodDays?: number;
  earlyTerminationFee?: number;

  autoRenewal?: boolean;
  renewalNoticeDays?: number;
  notes?: string;

  contractData?: Record<string, unknown>;
  contractHtml?: string;
}

// Renewal Request Types
export type RenewalRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface RenewalRequestItem {
  id: string;
  contractId: string;
  requestedById: string;
  durationMonths: number;
  proposedStartDate: string;
  proposedEndDate: string;
  status: RenewalRequestStatus;
  note?: string;
  reviewNote?: string;
  appendixId?: string;
  createdAt: string;
  approvedAt?: string;
  contract?: {
    rentalId: string;
    contractCode: string;
    propertyId: string;
    ownerId: string;
    tenantId: string;
    monthlyRent: number;
    startDate: string;
    endDate: string;
  };
  appendix?: ContractAppendixItem;
}

// Contract Appendix Types
export type ContractAppendixType = 'renewal' | 'adjustment' | 'extension';

export interface ContractAppendixItem {
  id: string;
  contractId: string;
  type: ContractAppendixType;
  appendixNumber: number;
  startDate: string;
  endDate: string;
  content?: string;
  createdById: string;
  signedAt?: string;
  blockchainTxHash?: string;
  createdAt: string;
  renewalRequest?: {
    id: string;
    requestedById: string;
    durationMonths: number;
    note?: string;
    status: string;
    createdAt: string;
  };
}


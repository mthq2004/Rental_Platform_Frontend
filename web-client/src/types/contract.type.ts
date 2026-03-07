// Rental Request Types
export type RentalRequestStatus = 
  'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'contract_created';

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
  contractId?: string;
  createdAt: string;
  updatedAt: string;
  contract?: {
    rentalId: string;
    contractCode: string;
    status: string;
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
  'draft' | 'pending_tenant' | 'tenant_signed' | 'pending_landlord' | 
  'fully_signed' | 'active' | 'expired' | 'terminated' | 'renewed' | 'cancelled';

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
  gracePeriodDays: number;
  autoRenewal: boolean;
  status: RentalContractStatus;
  isActive: boolean;
  notes?: string;
  contractPdfUrl?: string;
  createdAt: string;
  updatedAt: string;
  terms?: ContractTerm[];
  signatureLog?: SignatureLog[];
  payments?: Payment[];
  rentalRequest?: RentalRequest;
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
export interface TerminationRequest {
  terminationRequestId: string;
  rentalId: string;
  requestedBy: string;
  requesterRole: string;
  reason: string;
  note?: string;
  requestedTerminationDate: string;
  earlyTerminationFee?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
}

// Status count
export interface StatusCount {
  id: string;
  label: string;
  count: number;
}

export type UserType = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  phoneVerified: boolean;
  dateOfBirth: string | null;
  gender: string;
  avatarUrl: string;
  isActive: boolean;
};

export type Role = "user" | "admin";

export type KycStatus = "pending" | "in_review" | "verified" | "rejected" | "expired";

export type KycDocumentSummary = {
  kycId: string;
  status: "pending" | "in_review" | "approved" | "rejected";
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  selfieUrl?: string | null;
  ocrData?: Record<string, unknown> | null;
  score?: number | null;
  flags?: string[];
  rejectionReason?: string | null;
  submittedAt?: string;
  reviewedAt?: string | null;
};

export type AccountItem = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  isBanned: boolean;
  phoneVerified: boolean;
  isEmailVerified: boolean;
  kycStatus: KycStatus;
  createdAt: string;
  updatedAt: string;
  bannedAt?: string | null;
  bannedReason?: string | null;
  bannedUntil?: string | null;
  kycScore?: number | null;
  kycFlags?: string[];
  kycOcrData?: Record<string, unknown> | null;
  kycRejectionReason?: string | null;
  latestKycDocument?: KycDocumentSummary | null;
};

export type AccountListResponse = {
  items: AccountItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AccountQuery = {
  search?: string;
  kycStatus?: KycStatus | "all";
  isBanned?: boolean;
  page?: number;
  limit?: number;
};

export type CreateAccountPayload = {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  avatarUrl?: string;
  kycStatus?: KycStatus;
  isEmailVerified?: boolean;
  phoneVerified?: boolean;
  isActive?: boolean;
};

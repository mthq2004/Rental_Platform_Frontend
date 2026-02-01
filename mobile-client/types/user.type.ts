export interface LoginUser {
    phone: string;
    password: string;
}

export type User = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'admin' | 'user' | 'staff';
  avatarUrl: string | null;

  isEmailVerified: boolean;
  emailVerifiedAt: string | null;

  phoneVerified: boolean;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  dateOfBirth: string | null;
  gender: 'male' | 'female' | 'other' | null;

  walletAddress: string | null;
  walletType: string | null;

  kycStatus: 'pending' | 'approved' | 'rejected';
  kycSubmittedAt: string | null;
  kycVerifiedAt: string | null;
  kycExpiredAt: string | null;
  kycRejectionReason: string | null;

  isActive: boolean;

  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  bannedUntil: string | null;

  lastLoginAt: string | null;
  lastLoginIp: string | null;
  loginCount: number;
};

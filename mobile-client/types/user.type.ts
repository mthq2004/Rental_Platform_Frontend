export interface LoginUser {
    phone: string;
    password: string;
}

export interface UserProfile {
  profileId?: string;
  userId?: string;
  fullName?: string;
  idCardNumber?: string;
  currentAddress?: string | null;
  currentWard?: string | null;
  currentDistrict?: string | null;
  currentCity?: string | null;
  occupation?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
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

  kycStatus: 'pending' | 'approved' | 'rejected' | 'verified' | 'in_review';
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

  profile?: UserProfile;
};

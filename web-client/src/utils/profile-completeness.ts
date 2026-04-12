import { UserType } from "@/types/user.type";

export function getMissingPostingRequirements(user: UserType | null | undefined): string[] {
  if (!user) {
    return ["Bạn chưa đăng nhập"];
  }

  const missing: string[] = [];
  const profile = user.profile;

  if (!user.fullName?.trim()) {
    missing.push("Họ và tên");
  }

  if (!user.email?.trim()) {
    missing.push("Email");
  }

  if (!user.phone?.trim()) {
    missing.push("Số điện thoại");
  }

  if (!profile?.idCardNumber?.trim()) {
    missing.push("CCCD/CMND");
  }

  const hasAddress =
    !!profile?.currentAddress?.trim() &&
    !!profile?.currentWard?.trim() &&
    !!profile?.currentDistrict?.trim() &&
    !!profile?.currentCity?.trim();

  if (!hasAddress) {
    missing.push("Địa chỉ hiện tại");
  }

  if (user.kycStatus !== "verified") {
    missing.push("Xác thực KYC");
  }

  return missing;
}

/**
 * Kiểm tra yêu cầu thông tin cá nhân để thuê nhà (không cần KYC)
 */
export function getMissingRentalRequirements(user: UserType | null | undefined): string[] {
  if (!user) {
    return ["Bạn chưa đăng nhập"];
  }

  const missing: string[] = [];
  const profile = user.profile;

  if (!user.fullName?.trim()) {
    missing.push("Họ và tên");
  }

  if (!user.email?.trim()) {
    missing.push("Email");
  }

  if (!user.phone?.trim()) {
    missing.push("Số điện thoại");
  }

  if (!profile?.idCardNumber?.trim()) {
    missing.push("CCCD/CMND");
  }

  const hasAddress =
    !!profile?.currentAddress?.trim() &&
    !!profile?.currentWard?.trim() &&
    !!profile?.currentDistrict?.trim() &&
    !!profile?.currentCity?.trim();

  if (!hasAddress) {
    missing.push("Địa chỉ hiện tại");
  }

  return missing;
}

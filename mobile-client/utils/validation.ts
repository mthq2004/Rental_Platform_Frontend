// ─── Centralized Validation Utilities ─────────────────────────────────────────

// Regex patterns
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const FULLNAME_REGEX = /^(\p{Lu}\p{Ll}+)(\s\p{Lu}\p{Ll}*)+$/u;
// ─── Phone ────────────────────────────────────────────────────────────────────

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Vui lòng nhập số điện thoại';
  if (!PHONE_REGEX.test(phone)) {
    return 'Số điện thoại không hợp lệ (VD: 0912345678)';
  }
  return null;
};

export const validatePhoneRealtime = (phone: string): string | null => {
  if (!phone) return null; // Don't show error when empty (not submitted yet)
  // Check if starts with valid prefix
  if (phone.length >= 2) {
    const startsValid = /^(0[35789]|\+84[35789])/.test(phone);
    if (!startsValid) {
      return 'Đầu số không hợp lệ (03, 05, 07, 08, 09)';
    }
  }
  if (phone.length > 0 && phone.length < 10 && phone.startsWith('0')) {
    return `Còn thiếu ${10 - phone.length} số`;
  }
  if (phone.length === 10 && !PHONE_REGEX.test(phone)) {
    return 'Số điện thoại không hợp lệ';
  }
  if (phone.startsWith('+84') && phone.length > 3 && phone.length < 12) {
    return `Còn thiếu ${12 - phone.length} số`;
  }
  return null;
};

// ─── Email ────────────────────────────────────────────────────────────────────

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Vui lòng nhập email';
  if (!EMAIL_REGEX.test(email)) {
    return 'Email không hợp lệ (VD: example@gmail.com)';
  }
  return null;
};

export const validateEmailRealtime = (email: string): string | null => {
  if (!email) return null;
  if (email.length > 3 && !email.includes('@')) {
    return 'Email phải chứa ký tự @';
  }
  if (email.includes('@') && !EMAIL_REGEX.test(email)) {
    return 'Email không đúng định dạng';
  }
  return null;
};

// ─── Full Name ────────────────────────────────────────────────────────────────

export const validateFullName = (name: string): string | null => {
  if (!name || !name.trim()) return 'Vui lòng nhập họ và tên';
  if (name.trim().length < 2) return 'Họ tên phải có ít nhất 2 ký tự';
  if (!FULLNAME_REGEX.test(name.trim())) {
    return 'Họ tên phải gồm ít nhất 2 từ, mỗi từ viết hoa chữ cái đầu và không chứa số hoặc ký tự đặc biệt';
  }
  return null;
};
export const validateFullNameRealtime = (name: string): string | null => {
  if (!name) return null;

  if (/\d|[!@#$%^&*(),.?":{}|<>]/.test(name)) {
    return 'Không được chứa số hoặc ký tự đặc biệt';
  }

  if (name.trim().split(/\s+/).length >= 2 && !FULLNAME_REGEX.test(name.trim())) {
    return 'Mỗi từ phải viết hoa chữ cái đầu';
  }

  return null;
};

export const formatFullName = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
// ─── Password ─────────────────────────────────────────────────────────────────

export interface PasswordValidation {
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export const getPasswordValidation = (password: string): PasswordValidation => ({
  hasMinLength: password.length >= 8,
  hasLetter: /[a-zA-Z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
});

export const isPasswordValid = (password: string): boolean => {
  const v = getPasswordValidation(password);
  return v.hasMinLength && v.hasLetter && v.hasNumber && v.hasSpecialChar;
};

// ─── Export Regex patterns for direct use ──────────────────────────────────────

export { PHONE_REGEX, EMAIL_REGEX, FULLNAME_REGEX };

import { REGEX_PATTERNS } from "./regex";

export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  return REGEX_PATTERNS.PHONE.test(phone.trim());
};

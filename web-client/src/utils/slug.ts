/**
 * Convert Vietnamese text to URL-friendly slug.
 * Example: "TỔNG HỢP QUỸ CĂN GIÁ TỐT CHO THUÊ" → "tong-hop-quy-can-gia-tot-cho-thue"
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric
    .replace(/\s+/g, "-") // Spaces → hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Generate a property URL slug with ID appended for uniqueness.
 * Format: "ten-bai-dang-pr{id}"
 * Example: "tong-hop-quy-can-gia-tot-cho-thue-pr123"
 */
export function propertySlug(title: string, id: string): string {
  const slug = toSlug(title);
  return `${slug}-pr${id}`;
}

/**
 * Extract property ID from a slug.
 * "tong-hop-quy-can-gia-tot-cho-thue-pr123" → "123"
 * Also handles UUID IDs: "ten-bai-dang-pr2516002d-41d9-4067-8bbb-6b6bd2d42eca"
 */
export function extractIdFromSlug(slug: string): string | null {
  // Match -pr followed by the ID (supports plain IDs and UUID with hyphens)
  const match = slug.match(/-pr([\w-]+)$/);
  return match ? match[1] : null;
}

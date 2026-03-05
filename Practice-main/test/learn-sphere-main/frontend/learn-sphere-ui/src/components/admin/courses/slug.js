
// components/admin/courses/slug.js
export const normalizeSlug = (text) =>
  (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

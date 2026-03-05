// Email validation - improved with additional structural checks.
// - Returns `true` for syntactically valid, reasonably-restricted emails.
// - Keeps the API compatible with existing callers (boolean result).
export const isEmail = (value) => {
  if (!value || typeof value !== "string") return false;

  const email = value.trim();

  // General limits from RFCs: total length <= 254, local <= 64
  if (email.length > 254) return false;

  // Must have exactly one @
  const parts = email.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (local.length > 64 || domain.length > 255) return false;

  // No consecutive dots and no leading/trailing dots
  if (/\.\./.test(email)) return false;
  if (
    local.startsWith(".") ||
    local.endsWith(".") ||
    domain.startsWith(".") ||
    domain.endsWith(".")
  )
    return false;

  // Local part allowed chars (simplified, practical subset)
  // Allows ASCII letters, digits and these specials: !#$%&'*+/=?^_`{|}~.-
  const localRegex = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
  if (!localRegex.test(local)) return false;

  // Domain: require at least one dot and TLD of 2+ letters; labels may contain hyphens but not start/end with them
  const domainRegex =
    /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
  if (!domainRegex.test(domain)) return false;

  return true;
};

// Normalizes an email for storage/comparison: trims and lowercases the domain part.
// Note: the local part may be case-sensitive per spec, but most providers treat it as case-insensitive.
export const normalizeEmail = (value) => {
  if (!value || typeof value !== "string") return "";
  const email = value.trim();
  const at = email.lastIndexOf("@");
  if (at === -1) return email.toLowerCase();
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  return `${local}@${domain}`;
};

// Password validation
export const passwordIssues = (value) => {
  const issues = [];
  if (!value || typeof value !== "string") {
    issues.push("Password is required");
    return issues;
  }
  if (value.length < 10) issues.push("At least 10 characters");
  if (!/[A-Z]/.test(value)) issues.push("At least one uppercase letter");
  if (!/[a-z]/.test(value)) issues.push("At least one lowercase letter");
  if (!/[0-9]/.test(value)) issues.push("At least one number");
  if (!/[!@#$%^&*]/.test(value))
    issues.push("At least one special character (!@#$%^&*)");
  return issues;
};

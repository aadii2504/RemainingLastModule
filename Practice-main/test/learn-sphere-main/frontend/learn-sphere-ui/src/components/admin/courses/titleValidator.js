/**
 * Title Validator Utility
 * Validates titles to ensure they don't contain special characters
 */

// Regex to match allowed characters: letters, numbers, spaces, hyphens, apostrophes, periods
const ALLOWED_TITLE_REGEX = /^[a-zA-Z0-9\s\-'.&()]*$/;

// Regex to find special characters
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s\-'.&()]/g;

/**
 * Validates if a title contains only allowed characters
 * @param {string} title - The title to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateTitle = (title) => {
  if (!title || !title.trim()) {
    return { isValid: false, error: "Title is required" };
  }

  if (title.length > 150) {
    return { isValid: false, error: "Title must be less than 150 characters" };
  }

  if (!ALLOWED_TITLE_REGEX.test(title)) {
    const foundChars = title.match(SPECIAL_CHAR_REGEX);
    const uniqueChars = [...new Set(foundChars)].join(", ");
    return {
      isValid: false,
      error: `Title contains invalid characters: ${uniqueChars}. Only letters, numbers, spaces, hyphens, apostrophes, periods, and ampersands are allowed.`,
    };
  }

  return { isValid: true, error: "" };
};

/**
 * Sanitizes a title by removing special characters
 * @param {string} title - The title to sanitize
 * @returns {string} - Sanitized title
 */
export const sanitizeTitle = (title) => {
  return title.replace(SPECIAL_CHAR_REGEX, "").trim();
};

/**
 * Get the list of forbidden characters for display
 * @returns {string} - Comma-separated list of forbidden chars
 */
export const getForbiddenCharacters = () => {
  return "! @ # $ % ^ * { } [ ] < > / \\ | ; : \" , ? ~";
};

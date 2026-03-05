
// components/admin/courses/validators.js
import { validateTitle } from "./titleValidator";

export const validateCourse = (form) => {
  const errors = {};
  
  // Validate title
  if (!form.title?.trim()) {
    errors.title = "Title is required.";
  } else {
    const titleValidation = validateTitle(form.title);
    if (!titleValidation.isValid) {
      errors.title = titleValidation.error;
    }
  }
  
  if (!form.slug?.trim()) errors.slug = "Slug is required.";
  if (!form.summary?.trim())
    errors.summary = "Summary is required.";
  if ((form.description || "").length < 20) {
    errors.description = "Description looks too short.";
  }
  return errors;
};
``

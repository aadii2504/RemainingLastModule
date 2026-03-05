// components/admin/CourseApi.js
import { http } from "../../api/http";

const BASE_URL = "courses";

export const getAllCourses = async () => {
  try {
    const res = await http.get(BASE_URL);
    return res.data;
  } catch (e) {
    console.error("Failed to fetch courses", e);
    return [];
  }
};

export const getCourseById = async (id) => {
  try {
    const res = await http.get(`${BASE_URL}/${id}`);
    return res.data;
  } catch (e) {
    console.error(`Failed to fetch course ${id}`, e);
    return null;
  }
};

export const getCourseBySlug = async (slug) => {
  const courses = await getAllCourses();
  return courses.find((c) => c.slug === slug) || null;
};

export const createCourse = async (course) => {
  // Client validation
  if (!course.title || !course.title.trim()) {
    throw new Error("Title is required");
  }
  if (!course.slug || !course.slug.trim()) {
    throw new Error("Slug is required");
  }
  if (!course.summary || !course.summary.trim()) {
    throw new Error("Summary is required");
  }

  try {
    const payload = {
      title: course.title.trim(),
      slug: course.slug.trim(),
      summary: course.summary.trim(),
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      categories: Array.isArray(course.categories)
        ? course.categories.join(",")
        : "",
      duration: course.duration || "",
      level: course.level || "beginner",
      price: Number(course.price) || 0,
      status: course.status || "published",
    };

    const res = await http.post(BASE_URL, payload);
    return res.data;
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error("Only admins can create courses");
    }
    if (err.response?.status === 401) {
      throw new Error("Unauthorized. Please login as admin.");
    }
    if (err.response?.status === 400) {
      throw new Error(err.response.data?.error || "Invalid course data");
    }
    throw new Error(err.response?.data?.error || "Failed to create course");
  }
};

export const updateCourse = async (id, updates) => {
  try {
    const payload = {
      title: updates.title?.trim() || "",
      slug: updates.slug?.trim() || "",
      summary: updates.summary?.trim() || "",
      description: updates.description || "",
      thumbnail: updates.thumbnail || "",
      categories: Array.isArray(updates.categories)
        ? updates.categories.join(",")
        : "",
      duration: updates.duration || "",
      level: updates.level || "beginner",
      price: Number(updates.price) || 0,
      status: updates.status || "published",
    };

    const res = await http.put(`${BASE_URL}/${id}`, payload);
    return res.data;
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error("Only admins can update courses");
    }
    if (err.response?.status === 404) {
      throw new Error("Course not found");
    }
    throw new Error(err.response?.data?.error || "Failed to update course");
  }
};

export const deleteCourse = async (id) => {
  try {
    await http.delete(`${BASE_URL}/${id}`);
    return true;
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error("Only admins can delete courses");
    }
    if (err.response?.status === 404) {
      throw new Error("Course not found");
    }
    throw new Error(err.response?.data?.error || "Failed to delete course");
  }
};


import { http } from "./http";

const BASE_URL = "courses";
const BASE_QUIZ = "quizzes";
const BASE_ASSESSMENT = "assessments";

export const courseApi = {
  // Fetch all courses (public)
  getAll: async () => {
    try {
      const res = await http.get(BASE_URL);
      return res.data;
    } catch (e) {
      console.error("Failed to fetch courses", e);
      throw e;
    }
  },

  // Fetch single course by ID (public)
  getById: async (id) => {
    try {
      const res = await http.get(`${BASE_URL}/${id}`);
      return res.data;
    } catch (e) {
      console.error(`Failed to fetch course ${id}`, e);
      throw e;
    }
  },

  // Create course (admin/instructor only)
  create: async (payload) => {
    if (!payload.title || !payload.title.trim())
      throw new Error("Title is required");
    if (!payload.slug || !payload.slug.trim())
      throw new Error("Slug is required");
    if (!payload.summary || !payload.summary.trim())
      throw new Error("Summary is required");

    try {
      const res = await http.post(BASE_URL, payload);
      return res.data;
    } catch (err) {
      if (err.response?.status === 403)
        throw new Error("You must be an admin to create courses");
      if (err.response?.status === 400)
        throw new Error(err.response.data?.error || "Invalid course data");
      if (err.response?.status === 401)
        throw new Error("Unauthorized. Please login as admin.");
      throw new Error(err.response?.data?.error || "Failed to create course");
    }
  },

  // Update course (admin only)
  update: async (id, payload) => {
    try {
      const res = await http.put(`${BASE_URL}/${id}`, payload);
      return res.data;
    } catch (err) {
      if (err.response?.status === 403)
        throw new Error("Only admins can update courses");
      if (err.response?.status === 404) throw new Error("Course not found");
      throw new Error(err.response?.data?.error || "Failed to update course");
    }
  },

  // Delete course (admin only)
  delete: async (id) => {
    try {
      await http.delete(`${BASE_URL}/${id}`);
      return true;
    } catch (err) {
      if (err.response?.status === 403)
        throw new Error("Only admins can delete courses");
      if (err.response?.status === 404) throw new Error("Course not found");
      throw new Error(err.response?.data?.error || "Failed to delete course");
    }
  },

  // Get course with full structure (chapters, lessons, content)
  getStructure: async (id) => {
    try {
      const res = await http.get(`${BASE_URL}/${id}/structure`);
      return res.data;
    } catch (err) {
      console.error(`Failed to fetch course structure for ${id}`, err);
      throw err;
    }
  },

  // Fetch single course by slug (public)
  getBySlug: async (slug) => {
    try {
      const allCourses = await courseApi.getAll();
      const course = allCourses.find(
        (c) => c.slug === slug || c.id.toString() === slug,
      );
      if (!course) throw new Error("Course not found");
      return course;
    } catch (e) {
      console.error(`Failed to fetch course by slug ${slug}`, e);
      throw e;
    }
  },

  // Get course with full structure by slug (chapters, lessons, content)
  getStructureBySlug: async (slug) => {
    try {
      const course = await courseApi.getBySlug(slug);
      const res = await http.get(`${BASE_URL}/${course.id}/structure`);
      return res.data;
    } catch (err) {
      console.error(`Failed to fetch course structure by slug ${slug}`, err);
      throw err;
    }
  },

  // Chapter endpoints
  chapters: {
    create: async (courseId, payload) => {
      try {
        const res = await http.post(
          `${BASE_URL}/${courseId}/chapters`,
          payload,
        );
        return res.data;
      } catch (err) {
        throw new Error(
          err.response?.data?.error || "Failed to create chapter",
        );
      }
    },
    update: async (courseId, chapterId, payload) => {
      try {
        const res = await http.put(
          `${BASE_URL}/${courseId}/chapters/${chapterId}`,
          payload,
        );
        return res.data;
      } catch (err) {
        throw new Error(
          err.response?.data?.error || "Failed to update chapter",
        );
      }
    },
    delete: async (courseId, chapterId) => {
      try {
        await http.delete(`${BASE_URL}/${courseId}/chapters/${chapterId}`);
        return true;
      } catch (err) {
        throw new Error(
          err.response?.data?.error || "Failed to delete chapter",
        );
      }
    },
  },

  // Lesson endpoints
  lessons: {
    create: async (courseId, chapterId, payload) => {
      try {
        const res = await http.post(
          `${BASE_URL}/${courseId}/chapters/${chapterId}/lessons`,
          payload,
        );
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || "Failed to create lesson");
      }
    },
    update: async (courseId, chapterId, lessonId, payload) => {
      try {
        const res = await http.put(
          `${BASE_URL}/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
          payload,
        );
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || "Failed to update lesson");
      }
    },
    delete: async (courseId, chapterId, lessonId) => {
      try {
        await http.delete(
          `${BASE_URL}/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
        );
        return true;
      } catch (err) {
        throw new Error(err.response?.data?.error || "Failed to delete lesson");
      }
    },
  },

  // Content upload endpoints
  content: {
    upload: async (courseId, chapterId, lessonId, formData) => {
      try {
        const res = await http.post(
          `${BASE_URL}/${courseId}/chapters/${chapterId}/lessons/${lessonId}/content`,
          formData,
        );
        return res.data;
      } catch (err) {
        if (err.response?.status === 401)
          throw new Error("Unauthorized. Please login as admin.");
        if (err.response?.status === 403)
          throw new Error("Only admins can upload content");
        if (err.response?.status === 400)
          throw new Error(err.response.data?.error || "Invalid content data");
        throw new Error(
          err.response?.data?.error || "Failed to upload content",
        );
      }
    },
    delete: async (courseId, chapterId, lessonId, contentId) => {
      try {
        await http.delete(
          `${BASE_URL}/${courseId}/chapters/${chapterId}/lessons/${lessonId}/content/${contentId}`,
        );
        return true;
      } catch (err) {
        throw new Error(
          err.response?.data?.error || "Failed to delete content",
        );
      }
    },
  },
};

// -----------------------------------------------------------------------
// Quiz API
// -----------------------------------------------------------------------

export const quizApi = {
  getByChapter: async (chapterId) => {
    const res = await http.get(`${BASE_QUIZ}/chapter/${chapterId}`);
    return res.data;
  },
  getById: async (id) => {
    const res = await http.get(`${BASE_QUIZ}/${id}`);
    return res.data;
  },
  create: async (payload) => {
    const res = await http.post(`${BASE_QUIZ}`, payload);
    return res.data;
  },
  update: async (id, payload) => {
    const res = await http.put(`${BASE_QUIZ}/${id}`, payload);
    return res.data;
  },
  delete: async (id) => {
    await http.delete(`${BASE_QUIZ}/${id}`);
  },
  submit: async (id, answers) => {
    const res = await http.post(`${BASE_QUIZ}/${id}/submit`, { answers });
    return res.data;
  },
  getMyAttempt: async (id) => {
    const res = await http.get(`${BASE_QUIZ}/${id}/my-attempt`);
    return res.data;
  },
};

// -----------------------------------------------------------------------
// Assessment API
// -----------------------------------------------------------------------

export const assessmentApi = {
  getByCourse: async (courseId) => {
    const res = await http.get(`${BASE_ASSESSMENT}/course/${courseId}`);
    return res.data;
  },
  upsert: async (courseId, payload) => {
    const res = await http.put(
      `${BASE_ASSESSMENT}/course/${courseId}`,
      payload,
    );
    return res.data;
  },
  delete: async (courseId) => {
    await http.delete(`${BASE_ASSESSMENT}/course/${courseId}`);
  },
  getEligibility: async (courseId) => {
    const res = await http.get(
      `${BASE_ASSESSMENT}/course/${courseId}/eligibility`,
    );
    return res.data;
  },
  start: async (courseId) => {
    const res = await http.post(`${BASE_ASSESSMENT}/course/${courseId}/start`);
    return res.data;
  },
  submit: async (attemptId, answers) => {
    const res = await http.post(
      `${BASE_ASSESSMENT}/attempt/${attemptId}/submit`,
      { answers },
    );
    return res.data;
  },
  getMyAttempts: async (courseId) => {
    const res = await http.get(
      `${BASE_ASSESSMENT}/course/${courseId}/my-attempts`,
    );
    return res.data;
  },
  completeLesson: async (lessonId) => {
    const res = await http.post(
      `${BASE_ASSESSMENT}/lesson/${lessonId}/complete`,
    );
    return res.data;
  },
  getProgress: async (courseId) => {
    const res = await http.get(
      `${BASE_ASSESSMENT}/course/${courseId}/progress`,
    );
    return res.data;
  },
};
// -----------------------------------------------------------------------
// Live Session API
// -----------------------------------------------------------------------

export const liveSessionApi = {
  getAll: async () => {
    const res = await http.get("LiveSessions");
    return res.data;
  },
  getById: async (id) => {
    const res = await http.get(`LiveSessions/${id}`);
    return res.data;
  },
  create: async (payload) => {
    const res = await http.post("LiveSessions", payload);
    return res.data;
  },
  update: async (id, payload) => {
    const res = await http.put(`LiveSessions/${id}`, payload);
    return res.data;
  },
  delete: async (id) => {
    await http.delete(`LiveSessions/${id}`);
  },
  join: async (id) => {
    const res = await http.post(`LiveSessions/${id}/join`);
    return res.data;
  },
};

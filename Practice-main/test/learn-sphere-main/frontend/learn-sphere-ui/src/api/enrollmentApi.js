import { http } from "./http";

const BASE_URL = "students/me";

// Enroll in a course
export const enrollCourseAPI = async (courseId) => {
  try {
    const res = await http.post(`${BASE_URL}/enroll`, { courseId });
    return res.data;
  } catch (err) {
    if (err.response?.status === 400) {
      throw new Error("Already enrolled in this course");
    }
    throw new Error(err.response?.data?.error || "Failed to enroll");
  }
};

// Get enrolled courses for current student
export const getEnrolledCoursesAPI = async () => {
  try {
    const res = await http.get(`${BASE_URL}/courses`);
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch enrolled courses", err);
    return [];
  }
};

// Unenroll from a course
export const unenrollCourseAPI = async (courseId) => {
  try {
    const res = await http.delete(`${BASE_URL}/courses/${courseId}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to unenroll");
  }
};

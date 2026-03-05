import { http } from "./http";

export const getSummaryStats = async () => {
  const response = await http.get("/analytics/summary");
  console.log("Summary Stats API Response:", response.data);
  return response.data;
};

export const getStudentPerformance = async () => {
  const response = await http.get("/analytics/students");
  console.log("Student Performance API Response:", response.data);
  return response.data;
};

export const getCoursePerformance = async () => {
  const response = await http.get("/analytics/courses");
  console.log("Course Performance API Response:", response.data);
  return response.data;
};

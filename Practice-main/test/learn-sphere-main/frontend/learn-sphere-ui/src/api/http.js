import axios from "axios";

const API_BASE = "http://localhost:5267/api/";

export const http = axios.create({
  baseURL: API_BASE,
});

// Attach JWT automatically
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // For FormData requests, don't set Content-Type header
  // Let axios handle it with proper multipart/form-data + boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  
  return config;
});

// Handle response errors
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("learnsphere_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

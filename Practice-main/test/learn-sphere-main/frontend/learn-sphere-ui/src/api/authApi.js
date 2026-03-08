import { http } from "./http";

export const loginApi = (payload) => http.post("/auth/login", payload);
export const registerApi = (payload) => http.post("/auth/register", payload);
export const resetPasswordApi = (payload) =>
  http.post("/auth/reset-password", payload);

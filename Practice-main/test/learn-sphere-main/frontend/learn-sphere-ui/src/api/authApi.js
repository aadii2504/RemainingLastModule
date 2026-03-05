import { http } from "./http";

export const loginApi = (payload) => http.post("/auth/login", payload);
export const registerApi = (payload) => http.post("/auth/register", payload);
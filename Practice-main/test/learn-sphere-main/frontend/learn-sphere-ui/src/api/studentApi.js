import { http } from "./http";

export const getMeApi = () => http.get("/students/me");
export const saveMeApi = (payload) => http.post("/students/me", payload);
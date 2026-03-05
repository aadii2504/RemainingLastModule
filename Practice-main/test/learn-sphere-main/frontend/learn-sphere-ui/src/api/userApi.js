import { http } from "./http";

export const userApi = {
  // Fetch all users (admin only)
  getAll: async () => {
    try {
      const res = await http.get("/users");
      return res.data;
    } catch (e) {
      console.error("Failed to fetch users", e);
      throw e;
    }
  },

  // Update user status (admin only)
  updateStatus: async (userId, status) => {
    try {
      const res = await http.put(`/users/${userId}/status`, { status });
      return res.data;
    } catch (e) {
      console.error("Failed to update user status", e);
      throw e;
    }
  },
};
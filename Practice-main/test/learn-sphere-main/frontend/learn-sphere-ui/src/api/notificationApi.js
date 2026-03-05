import { http } from "./http";

export const notificationApi = {
  list: async (take = 20) => {
    const res = await http.get("notifications", { params: { take } });
    return res.data || [];
  },

  // NEW: mark one as read (persists on server)
  markRead: async (id) => {
    await http.post(`notifications/${id}/read`);
    return true;
  },

  markAllRead: async () => {
    await http.post("notifications/read-all");
    return true;
  },

  // Optional: if you wired the unread-count endpoint
  unreadCount: async () => {
    const res = await http.get("notifications/unread-count");
    return res.data?.count ?? 0;
  },
};
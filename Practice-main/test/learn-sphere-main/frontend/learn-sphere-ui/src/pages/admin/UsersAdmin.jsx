// src/pages/admin/UsersAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { userApi } from "../../api/userApi";
import { toast } from "react-toastify";

const Stat = ({ label, value }) => (
  <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
    <div className="text-sm text-[var(--text)]/80">{label}</div>
    <div className="mt-2 text-2xl font-bold">{value}</div>
  </div>
);
export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [updatingStatus, setUpdatingStatus] = useState(null); // user id being updated

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await userApi.getAll();
        // Transform backend data to frontend format
        const transformed = data.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.studentProfile?.phone || "",
          role: user.role,
          status: user.status, // Now from backend
          guardian: user.studentProfile
            ? {
                name: user.studentProfile.guardianName || "",
                phone: user.studentProfile.guardianPhone || "",
              }
            : null,
          createdAt: new Date().toISOString(), // Placeholder
        }));
        // Exclude admin accounts from the management list
        const nonAdmin = transformed.filter((u) => u.role !== "admin");
        setUsers(nonAdmin);
        setError(null);
      } catch (err) {
        console.error("Failed to load users:", err);
        const message =
          err.response?.data?.error || err.message || "Failed to load users";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setUpdatingStatus(userId);
    try {
      await userApi.updateStatus(userId, newStatus);
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)),
      );
      toast.success(
        `User ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update user status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let data = [...users];
    if (term) {
      data = data.filter((u) =>
        [u.name, u.email, u.phone, u.role, u.guardian?.name, u.guardian?.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)),
      );
    }
    data.sort((a, b) => {
      const va = (a[sortBy] ?? "").toString().toLowerCase();
      const vb = (b[sortBy] ?? "").toString().toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [users, q, sortBy, sortDir]);

  const changeSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  if (loading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users</h1>
          {/* <div className="text-sm text-[var(--text)]/70">
            Manage registered users (local storage)
          </div> */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Stat label="Total Users" value={users.length} />
          <Stat
            label="Active Students"
            value={
              users.filter((u) => u.role === "student" && u.status === "active")
                .length
            }
          />
          <Stat
            label="Deactivated Students"
            value={
              users.filter((u) => u.role === "student" && u.status !== "active")
                .length
            }
          />
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, phone, guardian..."
              className="w-full rounded-md px-3 py-2 bg-[var(--card)] border border-[var(--border)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--text)]/70">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md px-3 py-2 bg-[var(--card)] border border-[var(--border)] text-sm"
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="px-3 py-2 rounded-md border border-[var(--border)] text-sm"
            >
              {sortDir === "asc" ? "Asc" : "Desc"}
            </button>
          </div>
        </div>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="min-w-full overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/20">
                <tr>
                  <th
                    className="text-left px-4 py-3 cursor-pointer"
                    onClick={() => changeSort("name")}
                  >
                    Name
                  </th>
                  <th
                    className="text-left px-4 py-3 cursor-pointer"
                    onClick={() => changeSort("email")}
                  >
                    Email
                  </th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th
                    className="text-left px-4 py-3 cursor-pointer"
                    onClick={() => changeSort("role")}
                  >
                    Role
                  </th>
                  <th className="text-left px-4 py-3">Guardian</th>
                  <th className="text-left px-4 py-3">Guardian Phone</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-[var(--text)]/70"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-[var(--border)] hover:bg-white/5"
                    >
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.phone || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                            u.role === "admin"
                              ? "bg-indigo-600/20 text-indigo-300"
                              : "bg-green-600/20 text-green-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">{u.guardian?.name || "-"}</td>
                      <td className="px-4 py-3">{u.guardian?.phone || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                            u.status === "active"
                              ? "bg-green-600/20 text-green-300"
                              : "bg-gray-600/20 text-gray-300"
                          }`}
                        >
                          {u.status || "inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleStatusToggle(u.id, u.status)}
                          disabled={updatingStatus === u.id}
                          className={`px-3 py-1 rounded-md text-xs font-semibold ${
                            u.status === "active"
                              ? "bg-red-600/20 text-red-300 hover:bg-red-600/30"
                              : "bg-green-600/20 text-green-300 hover:bg-green-600/30"
                          } disabled:opacity-50`}
                        >
                          {updatingStatus === u.id
                            ? "Updating..."
                            : u.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

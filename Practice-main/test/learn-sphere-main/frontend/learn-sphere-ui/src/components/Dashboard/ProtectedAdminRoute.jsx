import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("learnsphere_user") || "null");

  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
}
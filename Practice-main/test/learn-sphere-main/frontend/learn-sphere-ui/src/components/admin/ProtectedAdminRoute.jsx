import React from "react";
import { Navigate } from "react-router-dom";

// Simple admin guard that expects the stored user object to have a `role` field set to 'admin'.
export const ProtectedAdminRoute = ({ children }) => {
  try {
    const user = JSON.parse(localStorage.getItem("learnsphere_user") || "null");
    if (!user || user.role !== "admin") return <Navigate to="/login" replace />;
    return children;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedAdminRoute;

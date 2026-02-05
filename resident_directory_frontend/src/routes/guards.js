import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

// PUBLIC_INTERFACE
export function RequireAuth() {
  /** Protects routes that require login. */
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// PUBLIC_INTERFACE
export function RequireAdmin() {
  /** Protects routes that require admin role. */
  const { isAuthed, user } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}

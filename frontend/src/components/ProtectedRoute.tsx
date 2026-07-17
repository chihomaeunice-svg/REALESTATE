import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import type { Role } from "../lib/api";

export function ProtectedRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-ink-400">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

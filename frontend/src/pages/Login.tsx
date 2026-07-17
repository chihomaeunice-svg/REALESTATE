import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(phone, password);
      const dest = user.role === "tenant" ? "/tenant" : user.role === "admin" ? "/admin" : "/landlord";
      navigate(dest);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink-900">Log in</h1>
      <p className="mt-1 text-ink-500">Landlords, tenants, and agents all log in here.</p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="label">Phone number</label>
          <input required className="input" placeholder="+255…" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input required type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-500">
        No account yet? <Link to="/register" className="font-semibold text-brand-600">Register</Link>
      </p>

      <div className="mt-8 rounded-xl bg-ink-100 p-4 text-xs text-ink-500">
        <p className="mb-1 font-semibold text-ink-600">Demo accounts (seeded)</p>
        <p>Landlord: +255712000001 / password123</p>
        <p>Tenant: +255755000001 / password123</p>
        <p>Admin: +255700000000 / admin123</p>
      </div>
    </div>
  );
}

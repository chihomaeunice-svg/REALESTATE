import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { ApiError, type Role } from "../lib/api";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Extract<Role, "landlord" | "tenant">>("landlord");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nidaNumber, setNidaNumber] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await register({
        phone,
        password,
        full_name: fullName,
        role,
        nida_number: nidaNumber || undefined,
      });
      navigate(user.role === "tenant" ? "/tenant" : "/landlord");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not register.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink-900">Create an account</h1>
      <p className="mt-1 text-ink-500">Free forever for listings and tenants.</p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="label">I am a…</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("landlord")}
              className={role === "landlord" ? "btn-primary !py-2" : "btn-secondary !py-2"}
            >
              Landlord
            </button>
            <button
              type="button"
              onClick={() => setRole("tenant")}
              className={role === "tenant" ? "btn-primary !py-2" : "btn-secondary !py-2"}
            >
              Tenant
            </button>
          </div>
        </div>
        <div>
          <label className="label">Full name</label>
          <input required className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label">Phone number</label>
          <input required className="input" placeholder="+255…" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {role === "landlord" && (
          <div>
            <label className="label">NIDA number (for listing verification)</label>
            <input className="input" placeholder="Optional but speeds up review" value={nidaNumber} onChange={(e) => setNidaNumber(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Password</label>
          <input required type="password" minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-500">
        Already have an account? <Link to="/login" className="font-semibold text-brand-600">Log in</Link>
      </p>
    </div>
  );
}

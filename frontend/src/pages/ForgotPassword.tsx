import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Eye, EyeOff, ArrowRight } from "lucide-react";
import { api, ApiError } from "../lib/api";

export function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStep("reset");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send reset code.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { email, code: code.join(""), new_password: newPassword });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset password. Check your code and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (step === "reset") inputRefs.current[0]?.focus();
  }, [step]);

  if (done) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/20">
            <KeyRound className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">Password reset</h1>
          <p className="mt-2 text-sm text-text-muted">Your password has been updated. Sign in with your new password.</p>
          <button onClick={() => navigate("/login")} className="btn-primary mt-6 w-full">
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/20">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold">Reset your password</h1>
            <p className="mt-2 text-sm text-text-muted">
              Enter the 6-digit code sent to <strong className="text-ink-900">{email}</strong> and choose a new password.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
            <div className="flex justify-center gap-2.5" onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className="h-13 w-11 rounded-xl border border-surface-border bg-surface text-center text-xl font-semibold text-ink-900 transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              ))}
            </div>

            <div>
              <label className="label">New password</label>
              <div className="relative">
                <input
                  required type={showPassword ? "text" : "password"} className="input !pr-11"
                  placeholder="At least 8 characters"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint transition hover:text-ink-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                required type={showPassword ? "text" : "password"} className="input"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting || code.join("").length !== 6} className="btn-primary w-full">
              {submitting ? "Resetting..." : "Reset password"}
            </button>
          </form>

          <button
            onClick={() => { setStep("email"); setCode(["", "", "", "", "", ""]); setError(""); }}
            className="mt-4 block w-full text-center text-sm text-text-muted hover:text-brand-600"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  // --- step: email ---
  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/20">
            <KeyRound className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">Forgot your password?</h1>
          <p className="mt-2 text-sm text-text-muted">We'll email you a 6-digit code to reset it.</p>
        </div>

        <form onSubmit={handleSendCode} className="mt-8">
          <label className="label">Email address</label>
          <input
            required type="email" className="input" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary mt-4 w-full">
            {submitting ? "Sending code..." : "Send reset code"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-text-faint">
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

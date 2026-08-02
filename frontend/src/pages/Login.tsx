import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api";

export function Login() {
  const { login, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  // OTP state
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Phone/password fallback
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function routeByRole(role: string) {
    const dest = role === "tenant" ? "/tenant" : role === "admin" ? "/admin" : "/landlord";
    navigate(dest);
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await sendOTP(email);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send code. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setCode(next);
      inputRefs.current[5]?.focus();
    }
  }

  const fullCode = code.join("");

  useEffect(() => {
    if (fullCode.length === 6 && otpSent) {
      handleVerifyOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullCode]);

  async function handleVerifyOTP() {
    setError("");
    setSubmitting(true);
    try {
      const user = await verifyOTP(email, fullCode);
      routeByRole(user.role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Try again.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(phone, password);
      routeByRole(user.role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/20">
            <Mail className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">
            {otpSent ? "Check your email" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {otpSent
              ? <>We sent a 6-digit code to <strong className="text-ink-700">{email}</strong></>
              : "Sign in with your email — no password needed."
            }
          </p>
        </div>

        {/* OTP Flow */}
        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="mt-8">
            <label className="label">Email address</label>
            <input
              required
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            {error && !showPhoneLogin && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary mt-4 w-full">
              {submitting ? "Sending code..." : "Continue with email"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        ) : (
          <div className="mt-8">
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
                  autoFocus={i === 0}
                  className="h-13 w-11 rounded-xl border border-ink-200 bg-surface text-center text-xl font-semibold text-ink-900 transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              ))}
            </div>
            {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
            {submitting && <p className="mt-3 text-center text-sm text-ink-400">Verifying...</p>}
            <button
              onClick={() => { setOtpSent(false); setCode(["", "", "", "", "", ""]); setError(""); }}
              className="mt-4 block w-full text-center text-sm text-ink-500 hover:text-brand-600"
            >
              Use a different email
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ink-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-ink-50 px-3 text-xs text-ink-400">or</span>
          </div>
        </div>

        {/* Phone/password fallback */}
        {!showPhoneLogin ? (
          <button
            onClick={() => setShowPhoneLogin(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 text-sm font-medium text-ink-500 hover:text-ink-700"
          >
            Sign in with phone & password
            <ChevronDown className="h-4 w-4" />
          </button>
        ) : (
          <form onSubmit={handlePhoneLogin} className="mt-6 space-y-3">
            <div>
              <label className="label">Phone number</label>
              <input required className="input" placeholder="+255..." value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} className="input !pr-11" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-ink-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>
            {error && showPhoneLogin && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-secondary w-full">
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-ink-400">
          New here?{" "}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

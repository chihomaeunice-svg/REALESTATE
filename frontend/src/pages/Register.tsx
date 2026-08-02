import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, User, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { ApiError, type Role } from "../lib/api";

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Fair", color: "bg-orange-400" };
  if (score === 3) return { score: 3, label: "Good", color: "bg-yellow-400" };
  if (score === 4) return { score: 4, label: "Strong", color: "bg-brand-400" };
  return { score: 5, label: "Very strong", color: "bg-brand-600" };
}

export function Register() {
  const { register, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  // Step: "form" | "otp"
  const [step, setStep] = useState<"form" | "otp">("form");

  // Form fields
  const [role, setRole] = useState<Extract<Role, "landlord" | "tenant">>("landlord");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nidaNumber, setNidaNumber] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // OTP
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreedTerms) {
      setError("Please accept the terms and conditions to continue.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await register({
        phone,
        email: email || undefined,
        password,
        full_name: fullName,
        role,
        nida_number: nidaNumber || undefined,
      });
      // Send OTP to email for verification
      if (email) {
        await sendOTP(email);
        setStep("otp");
      } else {
        // No email provided — skip OTP, go to dashboard
        navigate(role === "tenant" ? "/tenant" : "/landlord");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not register.");
    } finally {
      setSubmitting(false);
    }
  }

  // OTP handlers
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
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  const fullCode = code.join("");

  useEffect(() => {
    if (fullCode.length === 6 && step === "otp") {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullCode]);

  async function handleVerify() {
    setError("");
    setSubmitting(true);
    try {
      const user = await verifyOTP(email, fullCode);
      navigate(user.role === "tenant" ? "/tenant" : user.role === "admin" ? "/admin" : "/landlord");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Try again.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");
    try {
      await sendOTP(email);
    } catch {
      setError("Could not resend code. Try again.");
    }
  }

  // --- OTP Step ---
  if (step === "otp") {
    return (
      <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/20">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold">Verify your email</h1>
            <p className="mt-2 text-sm text-ink-500">
              We sent a 6-digit code to <strong className="text-ink-700">{email}</strong>
            </p>
          </div>

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

            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={handleResend}
                className="text-sm font-medium text-brand-600 transition hover:text-brand-700"
              >
                Resend code
              </button>
              <button
                onClick={() => { setStep("form"); setCode(["", "", "", "", "", ""]); setError(""); }}
                className="flex items-center gap-1 text-sm text-ink-500 transition hover:text-ink-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to registration
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Form Step ---
  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-ink-500">Free to list, free to browse. No hidden charges.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Role selection */}
          <div>
            <label className="label">I want to...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("landlord")}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition ${
                  role === "landlord"
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-surface text-ink-600 hover:border-ink-300"
                }`}
              >
                <Building2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">List property</p>
                  <p className="text-xs font-normal text-ink-400">Landlord / Agent</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole("tenant")}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition ${
                  role === "tenant"
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-surface text-ink-600 hover:border-ink-300"
                }`}
              >
                <User className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Find a home</p>
                  <p className="text-xs font-normal text-ink-400">Tenant</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="label">Full name</label>
            <input required className="input" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email address</label>
            <input required type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Phone number</label>
            <input required className="input" placeholder="+255..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {role === "landlord" && (
            <div>
              <label className="label">NIDA number <span className="font-normal text-ink-400">(optional)</span></label>
              <input className="input" placeholder="Speeds up listing verification" value={nidaNumber} onChange={(e) => setNidaNumber(e.target.value)} />
            </div>
          )}

          {/* Password with toggle + strength meter */}
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                minLength={8}
                className="input !pr-11"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-ink-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.score ? strength.color : "bg-ink-100"
                      }`}
                    />
                  ))}
                </div>
                <p className={`mt-1 text-xs font-medium ${
                  strength.score <= 1 ? "text-red-500"
                    : strength.score === 2 ? "text-orange-500"
                    : strength.score === 3 ? "text-yellow-600"
                    : "text-brand-600"
                }`}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="terms" className="text-sm text-ink-500">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="font-semibold text-brand-600 underline decoration-brand-200 underline-offset-2 transition hover:text-brand-700 hover:decoration-brand-400"
              >
                Terms and Conditions
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="font-semibold text-brand-600 underline decoration-brand-200 underline-offset-2 transition hover:text-brand-700 hover:decoration-brand-400"
              >
                Privacy Policy
              </button>
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !agreedTerms}
            className="btn-primary w-full py-3"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => setShowTerms(false)}>
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-ink-900">Terms and Conditions</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-600">
              <p><strong>1. Acceptance of Terms</strong><br />
                By creating an account on Nyumba Yangu, you agree to be bound by these Terms and Conditions. If you do not agree, do not use this platform.</p>
              <p><strong>2. User Accounts</strong><br />
                You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information during registration. You agree to notify us of any unauthorized use of your account.</p>
              <p><strong>3. Listing Accuracy</strong><br />
                Landlords and agents must provide accurate property information. Misleading listings, false photos, or fraudulent pricing will result in account suspension. Nyumba Yangu reserves the right to remove any listing that violates these terms.</p>
              <p><strong>4. Payments</strong><br />
                Rent payments processed through M-Pesa are between tenant and landlord. Nyumba Yangu facilitates payment tracking but is not liable for payment disputes. All amounts are in Tanzanian Shillings (TZS).</p>
              <p><strong>5. Privacy</strong><br />
                We collect personal information (name, phone, email, NIDA) solely to operate the platform. Your data is not sold to third parties. Phone numbers on listings are visible to seekers who submit inquiries.</p>
              <p><strong>6. Verification</strong><br />
                Identity verification via NIDA is used to build trust on the platform. Verification badges indicate identity confirmation, not property quality or legal compliance.</p>
              <p><strong>7. Limitation of Liability</strong><br />
                Nyumba Yangu is a marketplace platform. We do not own or manage properties listed. We are not responsible for the condition, legality, or safety of any listed property.</p>
              <p><strong>8. Modifications</strong><br />
                We may update these terms at any time. Continued use of the platform constitutes acceptance of revised terms.</p>
            </div>
            <button
              onClick={() => setShowTerms(false)}
              className="btn-primary mt-6 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

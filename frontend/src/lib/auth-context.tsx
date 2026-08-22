import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearToken, getToken, setToken, type User } from "./api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string, method?: "email" | "phone") => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

export interface RegisterPayload {
  phone: string;
  email?: string;
  password: string;
  full_name: string;
  role: "landlord" | "tenant" | "agent";
  nida_number?: string;
  business_license?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<User>("/me");
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(identifier: string, password: string, method: "email" | "phone" = "phone") {
    const body = method === "email"
      ? { email: identifier, password }
      : { phone: identifier, password };
    const res = await api.post<{ token: string; user: User }>("/auth/login", body);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  async function register(payload: RegisterPayload) {
    const res = await api.post<{ token: string; user: User }>("/auth/register", payload);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  async function sendOTP(email: string) {
    await api.post("/auth/otp/send", { email });
  }

  async function verifyOTP(email: string, code: string) {
    const res = await api.post<{ token: string; user: User }>("/auth/otp/verify", { email, code });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, sendOTP, verifyOTP, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

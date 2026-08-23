import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api";
import { PasswordInput } from "../components/PasswordInput";
import { OtpInput } from "../components/OtpInput";
import { colors } from "../theme/colors";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export function LoginScreen({ navigation }: { navigation: NativeStackNavigationProp<any> }) {
  const { login, sendOTP, verifyOTP } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otpMode, setOtpMode] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleEmailLogin() {
    setError("");
    setSubmitting(true);
    try {
      await login(email, password, "email");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhoneLogin() {
    setError("");
    setSubmitting(true);
    try {
      await login(phone, phonePassword, "phone");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid phone or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendOTP() {
    setError("");
    setSubmitting(true);
    try {
      await sendOTP(otpEmail);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send code.");
    } finally {
      setSubmitting(false);
    }
  }

  const fullCode = code.join("");
  useEffect(() => {
    if (fullCode.length === 6 && otpSent) handleVerifyOTP();
  }, [fullCode]);

  async function handleVerifyOTP() {
    setError("");
    setSubmitting(true);
    try {
      await verifyOTP(otpEmail, fullCode);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code.");
      setCode(["", "", "", "", "", ""]);
    } finally {
      setSubmitting(false);
    }
  }

  // OTP verify screen
  if (otpMode && otpSent) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.centerBox}>
          <View style={styles.iconCircle}>
            <Feather name="mail" size={28} color={colors.white} />
          </View>
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.subtext}>
            We sent a 6-digit code to <Text style={styles.bold}>{otpEmail}</Text>
          </Text>
          <View style={styles.otpBox}>
            <OtpInput code={code} setCode={setCode} />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {submitting ? <Text style={styles.mutedText}>Verifying...</Text> : null}
          <TouchableOpacity
            onPress={() => { setOtpSent(false); setCode(["", "", "", "", "", ""]); setError(""); }}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>Use a different email</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // OTP email entry
  if (otpMode) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.centerBox}>
          <View style={styles.iconCircle}>
            <Feather name="mail" size={28} color={colors.white} />
          </View>
          <Text style={styles.heading}>Passwordless sign in</Text>
          <Text style={styles.subtext}>We'll send a one-time code to your email.</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              value={otpEmail}
              onChangeText={setOtpEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.disabledBtn]}
            onPress={handleSendOTP}
            disabled={submitting}
          >
            <Text style={styles.primaryBtnText}>{submitting ? "Sending code..." : "Send code"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setOtpMode(false); setError(""); }}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>Back to email & password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Main login: email + password
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.centerBox}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subtext}>Sign in to your Nyumba Yangu account.</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <PasswordInput value={password} onChangeText={setPassword} placeholder="Your password" />
            </View>
            {error && !showPhoneLogin ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.primaryBtn, submitting && styles.disabledBtn]}
              onPress={handleEmailLogin}
              disabled={submitting}
            >
              <Text style={styles.primaryBtnText}>{submitting ? "Signing in..." : "Sign in"}</Text>
            </TouchableOpacity>
          </View>

          {/* OTP alternative */}
          <TouchableOpacity
            onPress={() => { setOtpMode(true); setError(""); }}
            style={styles.otpLink}
          >
            <Feather name="mail" size={16} color={colors.brand[600]} />
            <Text style={styles.otpLinkText}>Sign in with email code instead</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Phone fallback */}
          {!showPhoneLogin ? (
            <TouchableOpacity onPress={() => setShowPhoneLogin(true)} style={styles.linkBtn}>
              <Text style={styles.linkText}>Sign in with phone & password</Text>
              <Feather name="chevron-down" size={16} color={colors.ink[500]} />
            </TouchableOpacity>
          ) : (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Phone number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+255..."
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <PasswordInput value={phonePassword} onChangeText={setPhonePassword} />
              </View>
              {error && showPhoneLogin ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.secondaryBtn, submitting && styles.disabledBtn]}
                onPress={handlePhoneLogin}
                disabled={submitting}
              >
                <Text style={styles.secondaryBtnText}>
                  {submitting ? "Signing in..." : "Sign in with phone"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.footerLink}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surfaceSunken },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  centerBox: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.brand[600],
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.ink[900],
    textAlign: "center",
  },
  subtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.ink[500],
    textAlign: "center",
  },
  bold: {
    fontWeight: "600",
    color: colors.ink[900],
  },
  form: {
    marginTop: 24,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink[700],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink[900],
    backgroundColor: colors.white,
  },
  primaryBtn: {
    backgroundColor: colors.brand[600],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.white,
    marginTop: 4,
  },
  secondaryBtnText: {
    color: colors.ink[700],
    fontSize: 15,
    fontWeight: "600",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 13,
    color: colors.red[600],
    textAlign: "center",
  },
  mutedText: {
    fontSize: 13,
    color: colors.ink[400],
    textAlign: "center",
    marginTop: 8,
  },
  otpLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
  },
  otpLinkText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.brand[600],
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceBorder,
  },
  dividerText: {
    fontSize: 12,
    color: colors.ink[400],
  },
  linkBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginTop: 16,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: colors.ink[500],
    fontWeight: "500",
  },
  otpBox: {
    marginTop: 24,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: colors.ink[400],
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brand[600],
  },
});

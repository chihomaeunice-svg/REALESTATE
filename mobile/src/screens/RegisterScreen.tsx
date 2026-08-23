import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api";
import { PasswordInput } from "../components/PasswordInput";
import { PasswordStrength } from "../components/PasswordStrength";
import { OtpInput } from "../components/OtpInput";
import { colors } from "../theme/colors";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Role } from "../lib/types";

export function RegisterScreen({ navigation }: { navigation: NativeStackNavigationProp<any> }) {
  const { register, sendOTP, verifyOTP } = useAuth();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [role, setRole] = useState<"landlord" | "tenant">("landlord");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nidaNumber, setNidaNumber] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreedTerms) {
      setError("Please accept the terms and conditions.");
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
      if (email) {
        await sendOTP(email);
        setStep("otp");
      }
      // If no email, auth-context sets user -> navigator auto-redirects
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not register.");
    } finally {
      setSubmitting(false);
    }
  }

  const fullCode = code.join("");
  useEffect(() => {
    if (fullCode.length === 6 && step === "otp") handleVerify();
  }, [fullCode]);

  async function handleVerify() {
    setError("");
    setSubmitting(true);
    try {
      await verifyOTP(email, fullCode);
      // Navigator auto-redirects based on user role
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Try again.");
      setCode(["", "", "", "", "", ""]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");
    try {
      await sendOTP(email);
    } catch {
      setError("Could not resend code.");
    }
  }

  // OTP Step
  if (step === "otp") {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.centerBox}>
          <View style={styles.iconCircle}>
            <Feather name="mail" size={28} color={colors.white} />
          </View>
          <Text style={styles.heading}>Verify your email</Text>
          <Text style={styles.subtext}>
            We sent a 6-digit code to <Text style={styles.bold}>{email}</Text>
          </Text>
          <View style={styles.otpBox}>
            <OtpInput code={code} setCode={setCode} />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {submitting ? <Text style={styles.mutedText}>Verifying...</Text> : null}
          <TouchableOpacity onPress={handleResend} style={styles.linkBtn}>
            <Text style={styles.brandLink}>Resend code</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setStep("form"); setCode(["", "", "", "", "", ""]); setError(""); }}
            style={styles.linkBtn}
          >
            <Feather name="arrow-left" size={14} color={colors.ink[500]} />
            <Text style={styles.linkText}>Back to registration</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Form Step
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.centerBox}>
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.subtext}>Free to list, free to browse. No hidden charges.</Text>

          <View style={styles.form}>
            {/* Role selection */}
            <View style={styles.field}>
              <Text style={styles.label}>I want to...</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === "landlord" && styles.roleBtnActive]}
                  onPress={() => setRole("landlord")}
                >
                  <Feather name="home" size={18} color={role === "landlord" ? colors.brand[700] : colors.ink[600]} />
                  <View>
                    <Text style={[styles.roleTitle, role === "landlord" && styles.roleTitleActive]}>
                      List property
                    </Text>
                    <Text style={styles.roleSubtext}>Landlord / Agent</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, role === "tenant" && styles.roleBtnActive]}
                  onPress={() => setRole("tenant")}
                >
                  <Feather name="user" size={18} color={role === "tenant" ? colors.brand[700] : colors.ink[600]} />
                  <View>
                    <Text style={[styles.roleTitle, role === "tenant" && styles.roleTitleActive]}>
                      Find a home
                    </Text>
                    <Text style={styles.roleSubtext}>Tenant</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Your full name" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Phone number</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+255..." keyboardType="phone-pad" />
            </View>
            {role === "landlord" && (
              <View style={styles.field}>
                <Text style={styles.label}>NIDA number <Text style={styles.optional}>(optional)</Text></Text>
                <TextInput style={styles.input} value={nidaNumber} onChangeText={setNidaNumber} placeholder="Speeds up listing verification" />
              </View>
            )}
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <PasswordInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" />
              <PasswordStrength password={password} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <PasswordInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter your password" />
              {confirmPassword && confirmPassword !== password ? (
                <Text style={styles.errorSmall}>Passwords do not match</Text>
              ) : null}
            </View>

            {/* Terms checkbox */}
            <TouchableOpacity style={styles.checkRow} onPress={() => setAgreedTerms((v) => !v)}>
              <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
                {agreedTerms && <Feather name="check" size={14} color={colors.white} />}
              </View>
              <Text style={styles.checkText}>
                I agree to the{" "}
                <Text style={styles.brandLink} onPress={() => setShowTerms(true)}>Terms and Conditions</Text>
                {" "}and{" "}
                <Text style={styles.brandLink} onPress={() => setShowTerms(true)}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, (submitting || !agreedTerms) && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={submitting || !agreedTerms}
            >
              <Text style={styles.primaryBtnText}>
                {submitting ? "Creating account..." : "Create account"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms Modal */}
        <Modal visible={showTerms} animationType="slide" presentationStyle="pageSheet">
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <Text style={styles.modalBody}>
              {`1. Acceptance of Terms\nBy creating an account on Nyumba Yangu, you agree to be bound by these Terms and Conditions.\n\n2. User Accounts\nYou are responsible for maintaining the confidentiality of your account credentials.\n\n3. Listing Accuracy\nLandlords and agents must provide accurate property information. Misleading listings will result in account suspension.\n\n4. Payments\nRent payments processed through M-Pesa are between tenant and landlord. Nyumba Yangu facilitates payment tracking but is not liable for payment disputes.\n\n5. Privacy\nWe collect personal information solely to operate the platform. Your data is not sold to third parties.\n\n6. Verification\nIdentity verification via NIDA is used to build trust on the platform.\n\n7. Limitation of Liability\nNyumba Yangu is a marketplace platform. We do not own or manage properties listed.\n\n8. Modifications\nWe may update these terms at any time.`}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowTerms(false)}>
              <Text style={styles.primaryBtnText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </Modal>
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
  centerBox: { width: "100%", maxWidth: 440, alignSelf: "center" },
  iconCircle: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: colors.brand[600],
    justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 20,
  },
  heading: { fontSize: 24, fontWeight: "600", color: colors.ink[900], textAlign: "center" },
  subtext: { marginTop: 8, fontSize: 14, color: colors.ink[500], textAlign: "center" },
  bold: { fontWeight: "600", color: colors.ink[900] },
  form: { marginTop: 24, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink[700] },
  optional: { fontWeight: "400", color: colors.ink[400] },
  input: {
    borderWidth: 1, borderColor: colors.ink[200], borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
    color: colors.ink[900], backgroundColor: colors.white,
  },
  roleRow: { flexDirection: "row", gap: 12 },
  roleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 2, borderColor: colors.ink[200], borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14, backgroundColor: colors.white,
  },
  roleBtnActive: {
    borderColor: colors.brand[500], backgroundColor: colors.brand[50],
  },
  roleTitle: { fontSize: 14, fontWeight: "600", color: colors.ink[600] },
  roleTitleActive: { color: colors.brand[700] },
  roleSubtext: { fontSize: 11, color: colors.ink[400], marginTop: 1 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5,
    borderColor: colors.ink[300], justifyContent: "center", alignItems: "center", marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  checkText: { flex: 1, fontSize: 13, color: colors.ink[500], lineHeight: 18 },
  primaryBtn: {
    backgroundColor: colors.brand[600], borderRadius: 12, paddingVertical: 14,
    alignItems: "center", marginTop: 4,
  },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  disabledBtn: { opacity: 0.5 },
  errorText: { fontSize: 13, color: colors.red[600], textAlign: "center" },
  errorSmall: { fontSize: 12, color: colors.red[500], marginTop: 2 },
  mutedText: { fontSize: 13, color: colors.ink[400], textAlign: "center", marginTop: 8 },
  brandLink: { color: colors.brand[600], fontWeight: "600" },
  linkBtn: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    gap: 4, marginTop: 12, paddingVertical: 8,
  },
  linkText: { fontSize: 14, color: colors.ink[500], fontWeight: "500" },
  otpBox: { marginTop: 24, marginBottom: 8 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14, color: colors.ink[400] },
  footerLink: { fontSize: 14, fontWeight: "600", color: colors.brand[600] },
  modalContent: { padding: 24, paddingTop: 48 },
  modalTitle: { fontSize: 22, fontWeight: "600", color: colors.ink[900], marginBottom: 16 },
  modalBody: { fontSize: 14, lineHeight: 22, color: colors.ink[600], marginBottom: 24 },
});

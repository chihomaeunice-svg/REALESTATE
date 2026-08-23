import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { api, ApiError } from "../../lib/api";
import type { Tenant } from "../../lib/types";
import { useAuth } from "../../lib/auth-context";
import { colors } from "../../theme/colors";

export function TenantProfileScreen() {
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", nida_number: "", emergency_contact: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Tenant>("/tenant/me")
      .then((t) => {
        setForm({
          full_name: t.full_name,
          phone: t.phone,
          email: t.email ?? "",
          nida_number: t.nida_number ?? "",
          emergency_contact: t.emergency_contact ?? "",
        });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setForm((f) => ({ ...f, full_name: user?.full_name ?? "", phone: user?.phone ?? "" }));
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    setSaved(false);
    try {
      await api.post("/tenant/profile", {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || undefined,
        nida_number: form.nida_number || undefined,
        emergency_contact: form.emergency_contact || undefined,
      });
      setSaved(true);
    } catch {
      setError("Could not save your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Feather name="user" size={22} color={colors.brand[600]} />
          <Text style={styles.title}>My profile</Text>
        </View>
        <Text style={styles.subtitle}>
          Fill this in before you view a property - landlords can find your details instantly when drafting a lease.
        </Text>

        <View style={styles.card}>
          <View style={styles.formField}>
            <Text style={styles.label}>Full name</Text>
            <TextInput style={styles.input} value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="+255..." keyboardType="phone-pad" />
          </View>
          <View style={styles.formField}>
            <Text style={styles.label}>Email (optional)</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.formField}>
            <Text style={styles.label}>NIDA number (optional)</Text>
            <TextInput style={styles.input} value={form.nida_number} onChangeText={(v) => setForm({ ...form, nida_number: v })} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.label}>Emergency contact (optional)</Text>
            <TextInput style={styles.input} value={form.emergency_contact} onChangeText={(v) => setForm({ ...form, emergency_contact: v })} placeholder="Name and phone number" />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {saved && (
            <View style={styles.savedRow}>
              <Feather name="check-circle" size={14} color={colors.brand[600]} />
              <Text style={styles.savedText}>Saved.</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>{submitting ? "Saving..." : "Save profile"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surfaceSunken },
  content: { padding: 16, paddingBottom: 32 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 14, color: colors.ink[400] },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink[900] },
  subtitle: { fontSize: 14, color: colors.ink[500], marginBottom: 16, lineHeight: 20 },
  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  formField: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink[700], marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.ink[200], borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink[900], backgroundColor: colors.white,
  },
  errorText: { fontSize: 13, color: colors.red[600], marginBottom: 8 },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  savedText: { fontSize: 13, fontWeight: "500", color: colors.brand[700] },
  submitBtn: { backgroundColor: colors.brand[600], borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  submitBtnText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  disabledBtn: { opacity: 0.5 },
});

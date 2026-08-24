import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { api } from "../../lib/api";
import type { Subscription, SubscriptionPayment, SubscriptionResponse } from "../../lib/types";
import { formatTZS } from "../../lib/format";
import { colors } from "../../theme/colors";

const TIERS = [
  { key: "free", label: "Free", range: "1 unit", note: "Free for the first month only" },
  { key: "starter", label: "Starter", range: "2-10 units", note: "TZS 20,000 / month" },
  { key: "growth", label: "Growth", range: "11-25 units", note: "TZS 35,000 / month" },
  { key: "professional", label: "Professional", range: "26-50 units", note: "TZS 50,000 / month" },
  { key: "enterprise", label: "Enterprise", range: "51+ units", note: "TZS 75,000 / month" },
];

function daysUntil(iso?: string): number {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function SubscriptionScreen() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState("");

  useEffect(() => {
    api.get<SubscriptionResponse>("/subscription").then((res) => {
      setSub(res.subscription);
      setPayments(res.payments || []);
    });
  }, []);

  async function handlePay() {
    if (!phone || phone.length < 10) {
      setPayError("Enter a valid phone number (e.g. 255712345678)");
      return;
    }
    setPaying(true);
    setPayError("");
    setPaySuccess("");
    try {
      await api.post<SubscriptionPayment>("/subscription/pay", { phone_number: phone });
      setPaySuccess("Payment initiated! Check your phone for the M-Pesa/Airtel Money prompt.");
      const res = await api.get<SubscriptionResponse>("/subscription");
      setSub(res.subscription);
      setPayments(res.payments || []);
    } catch (err: any) {
      setPayError(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Subscription</Text>
      <Text style={styles.subtitle}>
        Listings stay free forever. The management suite is priced per unit, per month.
      </Text>

      {/* Status Banner */}
      {sub && <StatusBanner sub={sub} />}

      {/* Current Plan */}
      {sub && (
        <View style={styles.currentPlan}>
          <View>
            <Text style={styles.planLabel}>Current plan</Text>
            <Text style={styles.planValue}>
              {sub.tier} · {sub.unit_count} units
            </Text>
            {sub.current_period_end && sub.status === "active" && (
              <Text style={styles.periodText}>
                Billing period ends {formatDate(sub.current_period_end)}
              </Text>
            )}
          </View>
          <Text style={styles.planPrice}>
            {formatTZS(sub.price_tzs)}
            <Text style={styles.planPeriod}>/mo</Text>
          </Text>
        </View>
      )}

      {/* Payment Form */}
      {sub && sub.price_tzs > 0 && sub.status !== "active" && (
        <View style={styles.payCard}>
          <Text style={styles.payTitle}>Make a Payment</Text>
          <Text style={styles.payDesc}>
            Pay via M-Pesa or Airtel Money. You will receive a push notification on your phone.
          </Text>
          <View style={styles.payRow}>
            <View style={styles.inputWrap}>
              <Feather name="phone" size={16} color={colors.ink[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="255712345678"
                placeholderTextColor={colors.ink[300]}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <TouchableOpacity
              style={[styles.payButton, paying && styles.payButtonDisabled]}
              onPress={handlePay}
              disabled={paying}
            >
              {paying ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.payButtonText}>Pay {formatTZS(sub.price_tzs)}</Text>
              )}
            </TouchableOpacity>
          </View>
          {payError ? <Text style={styles.errorText}>{payError}</Text> : null}
          {paySuccess ? <Text style={styles.successText}>{paySuccess}</Text> : null}
        </View>
      )}

      {/* Tier Cards */}
      <View style={styles.tiersGrid}>
        {TIERS.map((t) => (
          <View key={t.key} style={[styles.tierCard, sub?.tier === t.key && styles.tierCardActive]}>
            <Text style={styles.tierRange}>{t.range}</Text>
            <Text style={styles.tierLabel}>{t.label}</Text>
            <Text style={styles.tierNote}>{t.note}</Text>
            {sub?.tier === t.key && (
              <View style={styles.currentBadge}>
                <Feather name="check-circle" size={14} color={colors.brand[600]} />
                <Text style={styles.currentBadgeText}>Your current tier</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Payment History */}
      {payments.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Payment History</Text>
          {payments.map((p) => (
            <View key={p.id} style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyDate}>{formatDate(p.created_at)}</Text>
                <Text style={styles.historyPhone}>{p.phone_number}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.historyAmount}>{formatTZS(p.amount)}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    p.status === "completed"
                      ? styles.statusCompleted
                      : p.status === "pending"
                        ? styles.statusPending
                        : styles.statusFailed,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      p.status === "completed"
                        ? styles.statusTextCompleted
                        : p.status === "pending"
                          ? styles.statusTextPending
                          : styles.statusTextFailed,
                    ]}
                  >
                    {p.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.footnote}>Your tier updates automatically as you add units.</Text>
    </ScrollView>
  );
}

function StatusBanner({ sub }: { sub: Subscription }) {
  if (sub.status === "trial") {
    const days = daysUntil(sub.trial_ends_at);
    return (
      <View style={[styles.banner, styles.bannerTrial]}>
        <Feather name="clock" size={18} color="#1d4ed8" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.bannerTitle, { color: "#1e3a5f" }]}>Free trial</Text>
          <Text style={[styles.bannerText, { color: "#1d4ed8" }]}>
            {days} day{days !== 1 ? "s" : ""} remaining in your free trial.
          </Text>
        </View>
      </View>
    );
  }

  if (sub.status === "grace") {
    const days = daysUntil(sub.grace_ends_at);
    return (
      <View style={[styles.banner, styles.bannerGrace]}>
        <Feather name="alert-triangle" size={18} color="#ca8a04" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.bannerTitle, { color: "#713f12" }]}>Grace period</Text>
          <Text style={[styles.bannerText, { color: "#a16207" }]}>
            Subscription expired. {days} day{days !== 1 ? "s" : ""} left before restriction. Pay
            now.
          </Text>
        </View>
      </View>
    );
  }

  if (sub.status === "expired") {
    return (
      <View style={[styles.banner, styles.bannerExpired]}>
        <Feather name="x-circle" size={18} color="#dc2626" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.bannerTitle, { color: "#7f1d1d" }]}>Subscription expired</Text>
          <Text style={[styles.bannerText, { color: "#b91c1c" }]}>
            Management features restricted and listings hidden. Pay to reactivate.
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSunken },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink[900], marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.ink[500], marginBottom: 16 },

  // Status banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  bannerTrial: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  bannerGrace: { backgroundColor: "#fefce8", borderColor: "#fde68a" },
  bannerExpired: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  bannerTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  bannerText: { fontSize: 13 },

  // Current plan
  currentPlan: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 16,
  },
  planLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.ink[400],
  },
  planValue: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink[900],
    marginTop: 2,
    textTransform: "capitalize",
  },
  planPrice: { fontSize: 22, fontWeight: "600", color: colors.brand[700] },
  planPeriod: { fontSize: 13, fontWeight: "400", color: colors.ink[400] },
  periodText: { fontSize: 13, color: colors.ink[500], marginTop: 4 },

  // Payment form
  payCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 16,
  },
  payTitle: { fontSize: 17, fontWeight: "600", color: colors.ink[900], marginBottom: 6 },
  payDesc: { fontSize: 13, color: colors.ink[500], marginBottom: 14 },
  payRow: { flexDirection: "row", gap: 10 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: colors.ink[900], paddingVertical: 10 },
  payButton: {
    backgroundColor: colors.brand[600],
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  payButtonDisabled: { opacity: 0.5 },
  payButtonText: { fontSize: 14, fontWeight: "600", color: colors.white },
  errorText: { fontSize: 13, color: colors.red[600], marginTop: 8 },
  successText: { fontSize: 13, color: colors.green[600], marginTop: 8 },

  // Tiers
  tiersGrid: { gap: 10, marginBottom: 16 },
  tierCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tierCardActive: { borderColor: colors.brand[500], borderWidth: 2 },
  tierRange: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.ink[400],
  },
  tierLabel: { fontSize: 17, fontWeight: "600", color: colors.ink[900], marginTop: 4 },
  tierNote: { fontSize: 13, color: colors.ink[500], marginTop: 6 },
  currentBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  currentBadgeText: { fontSize: 12, fontWeight: "600", color: colors.brand[600] },

  // Payment history
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 16,
    marginBottom: 16,
  },
  historyTitle: { fontSize: 17, fontWeight: "600", color: colors.ink[900], marginBottom: 12 },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.ink[50],
  },
  historyDate: { fontSize: 14, color: colors.ink[700] },
  historyPhone: { fontSize: 12, color: colors.ink[500], marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: "600", color: colors.ink[900] },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  statusCompleted: { backgroundColor: "#f0fdf4" },
  statusPending: { backgroundColor: "#fefce8" },
  statusFailed: { backgroundColor: "#fef2f2" },
  statusText: { fontSize: 11, fontWeight: "600" },
  statusTextCompleted: { color: "#15803d" },
  statusTextPending: { color: "#a16207" },
  statusTextFailed: { color: "#b91c1c" },

  footnote: { fontSize: 12, color: colors.ink[400], marginTop: 4, textAlign: "center" },
});

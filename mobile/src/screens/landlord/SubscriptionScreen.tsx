import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { api } from "../../lib/api";
import type { Subscription } from "../../lib/types";
import { formatTZS } from "../../lib/format";
import { colors } from "../../theme/colors";

const TIERS = [
  { key: "free", label: "Free", range: "1 unit", note: "Seed adoption with your first unit" },
  { key: "starter", label: "Starter", range: "1-5 units", note: "TZS 10,000 / unit / month" },
  { key: "growth", label: "Growth", range: "6-20 units", note: "TZS 8,000 / unit / month" },
  { key: "scale", label: "Scale", range: "21+ units", note: "TZS 6,000 / unit / month" },
];

export function SubscriptionScreen() {
  const [sub, setSub] = useState<Subscription | null>(null);

  useEffect(() => {
    api.get<Subscription>("/subscription").then(setSub);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Subscription</Text>
      <Text style={styles.subtitle}>
        Listings stay free forever. The management suite is priced per unit, per month.
      </Text>

      {sub && (
        <View style={styles.currentPlan}>
          <View>
            <Text style={styles.planLabel}>Current plan</Text>
            <Text style={styles.planValue}>{sub.tier} · {sub.unit_count} units</Text>
          </View>
          <Text style={styles.planPrice}>
            {formatTZS(sub.price_tzs)}
            <Text style={styles.planPeriod}>/mo</Text>
          </Text>
        </View>
      )}

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

      <Text style={styles.footnote}>
        Your tier updates automatically as you add units. Billing integration is out of scope for this prototype.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSunken },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink[900], marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.ink[500], marginBottom: 16 },
  currentPlan: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.white, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 20,
  },
  planLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.ink[400] },
  planValue: { fontSize: 18, fontWeight: "600", color: colors.ink[900], marginTop: 2, textTransform: "capitalize" },
  planPrice: { fontSize: 22, fontWeight: "600", color: colors.brand[700] },
  planPeriod: { fontSize: 13, fontWeight: "400", color: colors.ink[400] },
  tiersGrid: { gap: 10 },
  tierCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  tierCardActive: { borderColor: colors.brand[500], borderWidth: 2 },
  tierRange: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.ink[400] },
  tierLabel: { fontSize: 17, fontWeight: "600", color: colors.ink[900], marginTop: 4 },
  tierNote: { fontSize: 13, color: colors.ink[500], marginTop: 6 },
  currentBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  currentBadgeText: { fontSize: 12, fontWeight: "600", color: colors.brand[600] },
  footnote: { fontSize: 12, color: colors.ink[400], marginTop: 16, textAlign: "center" },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Payment } from "../lib/types";
import { formatTZS, formatDateTime } from "../lib/format";
import { colors } from "../theme/colors";

export function PaymentHistoryList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <Text style={styles.empty}>No payments recorded yet.</Text>;
  }

  return (
    <View>
      {payments.map((p) => (
        <View key={p.id} style={styles.row}>
          <View style={[styles.iconBox, p.method === "mpesa" ? styles.mpesaIcon : styles.cashIcon]}>
            <Feather
              name={p.method === "mpesa" ? "check-circle" : "dollar-sign"}
              size={16}
              color={p.method === "mpesa" ? colors.brand[600] : colors.ink[500]}
            />
          </View>
          <View style={styles.details}>
            <Text style={styles.amountText}>
              {formatTZS(p.amount)} via {p.method.toUpperCase()}
            </Text>
            <Text style={styles.meta}>
              {p.mpesa_receipt ? `Receipt ${p.mpesa_receipt} · ` : ""}
              {p.paid_at ? formatDateTime(p.paid_at) : "Pending"}
            </Text>
          </View>
          <Text style={styles.status}>{p.status}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 14,
    color: colors.ink[400],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  mpesaIcon: {
    backgroundColor: colors.brand[50],
  },
  cashIcon: {
    backgroundColor: colors.ink[100],
  },
  details: {
    flex: 1,
  },
  amountText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.ink[800],
  },
  meta: {
    fontSize: 12,
    color: colors.ink[400],
    marginTop: 2,
  },
  status: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    color: colors.ink[400],
  },
});

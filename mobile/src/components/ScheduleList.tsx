import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { PaymentSchedule } from "../lib/types";
import { formatTZS, formatDate } from "../lib/format";
import { colors } from "../theme/colors";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: colors.ink[100], text: colors.ink[600] },
  paid: { bg: colors.brand[50], text: colors.brand[700] },
  partial: { bg: colors.sun[50], text: colors.sun[700] },
  overdue: { bg: colors.red[50], text: colors.red[700] },
};

export function ScheduleList({
  schedules,
  onPay,
}: {
  schedules: PaymentSchedule[];
  onPay?: (schedule: PaymentSchedule) => void;
}) {
  if (schedules.length === 0) {
    return <Text style={styles.empty}>No schedule generated yet.</Text>;
  }

  return (
    <View>
      {schedules.map((s) => {
        const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS.pending;
        return (
          <View key={s.id} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.period}>
                {formatDate(s.period_start)} - {formatDate(s.period_end)}
              </Text>
              <Text style={styles.due}>Due: {formatDate(s.due_date)}</Text>
              <Text style={styles.amount}>{formatTZS(s.amount_due)}</Text>
            </View>
            <View style={styles.rowRight}>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.statusText, { color: sc.text }]}>{s.status}</Text>
              </View>
              {onPay && s.status !== "paid" && (
                <TouchableOpacity onPress={() => onPay(s)}>
                  <Text style={styles.payBtn}>Pay now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  rowLeft: {
    flex: 1,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  period: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.ink[700],
  },
  due: {
    fontSize: 12,
    color: colors.ink[500],
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink[800],
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  payBtn: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.brand[600],
  },
});

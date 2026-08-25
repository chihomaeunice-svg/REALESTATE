import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Dimensions, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BarChart } from "react-native-chart-kit";
import { api } from "../../lib/api";
import type { BuildingIncome, PaymentSchedule } from "../../lib/types";
import { formatTZS, formatDate } from "../../lib/format";
import { colors } from "../../theme/colors";

const screenWidth = Dimensions.get("window").width - 64;

export function ReportsScreen() {
  const [byBuilding, setByBuilding] = useState<BuildingIncome[]>([]);
  const [arrears, setArrears] = useState<PaymentSchedule[]>([]);

  useEffect(() => {
    api.get<BuildingIncome[]>("/reports/by-building").then(setByBuilding);
    api.get<PaymentSchedule[]>("/arrears").then(setArrears);
  }, []);

  const chartLabels = byBuilding.map((b) =>
    b.property_name.length > 10 ? b.property_name.slice(0, 8) + "..." : b.property_name
  );
  const collectedData = byBuilding.map((b) => b.collected);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reports & arrears</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Income by building</Text>
        {byBuilding.length === 0 ? (
          <Text style={styles.emptyText}>No data yet.</Text>
        ) : (
          <BarChart
            data={{
              labels: chartLabels,
              datasets: [{ data: collectedData.length > 0 ? collectedData : [0] }],
            }}
            width={screenWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero
            chartConfig={{
              backgroundColor: colors.white,
              backgroundGradientFrom: colors.white,
              backgroundGradientTo: colors.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(34, 104, 90, ${opacity})`,
              labelColor: () => colors.ink[500],
              barPercentage: 0.6,
              propsForLabels: { fontSize: 10 },
            }}
            style={styles.chart}
          />
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.arrearsHeader}>
          <Feather name="alert-triangle" size={18} color={colors.sun[600]} />
          <Text style={styles.cardTitle}>Tenants in arrears</Text>
        </View>
        {arrears.length === 0 ? (
          <Text style={styles.emptyText}>No overdue rent right now.</Text>
        ) : (
          arrears.map((a) => (
            <View key={a.id} style={styles.arrearRow}>
              <View style={styles.arrearLeft}>
                <Text style={styles.arrearName}>{a.tenant_name} · {a.tenant_phone}</Text>
                <Text style={styles.arrearMeta}>{a.property_title} ({a.unit_label})</Text>
              </View>
              <View style={styles.arrearRight}>
                <Text style={styles.arrearDate}>{formatDate(a.due_date)}</Text>
                <Text style={styles.arrearAmount}>{formatTZS(a.amount_due)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSunken },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink[900], marginBottom: 16 },
  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: "600", color: colors.ink[900], marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.ink[400] },
  chart: { borderRadius: 12 },
  arrearsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  arrearRow: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.ink[100],
  },
  arrearLeft: { flex: 1 },
  arrearRight: { alignItems: "flex-end" },
  arrearName: { fontSize: 14, fontWeight: "500", color: colors.ink[800] },
  arrearMeta: { fontSize: 13, color: colors.ink[500], marginTop: 2 },
  arrearDate: { fontSize: 12, color: colors.red[600] },
  arrearAmount: { fontSize: 14, fontWeight: "600", color: colors.ink[800], marginTop: 2 },
});

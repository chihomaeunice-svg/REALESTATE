import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { api } from "../../lib/api";
import type { IncomeSummary, Inquiry, MaintenanceRequest } from "../../lib/types";
import { StatTile } from "../../components/StatTile";
import { formatTZS, formatDate } from "../../lib/format";
import { colors } from "../../theme/colors";

export function OverviewScreen() {
  const navigation = useNavigation<any>();
  const [summary, setSummary] = useState<IncomeSummary | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [maintRequests, setMaintRequests] = useState<MaintenanceRequest[]>([]);

  function loadMaintRequests() {
    api.get<MaintenanceRequest[]>("/maintenance-requests").then(setMaintRequests).catch(() => {});
  }
  useEffect(() => {
    api.get<IncomeSummary>("/reports/summary").then(setSummary);
    api.get<Inquiry[]>("/inquiries").then((data) => setInquiries(data.slice(0, 6)));
    loadMaintRequests();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Overview</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("Properties")}
        >
          <Text style={styles.addBtnText}>Add property</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.statsGrid}>
          <StatTile
            label="Units (occ/total)"
            value={`${summary.occupied_units} / ${summary.total_units}`}
            icon="home"
          />
          <StatTile label="Active leases" value={String(summary.active_leases)} icon="users" />
          <StatTile label="Collected YTD" value={formatTZS(summary.collected_ytd)} icon="credit-card" />
          <StatTile
            label="Overdue"
            value={`${formatTZS(summary.overdue_amount)} (${summary.overdue_count})`}
            icon="alert-triangle"
            tone={summary.overdue_count > 0 ? "warning" : "default"}
          />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent inquiries</Text>
        {inquiries.length === 0 ? (
          <Text style={styles.emptyText}>No inquiries yet. Once your listings go live, seeker messages appear here.</Text>
        ) : (
          inquiries.map((inq) => (
            <View key={inq.id} style={styles.inquiryRow}>
              <View style={styles.inquiryLeft}>
                <Text style={styles.inquiryName}>{inq.seeker_name} · {inq.seeker_phone}</Text>
                <Text style={styles.inquiryListing}>{inq.listing_title}</Text>
              </View>
              <Text style={styles.inquiryDate}>{formatDate(inq.created_at)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Feather name="tool" size={18} color={colors.ink[400]} />
          <Text style={styles.cardTitle}>Maintenance requests</Text>
        </View>
        {maintRequests.length === 0 ? (
          <Text style={styles.emptyText}>No maintenance requests. When tenants report issues, they will appear here.</Text>
        ) : (
          maintRequests.map((mr) => (
            <View key={mr.id} style={styles.inquiryRow}>
              <View style={styles.inquiryLeft}>
                <Text style={styles.inquiryName}>{mr.title}</Text>
                <Text style={styles.inquiryListing}>{mr.tenant_name} · {mr.unit_label} · {mr.property_title}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
                  backgroundColor: mr.status === "open" ? colors.sun[50] : mr.status === "in_progress" ? colors.brand[50] : mr.status === "completed" ? "#DCFCE7" : colors.ink[100],
                }}>
                  <Text style={{
                    fontSize: 11, fontWeight: "600",
                    color: mr.status === "open" ? colors.sun[700] : mr.status === "in_progress" ? colors.brand[700] : mr.status === "completed" ? "#15803D" : colors.ink[500],
                  }}>{mr.status.replace("_", " ")}</Text>
                </View>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
                  backgroundColor: mr.priority === "urgent" || mr.priority === "high" ? "#FEF2F2" : colors.ink[100],
                }}>
                  <Text style={{
                    fontSize: 11, fontWeight: "600",
                    color: mr.priority === "urgent" || mr.priority === "high" ? "#B91C1C" : colors.ink[500],
                  }}>{mr.priority}</Text>
                </View>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink[900] },
  addBtn: {
    backgroundColor: colors.brand[600],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: colors.white, fontSize: 13, fontWeight: "600" },
  statsGrid: { gap: 10 },
  card: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardTitle: { fontSize: 17, fontWeight: "600", color: colors.ink[900], marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.ink[400] },
  inquiryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  inquiryLeft: { flex: 1 },
  inquiryName: { fontSize: 14, fontWeight: "500", color: colors.ink[800] },
  inquiryListing: { fontSize: 13, color: colors.ink[400], marginTop: 2 },
  inquiryDate: { fontSize: 12, color: colors.ink[400] },
});

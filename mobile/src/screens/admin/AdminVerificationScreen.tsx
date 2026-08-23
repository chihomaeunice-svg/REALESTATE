import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { api } from "../../lib/api";
import type { User, Property } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { colors } from "../../theme/colors";

export function AdminVerificationScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  function load() {
    api.get<User[]>("/admin/pending-users").then(setUsers);
    api.get<Property[]>("/admin/pending-properties").then(setProperties);
  }
  useEffect(load, []);

  async function decideUser(id: string, approve: boolean) {
    await api.post(`/admin/users/${id}/decide`, { approve });
    load();
  }

  async function decideProperty(id: string, approve: boolean) {
    await api.post(`/admin/properties/${id}/decide`, { approve });
    load();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Feather name="shield" size={22} color={colors.brand[600]} />
        <Text style={styles.title}>Verification queue</Text>
      </View>
      <Text style={styles.subtitle}>
        Manual review of identity documents and property submissions.
      </Text>

      {/* Users section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Landlords & agents awaiting ID verification</Text>
        {users.length === 0 ? (
          <Text style={styles.emptyText}>Nothing pending.</Text>
        ) : (
          users.map((u) => (
            <View key={u.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowName}>{u.full_name} · {u.phone}</Text>
                <Text style={styles.rowMeta}>
                  NIDA: {u.nida_number ?? "—"} · License: {u.business_license ?? "—"} · {formatDate(u.created_at)}
                </Text>
              </View>
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => decideUser(u.id, true)}>
                  <Feather name="check" size={14} color={colors.white} />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => decideUser(u.id, false)}>
                  <Feather name="x" size={14} color={colors.ink[700]} />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Properties section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Properties awaiting review</Text>
        {properties.length === 0 ? (
          <Text style={styles.emptyText}>Nothing pending.</Text>
        ) : (
          properties.map((p) => (
            <View key={p.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowName}>{p.title}</Text>
                <Text style={styles.rowMeta}>
                  {p.ward}, {p.district} · {p.property_type} · {formatDate(p.created_at)}
                </Text>
              </View>
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => decideProperty(p.id, true)}>
                  <Feather name="check" size={14} color={colors.white} />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => decideProperty(p.id, false)}>
                  <Feather name="x" size={14} color={colors.ink[700]} />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
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
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink[900] },
  subtitle: { fontSize: 14, color: colors.ink[500], marginBottom: 16, lineHeight: 20 },
  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: "600", color: colors.ink[900], marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.ink[400] },
  row: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.ink[100],
  },
  rowLeft: { marginBottom: 8 },
  rowName: { fontSize: 14, fontWeight: "500", color: colors.ink[800] },
  rowMeta: { fontSize: 12, color: colors.ink[400], marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 8 },
  approveBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.brand[600], borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  approveBtnText: { color: colors.white, fontSize: 12, fontWeight: "600" },
  rejectBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: colors.ink[200], borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white,
  },
  rejectBtnText: { color: colors.ink[700], fontSize: 12, fontWeight: "600" },
});

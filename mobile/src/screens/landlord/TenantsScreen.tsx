import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { api } from "../../lib/api";
import type { Tenant } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { colors } from "../../theme/colors";

export function TenantsScreen() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    api.get<Tenant[]>("/tenants").then(setTenants);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tenants</Text>
      {tenants.length === 0 ? (
        <Text style={styles.emptyText}>No tenants yet — they're created automatically when you draft a lease.</Text>
      ) : (
        tenants.map((t) => (
          <View key={t.id} style={styles.card}>
            <View style={styles.cardRow}>
              <Feather name="users" size={16} color={colors.ink[300]} />
              <View style={styles.cardInfo}>
                <Text style={styles.name}>{t.full_name}</Text>
                <Text style={styles.meta}>{t.phone}</Text>
                <Text style={styles.meta}>NIDA: {t.nida_number ?? "—"} · Since {formatDate(t.created_at)}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSunken },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink[900], marginBottom: 16 },
  emptyText: { fontSize: 14, color: colors.ink[400] },
  card: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 8,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: colors.ink[800] },
  meta: { fontSize: 13, color: colors.ink[500], marginTop: 2 },
});

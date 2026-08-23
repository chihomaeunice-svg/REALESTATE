import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { api, ApiError } from "../../lib/api";
import type { Lease, Tenant } from "../../lib/types";
import { formatTZS, formatDate } from "../../lib/format";
import { colors } from "../../theme/colors";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: colors.ink[100], text: colors.ink[600] },
  active: { bg: colors.brand[50], text: colors.brand[700] },
  terminated: { bg: colors.red[50], text: colors.red[700] },
  expired: { bg: colors.ink[100], text: colors.ink[500] },
};

export function LeasesScreen() {
  const navigation = useNavigation<any>();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [showForm, setShowForm] = useState(false);

  function load() {
    api.get<Lease[]>("/leases").then(setLeases);
  }
  useEffect(load, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Leases & rent</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Feather name="plus" size={14} color={colors.white} />
          <Text style={styles.addBtnText}>New lease</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <NewLeaseForm onDone={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />
      )}

      {leases.length === 0 ? (
        <Text style={styles.emptyText}>No leases yet. Create one once you've placed a tenant.</Text>
      ) : (
        leases.map((l) => {
          const sc = STATUS_COLORS[l.status] ?? STATUS_COLORS.draft;
          return (
            <TouchableOpacity
              key={l.id}
              style={styles.leaseCard}
              onPress={() => navigation.navigate("LeaseDetail", { id: l.id })}
            >
              <View style={styles.leaseLeft}>
                <Text style={styles.leaseName}>{l.tenant_name} · {l.property_title} ({l.unit_label})</Text>
                <Text style={styles.leaseMeta}>
                  {formatTZS(l.rent_amount)}/mo · {formatDate(l.start_date)} - {formatDate(l.end_date)}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.statusText, { color: sc.text }]}>{l.status}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

function NewLeaseForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [units, setUnits] = useState<{ id: string; unit_label: string; property_title: string; rent_amount: number; status: string }[]>([]);
  const [form, setForm] = useState({
    unit_id: "", tenant_full_name: "", tenant_phone: "",
    language: "sw", start_date: new Date().toISOString().slice(0, 10),
    rent_amount: 0, advance_months: 6, deposit_amount: 0, term_months: 12,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lookupState, setLookupState] = useState<"idle" | "found" | "not-found">("idle");
  const [foundProfile, setFoundProfile] = useState<Tenant | null>(null);

  useEffect(() => {
    api.get<typeof units>("/units").then((all) => setUnits(all.filter((u) => u.status === "vacant")));
  }, []);

  function selectUnit(unitId: string) {
    const unit = units.find((u) => u.id === unitId);
    setForm((f) => ({ ...f, unit_id: unitId, rent_amount: unit?.rent_amount ?? 0, deposit_amount: unit?.rent_amount ?? 0 }));
  }

  async function lookupTenant() {
    if (!form.tenant_phone) return;
    try {
      const tenant = await api.get<Tenant>(`/tenants/lookup?phone=${encodeURIComponent(form.tenant_phone)}`);
      setFoundProfile(tenant);
      setForm((f) => ({ ...f, tenant_full_name: tenant.full_name }));
      setLookupState("found");
    } catch (err) {
      setFoundProfile(null);
      setLookupState(err instanceof ApiError && err.status === 404 ? "not-found" : "idle");
    }
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      await api.post("/leases", {
        unit_id: form.unit_id,
        tenant: { full_name: form.tenant_full_name, phone: form.tenant_phone },
        language: form.language,
        start_date: form.start_date,
        rent_amount: form.rent_amount,
        advance_months: form.advance_months,
        deposit_amount: form.deposit_amount,
        term_months: form.term_months,
      });
      onDone();
    } catch {
      setError("Could not create lease. Check the unit and tenant details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>New lease</Text>

      <Text style={styles.label}>Vacant unit</Text>
      {units.length === 0 ? (
        <Text style={styles.noteText}>No vacant units. Add a property/unit first.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {units.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={[styles.unitChip, form.unit_id === u.id && styles.unitChipActive]}
              onPress={() => selectUnit(u.id)}
            >
              <Text style={[styles.unitChipText, form.unit_id === u.id && styles.unitChipTextActive]}>
                {u.property_title} — {u.unit_label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.formField}>
        <Text style={styles.label}>Tenant full name</Text>
        <TextInput style={styles.input} value={form.tenant_full_name} onChangeText={(v) => setForm({ ...form, tenant_full_name: v })} />
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>Tenant phone</Text>
        <View style={styles.phoneRow}>
          <TextInput style={[styles.input, { flex: 1 }]} value={form.tenant_phone}
            onChangeText={(v) => { setForm({ ...form, tenant_phone: v }); setLookupState("idle"); }}
            onBlur={lookupTenant} placeholder="+255..." keyboardType="phone-pad" />
          <TouchableOpacity style={styles.lookupBtn} onPress={lookupTenant}>
            <Feather name="search" size={16} color={colors.brand[600]} />
          </TouchableOpacity>
        </View>
        {lookupState === "found" && foundProfile && (
          <View style={styles.foundRow}>
            <Feather name="check-circle" size={14} color={colors.brand[600]} />
            <Text style={styles.foundText}>Profile found — {foundProfile.full_name}</Text>
          </View>
        )}
        {lookupState === "not-found" && (
          <Text style={styles.noteText}>No profile yet — fill in their details.</Text>
        )}
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formField, { flex: 1 }]}>
          <Text style={styles.label}>Monthly rent (TZS)</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={form.rent_amount ? String(form.rent_amount) : ""} onChangeText={(v) => setForm({ ...form, rent_amount: Number(v) })} />
        </View>
        <View style={[styles.formField, { flex: 1 }]}>
          <Text style={styles.label}>Deposit (TZS)</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={form.deposit_amount ? String(form.deposit_amount) : ""} onChangeText={(v) => setForm({ ...form, deposit_amount: Number(v) })} />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formField, { flex: 1 }]}>
          <Text style={styles.label}>Advance (months)</Text>
          <View style={styles.advanceRow}>
            {[1, 3, 6, 12].map((n) => (
              <TouchableOpacity key={n} style={[styles.unitChip, form.advance_months === n && styles.unitChipActive]} onPress={() => setForm({ ...form, advance_months: n })}>
                <Text style={[styles.unitChipText, form.advance_months === n && styles.unitChipTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[styles.formField, { flex: 1 }]}>
          <Text style={styles.label}>Term (months)</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={String(form.term_months)} onChangeText={(v) => setForm({ ...form, term_months: Number(v) })} />
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.submitBtn, { flex: 1 }, submitting && styles.disabledBtn]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitBtnText}>{submitting ? "Creating..." : "Create lease"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSunken },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink[900] },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brand[600], paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: colors.white, fontSize: 13, fontWeight: "600" },
  emptyText: { fontSize: 14, color: colors.ink[400] },
  leaseCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.white, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 8,
  },
  leaseLeft: { flex: 1 },
  leaseName: { fontSize: 14, fontWeight: "600", color: colors.ink[900] },
  leaseMeta: { fontSize: 13, color: colors.ink[500], marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "600" },
  formCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.surfaceBorder },
  formTitle: { fontSize: 16, fontWeight: "600", color: colors.ink[900], marginBottom: 12 },
  formField: { marginBottom: 10 },
  formRow: { flexDirection: "row", gap: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink[700], marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.ink[200], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink[900], backgroundColor: colors.white },
  phoneRow: { flexDirection: "row", gap: 6 },
  lookupBtn: { borderWidth: 1, borderColor: colors.ink[200], borderRadius: 10, paddingHorizontal: 12, justifyContent: "center", backgroundColor: colors.white },
  foundRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  foundText: { fontSize: 12, fontWeight: "500", color: colors.brand[700] },
  noteText: { fontSize: 12, color: colors.ink[400], marginTop: 4 },
  unitChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.ink[200], backgroundColor: colors.white, marginRight: 6 },
  unitChipActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  unitChipText: { fontSize: 13, color: colors.ink[600] },
  unitChipTextActive: { color: colors.brand[700], fontWeight: "500" },
  advanceRow: { flexDirection: "row", gap: 6 },
  errorText: { fontSize: 13, color: colors.red[600], marginVertical: 4 },
  submitBtn: { backgroundColor: colors.brand[600], borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  submitBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  disabledBtn: { opacity: 0.5 },
  cancelBtn: { borderWidth: 1, borderColor: colors.ink[200], borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", backgroundColor: colors.white },
  cancelBtnText: { color: colors.ink[700], fontSize: 14, fontWeight: "600" },
  btnRow: { flexDirection: "row", gap: 8, marginTop: 4 },
});

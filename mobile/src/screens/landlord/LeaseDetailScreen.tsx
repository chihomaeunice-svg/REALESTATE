import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Linking,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { api } from "../../lib/api";
import type { Lease, PaymentSchedule, Payment } from "../../lib/types";
import { formatTZS, formatDate, formatDateTime } from "../../lib/format";
import { ScheduleList } from "../../components/ScheduleList";
import { PaymentHistoryList } from "../../components/PaymentHistoryList";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { colors } from "../../theme/colors";

export function LeaseDetailScreen({ route }: { route: any }) {
  const { id } = route.params;
  const [lease, setLease] = useState<Lease | null>(null);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [logging, setLogging] = useState<PaymentSchedule | null>(null);

  function load() {
    if (!id) return;
    api.get<Lease[]>("/leases").then((all) => setLease(all.find((l) => l.id === id) ?? null));
    api.get<PaymentSchedule[]>(`/leases/${id}/schedules`).then(setSchedules);
    api.get<Payment[]>(`/leases/${id}/payments`).then(setPayments);
  }
  useEffect(load, [id]);

  if (!lease) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Text style={styles.tenantName}>{lease.tenant_name}</Text>
        <Text style={styles.headerMeta}>{lease.property_title} · {lease.unit_label}</Text>
      </View>

      <TouchableOpacity
        style={styles.docBtn}
        onPress={() => Linking.openURL(`https://api.nyumbayangu.online/api/leases/${lease.id}/document`)}
      >
        <Feather name="file-text" size={16} color={colors.brand[600]} />
        <Text style={styles.docBtnText}>View lease document</Text>
      </TouchableOpacity>

      {/* Facts */}
      <View style={styles.factsGrid}>
        <Fact label="Rent" value={`${formatTZS(lease.rent_amount)}/mo`} />
        <Fact label="Advance block" value={`${lease.advance_months} months`} />
        <Fact label="Term" value={`${formatDate(lease.start_date)} - ${formatDate(lease.end_date)}`} />
        <Fact label="Status" value={lease.status} />
      </View>

      {/* Signature status */}
      <View style={[styles.signatureBox, lease.tenant_signed_at ? styles.signedBox : styles.unsignedBox]}>
        {lease.tenant_signed_at ? (
          <Text style={styles.signedText}>
            Signed by {lease.tenant_signature_name} on {formatDateTime(lease.tenant_signed_at)}
          </Text>
        ) : (
          <Text style={styles.unsignedText}>
            Awaiting tenant e-signature. Ask them to log in and sign from their portal.
          </Text>
        )}
      </View>

      {/* Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment schedule</Text>
        <ScheduleList schedules={schedules} onPay={(s) => setLogging(s)} />
      </View>

      {/* Payment history */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment history</Text>
        <PaymentHistoryList payments={payments} />
      </View>

      {/* Log payment modal */}
      {logging && (
        <LogPaymentModal
          leaseId={lease.id}
          schedule={logging}
          onClose={() => setLogging(null)}
          onDone={() => { setLogging(null); load(); }}
        />
      )}
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function LogPaymentModal({
  leaseId,
  schedule,
  onClose,
  onDone,
}: {
  leaseId: string;
  schedule: PaymentSchedule;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(String(schedule.amount_due));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/payments/manual", { lease_id: leaseId, schedule_id: schedule.id, amount: Number(amount) });
      onDone();
    } catch {
      setError("Could not log payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Feather name="dollar-sign" size={20} color={colors.brand[600]} />
            <Text style={styles.modalTitle}>Log cash/bank payment</Text>
          </View>
          <Text style={styles.modalSubtext}>
            Period {formatDate(schedule.period_start)} - {formatDate(schedule.period_end)}
          </Text>
          <View style={styles.formField}>
            <Text style={styles.label}>Amount received (TZS)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={amount} onChangeText={setAmount} />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.modalBtns}>
            <TouchableOpacity style={[styles.submitBtn, { flex: 1 }, submitting && styles.disabledBtn]} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitBtnText}>{submitting ? "Logging..." : "Log payment"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSunken },
  content: { padding: 16, paddingBottom: 32 },
  headerSection: { marginBottom: 12 },
  tenantName: { fontSize: 22, fontWeight: "600", color: colors.ink[900] },
  headerMeta: { fontSize: 14, color: colors.ink[500], marginTop: 4 },
  docBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start",
    borderWidth: 1, borderColor: colors.ink[200], borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.white, marginBottom: 16,
  },
  docBtnText: { fontSize: 14, fontWeight: "600", color: colors.brand[600] },
  factsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  fact: {
    flex: 1, minWidth: "45%", backgroundColor: colors.white, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  factLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.ink[400] },
  factValue: { fontSize: 14, fontWeight: "600", color: colors.ink[900], marginTop: 4 },
  signatureBox: { borderRadius: 12, padding: 14, marginBottom: 16 },
  signedBox: { backgroundColor: colors.brand[50] },
  unsignedBox: { backgroundColor: colors.sun[50] },
  signedText: { fontSize: 13, color: colors.brand[700] },
  unsignedText: { fontSize: 13, color: colors.sun[700] },
  section: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: colors.ink[900], marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: colors.white, borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  modalTitle: { fontSize: 17, fontWeight: "600", color: colors.ink[900] },
  modalSubtext: { fontSize: 13, color: colors.ink[500], marginBottom: 12 },
  modalBtns: { flexDirection: "row", gap: 8, marginTop: 8 },
  formField: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink[700], marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.ink[200], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink[900], backgroundColor: colors.white },
  errorText: { fontSize: 13, color: colors.red[600], marginVertical: 4 },
  submitBtn: { backgroundColor: colors.brand[600], borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  submitBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  disabledBtn: { opacity: 0.5 },
  cancelBtn: { borderWidth: 1, borderColor: colors.ink[200], borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", backgroundColor: colors.white },
  cancelBtnText: { color: colors.ink[700], fontSize: 14, fontWeight: "600" },
});

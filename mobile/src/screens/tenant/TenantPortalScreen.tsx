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
import { useNavigation } from "@react-navigation/native";
import { api } from "../../lib/api";
import type { Lease, PaymentSchedule, Payment, MaintenanceRequest } from "../../lib/types";
import { formatTZS, formatDate, formatDateTime } from "../../lib/format";
import { ScheduleList } from "../../components/ScheduleList";
import { PaymentHistoryList } from "../../components/PaymentHistoryList";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../lib/auth-context";
import { colors } from "../../theme/colors";

export function TenantPortalScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [activeLeaseId, setActiveLeaseId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paying, setPaying] = useState<PaymentSchedule | null>(null);
  const [signing, setSigning] = useState(false);
  const [signatureName, setSignatureName] = useState(user?.full_name ?? "");
  const [maintRequests, setMaintRequests] = useState<MaintenanceRequest[]>([]);
  const [showMaintForm, setShowMaintForm] = useState(false);

  function loadLeases() {
    api.get<Lease[]>("/tenant/leases").then((data) => {
      setLeases(data);
      if (data.length > 0 && !activeLeaseId) setActiveLeaseId(data[0].id);
    });
  }
  function loadMaintRequests() {
    api.get<MaintenanceRequest[]>("/tenant/maintenance-requests").then(setMaintRequests).catch(() => {});
  }
  useEffect(loadLeases, []);
  useEffect(loadMaintRequests, []);

  function loadDetail(leaseId: string) {
    api.get<PaymentSchedule[]>(`/leases/${leaseId}/schedules`).then(setSchedules);
    api.get<Payment[]>(`/leases/${leaseId}/payments`).then(setPayments);
  }
  useEffect(() => {
    if (activeLeaseId) loadDetail(activeLeaseId);
  }, [activeLeaseId]);

  const lease = leases.find((l) => l.id === activeLeaseId);

  async function handleSign() {
    if (!lease) return;
    setSigning(true);
    try {
      await api.post(`/leases/${lease.id}/sign`, { signature_name: signatureName });
      loadLeases();
    } finally {
      setSigning(false);
    }
  }

  if (leases.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="file-text"
          title="No lease yet"
          message="Once your landlord creates a lease for you using this phone number, it will show up here."
        />
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate("TenantProfile")}>
          <Feather name="user" size={16} color={colors.white} />
          <Text style={styles.profileBtnText}>Set up your profile now</Text>
        </TouchableOpacity>
        <Text style={styles.profileHint}>
          Landlords can find your details instantly when drafting a lease.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My rental</Text>
        <TouchableOpacity onPress={() => navigation.navigate("TenantProfile")} style={styles.profileLink}>
          <Feather name="user" size={14} color={colors.brand[600]} />
          <Text style={styles.profileLinkText}>My profile</Text>
        </TouchableOpacity>
      </View>

      {leases.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {leases.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[styles.leaseChip, activeLeaseId === l.id && styles.leaseChipActive]}
              onPress={() => setActiveLeaseId(l.id)}
            >
              <Text style={[styles.leaseChipText, activeLeaseId === l.id && styles.leaseChipTextActive]}>
                {l.property_title} — {l.unit_label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {lease && (
        <>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.propertyTitle}>{lease.property_title} · {lease.unit_label}</Text>
                <View style={styles.locationRow}>
                  <Feather name="map-pin" size={12} color={colors.ink[500]} />
                  <Text style={styles.locationText}>{lease.ward}, {lease.district}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.docBtn}
                onPress={() => Linking.openURL(`https://api.nyumbayangu.online/api/leases/${lease.id}/document`)}
              >
                <Feather name="file-text" size={14} color={colors.brand[600]} />
                <Text style={styles.docBtnText}>View doc</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.factsGrid}>
              <Fact label="Rent" value={`${formatTZS(lease.rent_amount)}/mo`} />
              <Fact label="Advance" value={`${lease.advance_months} months`} />
              <Fact label="Term" value={`${formatDate(lease.start_date)} - ${formatDate(lease.end_date)}`} />
              <Fact label="Status" value={lease.status} />
            </View>

            <View style={[styles.signBox, lease.tenant_signed_at ? styles.signedBox : styles.unsignedBox]}>
              {lease.tenant_signed_at ? (
                <Text style={styles.signedText}>
                  You signed this lease on {formatDateTime(lease.tenant_signed_at)}.
                </Text>
              ) : (
                <View>
                  <Text style={styles.unsignedText}>
                    Please review the lease document, then sign electronically:
                  </Text>
                  <View style={styles.signRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={signatureName}
                      onChangeText={setSignatureName}
                      placeholder="Type your full name"
                    />
                    <TouchableOpacity
                      style={[styles.signBtn, (signing || !signatureName) && styles.disabledBtn]}
                      onPress={handleSign}
                      disabled={signing || !signatureName}
                    >
                      <Text style={styles.signBtnText}>{signing ? "Signing..." : "Sign lease"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment schedule</Text>
            <ScheduleList schedules={schedules} onPay={(s) => setPaying(s)} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment history</Text>
            <PaymentHistoryList payments={payments} />
          </View>

          <View style={styles.section}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="tool" size={18} color={colors.ink[400]} />
                <Text style={styles.sectionTitle}>Maintenance requests</Text>
              </View>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.ink[200], borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.white }}
                onPress={() => setShowMaintForm(!showMaintForm)}
              >
                <Feather name="plus" size={12} color={colors.brand[600]} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.brand[600] }}>New request</Text>
              </TouchableOpacity>
            </View>

            {showMaintForm && (
              <MaintenanceForm
                unitId={lease.unit_id}
                onDone={() => { setShowMaintForm(false); loadMaintRequests(); }}
                onCancel={() => setShowMaintForm(false)}
              />
            )}

            {maintRequests.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.ink[400] }}>No maintenance requests yet.</Text>
            ) : (
              maintRequests.map((mr) => (
                <View key={mr.id} style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.ink[50], borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.ink[800] }}>{mr.title}</Text>
                    {mr.description ? <Text style={{ fontSize: 12, color: colors.ink[500], marginTop: 2 }}>{mr.description}</Text> : null}
                    <Text style={{ fontSize: 11, color: colors.ink[400], marginTop: 2 }}>{mr.unit_label} · {mr.property_title}</Text>
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
        </>
      )}

      {paying && lease && (
        <PayModal
          leaseId={lease.id}
          schedule={paying}
          userPhone={user?.phone ?? ""}
          onClose={() => setPaying(null)}
          onDone={() => { setPaying(null); loadDetail(lease.id); }}
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

function PayModal({
  leaseId,
  schedule,
  userPhone,
  onClose,
  onDone,
}: {
  leaseId: string;
  schedule: PaymentSchedule;
  userPhone: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [phone, setPhone] = useState(userPhone);
  const [stage, setStage] = useState<"form" | "pushing" | "done">("form");
  const [receipt, setReceipt] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    setStage("pushing");
    try {
      const res = await api.post<{ mpesa_receipt: string }>("/payments/mpesa/stk-push", {
        lease_id: leaseId,
        schedule_id: schedule.id,
        amount: schedule.amount_due,
        phone_number: phone,
      });
      setReceipt(res.mpesa_receipt);
      setStage("done");
    } catch {
      setError("Payment failed. Please try again.");
      setStage("form");
    }
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {stage === "done" ? (
            <View style={styles.doneBox}>
              <Text style={styles.doneEmoji}>Done</Text>
              <Text style={styles.doneTitle}>Payment confirmed</Text>
              <Text style={styles.doneReceipt}>M-Pesa receipt: {receipt}</Text>
              <Text style={styles.doneSms}>An SMS receipt has been sent to your phone.</Text>
              <TouchableOpacity style={styles.submitBtn} onPress={onDone}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <Feather name="smartphone" size={20} color={colors.brand[600]} />
                <Text style={styles.modalTitle}>Pay with M-Pesa</Text>
              </View>
              <Text style={styles.modalSubtext}>
                Amount due: {formatTZS(schedule.amount_due)}
              </Text>
              <View style={styles.formField}>
                <Text style={styles.label}>M-Pesa phone number</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={[styles.submitBtn, { flex: 1 }, stage === "pushing" && styles.disabledBtn]}
                  onPress={handleSubmit}
                  disabled={stage === "pushing"}
                >
                  <Text style={styles.submitBtnText}>
                    {stage === "pushing" ? "Confirming on your phone..." : "Send STK push"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sandbox}>
                Sandbox mode: simulates M-Pesa PIN prompt and confirms instantly.
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function MaintenanceForm({ unitId, onDone, onCancel }: { unitId: string; onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/tenant/maintenance-requests", {
        unit_id: unitId,
        title,
        description: description || undefined,
        priority,
      });
      onDone();
    } catch {
      setError("Could not submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ backgroundColor: colors.ink[50], borderRadius: 12, padding: 12, marginBottom: 12 }}>
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.label}>Issue title</Text>
        <TextInput style={styles.input} placeholder="e.g. Broken pipe in bathroom" value={title} onChangeText={setTitle} />
      </View>
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.label}>Priority</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {["low", "medium", "high", "urgent"].map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPriority(p)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                borderWidth: 1, borderColor: priority === p ? colors.brand[500] : colors.ink[200],
                backgroundColor: priority === p ? colors.brand[50] : colors.white,
              }}
            >
              <Text style={{ fontSize: 12, color: priority === p ? colors.brand[700] : colors.ink[600], fontWeight: priority === p ? "500" : "400" }}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, { height: 70, textAlignVertical: "top" }]}
          multiline
          placeholder="Describe the issue..."
          value={description}
          onChangeText={setDescription}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity style={[styles.submitBtn, { flex: 1 }, submitting && styles.disabledBtn]} onPress={handleSubmit} disabled={submitting || !title}>
          <Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit request"}</Text>
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
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink[900] },
  profileLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  profileLinkText: { fontSize: 13, fontWeight: "600", color: colors.brand[600] },
  profileBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.brand[600], borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14, marginTop: 16,
  },
  profileBtnText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  profileHint: { fontSize: 12, color: colors.ink[400], marginTop: 8, textAlign: "center" },
  leaseChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.ink[200], backgroundColor: colors.white, marginRight: 8 },
  leaseChipActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  leaseChipText: { fontSize: 13, color: colors.ink[600] },
  leaseChipTextActive: { color: colors.brand[700], fontWeight: "500" },
  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 12,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardHeaderLeft: { flex: 1 },
  propertyTitle: { fontSize: 18, fontWeight: "600", color: colors.ink[900] },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locationText: { fontSize: 13, color: colors.ink[500] },
  docBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: colors.ink[200], borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.white,
  },
  docBtnText: { fontSize: 12, fontWeight: "600", color: colors.brand[600] },
  factsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  fact: { flex: 1, minWidth: "45%", backgroundColor: colors.ink[50], borderRadius: 10, padding: 10 },
  factLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.ink[400] },
  factValue: { fontSize: 13, fontWeight: "600", color: colors.ink[900], marginTop: 2 },
  signBox: { borderRadius: 12, padding: 14 },
  signedBox: { backgroundColor: colors.brand[50] },
  unsignedBox: { backgroundColor: colors.ink[50] },
  signedText: { fontSize: 13, color: colors.brand[700] },
  unsignedText: { fontSize: 13, color: colors.sun[700], marginBottom: 10 },
  signRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  signBtn: { backgroundColor: colors.brand[600], borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  signBtnText: { color: colors.white, fontSize: 13, fontWeight: "600" },
  section: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: colors.ink[900], marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: colors.white, borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  modalTitle: { fontSize: 17, fontWeight: "600", color: colors.ink[900] },
  modalSubtext: { fontSize: 14, fontWeight: "500", color: colors.ink[500], marginBottom: 12 },
  modalBtns: { flexDirection: "row", gap: 8, marginTop: 8 },
  doneBox: { alignItems: "center", paddingVertical: 8 },
  doneEmoji: { fontSize: 20, fontWeight: "700", color: colors.brand[600], marginBottom: 8 },
  doneTitle: { fontSize: 17, fontWeight: "600", color: colors.ink[900] },
  doneReceipt: { fontSize: 13, color: colors.ink[500], marginTop: 6, fontFamily: "monospace" as any },
  doneSms: { fontSize: 13, color: colors.ink[500], marginTop: 4 },
  formField: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink[700], marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.ink[200], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink[900], backgroundColor: colors.white },
  errorText: { fontSize: 13, color: colors.red[600], marginVertical: 4 },
  submitBtn: { backgroundColor: colors.brand[600], borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  submitBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  disabledBtn: { opacity: 0.5 },
  cancelBtn: { borderWidth: 1, borderColor: colors.ink[200], borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", backgroundColor: colors.white },
  cancelBtnText: { color: colors.ink[700], fontSize: 14, fontWeight: "600" },
  sandbox: { fontSize: 11, color: colors.ink[400], marginTop: 10, textAlign: "center" },
});

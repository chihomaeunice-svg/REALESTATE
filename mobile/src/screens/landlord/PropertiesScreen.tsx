import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { api } from "../../lib/api";
import type { Property, Unit, Listing } from "../../lib/types";
import { formatTZS } from "../../lib/format";
import { VerifiedBadge } from "../../components/VerifiedBadge";
import { DAR_DISTRICTS, PROPERTY_TYPES, NO_UNIT_TYPES } from "../../lib/constants";
import { useAuth } from "../../lib/auth-context";
import { colors } from "../../theme/colors";

export function PropertiesScreen() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  function load() {
    api.get<Property[]>("/properties").then(setProperties);
    api.get<Listing[]>("/listings").then(setListings).catch(() => {});
  }
  useEffect(load, []);

  const listingsByUnitId = useMemo(() => {
    const map = new Map<string, Listing>();
    for (const l of listings) if (l.unit_id) map.set(l.unit_id, l);
    return map;
  }, [listings]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Properties & units</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Feather name="plus" size={14} color={colors.white} />
          <Text style={styles.addBtnText}>Add property</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <NewPropertyForm onDone={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />
      )}

      {properties.length === 0 && (
        <Text style={styles.emptyText}>No properties yet. Add your first building or house above.</Text>
      )}

      {properties.map((p) => (
        <View key={p.id} style={styles.card}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => setExpanded(expanded === p.id ? null : p.id)}
          >
            <View style={styles.cardHeaderLeft}>
              <View style={styles.nameRow}>
                <Text style={styles.cardName}>{p.title}</Text>
                <VerifiedBadge status={p.verification} />
              </View>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={12} color={colors.ink[500]} />
                <Text style={styles.locationText}>{p.ward}, {p.district}</Text>
              </View>
            </View>
            <Feather name={expanded === p.id ? "chevron-up" : "chevron-down"} size={20} color={colors.ink[400]} />
          </TouchableOpacity>

          {expanded === p.id && (
            NO_UNIT_TYPES.has(p.property_type)
              ? <LandPanel property={p} landlordPhone={user?.phone ?? ""} />
              : <UnitsPanel property={p} landlordPhone={user?.phone ?? ""} listingsByUnitId={listingsByUnitId} />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function NewPropertyForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: "", property_type: "apartment", district: DAR_DISTRICTS[0], ward: "",
    address_line: "", land_size_acres: "", title_deed_status: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isLand = NO_UNIT_TYPES.has(form.property_type);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/properties", {
        title: form.title, property_type: form.property_type,
        district: form.district, ward: form.ward,
        address_line: form.address_line || undefined,
        land_size_acres: isLand && form.land_size_acres ? Number(form.land_size_acres) : undefined,
        title_deed_status: isLand && form.title_deed_status ? form.title_deed_status : undefined,
      });
      onDone();
    } catch {
      setError("Could not create property.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>New property</Text>
        <TouchableOpacity onPress={onCancel}>
          <Feather name="x" size={18} color={colors.ink[400]} />
        </TouchableOpacity>
      </View>
      <View style={styles.formField}>
        <Text style={styles.label}>Property name</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
      </View>
      <View style={styles.formField}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.pickerWrap}>
          {PROPERTY_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeChip, form.property_type === t.value && styles.typeChipActive]}
              onPress={() => setForm({ ...form, property_type: t.value })}
            >
              <Text style={[styles.typeChipText, form.property_type === t.value && styles.typeChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.formField}>
        <Text style={styles.label}>District</Text>
        <View style={styles.pickerWrap}>
          {DAR_DISTRICTS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.typeChip, form.district === d && styles.typeChipActive]}
              onPress={() => setForm({ ...form, district: d })}
            >
              <Text style={[styles.typeChipText, form.district === d && styles.typeChipTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.formField}>
        <Text style={styles.label}>Ward</Text>
        <TextInput style={styles.input} value={form.ward} onChangeText={(v) => setForm({ ...form, ward: v })} />
      </View>
      <View style={styles.formField}>
        <Text style={styles.label}>Address (optional)</Text>
        <TextInput style={styles.input} value={form.address_line} onChangeText={(v) => setForm({ ...form, address_line: v })} />
      </View>
      {isLand && (
        <>
          <View style={styles.formField}>
            <Text style={styles.label}>Plot size (acres)</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={form.land_size_acres} onChangeText={(v) => setForm({ ...form, land_size_acres: v })} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.label}>Title deed status</Text>
            <TextInput style={styles.input} value={form.title_deed_status} onChangeText={(v) => setForm({ ...form, title_deed_status: v })} placeholder="e.g. Full title deed" />
          </View>
        </>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity style={[styles.submitBtn, submitting && styles.disabledBtn]} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitBtnText}>{submitting ? "Creating..." : "Create property"}</Text>
      </TouchableOpacity>
      <Text style={styles.noteText}>New properties enter admin review before listing publicly.</Text>
    </View>
  );
}

function LandPanel({ property, landlordPhone }: { property: Property; landlordPhone: string }) {
  const [price, setPrice] = useState("");
  const [pricePeriod, setPricePeriod] = useState("total");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [published, setPublished] = useState(false);

  async function handlePublish() {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/listings", {
        property_id: property.id,
        purpose: pricePeriod === "total" ? "sale" : "rent",
        title: property.title,
        description: description || undefined,
        price: Number(price),
        price_period: pricePeriod,
        contact_phone: landlordPhone,
        images: [`https://picsum.photos/seed/${property.id}/900/600`],
      });
      setPublished(true);
    } catch {
      setError("Could not publish listing.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.panelContent}>
      {published ? (
        <Text style={styles.successText}>Listing published - it's now live on the marketplace.</Text>
      ) : (
        <>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <TextInput style={styles.input} keyboardType="number-pad" placeholder="Price (TZS)" value={price} onChangeText={setPrice} />
            </View>
            <View style={styles.formField}>
              <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
            </View>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity style={[styles.submitBtn, submitting && styles.disabledBtn]} onPress={handlePublish} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? "Publishing..." : "Publish listing"}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

function UnitsPanel({ property, landlordPhone, listingsByUnitId }: { property: Property; landlordPhone: string; listingsByUnitId: Map<string, Listing> }) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [unitLabel, setUnitLabel] = useState("");
  const [beds, setBeds] = useState("1");
  const [baths, setBaths] = useState("1");
  const [rent, setRent] = useState("");
  const [error, setError] = useState("");

  function loadUnits() {
    api.get<Unit[]>(`/properties/${property.id}/units`).then(setUnits);
  }
  useEffect(loadUnits, [property.id]);

  async function addUnit() {
    setError("");
    try {
      await api.post(`/properties/${property.id}/units`, {
        unit_label: unitLabel, bedrooms: Number(beds), bathrooms: Number(baths), rent_amount: Number(rent),
      });
      setShowForm(false);
      setUnitLabel(""); setBeds("1"); setBaths("1"); setRent("");
      loadUnits();
    } catch { setError("Could not create unit."); }
  }

  async function publishUnit(unit: Unit) {
    try {
      await api.post("/listings", {
        property_id: property.id, unit_id: unit.id,
        title: `${unit.unit_label} — ${formatTZS(unit.rent_amount)}/month`,
        price: unit.rent_amount, contact_phone: landlordPhone,
        images: [`https://picsum.photos/seed/${unit.id}/900/600`],
      });
      loadUnits();
    } catch {}
  }

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Units</Text>
        <TouchableOpacity style={styles.smallBtn} onPress={() => setShowForm((s) => !s)}>
          <Feather name="plus" size={12} color={colors.brand[600]} />
          <Text style={styles.smallBtnText}>Add unit</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.unitFormRow}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Label (A1)" value={unitLabel} onChangeText={setUnitLabel} />
          <TextInput style={[styles.input, { width: 50 }]} keyboardType="number-pad" placeholder="Beds" value={beds} onChangeText={setBeds} />
          <TextInput style={[styles.input, { width: 50 }]} keyboardType="number-pad" placeholder="Baths" value={baths} onChangeText={setBaths} />
          <TextInput style={[styles.input, { flex: 1 }]} keyboardType="number-pad" placeholder="Rent" value={rent} onChangeText={setRent} />
          <TouchableOpacity style={styles.submitBtn} onPress={addUnit}>
            <Text style={styles.submitBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {units.length === 0 ? (
        <Text style={styles.emptyText}>No units yet.</Text>
      ) : (
        units.map((u) => {
          const listing = listingsByUnitId.get(u.id);
          return (
            <View key={u.id} style={styles.unitRow}>
              <View style={styles.unitLeft}>
                <Text style={styles.unitLabel}>{u.unit_label}</Text>
                <Text style={styles.unitMeta}>{u.bedrooms}bd / {u.bathrooms}ba · {formatTZS(u.rent_amount)}</Text>
              </View>
              <View style={styles.unitRight}>
                <View style={[styles.statusBadge, u.status === "occupied" ? styles.occupiedBadge : styles.vacantBadge]}>
                  <Text style={[styles.statusText, u.status === "occupied" ? styles.occupiedText : styles.vacantText]}>
                    {u.status}
                  </Text>
                </View>
                {listing && (
                  <Text style={styles.viewCount}>{listing.view_count} views</Text>
                )}
                {u.status === "vacant" && !listing && (
                  <TouchableOpacity onPress={() => publishUnit(u)}>
                    <Text style={styles.publishLink}>Publish</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSunken },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink[900] },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.brand[600], paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  addBtnText: { color: colors.white, fontSize: 13, fontWeight: "600" },
  card: {
    backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.surfaceBorder,
    marginBottom: 10, overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16,
  },
  cardHeaderLeft: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardName: { fontSize: 15, fontWeight: "600", color: colors.ink[900] },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locationText: { fontSize: 13, color: colors.ink[500] },
  panelContent: {
    borderTopWidth: 1, borderTopColor: colors.ink[100], paddingHorizontal: 16, paddingVertical: 12,
  },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  panelTitle: { fontSize: 13, fontWeight: "600", color: colors.ink[700] },
  smallBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: colors.ink[200], borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.white,
  },
  smallBtnText: { fontSize: 12, fontWeight: "600", color: colors.brand[600] },
  unitFormRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10, alignItems: "center",
  },
  unitRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.ink[100],
  },
  unitLeft: { flex: 1 },
  unitRight: { alignItems: "flex-end", gap: 4 },
  unitLabel: { fontSize: 14, fontWeight: "600", color: colors.ink[800] },
  unitMeta: { fontSize: 12, color: colors.ink[500], marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "600" },
  occupiedBadge: { backgroundColor: colors.brand[50] },
  occupiedText: { color: colors.brand[700] },
  vacantBadge: { backgroundColor: colors.sun[50] },
  vacantText: { color: colors.sun[700] },
  viewCount: { fontSize: 11, color: colors.ink[400] },
  publishLink: { fontSize: 12, fontWeight: "600", color: colors.brand[600] },
  formCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  formTitle: { fontSize: 16, fontWeight: "600", color: colors.ink[900] },
  formField: { marginBottom: 10 },
  formRow: { flexDirection: "row", gap: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink[700], marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.ink[200], borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink[900], backgroundColor: colors.white,
  },
  pickerWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: colors.ink[200], backgroundColor: colors.white,
  },
  typeChipActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  typeChipText: { fontSize: 13, color: colors.ink[600] },
  typeChipTextActive: { color: colors.brand[700], fontWeight: "500" },
  errorText: { fontSize: 13, color: colors.red[600], marginVertical: 4 },
  submitBtn: {
    backgroundColor: colors.brand[600], borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 4,
  },
  submitBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  disabledBtn: { opacity: 0.5 },
  emptyText: { fontSize: 14, color: colors.ink[400] },
  successText: { fontSize: 14, fontWeight: "500", color: colors.brand[700] },
  noteText: { fontSize: 12, color: colors.ink[400], marginTop: 8 },
});

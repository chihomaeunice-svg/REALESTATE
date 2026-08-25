import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { api } from "../lib/api";
import type { Listing } from "../lib/types";
import { formatTZS, formatDate } from "../lib/format";
import { recordView } from "../lib/recently-viewed";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { WishlistButton } from "../components/WishlistButton";
import { SimilarListings } from "../components/SimilarListings";
import { RecentlyViewedStrip } from "../components/RecentlyViewedStrip";
import { PROPERTY_TYPE_LABEL, NO_UNIT_TYPES } from "../lib/constants";
import { colors } from "../theme/colors";

export function ListingDetailScreen({ route }: { route: any }) {
  const { id } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [form, setForm] = useState({ seeker_name: "", seeker_phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      api.get<Listing>(`/listings/${id}`).then((l) => {
        setListing(l);
        recordView(l.id);
      });
    }
  }, [id]);

  async function submitInquiry() {
    setError("");
    try {
      await api.post(`/listings/${id}/inquiries`, form);
      setSent(true);
    } catch {
      setError("Could not send your inquiry. Please try again.");
    }
  }

  if (!listing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  const image = listing.images?.[0] ?? `https://picsum.photos/seed/${listing.id}/1200/800`;
  const isLand = NO_UNIT_TYPES.has(listing.property_type);

  const waPhone = listing.contact_phone.replace(/[^0-9]/g, "");
  const waMessage = encodeURIComponent(`Hi, I'm interested in "${listing.title}" listed on Nyumba Yangu.`);
  const waLink = `https://wa.me/${waPhone}?text=${waMessage}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Image */}
      <Image source={{ uri: image }} style={styles.heroImage} contentFit="cover" />

      <View style={styles.body}>
        {/* Title & badges */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={14} color={colors.ink[500]} />
              <Text style={styles.location}>
                {listing.ward}, {listing.district}, {listing.city}
              </Text>
            </View>
          </View>
          <View style={styles.titleRight}>
            <VerifiedBadge status={listing.verification} />
            <WishlistButton listingId={listing.id} variant="inline" />
          </View>
        </View>

        {/* Detail chips */}
        <View style={styles.chipRow}>
          <Chip text={PROPERTY_TYPE_LABEL[listing.property_type] ?? listing.property_type} />
          {isLand ? (
            <>
              {listing.land_size_acres ? <Chip icon="maximize" text={`${listing.land_size_acres} acres`} /> : null}
              {listing.title_deed_status ? <Chip icon="shield" text={listing.title_deed_status} /> : null}
            </>
          ) : (
            <>
              {listing.bedrooms > 0 && <Chip icon="home" text={`${listing.bedrooms} bed${listing.bedrooms > 1 ? "s" : ""}`} />}
              {listing.bathrooms > 0 && <Chip icon="droplet" text={`${listing.bathrooms} bath`} />}
            </>
          )}
          <Chip icon="calendar" text={`Listed ${formatDate(listing.created_at)}`} />
        </View>

        {/* Description */}
        {listing.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this property</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>
        ) : null}

        {/* Price card */}
        <View style={styles.priceCard}>
          <Text style={styles.price}>
            {formatTZS(listing.price)}
            {listing.price_period !== "total" && (
              <Text style={styles.pricePeriod}> /{listing.price_period}</Text>
            )}
          </Text>
          <Text style={styles.purpose}>
            {listing.purpose === "rent" ? "Available for rent" : "Available for sale"}
          </Text>

          {!showContact ? (
            <View style={styles.contactBtns}>
              <TouchableOpacity style={styles.contactBtn} onPress={() => setShowContact(true)}>
                <Feather name="phone" size={16} color={colors.white} />
                <Text style={styles.contactBtnText}>Contact lister</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={() => Linking.openURL(waLink)}
              >
                <Feather name="message-circle" size={16} color={colors.white} />
                <Text style={styles.whatsappBtnText}>Chat on WhatsApp</Text>
              </TouchableOpacity>
            </View>
          ) : sent ? (
            <View style={styles.sentBox}>
              <Feather name="check-circle" size={18} color={colors.brand[600]} />
              <View style={styles.sentTextBox}>
                <Text style={styles.sentTitle}>Inquiry sent</Text>
                <Text style={styles.sentSubtext}>
                  The lister's number is {listing.contact_phone}. They'll reach out, or call directly.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.inquiryForm}>
              <TextInput
                style={styles.input}
                value={form.seeker_name}
                onChangeText={(v) => setForm({ ...form, seeker_name: v })}
                placeholder="Your name"
              />
              <TextInput
                style={styles.input}
                value={form.seeker_phone}
                onChangeText={(v) => setForm({ ...form, seeker_phone: v })}
                placeholder="+255..."
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.message}
                onChangeText={(v) => setForm({ ...form, message: v })}
                placeholder="Message (optional)"
                multiline
                numberOfLines={3}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity style={styles.contactBtn} onPress={submitInquiry}>
                <Text style={styles.contactBtnText}>Send inquiry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <SimilarListings listing={listing} />
      <RecentlyViewedStrip excludeId={listing.id} />
    </ScrollView>
  );
}

function Chip({ text, icon }: { text: string; icon?: keyof typeof Feather.glyphMap }) {
  return (
    <View style={chipStyles.chip}>
      {icon && <Feather name={icon} size={14} color={colors.ink[600]} />}
      <Text style={chipStyles.text}>{text}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  text: {
    fontSize: 13,
    color: colors.ink[600],
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSunken,
  },
  content: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: colors.ink[100],
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleLeft: {
    flex: 1,
  },
  titleRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.ink[900],
    lineHeight: 28,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  location: {
    fontSize: 14,
    color: colors.ink[500],
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.ink[900],
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink[600],
  },
  priceCard: {
    marginTop: 24,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  price: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.ink[900],
  },
  pricePeriod: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.ink[400],
  },
  purpose: {
    fontSize: 14,
    color: colors.ink[500],
    marginTop: 4,
  },
  contactBtns: {
    marginTop: 16,
    gap: 10,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brand[600],
    borderRadius: 12,
    paddingVertical: 14,
  },
  contactBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.whatsapp,
    borderRadius: 12,
    paddingVertical: 14,
  },
  whatsappBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  sentBox: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.brand[50],
    borderRadius: 12,
    padding: 16,
  },
  sentTextBox: {
    flex: 1,
  },
  sentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brand[700],
  },
  sentSubtext: {
    fontSize: 13,
    color: colors.brand[700],
    marginTop: 4,
    lineHeight: 19,
  },
  inquiryForm: {
    marginTop: 16,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink[900],
    backgroundColor: colors.white,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 13,
    color: colors.red[600],
  },
});

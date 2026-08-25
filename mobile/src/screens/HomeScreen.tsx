import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import type { Listing } from "../lib/types";
import { ListingCard } from "../components/ListingCard";
import { RecentlyViewedStrip } from "../components/RecentlyViewedStrip";
import { DAR_DISTRICTS, PROPERTY_TYPES } from "../lib/constants";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState("");

  useEffect(() => {
    api.get<Listing[]>("/listings").then((data) => setFeatured(data.slice(0, 6)));
  }, []);

  function handleSearch() {
    navigation.navigate("Listings", { district, property_type: propertyType });
  }

  return (
    <FlatList
      data={featured}
      keyExtractor={(item) => item.id}
      numColumns={width > 600 ? 2 : 1}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroLocationRow}>
              <Feather name="map-pin" size={14} color={colors.brand[300]} />
              <Text style={styles.heroLocation}>Dar es Salaam</Text>
            </View>
            <Text style={styles.heroTitle}>
              Find your next home, verified and ready.
            </Text>
            <Text style={styles.heroSubtext}>
              Browse verified rentals and listings across Dar es Salaam.
            </Text>

            {/* Search controls */}
            <View style={styles.searchCard}>
              {/* District chips */}
              <FlatList
                data={[{ value: "", label: "All districts" }, ...DAR_DISTRICTS.map((d) => ({ value: d, label: d }))]}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.value}
                contentContainerStyle={styles.chipRow}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.chip, district === item.value && styles.chipActive]}
                    onPress={() => setDistrict(item.value)}
                  >
                    <Text style={[styles.chipText, district === item.value && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              {/* Type chips */}
              <FlatList
                data={[{ value: "", label: "Any type" }, ...PROPERTY_TYPES]}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.value}
                contentContainerStyle={styles.chipRow}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.chip, propertyType === item.value && styles.chipActive]}
                    onPress={() => setPropertyType(item.value)}
                  >
                    <Text style={[styles.chipText, propertyType === item.value && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                <Feather name="search" size={16} color={colors.white} />
                <Text style={styles.searchBtnText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>

          <RecentlyViewedStrip />

          {/* Section heading */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Recently listed</Text>
              <Text style={styles.sectionSubtext}>Fresh properties across the city.</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Listings", {})}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <ListingCard listing={item} />
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No listings yet. Be the first to list a property.</Text>
      }
      ListFooterComponent={
        <>
          {/* Features section */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresLabel}>FOR LANDLORDS</Text>
            <Text style={styles.featuresTitle}>
              The listing is just the beginning
            </Text>
            <Text style={styles.featuresSubtext}>
              Manage leases, rent collection, and tenant management — all in one place.
            </Text>
            <View style={styles.featureGrid}>
              <FeatureItem icon="file-text" title="Digital leases" text="Swahili and English templates with signed audit trail." />
              <FeatureItem icon="credit-card" title="Advance-rent schedules" text="6 or 12-month advances modeled natively." />
              <FeatureItem icon="smartphone" title="M-Pesa collection" text="Tenants pay from their phone. Payments reconcile automatically." />
              <FeatureItem icon="shield" title="Verified listings" text="NIDA-linked identity badges for legitimate listings." />
            </View>
          </View>

          {/* CTA */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>Start managing your properties today</Text>
            <Text style={styles.ctaSubtext}>
              Free to list, free to browse. Management tools priced per unit.
            </Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate("Register")}>
              <Text style={styles.ctaBtnText}>Create free account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaSecondary} onPress={() => navigation.navigate("Listings", {})}>
              <Text style={styles.ctaSecondaryText}>Browse listings</Text>
              <Feather name="arrow-right" size={14} color={colors.brand[200]} />
            </TouchableOpacity>
          </View>
        </>
      }
    />
  );
}

function FeatureItem({ icon, title, text }: { icon: keyof typeof Feather.glyphMap; title: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Feather name={icon} size={20} color={colors.brand[600]} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: colors.brand[950],
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroLocation: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.brand[300],
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: "600",
    color: colors.white,
    lineHeight: 34,
  },
  heroSubtext: {
    marginTop: 10,
    fontSize: 14,
    color: "rgba(209,232,227,0.85)",
    lineHeight: 20,
  },
  searchCard: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  chipRow: {
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.ink[50],
  },
  chipActive: {
    backgroundColor: colors.brand[600],
  },
  chipText: {
    fontSize: 13,
    color: colors.ink[700],
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: "500",
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.sun[600],
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  searchBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.ink[900],
  },
  sectionSubtext: {
    fontSize: 13,
    color: colors.ink[500],
    marginTop: 2,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.brand[600],
  },
  cardWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  emptyText: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    fontSize: 14,
    color: colors.ink[400],
  },
  featuresSection: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  featuresLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    color: colors.brand[600],
    textAlign: "center",
  },
  featuresTitle: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "600",
    color: colors.ink[900],
    textAlign: "center",
  },
  featuresSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.ink[500],
    textAlign: "center",
    lineHeight: 20,
  },
  featureGrid: {
    marginTop: 24,
    gap: 20,
  },
  featureItem: {
    gap: 6,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink[900],
  },
  featureText: {
    fontSize: 13,
    color: colors.ink[500],
    lineHeight: 19,
  },
  ctaSection: {
    backgroundColor: colors.brand[950],
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
  },
  ctaSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(209,232,227,0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
  ctaBtn: {
    marginTop: 20,
    backgroundColor: colors.sun[600],
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
  },
  ctaSecondary: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brand[200],
  },
});

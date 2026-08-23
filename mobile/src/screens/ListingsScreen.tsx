import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { api } from "../lib/api";
import type { Listing } from "../lib/types";
import { ListingCard } from "../components/ListingCard";
import { FilterBar } from "../components/FilterBar";
import { DAR_DISTRICTS, PROPERTY_TYPES } from "../lib/constants";
import { colors } from "../theme/colors";

type SortOption = "newest" | "price_asc" | "price_desc";

export function ListingsScreen({ route }: { route: any }) {
  const initialDistrict = route?.params?.district ?? "";
  const initialType = route?.params?.property_type ?? "";

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [district, setDistrict] = useState(initialDistrict);
  const [propertyType, setPropertyType] = useState(initialType);
  const [purpose, setPurpose] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (district) query.set("district", district);
    if (propertyType) query.set("property_type", propertyType);
    if (purpose) query.set("purpose", purpose);
    api
      .get<Listing[]>(`/listings?${query.toString()}`)
      .then(setListings)
      .finally(() => setLoading(false));
  }, [district, propertyType, purpose]);

  const sortedListings = useMemo(() => {
    const copy = [...listings];
    if (sort === "price_asc") copy.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") copy.sort((a, b) => b.price - a.price);
    return copy;
  }, [listings, sort]);

  function onFilterChange(key: string, value: string) {
    if (key === "district") setDistrict(value);
    else if (key === "property_type") setPropertyType(value);
    else if (key === "purpose") setPurpose(value);
    else if (key === "sort") setSort((value || "newest") as SortOption);
  }

  function onClear() {
    setDistrict("");
    setPropertyType("");
    setPurpose("");
    setSort("newest");
  }

  const activeFilters = [district, propertyType, purpose].filter(Boolean).length;

  const filters = [
    {
      key: "district",
      label: "District",
      options: DAR_DISTRICTS.map((d) => ({ value: d, label: d })),
      value: district,
    },
    {
      key: "property_type",
      label: "Type",
      options: PROPERTY_TYPES.map((p) => ({ value: p.value, label: p.label })),
      value: propertyType,
    },
    {
      key: "purpose",
      label: "Purpose",
      options: [
        { value: "rent", label: "For rent" },
        { value: "sale", label: "For sale" },
      ],
      value: purpose,
    },
    {
      key: "sort",
      label: "Sort",
      options: [
        { value: "newest", label: "Newest" },
        { value: "price_asc", label: "Price: Low" },
        { value: "price_desc", label: "Price: High" },
      ],
      value: sort === "newest" ? "" : sort,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse listings</Text>
        <Text style={styles.subtitle}>
          {loading ? "Searching..." : `${listings.length} propert${listings.length === 1 ? "y" : "ies"} found`}
        </Text>
      </View>

      <FilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onClear={onClear}
        activeCount={activeFilters}
      />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.brand[600]} />
        </View>
      ) : sortedListings.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No listings match those filters.</Text>
          <Text style={styles.emptySubtext}>Try broadening your search.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedListings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ListingCard listing={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSunken,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.ink[900],
  },
  subtitle: {
    fontSize: 13,
    color: colors.ink[500],
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.ink[400],
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.ink[400],
    marginTop: 4,
  },
});

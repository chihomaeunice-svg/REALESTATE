import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { api } from "../lib/api";
import type { Listing } from "../lib/types";
import { ListingCard } from "./ListingCard";
import { colors } from "../theme/colors";

export function SimilarListings({ listing }: { listing: Listing }) {
  const [similar, setSimilar] = useState<Listing[]>([]);

  useEffect(() => {
    const query = new URLSearchParams();
    query.set("district", listing.district);
    query.set("property_type", listing.property_type);
    query.set("purpose", listing.purpose);
    query.set("min_price", String(Math.round(listing.price * 0.7)));
    query.set("max_price", String(Math.round(listing.price * 1.3)));

    api
      .get<Listing[]>(`/listings?${query.toString()}`)
      .then((results) => setSimilar(results.filter((l) => l.id !== listing.id).slice(0, 4)))
      .catch(() => setSimilar([]));
  }, [listing.id, listing.district, listing.property_type, listing.purpose, listing.price]);

  if (similar.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Similar listings</Text>
      <FlatList
        data={similar}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ListingCard listing={item} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  heading: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.ink[900],
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  cardWrapper: {
    width: 260,
  },
});

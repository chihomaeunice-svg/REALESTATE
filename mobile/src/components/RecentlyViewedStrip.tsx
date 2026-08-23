import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { api } from "../lib/api";
import { getRecentlyViewedIds } from "../lib/recently-viewed";
import type { Listing } from "../lib/types";
import { ListingCard } from "./ListingCard";
import { colors } from "../theme/colors";

export function RecentlyViewedStrip({ excludeId }: { excludeId?: string }) {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    getRecentlyViewedIds(excludeId).then((ids) => {
      if (ids.length === 0) {
        setListings([]);
        return;
      }
      Promise.all(ids.map((id) => api.get<Listing>(`/listings/${id}`).catch(() => null))).then(
        (results) => setListings(results.filter((l): l is Listing => l !== null))
      );
    });
  }, [excludeId]);

  if (listings.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recently viewed</Text>
      <FlatList
        data={listings}
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
    paddingVertical: 20,
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

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { api } from "../lib/api";
import type { Listing } from "../lib/types";
import { ListingCard } from "../components/ListingCard";
import { useWishlist } from "../lib/wishlist-context";
import { useAuth } from "../lib/auth-context";
import { colors } from "../theme/colors";

export function WishlistScreen() {
  const { user } = useAuth();
  const { ids } = useWishlist();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (user) {
      api
        .get<Listing[]>("/favorites")
        .then(setListings)
        .finally(() => setLoading(false));
      return;
    }
    if (ids.size === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    Promise.all([...ids].map((id) => api.get<Listing>(`/listings/${id}`).catch(() => null)))
      .then((results) => setListings(results.filter((l): l is Listing => l !== null)))
      .finally(() => setLoading(false));
  }, [user, ids]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="heart" size={22} color={colors.red[500]} />
          <Text style={styles.title}>Your wishlist</Text>
        </View>
        <Text style={styles.subtitle}>
          {user
            ? "Saved to your account — available on any device."
            : "Saved on this device. Log in to sync across devices."}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.brand[600]} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>
            Nothing saved yet — tap the heart on any listing to add it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
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
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.ink[900],
  },
  subtitle: {
    fontSize: 13,
    color: colors.ink[500],
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.ink[400],
    textAlign: "center",
  },
});

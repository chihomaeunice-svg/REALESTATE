import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { Listing } from "../lib/types";
import { formatTZS } from "../lib/format";
import { VerifiedBadge } from "./VerifiedBadge";
import { WishlistButton } from "./WishlistButton";
import { PROPERTY_TYPE_LABEL, NO_UNIT_TYPES } from "../lib/constants";
import { colors } from "../theme/colors";

export function ListingCard({ listing }: { listing: Listing }) {
  const navigation = useNavigation<any>();
  const image = listing.images?.[0] ?? `https://picsum.photos/seed/${listing.id}/900/600`;
  const isLand = NO_UNIT_TYPES.has(listing.property_type);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate("ListingDetail", { id: listing.id })}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
        <View style={styles.topLeft}>
          <VerifiedBadge status={listing.verification} />
        </View>
        <View style={styles.topRight}>
          <WishlistButton listingId={listing.id} />
        </View>
        <View style={styles.bottomLeft}>
          <View style={styles.purposeBadge}>
            <Text style={styles.purposeText}>
              {listing.purpose === "rent" ? "For rent" : "For sale"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.price}>
          {formatTZS(listing.price)}
          {listing.price_period !== "total" && (
            <Text style={styles.period}> /{listing.price_period}</Text>
          )}
        </Text>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={colors.ink[400]} />
          <Text style={styles.location}>{listing.ward}, {listing.district}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {PROPERTY_TYPE_LABEL[listing.property_type] ?? listing.property_type}
            </Text>
          </View>
          {isLand ? (
            listing.land_size_acres ? (
              <View style={styles.metaItem}>
                <Feather name="maximize" size={12} color={colors.ink[500]} />
                <Text style={styles.metaText}>{listing.land_size_acres} ac</Text>
              </View>
            ) : null
          ) : listing.property_type !== "shop" && listing.property_type !== "office" ? (
            <>
              <View style={styles.metaItem}>
                <Feather name="home" size={12} color={colors.ink[500]} />
                <Text style={styles.metaText}>{listing.bedrooms}</Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="droplet" size={12} color={colors.ink[500]} />
                <Text style={styles.metaText}>{listing.bathrooms}</Text>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  imageContainer: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.ink[100],
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  topLeft: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  topRight: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  bottomLeft: {
    position: "absolute",
    bottom: 12,
    left: 12,
  },
  purposeBadge: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  purposeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.ink[800],
  },
  body: {
    padding: 14,
  },
  price: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.ink[900],
  },
  period: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.ink[400],
  },
  title: {
    fontSize: 13,
    color: colors.ink[600],
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  location: {
    fontSize: 12,
    color: colors.ink[400],
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
  },
  typeBadge: {
    backgroundColor: colors.ink[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.ink[600],
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.ink[500],
  },
});

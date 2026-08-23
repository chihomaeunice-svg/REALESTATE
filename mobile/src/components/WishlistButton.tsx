import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useWishlist } from "../lib/wishlist-context";
import { colors } from "../theme/colors";

export function WishlistButton({
  listingId,
  variant = "overlay",
}: {
  listingId: string;
  variant?: "overlay" | "inline";
}) {
  const { has, toggle } = useWishlist();
  const saved = has(listingId);

  if (variant === "overlay") {
    return (
      <TouchableOpacity
        onPress={() => toggle(listingId)}
        style={styles.overlay}
        activeOpacity={0.7}
      >
        <Feather
          name="heart"
          size={16}
          color={saved ? colors.red[500] : colors.white}
          style={saved ? { } : undefined}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => toggle(listingId)}
      style={[styles.inline, saved && styles.inlineSaved]}
      activeOpacity={0.7}
    >
      <Feather
        name="heart"
        size={16}
        color={saved ? colors.red[600] : colors.ink[500]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  inline: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ink[200],
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  inlineSaved: {
    borderColor: colors.red[500],
    backgroundColor: colors.red[50],
  },
});

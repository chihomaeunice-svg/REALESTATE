import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import type { Verification } from "../lib/types";

export function VerifiedBadge({ status }: { status: Verification }) {
  if (status === "verified") {
    return (
      <View style={[styles.badge, styles.verified]}>
        <Feather name="check-circle" size={12} color={colors.brand[700]} />
        <Text style={[styles.text, styles.verifiedText]}>Verified</Text>
      </View>
    );
  }
  if (status === "pending") {
    return (
      <View style={[styles.badge, styles.pending]}>
        <Feather name="clock" size={12} color={colors.sun[700]} />
        <Text style={[styles.text, styles.pendingText]}>Pending</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.unverified]}>
      <Feather name="shield" size={12} color={colors.ink[500]} />
      <Text style={[styles.text, styles.unverifiedText]}>Unverified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
  verified: {
    backgroundColor: colors.brand[50],
  },
  verifiedText: {
    color: colors.brand[700],
  },
  pending: {
    backgroundColor: colors.sun[50],
  },
  pendingText: {
    color: colors.sun[700],
  },
  unverified: {
    backgroundColor: colors.ink[100],
  },
  unverifiedText: {
    color: colors.ink[500],
  },
});

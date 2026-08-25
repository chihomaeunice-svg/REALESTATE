import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface StatTileProps {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  tone?: "default" | "warning";
}

export function StatTile({ label, value, icon, tone = "default" }: StatTileProps) {
  const isWarning = tone === "warning";
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, isWarning && styles.iconBoxWarning]}>
        <Feather name={icon} size={20} color={isWarning ? colors.sun[600] : colors.brand[600]} />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand[50],
    justifyContent: "center",
    alignItems: "center",
  },
  iconBoxWarning: {
    backgroundColor: colors.sun[50],
  },
  textBox: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.ink[400],
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink[900],
    marginTop: 2,
  },
});

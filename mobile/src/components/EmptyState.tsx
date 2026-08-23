import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message: string;
}

export function EmptyState({ icon = "inbox", title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Feather name={icon} size={48} color={colors.ink[300]} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink[800],
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    color: colors.ink[500],
    textAlign: "center",
    lineHeight: 20,
  },
});

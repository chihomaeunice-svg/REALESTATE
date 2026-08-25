import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export function LoadingSpinner() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.brand[600]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

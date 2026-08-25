import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Nyumba Yangu</Text>
      <Text style={styles.tagline}>Find your next home, verified and ready.</Text>
      <ActivityIndicator size="small" color={colors.brand[400]} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand[950],
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    color: colors.brand[200],
    textAlign: "center",
  },
  spinner: {
    marginTop: 32,
  },
});

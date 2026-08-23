import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  filters: {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
  }[];
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  activeCount: number;
}

export function FilterBar({ filters, onFilterChange, onClear, activeCount }: FilterBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Feather name="sliders" size={16} color={colors.ink[400]} style={styles.icon} />
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, f.value ? styles.chipActive : undefined]}
            onPress={() => {
              // Cycle through options: empty -> first option -> second -> ... -> empty
              const currentIndex = f.options.findIndex((o) => o.value === f.value);
              const nextIndex = currentIndex + 1;
              const nextValue = nextIndex < f.options.length ? f.options[nextIndex].value : "";
              onFilterChange(f.key, nextValue);
            }}
          >
            <Text style={[styles.chipText, f.value ? styles.chipTextActive : undefined]}>
              {f.value ? f.options.find((o) => o.value === f.value)?.label ?? f.label : f.label}
            </Text>
            <Feather name="chevron-down" size={14} color={f.value ? colors.brand[700] : colors.ink[400]} />
          </TouchableOpacity>
        ))}
        {activeCount > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
            <Feather name="x" size={14} color={colors.ink[500]} />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  scroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.ink[200],
    backgroundColor: colors.white,
  },
  chipActive: {
    borderColor: colors.brand[400],
    backgroundColor: colors.brand[50],
  },
  chipText: {
    fontSize: 13,
    color: colors.ink[600],
  },
  chipTextActive: {
    color: colors.brand[700],
    fontWeight: "500",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: {
    fontSize: 13,
    color: colors.ink[500],
    fontWeight: "500",
  },
});

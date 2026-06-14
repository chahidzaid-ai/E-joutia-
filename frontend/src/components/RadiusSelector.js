// RadiusSelector: a slider that snaps to the supported search radii.
//
// Supported values: 1, 5, 10, 20, 50 km. The slider moves over discrete
// steps (indices) and maps each step to a km value, so users can only pick
// the allowed distances.

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";

import { colors, spacing } from "../theme";

export const RADIUS_OPTIONS = [1, 5, 10, 20, 50];

export default function RadiusSelector({ value, onChange }) {
  // Resolve the current index from the value (default to 10 km).
  const currentIndex = Math.max(0, RADIUS_OPTIONS.indexOf(value));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Search Radius</Text>
        <Text style={styles.value}>{value} km</Text>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={RADIUS_OPTIONS.length - 1}
        step={1}
        value={currentIndex}
        onValueChange={(index) => onChange(RADIUS_OPTIONS[index])}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />

      <View style={styles.ticksRow}>
        {RADIUS_OPTIONS.map((option) => (
          <Text
            key={option}
            style={[styles.tick, option === value && styles.tickActive]}
          >
            {option}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  ticksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  tick: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tickActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});

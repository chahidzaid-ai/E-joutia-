// NavBar — top application bar showing the e-Joutia logo (left-aligned).
//
// Reused across the Home, Locating and Listings screens so the brand is always
// visible at the top-left. Supports optional left/right action buttons
// (e.g. a back chevron on the left, a "Filters" toggle on the right).
//
//   <NavBar
//     left={{ label: "‹", big: true, onPress: goBack }}
//     right={{ label: "Filters", onPress: toggleFilters, active: showFilters }}
//   />

import React from "react";
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, spacing } from "../theme";

// Extra top padding so content clears the Android status bar (Wi-Fi, battery,
// clock, etc.). iOS handles this via SafeAreaView, so we only pad on Android.
const STATUS_BAR_PAD =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

// Horizontal wordmark logo used inside the app.
const LOGO = require("../../assets/ejotiya2.png");

function Action({ action, side }) {
  if (!action) return null;
  return (
    <TouchableOpacity
      style={[styles.action, side === "right" && styles.actionRight]}
      onPress={action.onPress}
      hitSlop={10}
    >
      <Text
        style={[
          styles.actionText,
          action.active && styles.actionTextActive,
          action.big && styles.actionTextBig,
        ]}
        numberOfLines={1}
      >
        {action.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function NavBar({ left = null, right = null }) {
  return (
    <View style={styles.bar}>
      <Action action={left} side="left" />
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      {/* Spacer pushes any right action to the far edge, keeping the logo left. */}
      <View style={styles.spacer} />
      <Action action={right} side="right" />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: STATUS_BAR_PAD + spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logo: {
    height: 38,
    width: 120, // ~3:1 wordmark; contain keeps the aspect ratio
    marginLeft: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  action: {
    justifyContent: "center",
    paddingRight: spacing.sm,
  },
  actionRight: {
    paddingRight: 0,
    paddingLeft: spacing.sm,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  actionTextActive: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  actionTextBig: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "400",
    color: colors.text,
  },
});

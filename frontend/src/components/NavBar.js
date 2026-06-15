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

const STATUS_BAR_PAD =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

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
    width: 120,
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

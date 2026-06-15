import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import NavBar from "../components/NavBar";
import { colors, radius as r, spacing } from "../theme";

export default function HomeScreen({ onEnterMarketplace }) {
  return (
    <SafeAreaView style={styles.safe}>
      <NavBar />

      <View style={styles.content}>
        <Text style={styles.title}>Welcome to e-Joutia</Text>
        <Text style={styles.subtitle}>
          Your neighbourhood marketplace. Discover great deals on items near you
          — electronics, furniture, vehicles and more.
        </Text>

        <View style={styles.bullets}>
          <Bullet icon="📍" text="Find items around your location" />
          <Bullet icon="🗺️" text="Adjust the area right on the map" />
          <Bullet icon="🛍️" text="Browse listings from local sellers" />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cta}
          onPress={onEnterMarketplace}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Go to Marketplace</Text>
        </TouchableOpacity>
        <Text style={styles.footnote}>
          We'll ask for your location next so we can show nearby products.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Bullet({ icon, text }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletIcon}>{icon}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacing.md,
  },
  bullets: {
    marginTop: spacing.xl,
    alignSelf: "center",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  bulletIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  bulletText: {
    fontSize: 15,
    color: colors.text,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: r.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  ctaText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  footnote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});

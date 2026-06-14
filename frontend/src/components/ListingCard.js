// ListingCard: a single product tile for the 2-column nearby grid.
// Mirrors the Facebook Marketplace look: image, "Nearby" badge, price,
// title, and distance/location line.

import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../theme";

const PLACEHOLDER = "https://via.placeholder.com/300x300.png?text=No+Image";

function formatPrice(price) {
  const numeric = Number(price);
  if (!numeric || numeric <= 0) return "Free";
  // Group thousands: 8700 -> "8,700"
  return `${numeric.toLocaleString("en-US")} DH`;
}

export default function ListingCard({ listing }) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: listing.image || PLACEHOLDER }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Nearby</Text>
        </View>
      </View>

      <Text style={styles.price}>{formatPrice(listing.price)}</Text>
      <Text style={styles.title} numberOfLines={1}>
        {listing.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {`${listing.distance} km away`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: spacing.xs,
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.badgeBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  price: {
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  title: {
    marginTop: 2,
    fontSize: 14,
    color: colors.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
});

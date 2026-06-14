// QuickPreviewModal — a draggable bottom sheet shown when a map marker is
// tapped. Ported from the teammate's map module and adapted to our theme and
// data shape:
//   - image source uses `listing.image` (our backend) and falls back to
//     `listing.photo` (the teammate's backend field) so it works with both.
//   - price formatting matches ListingCard ("8,700 DH"); currency defaults
//     to "DH".

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, radius as r, spacing } from "../theme";

const MODAL_HEIGHT = 320;

function formatPrice(price, currency = "DH") {
  const numeric = Number(price);
  if (!numeric || numeric <= 0) return "Free";
  return `${numeric.toLocaleString("en-US")} ${currency}`;
}

function formatDistance(value) {
  const dist = Number(value);
  if (!Number.isFinite(dist)) return "";
  if (dist < 1) return `${Math.round(dist * 1000)} m away`;
  return `${dist.toFixed(1)} km away`;
}

export default function QuickPreviewModal({ listing, visible, onClose, onViewMore }) {
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: MODAL_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  if (!listing) {
    return null;
  }

  const imageUri = listing.image || listing.photo || null;
  const distanceText = formatDistance(listing.distance);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.handle} />

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>No image</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>

        <Text style={styles.price}>{formatPrice(listing.price, listing.currency)}</Text>

        {distanceText ? <Text style={styles.distance}>{distanceText}</Text> : null}

        <TouchableOpacity style={styles.viewMoreButton} onPress={onViewMore}>
          <Text style={styles.viewMoreText}>View more</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  closeButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.lg,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  closeButtonText: { fontSize: 16, color: colors.text, fontWeight: "600" },
  photo: { width: "100%", height: 120, borderRadius: r.md, marginBottom: spacing.md },
  photoPlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: r.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  photoPlaceholderText: { fontSize: 14, color: colors.textSecondary },
  content: { flex: 1 },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 6 },
  price: { fontSize: 20, fontWeight: "700", color: colors.primary, marginBottom: 6 },
  distance: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md },
  viewMoreButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: r.sm,
    alignItems: "center",
  },
  viewMoreText: { color: colors.white, fontSize: 16, fontWeight: "600" },
});

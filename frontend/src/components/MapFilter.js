// MapFilter — compact map-based filter shown under the navbar on the items
// screen.
//
// The map here is a PREVIEW: tapping it opens the full-screen map (onExpand)
// where the user can precisely move the location, change the radius, or switch
// to the "All listings" view. A quick radius slider + "Apply" are kept here for
// fast tweaks without leaving the list.

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import Slider from "@react-native-community/slider";

import { colors, radius as r, spacing } from "../theme";

const DEFAULT_CENTER = { latitude: 35.7595, longitude: -5.834 }; // Tangier
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;

function deltaForRadius(radiusKm) {
  const delta = (radiusKm / 111) * 3;
  return Math.min(Math.max(delta, 0.02), 1.5);
}

export default function MapFilter({
  initialCenter = null,
  initialRadius = 10,
  onApply,
  onExpand,
}) {
  const center =
    initialCenter && initialCenter.latitude != null
      ? initialCenter
      : DEFAULT_CENTER;
  const [searchRadius, setSearchRadius] = useState(initialRadius);

  const region = {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: deltaForRadius(searchRadius),
    longitudeDelta: deltaForRadius(searchRadius),
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        {/* Non-interactive preview — the overlay below captures the tap. */}
        <MapView
          style={styles.map}
          region={region}
          pointerEvents="none"
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {searchRadius > 0 && (
            <Circle
              center={center}
              radius={searchRadius * 1000}
              strokeColor={colors.searchCircleStroke}
              fillColor={colors.searchCircleFill}
              strokeWidth={2}
            />
          )}
          <Marker coordinate={center} pinColor={colors.primary} />
        </MapView>

        {/* Tap anywhere on the preview to open the full-screen map. */}
        <TouchableOpacity
          style={styles.tapOverlay}
          activeOpacity={0.8}
          onPress={onExpand}
        >
          <View style={styles.expandBadge}>
            <Text style={styles.expandText}>⛶  Tap to open full map</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>Search radius (diameter)</Text>
        <Text style={styles.sliderValue}>{searchRadius} km</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={MIN_RADIUS_KM}
        maximumValue={MAX_RADIUS_KM}
        step={1}
        value={searchRadius}
        onValueChange={setSearchRadius}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />

      <TouchableOpacity
        style={styles.applyButton}
        onPress={() =>
          onApply?.({
            latitude: center.latitude,
            longitude: center.longitude,
            radius: searchRadius,
          })
        }
      >
        <Text style={styles.applyText}>Apply filters</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  mapWrap: {
    height: 200,
    borderRadius: r.lg,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: spacing.md,
  },
  expandBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: r.pill,
  },
  expandText: { color: colors.white, fontSize: 13, fontWeight: "700" },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  sliderLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  sliderValue: { fontSize: 14, fontWeight: "700", color: colors.primary },
  slider: { width: "100%", height: 40 },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: r.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  applyText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});

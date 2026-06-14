// MapScreen — full-screen interactive map with two distinct modes.
//
//   ┌─────────────────────────────────────────────────────────────┐
//   │  ‹      [ Adjust area | All listings ]            (count)     │
//   │                                                              │
//   │                      M A P                                   │
//   │                                                              │
//   │  ADJUST AREA mode:  draggable pin + radius circle + slider   │
//   │                     + "Search this area" (returns the area). │
//   │  ALL LISTINGS mode: every listing shown as a marker, with no │
//   │                     pin/circle — purely for browsing where   │
//   │                     things are. Separate from picking area.  │
//   └─────────────────────────────────────────────────────────────┘
//
// "Adjust area" hands { latitude, longitude, radius } back via onConfirm.

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import Slider from "@react-native-community/slider";

import ListingMarker from "../components/ListingMarker";
import QuickPreviewModal from "../components/QuickPreviewModal";
import { fetchNearbyListings } from "../services/api";
import {
  PermissionStatus,
  ensureLocation,
} from "../services/locationService";
import { colors, radius as r, spacing } from "../theme";

// Fallback center (Tangier) used when we open the map without a GPS fix.
const DEFAULT_CENTER = { latitude: 35.7595, longitude: -5.834 };

const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;

// Radius (km) large enough to cover every listing for the "All listings" mode.
const ALL_RADIUS_KM = 20000;

const FETCH_DEBOUNCE_MS = 400;

function deltaForRadius(radiusKm) {
  const delta = (radiusKm / 111) * 3;
  return Math.min(Math.max(delta, 0.02), 1.5);
}

export default function MapScreen({
  initialLocation = null,
  initialRadius = 10,
  onConfirm,
  onBack,
}) {
  const [mode, setMode] = useState("area"); // "area" | "all"
  const [center, setCenter] = useState(initialLocation || DEFAULT_CENTER);
  const [searchRadius, setSearchRadius] = useState(initialRadius);

  const [listings, setListings] = useState([]); // within radius (area mode)
  const [allListings, setAllListings] = useState([]); // everything (all mode)
  const [loadingListings, setLoadingListings] = useState(false);
  const [locating, setLocating] = useState(false);

  const [selectedListing, setSelectedListing] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const mapRef = useRef(null);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const initialRegion = {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: deltaForRadius(searchRadius),
    longitudeDelta: deltaForRadius(searchRadius),
  };

  // ---- Area-mode: live listings within the radius (debounced) ----
  const loadListings = useCallback(async (lat, lng, rad) => {
    const requestId = ++requestIdRef.current;
    setLoadingListings(true);
    try {
      const data = await fetchNearbyListings({ latitude: lat, longitude: lng, radius: rad });
      if (requestId === requestIdRef.current) {
        setListings(Array.isArray(data) ? data : []);
      }
    } catch {
      if (requestId === requestIdRef.current) setListings([]);
    } finally {
      if (requestId === requestIdRef.current) setLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    if (mode !== "area") return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadListings(center.latitude, center.longitude, searchRadius);
    }, FETCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mode, center.latitude, center.longitude, searchRadius, loadListings]);

  // ---- All-mode: fetch every listing once when entering the mode ----
  const loadAllListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const data = await fetchNearbyListings({
        latitude: center.latitude,
        longitude: center.longitude,
        radius: ALL_RADIUS_KM,
      });
      setAllListings(Array.isArray(data) ? data : []);
    } catch {
      setAllListings([]);
    } finally {
      setLoadingListings(false);
    }
    // center is intentionally read at call time; we only refetch on mode switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "all") loadAllListings();
  }, [mode, loadAllListings]);

  // ---- Interactions ----
  const moveCenter = useCallback((coordinate, recenterMap = false) => {
    setCenter(coordinate);
    setModalVisible(false);
    setSelectedListing(null);
    if (recenterMap && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          latitudeDelta: deltaForRadius(searchRadius),
          longitudeDelta: deltaForRadius(searchRadius),
        },
        500
      );
    }
  }, [searchRadius]);

  const handleMapPress = (event) => {
    // Tapping the map only repositions the search center in "area" mode.
    if (mode === "area") moveCenter(event.nativeEvent.coordinate);
  };

  const handleUseGps = async () => {
    setLocating(true);
    const result = await ensureLocation();
    setLocating(false);
    if (result.status === PermissionStatus.GRANTED) {
      moveCenter({ latitude: result.latitude, longitude: result.longitude }, true);
    }
  };

  const handleMarkerPress = (listing) => {
    setSelectedListing(listing);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedListing(null);
  };

  const handleConfirm = () => {
    onConfirm?.({
      latitude: center.latitude,
      longitude: center.longitude,
      radius: searchRadius,
    });
  };

  const isArea = mode === "area";
  const markers = isArea ? listings : allListings;
  const count = markers.length;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Area mode only: search circle + draggable center pin. */}
        {isArea && searchRadius > 0 && (
          <Circle
            center={center}
            radius={searchRadius * 1000}
            strokeColor={colors.searchCircleStroke}
            fillColor={colors.searchCircleFill}
            strokeWidth={2}
          />
        )}
        {isArea && (
          <Marker
            coordinate={center}
            draggable
            onDragEnd={(e) => moveCenter(e.nativeEvent.coordinate)}
            pinColor={colors.primary}
            title="Search center"
            description="Drag or tap the map to move"
          />
        )}

        {/* Listing markers (within radius in area mode; everything in all mode). */}
        {markers.map((listing) => (
          <ListingMarker
            key={String(listing.id)}
            listing={listing}
            isSelected={selectedListing?.id === listing.id}
            onPress={() => handleMarkerPress(listing)}
          />
        ))}
      </MapView>

      {/* Top bar: back + mode toggle + live count. */}
      <View style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.iconButton} onPress={onBack} hitSlop={10}>
          <Text style={styles.iconButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentBtn, isArea && styles.segmentBtnActive]}
            onPress={() => setMode("area")}
          >
            <Text style={[styles.segmentText, isArea && styles.segmentTextActive]}>
              Adjust area
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, !isArea && styles.segmentBtnActive]}
            onPress={() => setMode("all")}
          >
            <Text style={[styles.segmentText, !isArea && styles.segmentTextActive]}>
              All listings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Count badge. */}
      <View style={styles.countBadge}>
        {loadingListings ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.countText}>
            {isArea
              ? `${count} item${count === 1 ? "" : "s"} · ${searchRadius} km`
              : `${count} listing${count === 1 ? "" : "s"} total`}
          </Text>
        )}
      </View>

      {/* GPS / locate button — only relevant when adjusting the area. */}
      {isArea && (
        <TouchableOpacity style={styles.gpsButton} onPress={handleUseGps} disabled={locating}>
          {locating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.gpsButtonText}>📍</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Bottom sheet: area mode = radius + confirm; all mode = info note. */}
      {isArea ? (
        <View style={styles.sheet}>
          <Text style={styles.hint}>
            Tap the map or drag the pin to choose where to search.
          </Text>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Search Radius</Text>
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
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Search this area</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sheet}>
          <Text style={styles.allTitle}>Browsing all listings</Text>
          <Text style={styles.hint}>
            Tap a marker to preview it. Switch to “Adjust area” to set your
            search location and radius.
          </Text>
        </View>
      )}

      <QuickPreviewModal
        listing={selectedListing}
        visible={modalVisible}
        onClose={handleCloseModal}
        onViewMore={isArea ? handleConfirm : handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  topBar: {
    position: "absolute",
    top: 50,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    marginRight: spacing.md,
  },
  iconButtonText: { fontSize: 28, color: colors.text, lineHeight: 30 },
  segment: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: r.pill,
    padding: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: r.pill,
    alignItems: "center",
  },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  segmentTextActive: { color: colors.white },
  countBadge: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: r.pill,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  countText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  gpsButton: {
    position: "absolute",
    right: spacing.lg,
    bottom: 220,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  gpsButtonText: { fontSize: 22 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 8,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  allTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
  sliderValue: { fontSize: 15, fontWeight: "700", color: colors.primary },
  slider: { width: "100%", height: 40, marginBottom: spacing.sm },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: r.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  confirmText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});

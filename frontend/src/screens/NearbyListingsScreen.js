// NearbyListingsScreen — renders the results returned by the backend.
//
// Layout:
//   [ NavBar with logo ]                 ← brand bar (left: back, right: Filters)
//   [ location + radius summary row ]
//   [ MapFilter panel ]  (collapsible)   ← map to change location / radius
//   [ 2-column grid of listings ]
//
// Tapping "Filters" reveals the map filter under the logo; applying it updates
// the search center/radius and re-runs the query. Receives the initial
// { latitude, longitude, radius } and an onBack handler.

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ListingCard from "../components/ListingCard";
import MapFilter from "../components/MapFilter";
import NavBar from "../components/NavBar";
import MapScreen from "./MapScreen";
import { fetchNearbyListings } from "../services/api";
import { reverseGeocode } from "../services/locationService";
import { colors, radius as r, spacing } from "../theme";

// Demo area where the sample listings live (Tangier). Used as a fallback so
// products are always shown even when the user's real GPS location has none.
const DEMO_LOCATION = { latitude: 35.76, longitude: -5.83 };
const FALLBACK_RADIUS_KM = 100;

export default function NearbyListingsScreen({ params, onBack }) {
  // Active search params live in state so the in-screen filter can update them.
  const [search, setSearch] = useState({
    latitude: params?.latitude ?? null,
    longitude: params?.longitude ?? null,
    radius: params?.radius ?? 10,
  });
  const [showFilter, setShowFilter] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listings, setListings] = useState([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [locationLabel, setLocationLabel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsedFallback(false);
    try {
      let lat = search.latitude;
      let lng = search.longitude;
      let fallback = false;

      // No location set? Start from the demo area.
      if (lat == null || lng == null) {
        lat = DEMO_LOCATION.latitude;
        lng = DEMO_LOCATION.longitude;
        fallback = true;
      }

      let data = await fetchNearbyListings({
        latitude: lat,
        longitude: lng,
        radius: fallback ? FALLBACK_RADIUS_KM : search.radius,
      });

      // Real location returned nothing nearby -> fall back to the demo area
      // so the user always sees products.
      if ((!data || data.length === 0) && !fallback) {
        data = await fetchNearbyListings({
          latitude: DEMO_LOCATION.latitude,
          longitude: DEMO_LOCATION.longitude,
          radius: FALLBACK_RADIUS_KM,
        });
        fallback = true;
      }

      setListings(data || []);
      setUsedFallback(fallback);

      // Resolve a friendly label for the (real) search center.
      if (search.latitude != null && search.longitude != null) {
        const label = await reverseGeocode(search.latitude, search.longitude);
        setLocationLabel(label);
      } else {
        setLocationLabel(null);
      }
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          "Could not reach the server. Check your API URL and that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApplyFilter = (next) => {
    setShowFilter(false);
    setMapModalVisible(false);
    setSearch({
      latitude: next.latitude,
      longitude: next.longitude,
      radius: next.radius,
    });
  };

  const headerLabel = usedFallback
    ? "Tangier, Morocco"
    : locationLabel || "Your area";

  return (
    <SafeAreaView style={styles.safe}>
      <NavBar
        left={{ label: "‹", big: true, onPress: onBack }}
        right={{
          label: showFilter ? "Close" : "Filters",
          active: showFilter,
          onPress: () => setShowFilter((v) => !v),
        }}
      />

      {/* Location + radius summary under the logo. */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText} numberOfLines={1}>
          📍 {headerLabel} · {search.radius} km
        </Text>
      </View>

      {/* Collapsible map filter, directly under the logo/summary. */}
      {showFilter && (
        <MapFilter
          initialCenter={
            search.latitude != null
              ? { latitude: search.latitude, longitude: search.longitude }
              : null
          }
          initialRadius={search.radius}
          onApply={handleApplyFilter}
          onExpand={() => setMapModalVisible(true)}
        />
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>Finding items near you…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.muted}>
            No products available right now. Try widening the radius in Filters.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.column}
          renderItem={({ item }) => <ListingCard listing={item} />}
          ListHeaderComponent={
            <View>
              {usedFallback && (
                <View style={styles.banner}>
                  <Text style={styles.bannerText}>
                    Showing sample products near Tangier (no items found at your
                    exact location).
                  </Text>
                </View>
              )}
              <Text style={styles.resultsCount}>
                {listings.length} result{listings.length === 1 ? "" : "s"} nearby
              </Text>
            </View>
          }
        />
      )}

      {/* Full-screen map opened from the filter preview. */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <MapScreen
          initialLocation={
            search.latitude != null
              ? { latitude: search.latitude, longitude: search.longitude }
              : null
          }
          initialRadius={search.radius}
          onConfirm={handleApplyFilter}
          onBack={() => setMapModalVisible(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  muted: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: r.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  retryText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  listContent: {
    padding: spacing.sm,
  },
  column: {
    justifyContent: "space-between",
  },
  resultsCount: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  banner: {
    backgroundColor: "#E7F3FF",
    borderRadius: r.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  bannerText: {
    fontSize: 13,
    color: colors.primaryDark,
  },
});

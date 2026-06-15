import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import RadiusSelector from "../components/RadiusSelector";
import { PermissionStatus, getLocation, getCityName } from "../services/locationService";
import { colors, radius as r, spacing } from "../theme";

export default function LocationSetupScreen({ onViewListings, onChooseOnMap }) {
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState(null);
  const [coords, setCoords] = useState(null);
  const [city, setCity] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10);

  const init = useCallback(async () => {
    setLoading(true);
    setCity(null);
    const result = await getLocation();
    setPermission(result.status);
    if (result.status === PermissionStatus.GRANTED) {
      setCoords({ latitude: result.latitude, longitude: result.longitude });
      const label = await getCityName(result.latitude, result.longitude);
      setCity(label);
    } else {
      setCoords(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const granted = permission === PermissionStatus.GRANTED && coords;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Getting your location…</Text>
      </SafeAreaView>
    );
  }

  if (!granted) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <View style={styles.deniedCard}>
          <Text style={styles.deniedEmoji}>📍</Text>
          <Text style={styles.deniedTitle}>Location needed</Text>
          <Text style={styles.deniedText}>
            We need your location to show nearby products. You can enable
            location access from your device settings.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={init}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              onChooseOnMap?.({ latitude: null, longitude: null, radius: searchRadius })
            }
          >
            <Text style={styles.secondaryButtonText}>Choose location on map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => onViewListings?.({ latitude: null, longitude: null, radius: searchRadius })}
          >
            <Text style={styles.secondaryButtonText}>
              Continue without location
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.header}>Find items near you</Text>
        <Text style={styles.subtitle}>
          Choose how far you'd like to search for products.
        </Text>

        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <Text style={styles.pin}>📍</Text>
            <Text style={styles.locationLabel}>Current Location</Text>
            <View style={styles.gpsBadge}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>GPS active</Text>
            </View>
          </View>

          {city ? (
            <Text style={styles.cityText}>{city}</Text>
          ) : (
            <Text style={styles.cityText}>
              {`Lat: ${coords.latitude.toFixed(4)}   Lng: ${coords.longitude.toFixed(4)}`}
            </Text>
          )}

          {city && (
            <Text style={styles.coordsText}>
              {`Lat: ${coords.latitude.toFixed(4)}   Lng: ${coords.longitude.toFixed(4)}`}
            </Text>
          )}
        </View>

        <RadiusSelector value={searchRadius} onChange={setSearchRadius} />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            onViewListings?.({
              latitude: coords.latitude,
              longitude: coords.longitude,
              radius: searchRadius,
            })
          }
        >
          <Text style={styles.primaryButtonText}>View Nearby Listings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            onChooseOnMap?.({
              latitude: coords.latitude,
              longitude: coords.longitude,
              radius: searchRadius,
            })
          }
        >
          <Text style={styles.secondaryButtonText}>Choose on map</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: r.lg,
    padding: spacing.lg,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pin: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.xs,
  },
  gpsText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
  },
  cityText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
  },
  coordsText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: r.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  deniedCard: {
    alignItems: "center",
  },
  deniedEmoji: {
    fontSize: 44,
    marginBottom: spacing.md,
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  deniedText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
});

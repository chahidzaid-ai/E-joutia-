import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import NavBar from "../components/NavBar";
import {
  PermissionStatus,
  getCoords,
  checkPermission,
  gpsEnabled,
  enableGps,
  askPermission,
} from "../services/locationService";
import { colors, radius as r, spacing } from "../theme";

const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LocatingScreen({ onLocated, onChooseOnMap }) {
  const [phase, setPhase] = useState("checking");
  const [message, setMessage] = useState("Getting your location…");
  const [note, setNote] = useState(null);
  const [canAskAgain, setCanAskAgain] = useState(true);

  const cancelledRef = useRef(false);
  const runningRef = useRef(false);
  const onLocatedRef = useRef(onLocated);
  const onChooseOnMapRef = useRef(onChooseOnMap);
  onLocatedRef.current = onLocated;
  onChooseOnMapRef.current = onChooseOnMap;

  const startLocating = async () => {
    setPhase("locating");
    setMessage("Getting your location…");
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const coords = await getCoords();
      if (cancelledRef.current) return;

      if (coords.success) {
        onLocatedRef.current?.({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        return;
      }

      setMessage(
        attempt < MAX_ATTEMPTS
          ? "Still pinpointing you… make sure GPS is on."
          : "Almost there…"
      );
      await sleep(RETRY_DELAY_MS);
      if (cancelledRef.current) return;
    }

    setNote("We couldn't get your location. Try again, or choose on the map.");
    setCanAskAgain(true);
    setPhase("choice");
  };

  const initialCheck = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      setPhase("checking");
      const [servicesOn, perm] = await Promise.all([
        gpsEnabled(),
        checkPermission(),
      ]);
      if (cancelledRef.current) return;

      if (perm.status === PermissionStatus.GRANTED && servicesOn) {
        await startLocating();
      } else {
        setCanAskAgain(perm.canAskAgain !== false);
        setNote(null);
        setPhase("choice");
      }
    } finally {
      runningRef.current = false;
    }
  };

  const chooseGps = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      setPhase("checking");

      let perm = await checkPermission();
      if (cancelledRef.current) return;

      if (perm.status !== PermissionStatus.GRANTED && perm.canAskAgain) {
        perm = await askPermission();
        if (cancelledRef.current) return;
      }

      if (perm.status !== PermissionStatus.GRANTED) {
        setCanAskAgain(perm.canAskAgain !== false);
        setNote(
          perm.canAskAgain !== false
            ? "Location permission is needed to use GPS."
            : "Enable location permission in Settings to use GPS."
        );
        setPhase("choice");
        return;
      }

      const servicesOn = await gpsEnabled();
      if (cancelledRef.current) return;
      if (!servicesOn) {
        setPhase("checking");
        const enabled = await enableGps();
        if (cancelledRef.current) return;
        if (!enabled) {
          setNote("Your device GPS is turned off. Turn it on, or choose on the map.");
          setPhase("choice");
          return;
        }
      }

      await startLocating();
    } finally {
      runningRef.current = false;
    }
  };

  useEffect(() => {
    cancelledRef.current = false;
    initialCheck();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "checking" || phase === "locating") {
    return (
      <SafeAreaView style={styles.safe}>
        <NavBar />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>
            {phase === "locating" ? message : "Checking location…"}
          </Text>
          <Text style={styles.hint}>Hang tight, this only takes a moment.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <NavBar />
      <View style={styles.center}>
        <Text style={styles.emoji}>📍</Text>
        <Text style={styles.title}>Location is off</Text>
        <Text style={styles.subtitle}>
          How would you like to find items near you?
        </Text>

        {note && <Text style={styles.note}>{note}</Text>}

        <TouchableOpacity style={styles.primaryButton} onPress={chooseGps}>
          <Text style={styles.primaryButtonText}>Use my GPS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => onChooseOnMapRef.current?.()}
        >
          <Text style={styles.outlineButtonText}>Choose on the map</Text>
        </TouchableOpacity>

        {canAskAgain === false && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.linkText}>Open settings</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  message: {
    marginTop: spacing.lg,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emoji: {
    fontSize: 44,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  note: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: r.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    alignSelf: "stretch",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: r.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: spacing.md,
  },
  outlineButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  linkButton: {
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
});

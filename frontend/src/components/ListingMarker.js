import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import categories from "../constants/categories";
import { accent, colors } from "../theme";

export default function ListingMarker({ listing, onPress, isSelected = false }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.3 : 1,
      friction: 5,
      tension: 80,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(timer);
  }, [scaleAnim, isSelected]);

  const category = categories[listing.category] || categories.other;
  const markerColor = category.color || colors.markers.other;
  const emoji = category.emoji || "📦";

  return (
    <Marker
      coordinate={{
        latitude: listing.latitude,
        longitude: listing.longitude,
      }}
      onPress={onPress}
      calloutEnabled={false}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 1 }}
    >
      <Animated.View
        style={[
          styles.markerContainer,
          {
            backgroundColor: markerColor,
            borderColor: isSelected ? accent : colors.white,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <View
          style={[
            styles.arrow,
            { borderTopColor: isSelected ? accent : colors.white },
          ]}
        />
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  emoji: { fontSize: 18 },
  arrow: {
    position: "absolute",
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.white,
  },
});

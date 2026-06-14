// App entry — state-based navigation between the screens.
//
//   HomeScreen ──(Go to Marketplace)──▶ LocatingScreen
//                                            │
//        ┌──────── permission GRANTED ───────┤
//        ▼                                   ▼ permission DENIED / no fix
//   NearbyListingsScreen ◀──(Apply / Search)── MapScreen
//        ▲                                         │
//        └─────────────(Search this area)──────────┘
//
// Flow rules:
//   • No GPS permission is requested until the user taps "Go to Marketplace".
//   • GRANTED → LocatingScreen spins and waits for a real coordinate, then goes
//     straight to the items list (which has an in-place map filter).
//   • DENIED / no fix → MapScreen so the user can pick a location + radius and
//     then continue to the items list.
//
// All screens speak the same { latitude, longitude, radius } contract.

import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";

import HomeScreen from "./src/screens/HomeScreen";
import LocatingScreen from "./src/screens/LocatingScreen";
import MapScreen from "./src/screens/MapScreen";
import NearbyListingsScreen from "./src/screens/NearbyListingsScreen";

const DEFAULT_RADIUS_KM = 10;

export default function App() {
  const [screen, setScreen] = useState("home"); // "home" | "locating" | "map" | "listings"
  const [searchParams, setSearchParams] = useState(null);
  // Seed values handed to the map (GPS coords + radius when available).
  const [mapSeed, setMapSeed] = useState(null);

  const goHome = () => setScreen("home");
  const goToLocating = () => setScreen("locating");

  const goToListings = (params) => {
    setSearchParams(params);
    setScreen("listings");
  };

  const goToMap = (seed) => {
    setMapSeed(seed || null);
    setScreen("map");
  };

  // GPS granted + coordinates obtained → straight to the items list.
  const handleLocated = (coords) => {
    goToListings({ ...coords, radius: DEFAULT_RADIUS_KM });
  };

  // GPS denied (or no fix) → let the user choose on the map first.
  const handleDenied = () => {
    goToMap({ latitude: null, longitude: null, radius: DEFAULT_RADIUS_KM });
  };

  let content;
  if (screen === "home") {
    content = <HomeScreen onEnterMarketplace={goToLocating} />;
  } else if (screen === "locating") {
    content = (
      <LocatingScreen onLocated={handleLocated} onChooseOnMap={handleDenied} />
    );
  } else if (screen === "map") {
    content = (
      <MapScreen
        initialLocation={
          mapSeed && mapSeed.latitude != null && mapSeed.longitude != null
            ? { latitude: mapSeed.latitude, longitude: mapSeed.longitude }
            : null
        }
        initialRadius={mapSeed?.radius ?? DEFAULT_RADIUS_KM}
        onConfirm={goToListings}
        onBack={goHome}
      />
    );
  } else {
    content = (
      <NearbyListingsScreen params={searchParams} onBack={goHome} />
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {content}
    </>
  );
}

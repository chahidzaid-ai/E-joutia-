import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";

import HomeScreen from "./src/screens/HomeScreen";
import LocatingScreen from "./src/screens/LocatingScreen";
import MapScreen from "./src/screens/MapScreen";
import NearbyListingsScreen from "./src/screens/NearbyListingsScreen";

const DEFAULT_RADIUS_KM = 10;

export default function App() {
  const [screen, setScreen] = useState("home");
  const [searchParams, setSearchParams] = useState(null);
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

  const handleLocated = (coords) => {
    goToListings({ ...coords, radius: DEFAULT_RADIUS_KM });
  };

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

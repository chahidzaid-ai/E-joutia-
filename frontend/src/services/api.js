// API integration service (Axios) for the e-Joutia backend.
//
// IMPORTANT: set API_BASE_URL to a host your device can reach.
//   - Android emulator:        http://10.0.2.2:8000
//   - iOS simulator:           http://127.0.0.1:8000
//   - Physical phone (Expo Go): http://<YOUR_PC_LAN_IP>:8000
//
// You can override it without editing code via an Expo env var:
//   EXPO_PUBLIC_API_URL=http://192.168.1.20:8000

import axios from "axios";

// Default points to this PC's LAN IP so a physical phone on the same Wi-Fi
// (via Expo Go) can reach the Django backend. Override with EXPO_PUBLIC_API_URL.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.52:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { Accept: "application/json" },
});

/**
 * Fetch listings near a coordinate within a radius (km).
 * @param {{latitude: number, longitude: number, radius: number}} params
 * @returns {Promise<Array>} listings with a computed `distance` field
 */
export async function fetchNearbyListings({ latitude, longitude, radius }) {
  const response = await client.get("/api/listings/nearby/", {
    params: { latitude, longitude, radius },
  });
  return response.data;
}

export default client;

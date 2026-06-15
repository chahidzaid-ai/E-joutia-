import axios from "axios";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.52:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { Accept: "application/json" },
});

export async function getNearbyListings({ latitude, longitude, radius }) {
  const response = await client.get("/api/listings/nearby/", {
    params: { latitude, longitude, radius },
  });
  return response.data;
}

export default client;

import * as Location from "expo-location";

export const PermissionStatus = {
  GRANTED: "granted",
  DENIED: "denied",
  ERROR: "error",
};

export async function gpsEnabled() {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return false;
  }
}

export async function enableGps() {
  try {
    await Location.enableNetworkProviderAsync();
    return true;
  } catch {
    return false;
  }
}

export async function checkPermission() {
  try {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    return {
      status: status === "granted" ? PermissionStatus.GRANTED : PermissionStatus.DENIED,
      canAskAgain,
    };
  } catch (error) {
    return { status: PermissionStatus.ERROR, canAskAgain: false, message: error?.message };
  }
}

export async function askPermission() {
  try {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    return {
      status: status === "granted" ? PermissionStatus.GRANTED : PermissionStatus.DENIED,
      canAskAgain,
    };
  } catch (error) {
    return { status: PermissionStatus.ERROR, canAskAgain: false, message: error?.message };
  }
}

export async function getCoords() {
  try {
    const last = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
    if (last) {
      return {
        success: true,
        latitude: last.coords.latitude,
        longitude: last.coords.longitude,
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      success: true,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    return { success: false, message: error?.message ?? "Unable to get location." };
  }
}

export async function getLocation() {
  const permission = await askPermission();
  if (permission.status !== PermissionStatus.GRANTED) {
    return permission;
  }
  const coords = await getCoords();
  if (!coords.success) {
    return { status: PermissionStatus.ERROR, message: coords.message };
  }
  return {
    status: PermissionStatus.GRANTED,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

export async function getCityName(latitude, longitude) {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!results || results.length === 0) return null;
    const place = results[0];
    const city = place.city || place.subregion || place.region;
    const country = place.country;
    return [city, country].filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}

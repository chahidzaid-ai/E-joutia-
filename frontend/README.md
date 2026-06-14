# e-Joutia Frontend (Member 1)

React Native (Expo) app for the **geolocation + nearby search** experience.

## Features

- GPS permission handling (granted / denied / error) via `expo-location`
- `LocationSetupScreen` — "Find items near you" (current location card,
  GPS status, radius selector, CTA)
- `RadiusSelector` — slider snapping to 1 / 5 / 10 / 20 / 50 km
- Axios API service that calls the Django backend
- `NearbyListingsScreen` — Facebook Marketplace–style 2-column results grid

## Requirements

- Node.js 18+
- Expo CLI (`npx expo`)
- The Django backend running (see `../backend/README.md`)

## Setup

```bash
cd frontend
npm install
npx expo start
```

Then open the app in **Expo Go** (scan the QR code) or an emulator.

## Configure the API URL

The app needs to reach the backend. Default is `http://10.0.2.2:8000`
(Android emulator). Override it for your environment:

| Environment            | API URL                       |
|------------------------|-------------------------------|
| Android emulator       | `http://10.0.2.2:8000`        |
| iOS simulator          | `http://127.0.0.1:8000`       |
| Physical phone (Expo)  | `http://<YOUR_PC_LAN_IP>:8000`|

Set it without editing code via an env var when starting Expo:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:8000 npx expo start
```

(or edit `API_BASE_URL` in `src/services/api.js`.)

## Project layout

```
frontend/
├── App.js                       # state-based navigation
├── app.json                     # expo config + location permission
├── index.js
└── src/
    ├── theme.js                 # colors / spacing tokens
    ├── services/
    │   ├── locationService.js   # permission + GPS + reverse geocode
    │   └── api.js               # Axios client + fetchNearbyListings()
    ├── components/
    │   ├── RadiusSelector.js
    │   └── ListingCard.js
    └── screens/
        ├── LocationSetupScreen.js
        └── NearbyListingsScreen.js
```

## Data flow

1. Request GPS permission and read the device location.
2. User picks a search radius.
3. `fetchNearbyListings({ latitude, longitude, radius })` calls
   `GET /api/listings/nearby/`.
4. Results (each with a computed `distance`) render in the grid.

The Map module can reuse the same params and API response directly.

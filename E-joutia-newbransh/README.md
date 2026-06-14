# e-Joutia — Géolocalisation & Cartographie des annonces

e-Joutia est une marketplace mobile qui permet de découvrir les annonces
**autour de soi**. Ce projetimplémente la géolocalisation de l'utilisateur, la recherche d'annonces par
rayon, le calcul de distance et leur affichage sur une carte interactive.

## Fonctionnalités

- 📍 Détection de la position GPS de l'utilisateur (gestion des permissions).
- 🎯 Recherche des annonces dans un rayon configurable (1 / 5 / 10 / 20 / 50 km).
- 📏 Calcul de distance par la formule de Haversine, tri du plus proche au plus loin.
- 🗺️ Carte interactive avec marqueurs par catégorie et cercle de rayon.
- 🧱 Vue liste façon « marketplace » (grille 2 colonnes) et aperçu rapide.
- 🌍 Endpoint REST `GET /api/listings/nearby/` filtré par rayon.

## Architecture

```
E-joutia/
├── backend/            API REST Django + DRF (recherche géolocalisée)
├── frontend/           App Expo / React Native (carte, liste, marqueurs)
├── start-all.bat       Installe et lance backend + frontend (Windows)
├── start-backend.bat   Lance uniquement l'API Django
└── start-frontend.bat  Lance uniquement le serveur Expo
```

## Stack technique

| Couche    | Technologies |
|-----------|--------------|
| Frontend  | Expo `~54`, React Native `0.81`, `react-native-maps`, `expo-location`, `axios`, `@react-native-community/slider` |
| Backend   | Django, Django REST Framework |
| Base de données | SQLite (développement) |
| Géospatial | Formule de Haversine (rayon terrestre 6371 km) |

## Démarrage rapide

### Option 1 — Windows (un clic)

À la racine du projet :

```bat
start-all.bat
```

Ce script installe les dépendances backend (pip) et frontend (npm), applique
les migrations Django, puis ouvre deux fenêtres : l'API Django et le serveur
Expo (avec le QR code à scanner depuis Expo Go).

### Option 2 — Manuel

**Backend (Django)**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows : .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata sample_listings   # données d'exemple (optionnel)
python manage.py runserver 0.0.0.0:8000
```

> Utilisez `0.0.0.0:8000` pour qu'un téléphone physique sur le même Wi-Fi
> puisse joindre l'API via `http://<IP_DU_PC>:8000`.

**Frontend (Expo)**

```bash
cd frontend
npm install
npx expo start
```

Scannez le QR code avec **Expo Go** ou lancez un émulateur.

## Configuration de l'URL de l'API

Le frontend doit pouvoir joindre le backend. Définissez l'URL selon votre
environnement (sans modifier le code) via une variable d'environnement Expo :

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:8000 npx expo start
```

| Environnement              | URL de l'API                    |
|----------------------------|---------------------------------|
| Émulateur Android          | `http://10.0.2.2:8000`          |
| Simulateur iOS             | `http://127.0.0.1:8000`         |
| Téléphone physique (Expo)  | `http://<IP_LAN_DU_PC>:8000`    |

Sinon, modifiez `API_BASE_URL` dans `frontend/src/services/api.js`.

## API — recherche d'annonces à proximité

### `GET /api/listings/nearby/`

Renvoie les annonces situées dans un rayon de `radius` km autour des
coordonnées fournies, triées du plus proche au plus loin.

| Paramètre  | Type  | Requis | Défaut | Notes |
|------------|-------|--------|--------|-------|
| `latitude` | float | oui    | —      | -90 .. 90 |
| `longitude`| float | oui    | —      | -180 .. 180 |
| `radius`   | float | non    | 10     | en km, doit être > 0 |

**Exemple**

```
GET /api/listings/nearby/?latitude=35.76&longitude=-5.83&radius=10
```

**Réponse `200 OK`** — chaque annonce inclut un champ `distance` calculé (km) :

```json
[
  {
    "id": 4,
    "title": "Laptop gaming",
    "description": "...",
    "price": "0.00",
    "image": null,
    "latitude": 35.761,
    "longitude": -5.829,
    "distance": 0.1,
    "created_at": "2026-06-04T14:45:00Z"
  }
]
```

**Erreurs `400 Bad Request`** — paramètre manquant/invalide, coordonnées hors
limites, ou rayon non positif :

```json
{ "detail": "'latitude' is required." }
```

### Catégories

`electronics`, `vehicles`, `furniture`, `sports`, `clothing`, `books`, `home`,
`services`, `other`. Les clés sont partagées entre le backend
(`listings/models.py`) et le frontend (`src/constants/categories.js`).

## Flux applicatif

1. L'app demande la permission de localisation puis lit la position GPS.
2. L'utilisateur choisit un rayon de recherche.
3. `fetchNearbyListings({ latitude, longitude, radius })` appelle
   `GET /api/listings/nearby/`.
4. Les résultats (avec leur `distance`) s'affichent dans la liste et sur la carte.

## Structure du code

```
backend/
└── listings/
    ├── models.py        # modèle Listing
    ├── serializers.py   # ListingSerializer (+ distance calculée)
    ├── utils.py         # haversine_km()
    ├── views.py         # endpoint nearby_listings
    ├── tests.py
    └── fixtures/sample_listings.json

frontend/
└── src/
    ├── services/        # locationService.js (GPS), api.js (Axios)
    ├── components/      # ListingCard, ListingMarker, QuickPreviewModal, RadiusSelector
    ├── constants/       # categories.js
    └── screens/         # LocationSetupScreen, NearbyListingsScreen, MapScreen
```

## Tests

```bash
cd backend
python manage.py test listings
```

Couvre le calcul Haversine ainsi que le filtrage par rayon et la validation
des paramètres de l'endpoint.

## Documentation détaillée

- Backend : [`backend/README.md`](backend/README.md)
- Frontend : [`frontend/README.md`](frontend/README.md)

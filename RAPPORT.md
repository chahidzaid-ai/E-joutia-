# Rapport de projet — e-Joutia
## Géolocalisation et cartographie des annonces

---

### Fiche signalétique

| Élément | Détail |
|---|---|
| **Nom du projet** | e-Joutia — Marketplace de petites annonces géolocalisées |
| **Module / fonctionnalité** | Géolocalisation, recherche par rayon et cartographie des annonces |
| **Branche Git** | `geolocalisation-cartographie-annonces` |
| **Type d'application** | Application mobile (client) + API REST (serveur) |
| **Dépôt** | `chahidzaid-ai/E-joutia` |

---

## 1. Introduction et contexte

e-Joutia est une application mobile de petites annonces (marketplace) inspirée
des places de marché de proximité. L'idée centrale est de permettre à un
utilisateur de **découvrir les produits disponibles autour de lui**, sur une
carte, en fonction de sa position et d'un rayon de recherche qu'il choisit
lui-même.

Ce rapport documente le périmètre **« géolocalisation et cartographie des
annonces »**, qui couvre :

- la récupération de la position GPS de l'utilisateur ;
- le calcul de la distance entre l'utilisateur et chaque annonce ;
- le filtrage des annonces par rayon (recherche de proximité) ;
- la restitution des résultats sous forme de **liste** et de **carte
  interactive**.

### 1.1 Objectifs

1. Obtenir la position de l'utilisateur de façon fiable, avec une gestion
   propre des permissions et des cas d'échec.
2. Offrir une recherche d'annonces « à proximité » via une API REST dédiée.
3. Calculer une distance exacte (formule de Haversine) et trier les résultats
   du plus proche au plus loin.
4. Proposer une expérience cartographique : choix manuel du centre de
   recherche, cercle de rayon dynamique, marqueurs par catégorie et aperçu
   rapide d'une annonce.

---

## 2. Architecture générale

Le projet suit une architecture **client / serveur** découplée :

```
┌─────────────────────────────┐         HTTP / JSON          ┌──────────────────────────────┐
│         FRONTEND            │  ─────────────────────────▶  │           BACKEND             │
│   Expo / React Native       │   GET /api/listings/nearby/  │       Django + DRF            │
│                             │                              │                               │
│  • expo-location (GPS)      │  ◀─────────────────────────  │  • Modèle Listing             │
│  • react-native-maps (carte)│      Annonces + distance     │  • Calcul Haversine           │
│  • axios (appels API)       │                              │  • Filtrage par rayon         │
└─────────────────────────────┘                              └──────────────────────────────┘
                                                                          │
                                                                          ▼
                                                                  ┌───────────────┐
                                                                  │  SQLite (db)  │
                                                                  └───────────────┘
```

Les deux parties partagent un **contrat de données commun** :
`{ latitude, longitude, radius }` en entrée, et une liste d'annonces enrichies
d'un champ `distance` en sortie.

### 2.1 Organisation du dépôt

```
E-joutia/
├── backend/                     API REST Django
│   ├── ejoutia/                 Configuration du projet (settings, urls)
│   ├── listings/                Application métier des annonces
│   │   ├── models.py            Modèle Listing
│   │   ├── serializers.py       Sérialisation + champ distance
│   │   ├── utils.py             Fonction haversine_km()
│   │   ├── views.py             Endpoint nearby_listings
│   │   ├── tests.py             Tests unitaires et d'API
│   │   ├── fixtures/            Données d'exemple
│   │   └── management/commands/ Commande de seed
│   ├── manage.py
│   └── requirements.txt
├── frontend/                    Application Expo / React Native
│   └── src/
│       ├── services/            locationService.js (GPS), api.js (Axios)
│       ├── components/          ListingCard, ListingMarker, QuickPreviewModal, RadiusSelector
│       ├── constants/           categories.js
│       ├── screens/             LocationSetupScreen, MapScreen, NearbyListingsScreen
│       └── theme.js             Couleurs, espacements, rayons
├── start-all.bat                Lancement complet (Windows)
├── start-backend.bat            Lancement de l'API seule
└── start-frontend.bat           Lancement d'Expo seul
```

---

## 3. Technologies utilisées

### 3.1 Backend

| Technologie | Rôle | Justification |
|---|---|---|
| **Python / Django** | Framework web | Productif, robuste, ORM intégré |
| **Django REST Framework** | Construction de l'API REST | Sérialisation, vues, rendu JSON et navigable |
| **django-cors-headers** | Gestion CORS | Autoriser l'app Expo à appeler l'API en développement |
| **SQLite** | Base de données | Léger, sans configuration, adapté au développement |

### 3.2 Frontend

| Technologie | Rôle |
|---|---|
| **Expo (~54) / React Native (0.81)** | Application mobile multiplateforme (iOS, Android, Web) |
| **expo-location (~19)** | Permissions GPS, position courante, reverse-geocoding |
| **react-native-maps (1.20)** | Carte interactive, marqueurs, cercle de rayon |
| **@react-native-community/slider** | Curseur de sélection du rayon |
| **axios** | Appels HTTP vers l'API |

---

## 4. Le backend — API de recherche de proximité

### 4.1 Le modèle de données `Listing`

Une annonce est représentée par le modèle `Listing` (`listings/models.py`) :

| Champ | Type | Description |
|---|---|---|
| `title` | CharField(150) | Titre de l'annonce |
| `description` | TextField | Description (optionnelle) |
| `price` | DecimalField(10,2) | Prix |
| `category` | CharField (choix) | Catégorie (défaut : `other`) |
| `image` | ImageField | Photo (optionnelle) |
| `latitude` | FloatField | Latitude de l'annonce |
| `longitude` | FloatField | Longitude de l'annonce |
| `created_at` | DateTimeField | Date de création (auto) |

Les annonces sont triées par défaut du plus récent au plus ancien
(`ordering = ["-created_at"]`). Les **clés de catégorie** sont volontairement
identiques côté backend et côté frontend (`electronics`, `vehicles`,
`furniture`, `sports`, `clothing`, `books`, `home`, `services`, `other`) afin
que les marqueurs de la carte restent cohérents.

> Remarque : le champ `distance` **n'est pas stocké** en base. Il est calculé
> à la volée et ajouté à chaque annonce par la vue de recherche, puis exposé
> par le sérialiseur.

### 4.2 Le calcul de distance (formule de Haversine)

Le cœur géospatial du projet est la fonction `haversine_km()`
(`listings/utils.py`). Elle calcule la **distance orthodromique**
(« à vol d'oiseau ») entre deux points à la surface de la Terre, en
kilomètres, à partir de leurs coordonnées géographiques.

```python
EARTH_RADIUS_KM = 6371.0

def haversine_km(lat1, lon1, lat2, lon2):
    lat1_r, lon1_r, lat2_r, lon2_r = map(radians, (lat1, lon1, lat2, lon2))
    dlat = lat2_r - lat1_r
    dlon = lon2_r - lon1_r
    a = sin(dlat / 2) ** 2 + cos(lat1_r) * cos(lat2_r) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return round(EARTH_RADIUS_KM * c, 1)
```

Principe : on convertit les degrés en radians, on applique la formule de
Haversine puis on multiplie par le rayon moyen de la Terre (6371 km). Le
résultat est arrondi à une décimale.

> La même logique est volontairement dupliquée côté frontend
> (`calculateDistance` dans `locationService.js`) pour des estimations locales,
> mais le backend reste la **source de vérité**.

### 4.3 L'endpoint `GET /api/listings/nearby/`

C'est le point d'entrée principal de la fonctionnalité (`listings/views.py`).

**Paramètres de requête**

| Paramètre | Type | Requis | Défaut | Contrainte |
|---|---|---|---|---|
| `latitude` | float | oui | — | −90 à 90 |
| `longitude` | float | oui | — | −180 à 180 |
| `radius` | float | non | 10 | > 0 (en km) |

**Algorithme**

1. Lecture et validation des paramètres (type, présence, plages de valeurs).
2. Parcours de toutes les annonces ; pour chacune, calcul de la distance via
   `haversine_km()`.
3. Conservation des annonces dont la distance ≤ rayon demandé.
4. Tri du résultat du plus proche au plus loin.
5. Sérialisation et renvoi en JSON avec le champ `distance`.

**Exemple de requête**

```
GET /api/listings/nearby/?latitude=35.76&longitude=-5.83&radius=10
```

**Exemple de réponse `200 OK`**

```json
[
  {
    "id": 4,
    "title": "Laptop gaming",
    "description": "...",
    "price": "4500.00",
    "category": "electronics",
    "image": "http://192.168.100.52:8000/media/listings/laptop.jpg",
    "latitude": 35.761,
    "longitude": -5.829,
    "distance": 0.1,
    "created_at": "2026-06-04T14:45:00Z"
  }
]
```

**Gestion des erreurs `400 Bad Request`**

| Cas | Message renvoyé |
|---|---|
| Paramètre manquant | `"'latitude' is required."` |
| Valeur non numérique | `"'latitude' must be a valid number."` |
| Coordonnées hors limites | `"Coordinates out of range."` |
| Rayon ≤ 0 | `"'radius' must be greater than 0."` |

### 4.4 Sérialisation

`ListingSerializer` (`listings/serializers.py`) expose les champs du modèle,
ajoute le champ calculé `distance` (lecture seule) et transforme l'image en
**URL absolue** (`get_image`) pour qu'elle soit directement affichable sur le
téléphone.

### 4.5 Configuration notable

- `CORS_ALLOW_ALL_ORIGINS = True` et `ALLOWED_HOSTS = ["*"]` en développement,
  pour que l'app Expo (sur un autre appareil du même Wi-Fi) puisse appeler
  l'API.
- Fuseau horaire `Africa/Casablanca`, base SQLite, fichiers média servis en
  mode `DEBUG`.

---

## 5. Le frontend — application mobile

### 5.1 Navigation

L'application utilise une navigation simple basée sur l'état (`App.js`), avec
trois écrans :

```
LocationSetupScreen ──(Voir les annonces)──────────────▶ NearbyListingsScreen
       │                                                        ▲
       └────(Choisir sur la carte)──▶ MapScreen ──(Rechercher)─┘
```

Tous les écrans échangent le même contrat `{ latitude, longitude, radius }`.

### 5.2 Service de localisation (`locationService.js`)

Construit sur `expo-location`, il centralise :

- `requestLocationPermission()` — demande la permission GPS au premier plan ;
- `getCurrentLocation()` — récupère les coordonnées courantes ;
- `ensureLocation()` — enchaîne permission + position en un seul appel ;
- `reverseGeocode()` — convertit des coordonnées en libellé « Ville, Pays » ;
- `calculateDistance()` — version client de la formule de Haversine.

Les fonctions renvoient des objets simples avec un champ `status`
(`granted` / `denied` / `error`), ce qui permet aux écrans de réagir sans
gérer d'exceptions.

### 5.3 Écran de configuration (`LocationSetupScreen`)

Au démarrage, l'écran demande la permission et la position, puis affiche :

- la **localisation courante** (ville si disponible, sinon coordonnées) ;
- un **badge GPS actif** ;
- un sélecteur de **rayon** (1 / 5 / 10 / 20 / 50 km).

En cas de refus de permission, un écran de repli convivial propose : *Réessayer*,
*Choisir sur la carte*, ou *Continuer sans localisation* (mode démonstration).

### 5.4 Écran cartographique (`MapScreen`)

C'est la pièce maîtresse de la cartographie. Il permet de définir le centre de
recherche de trois façons :

1. **Manuel** — toucher la carte ou faire glisser l'épingle ;
2. **GPS** — bouton de localisation pour se recentrer sur l'appareil ;
3. **Repli** — centre par défaut (Tanger) si aucune position.

Caractéristiques techniques notables :

- un **cercle bleu semi-transparent** matérialise la zone de recherche et se
  redimensionne en direct avec le curseur de rayon (`Circle`, rayon converti
  de km en mètres) ;
- les annonces situées dans le rayon sont **chargées en direct** depuis l'API
  et affichées comme marqueurs (`ListingMarker`) ;
- les appels sont **temporisés** (debounce de 400 ms) pour ne pas surcharger
  le serveur à chaque micro-déplacement ;
- un **jeton de requête monotone** évite qu'une réponse lente n'écrase une
  réponse plus récente ;
- toucher un marqueur ouvre un **aperçu rapide** (`QuickPreviewModal`) ;
- le bouton « Search this area » renvoie `{ latitude, longitude, radius }` à
  l'application.

### 5.5 Écran de résultats (`NearbyListingsScreen`)

Affiche les annonces renvoyées par l'API dans une **grille à deux colonnes**
de style marketplace, avec un en-tête de localisation et le nombre de
résultats. Une logique de **repli intelligent** garantit qu'on voit toujours
des produits : si la position réelle ne renvoie rien, l'écran interroge la zone
de démonstration (Tanger) avec un rayon élargi et affiche une bannière
explicative.

### 5.6 Configuration de l'URL de l'API

Le frontend cible l'API via `API_BASE_URL` (`src/services/api.js`),
surchargeable sans modifier le code grâce à la variable d'environnement Expo
`EXPO_PUBLIC_API_URL` :

| Environnement | URL |
|---|---|
| Émulateur Android | `http://10.0.2.2:8000` |
| Simulateur iOS | `http://127.0.0.1:8000` |
| Téléphone physique (Expo Go) | `http://<IP_LAN_DU_PC>:8000` |

---

## 6. Flux complet (de bout en bout)

1. L'utilisateur ouvre l'application ; celle-ci demande la **permission GPS**.
2. La position est récupérée puis convertie en nom de ville (reverse-geocoding).
3. L'utilisateur choisit un **rayon** de recherche.
4. (Optionnel) Il ajuste le **centre** de recherche sur la carte.
5. Le frontend appelle `GET /api/listings/nearby/` avec
   `latitude`, `longitude`, `radius`.
6. Le backend calcule la **distance** de chaque annonce, **filtre** par rayon
   et **trie** du plus proche au plus loin.
7. Les annonces (avec leur distance) s'affichent sous forme de **liste** et de
   **marqueurs** sur la carte.

---

## 7. Tests

Les tests sont définis dans `backend/listings/tests.py` et couvrent :

- **`HaversineTests`** : distance nulle pour un point identique, et
  cohérence/arrondi pour deux points connus ;
- **`NearbyListingsApiTests`** : filtrage correct par rayon (une annonce
  proche incluse, une lointaine exclue) et renvoi d'une erreur `400` lorsqu'un
  paramètre obligatoire est manquant.

Exécution :

```bash
cd backend
python manage.py test listings
```

---

## 8. Mise en route du projet

### 8.1 Lancement automatique (Windows)

```bat
start-all.bat
```

Installe les dépendances backend et frontend, applique les migrations, puis
ouvre deux fenêtres (API Django + serveur Expo avec QR code).

### 8.2 Lancement manuel

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

**Frontend**

```bash
cd frontend
npm install
npx expo start
```

---

## 9. Choix de conception et points forts

- **Séparation claire des responsabilités** : services (GPS, API), composants
  d'affichage, écrans et constantes sont isolés.
- **Source de vérité unique** pour les couleurs et catégories, partagée entre
  la carte et la liste.
- **Robustesse réseau** : temporisation des requêtes, gestion des réponses
  obsolètes, repli sur des données de démonstration.
- **Expérience dégradée maîtrisée** : refus de permission, absence de réseau ou
  zone sans annonce sont tous gérés avec des messages clairs.
- **Validation côté serveur** des coordonnées et du rayon.

---

## 10. Limites et perspectives

**Limites actuelles**

- Base SQLite et configuration permissive (`DEBUG`, CORS ouvert) : adaptés au
  développement, pas à la production.
- Le filtrage par rayon parcourt toutes les annonces en mémoire (suffisant pour
  un jeu de données réduit).
- Pas encore d'authentification ni de création d'annonce depuis l'application.

**Perspectives d'évolution**

- Passer à **PostgreSQL + PostGIS** et utiliser des requêtes géospatiales
  indexées pour passer à l'échelle.
- Ajouter l'**authentification** et la publication d'annonces avec photo.
- Introduire des **filtres** (catégorie, prix) et la **pagination**.
- Mettre en place un **cache** et la mise à jour en temps réel des annonces
  proches.

---

## 11. Conclusion

Le module de géolocalisation et de cartographie d'e-Joutia atteint son
objectif : permettre à un utilisateur de trouver, sur une carte, les annonces
autour de lui dans un rayon choisi. L'architecture client/serveur, le calcul
de distance par la formule de Haversine, l'API de recherche de proximité et
l'interface cartographique interactive constituent une base fonctionnelle,
testée et extensible, prête à accueillir des fonctionnalités plus avancées
(authentification, filtres, montée en charge).

# e-Joutia Backend (Member 1)

Django + Django REST Framework backend for the **geolocation / nearby search**
part of the e-Joutia marketplace.

## Features

- `Listing` model (title, description, price, image, latitude, longitude, created_at)
- SQLite database
- Haversine distance calculation (km, rounded to 1 decimal)
- `GET /api/listings/nearby/` endpoint with radius filtering (nearest-first)
- Sample seed data around Tangier

## Requirements

- Python 3.10+ (tested on 3.13)
- See `requirements.txt`

## Setup

```bash
cd backend

# (recommended) create a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt

python manage.py migrate
python manage.py loaddata sample_listings   # optional seed data
python manage.py runserver 0.0.0.0:8000
```

> Use `0.0.0.0:8000` so a physical phone running Expo can reach the API over
> your local network. From the phone, call `http://<YOUR_PC_IP>:8000`.

## API

### GET `/api/listings/nearby/`

Returns listings within `radius` km of the given coordinates, sorted nearest-first.

**Query parameters**

| Param      | Type  | Required | Default | Notes                     |
|------------|-------|----------|---------|---------------------------|
| latitude   | float | yes      | —       | -90 .. 90                 |
| longitude  | float | yes      | —       | -180 .. 180               |
| radius     | float | no       | 10      | kilometers, must be > 0   |

**Example**

```
GET /api/listings/nearby/?latitude=35.76&longitude=-5.83&radius=10
```

**Response `200 OK`**

```json
[
  {
    "id": 4,
    "title": "Laptops GAMING. Pc portable",
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

**Errors `400 Bad Request`** — missing/invalid params, out-of-range coordinates,
or non-positive radius:

```json
{ "detail": "'latitude' is required." }
```

## Distance logic

Implemented in `listings/utils.py` using the Haversine formula. Filtering and
sorting happen in `listings/views.py::nearby_listings`. Any listing with
`distance > radius` is excluded.

## Tests

```bash
python manage.py test listings
```

Covers the Haversine helper and the radius-filtering / validation behavior of
the endpoint.

## Project layout

```
backend/
├── manage.py
├── requirements.txt
├── ejoutia/            # project settings, urls, wsgi/asgi
└── listings/
    ├── models.py       # Listing model
    ├── serializers.py  # ListingSerializer (+ computed distance)
    ├── utils.py        # haversine_km()
    ├── views.py        # nearby_listings endpoint
    ├── urls.py
    ├── tests.py
    └── fixtures/sample_listings.json
```

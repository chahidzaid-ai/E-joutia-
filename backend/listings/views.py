from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Listing
from .serializers import ListingSerializer
from .utils import haversine_km

# Default search radius (km) when the client does not provide one.
DEFAULT_RADIUS_KM = 10.0


def _parse_float(value, name):
    """Parse a query param to float, raising ValueError with a clear message."""
    if value is None:
        raise ValueError(f"'{name}' is required.")
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"'{name}' must be a valid number.")


@api_view(["GET"])
def nearby_listings(request):
    """Return listings within `radius` km of (latitude, longitude).

    Query params:
        latitude  (float, required)
        longitude (float, required)
        radius    (float, optional, defaults to 10 km)

    Each returned listing includes a computed `distance` (km, 1 decimal).
    Results are sorted nearest-first.
    """
    try:
        latitude = _parse_float(request.query_params.get("latitude"), "latitude")
        longitude = _parse_float(request.query_params.get("longitude"), "longitude")
        radius = request.query_params.get("radius")
        radius = _parse_float(radius, "radius") if radius is not None else DEFAULT_RADIUS_KM
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    # Basic range validation for coordinates.
    if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        return Response(
            {"detail": "Coordinates out of range."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if radius <= 0:
        return Response(
            {"detail": "'radius' must be greater than 0."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    nearby = []
    for listing in Listing.objects.all():
        distance = haversine_km(latitude, longitude, listing.latitude, listing.longitude)
        if distance <= radius:
            # Attach the computed distance so the serializer can expose it.
            listing.distance = distance
            nearby.append(listing)

    # Sort nearest-first.
    nearby.sort(key=lambda item: item.distance)

    serializer = ListingSerializer(nearby, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)

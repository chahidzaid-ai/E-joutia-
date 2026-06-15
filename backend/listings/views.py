from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Listing
from .serializers import ListingSerializer
from .utils import distance_km


def read_float(value, name):
    if value is None:
        raise ValueError(f"'{name}' is required.")
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"'{name}' must be a valid number.")


@api_view(["GET"])
def nearby(request):
    try:
        latitude = read_float(request.query_params.get("latitude"), "latitude")
        longitude = read_float(request.query_params.get("longitude"), "longitude")
        radius = request.query_params.get("radius")
        radius = read_float(radius, "radius") if radius is not None else 10.0
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

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

    results = []
    for listing in Listing.objects.all():
        d = distance_km(latitude, longitude, listing.latitude, listing.longitude)
        if d <= radius:
            listing.distance = d
            results.append(listing)

    results.sort(key=lambda item: item.distance)

    serializer = ListingSerializer(results, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)

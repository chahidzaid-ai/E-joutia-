"""Geospatial helpers for the marketplace.

The Haversine formula computes the great-circle distance between two points
on a sphere given their latitude/longitude. We use it to measure how far a
listing is from the user, in kilometers.
"""

from math import asin, cos, radians, sin, sqrt

# Mean radius of the Earth in kilometers.
EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1, lon1, lat2, lon2):
    """Return the great-circle distance in km between two coordinates.

    Args:
        lat1, lon1: latitude/longitude of the first point (degrees).
        lat2, lon2: latitude/longitude of the second point (degrees).

    Returns:
        float: distance in kilometers, rounded to one decimal place.
    """
    # Convert decimal degrees to radians.
    lat1_r, lon1_r, lat2_r, lon2_r = map(radians, (lat1, lon1, lat2, lon2))

    dlat = lat2_r - lat1_r
    dlon = lon2_r - lon1_r

    a = sin(dlat / 2) ** 2 + cos(lat1_r) * cos(lat2_r) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))

    distance = EARTH_RADIUS_KM * c
    return round(distance, 1)

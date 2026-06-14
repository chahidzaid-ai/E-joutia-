from django.test import TestCase
from django.urls import reverse

from .models import Listing
from .utils import haversine_km


class HaversineTests(TestCase):
    def test_same_point_is_zero(self):
        self.assertEqual(haversine_km(35.76, -5.83, 35.76, -5.83), 0.0)

    def test_known_distance_rounded(self):
        # ~1.3 km apart near Tangier.
        d = haversine_km(35.76, -5.83, 35.78, -5.81)
        self.assertGreater(d, 0)
        self.assertEqual(round(d, 1), d)


class NearbyListingsApiTests(TestCase):
    def setUp(self):
        Listing.objects.create(title="Close", price=100, latitude=35.77, longitude=-5.82)
        Listing.objects.create(title="Far", price=200, latitude=34.02, longitude=-6.83)

    def test_filters_by_radius(self):
        url = reverse("nearby-listings")
        res = self.client.get(url, {"latitude": 35.76, "longitude": -5.83, "radius": 10})
        self.assertEqual(res.status_code, 200)
        titles = [item["title"] for item in res.json()]
        self.assertIn("Close", titles)
        self.assertNotIn("Far", titles)

    def test_missing_params_returns_400(self):
        url = reverse("nearby-listings")
        res = self.client.get(url, {"latitude": 35.76})
        self.assertEqual(res.status_code, 400)

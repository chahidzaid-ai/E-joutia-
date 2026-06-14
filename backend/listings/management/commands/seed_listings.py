import random
from django.core.management.base import BaseCommand
from listings.models import Listing

# 👇 CHANGE these to the location your app searches (your GPS or demo location).
#    Example = Casablanca, Morocco.
BASE_LAT = 35.76
BASE_LON = -5.83


PRODUCTS = [
    ("iPhone 13 Pro", "Excellent condition, 128GB", 6500),
    ("VTT Trek mountain bike", "Lightly used, great for trails", 3200),
    ("Canape 3 places", "Comfortable grey sofa", 1800),
    ("Renault Clio 2018", "Low mileage, well maintained", 95000),
    ("PlayStation 5", "With two controllers", 5200),
    ("Veste en cuir", "Genuine leather, size M", 450),
    ("Lot de 10 livres", "Mixed fiction collection", 200),
    ("Cours de guitare", "Beginner lessons, 1h sessions", 150),
]

class Command(BaseCommand):
    help = "Seed sample listings near BASE_LAT/BASE_LON"

    def handle(self, *args, **options):
        Listing.objects.all().delete()
        for title, desc, price in PRODUCTS:
            lat = BASE_LAT + random.uniform(-0.02, 0.02)
            lon = BASE_LON + random.uniform(-0.02, 0.02)
            Listing.objects.create(
                title=title,
                description=desc,
                price=price,
                latitude=lat,
                longitude=lon,
            )
        self.stdout.write(self.style.SUCCESS(f"Created {len(PRODUCTS)} listings."))

import random
from django.core.management.base import BaseCommand
from listings.models import Listing


BASE_LAT = 35.76
BASE_LON = -5.83


PRODUCTS = [
    (
        "iPhone 13 Pro",
        "Excellent condition, 128GB",
        6500,
        "electronics",
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80",
    ),
    (
        "VTT Trek mountain bike",
        "Lightly used, great for trails",
        3200,
        "sports",
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80",
    ),
    (
        "Canape 3 places",
        "Comfortable grey sofa",
        1800,
        "furniture",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
    ),
    (
        "Renault Clio 2018",
        "Low mileage, well maintained",
        95000,
        "vehicles",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80",
    ),
    (
        "PlayStation 5",
        "With two controllers",
        5200,
        "electronics",
        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80",
    ),
    (
        "Veste en cuir",
        "Genuine leather, size M",
        450,
        "clothing",
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80",
    ),
    (
        "Lot de 10 livres",
        "Mixed fiction collection",
        200,
        "books",
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
    ),
    (
        "Cours de guitare",
        "Beginner lessons, 1h sessions",
        150,
        "services",
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80",
    ),
]


class Command(BaseCommand):
    help = "Seed sample listings near BASE_LAT/BASE_LON"

    def handle(self, *args, **options):
        Listing.objects.all().delete()
        for title, desc, price, category, image in PRODUCTS:
            lat = BASE_LAT + random.uniform(-0.02, 0.02)
            lon = BASE_LON + random.uniform(-0.02, 0.02)
            Listing.objects.create(
                title=title,
                description=desc,
                price=price,
                category=category,
                image=image,
                latitude=lat,
                longitude=lon,
            )
        self.stdout.write(self.style.SUCCESS(f"Created {len(PRODUCTS)} listings."))

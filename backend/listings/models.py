from django.db import models


class Listing(models.Model):
    CATEGORY_CHOICES = [
        ("electronics", "Electronics"),
        ("vehicles", "Vehicles"),
        ("furniture", "Furniture"),
        ("sports", "Sports"),
        ("clothing", "Clothing"),
        ("books", "Books"),
        ("home", "Home"),
        ("services", "Services"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="other",
    )
    image = models.ImageField(upload_to="listings/", blank=True, null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.price})"

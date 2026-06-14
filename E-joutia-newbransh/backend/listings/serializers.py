from rest_framework import serializers

from .models import Listing


class ListingSerializer(serializers.ModelSerializer):
    """Serializes a listing and exposes a computed `distance` field.

    `distance` is not stored on the model; it is attached at runtime by the
    nearby-listings view (in km, relative to the requesting user).
    """

    distance = serializers.FloatField(read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
             "id",
            "title",
            "description",
            "price",
            "category",
            "image",
            "latitude",
            "longitude",
            "distance",
            "created_at",
        ]

    def get_image(self, obj):
        """Return an absolute URL for the image, or None when absent."""
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

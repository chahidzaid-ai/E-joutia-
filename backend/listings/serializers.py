from rest_framework import serializers

from .models import Listing


class ListingSerializer(serializers.ModelSerializer):
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
        if not obj.image:
            return None
        if obj.image.name.startswith(("http://", "https://")):
            return obj.image.name
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

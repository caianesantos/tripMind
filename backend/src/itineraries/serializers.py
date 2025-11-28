from rest_framework import serializers

from itineraries.models import Itinerary, SavedItinerary


class ItinerarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Itinerary
        fields = [
            "id",
            "origin",
            "destination",
            "start_date",
            "end_date",
            "budget_level",
            "ai_summary",
            "transport_options",
            "lodging_options",
            "activities",
            "total_budget",
            "created_at",
        ]
        read_only_fields = ["ai_summary", "transport_options", "lodging_options", "activities", "total_budget", "created_at"]


class ItinerarySearchSerializer(serializers.Serializer):
    origin = serializers.CharField(max_length=120)
    destination = serializers.CharField(max_length=120)
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    budget_level = serializers.ChoiceField(choices=Itinerary.BUDGET_CHOICES)


class SavedItinerarySerializer(serializers.ModelSerializer):
    itinerary = ItinerarySerializer(read_only=True)

    class Meta:
        model = SavedItinerary
        fields = ["id", "itinerary", "saved_at"]

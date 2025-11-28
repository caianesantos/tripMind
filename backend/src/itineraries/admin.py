from django.contrib import admin

from itineraries.models import Itinerary, SavedItinerary


@admin.register(Itinerary)
class ItineraryAdmin(admin.ModelAdmin):
    list_display = ("origin", "destination", "budget_level", "created_at")
    search_fields = ("origin", "destination")
    list_filter = ("budget_level",)


@admin.register(SavedItinerary)
class SavedItineraryAdmin(admin.ModelAdmin):
    list_display = ("user", "itinerary", "saved_at")
    search_fields = ("user__username", "itinerary__destination")

# Register your models here.

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from itineraries.views import ItinerarySearchView, ItineraryViewSet, SaveItineraryView, SavedItineraryListView

router = DefaultRouter()
router.register(r"", ItineraryViewSet, basename="itineraries")

urlpatterns = [
    path("search/", ItinerarySearchView.as_view(), name="itinerary-search"),
    path("save/", SaveItineraryView.as_view(), name="itinerary-save"),
    path("saved/", SavedItineraryListView.as_view(), name="itinerary-saved"),
    path("", include(router.urls)),
]

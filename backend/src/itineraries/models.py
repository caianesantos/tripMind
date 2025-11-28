from django.conf import settings
from django.db import models


class Itinerary(models.Model):
    BUDGET_CHOICES = [
        ("economico", "Econômico"),
        ("intermediario", "Intermediário"),
        ("premium", "Premium"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="itineraries"
    )
    origin = models.CharField(max_length=120)
    destination = models.CharField(max_length=120)
    start_date = models.DateField()
    end_date = models.DateField()
    budget_level = models.CharField(max_length=20, choices=BUDGET_CHOICES)
    ai_summary = models.TextField(blank=True)
    transport_options = models.JSONField(default=list)
    lodging_options = models.JSONField(default=list)
    activities = models.JSONField(default=list)
    total_budget = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.origin} -> {self.destination} ({self.start_date} a {self.end_date})"


class SavedItinerary(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_itineraries")
    itinerary = models.ForeignKey(Itinerary, on_delete=models.CASCADE, related_name="saved_by")
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "itinerary")
        ordering = ["-saved_at"]

    def __str__(self) -> str:
        return f"{self.user.username} salvou {self.itinerary}"

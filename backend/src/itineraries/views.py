from datetime import datetime, timedelta

from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from itineraries.models import Itinerary, SavedItinerary
from itineraries.serializers import ItinerarySearchSerializer, ItinerarySerializer, SavedItinerarySerializer


def _generate_mock_plan(validated_data):
    def format_date(d):
        return d.strftime("%d/%m/%Y")

    budget_level = validated_data["budget_level"]
    base_budget = {"economico": 2500, "intermediario": 4500, "premium": 9000}.get(budget_level, 4000)
    transport_options = [
        {"provider": "VoeFácil", "price": int(base_budget * 0.3), "type": "Aéreo"},
        {"provider": "Rodovia+", "price": int(base_budget * 0.15), "type": "Ônibus"},
    ]
    lodging_options = [
        {"name": "Hotel Central", "price_per_night": int(base_budget * 0.08), "rating": 4.2},
        {"name": "Stay & Co.", "price_per_night": int(base_budget * 0.05), "rating": 3.8},
    ]
    activities = [
        {"day": 1, "title": "City tour guiado", "cost": 180},
        {"day": 2, "title": "Passeio cultural", "cost": 120},
        {"day": 3, "title": "Gastronomia local", "cost": 220},
    ]
    total_nights = max((validated_data["end_date"] - validated_data["start_date"]).days, 1)
    total_budget = base_budget + int(total_nights * lodging_options[0]["price_per_night"])
    ai_summary = (
        f"Roteiro {budget_level} para {validated_data['destination']} saindo de {validated_data['origin']} "
        f"entre {format_date(validated_data['start_date'])} e {format_date(validated_data['end_date'])}. "
        "Inclui opções de transporte e hospedagem balanceadas com o orçamento informado."
    )
    return {
        "transport_options": transport_options,
        "lodging_options": lodging_options,
        "activities": activities,
        "ai_summary": ai_summary,
        "total_budget": total_budget,
    }


class ItineraryViewSet(viewsets.ModelViewSet):
    serializer_class = ItinerarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Itinerary.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ItinerarySearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ItinerarySearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        mock_data = _generate_mock_plan(payload)
        itinerary = Itinerary.objects.create(
            user=request.user if request.user.is_authenticated else None,
            **payload,
            **mock_data,
        )
        return Response(ItinerarySerializer(itinerary).data, status=status.HTTP_201_CREATED)


class SaveItineraryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        itinerary_id = request.data.get("itinerary_id")
        itinerary = get_object_or_404(Itinerary, id=itinerary_id)
        saved, _ = SavedItinerary.objects.get_or_create(user=request.user, itinerary=itinerary)
        return Response({"saved_id": saved.id}, status=status.HTTP_201_CREATED)


class SavedItineraryListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        saved = SavedItinerary.objects.filter(user=request.user)
        data = SavedItinerarySerializer(saved, many=True).data
        return Response(data)


class SavedItineraryDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        saved = get_object_or_404(SavedItinerary, id=pk, user=request.user)
        saved.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

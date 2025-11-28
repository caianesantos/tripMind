from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from support.serializers import SupportTicketSerializer


class SupportTicketView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SupportTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save()
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

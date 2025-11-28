from rest_framework import serializers

from support.models import SupportTicket


class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ["id", "name", "email", "subject", "message", "status", "created_at"]
        read_only_fields = ["status", "created_at"]

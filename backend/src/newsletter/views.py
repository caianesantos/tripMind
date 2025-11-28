from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from newsletter.serializers import NewsletterSubscriptionSerializer


class NewsletterSubscribeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = NewsletterSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subscription = serializer.save()
        return Response(NewsletterSubscriptionSerializer(subscription).data, status=status.HTTP_201_CREATED)

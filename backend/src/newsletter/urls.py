from django.urls import path

from newsletter.views import NewsletterSubscribeView

urlpatterns = [
    path("subscribe/", NewsletterSubscribeView.as_view(), name="newsletter-subscribe"),
]

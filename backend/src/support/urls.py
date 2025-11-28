from django.urls import path

from support.views import SupportTicketView

urlpatterns = [
    path("", SupportTicketView.as_view(), name="support-ticket"),
]

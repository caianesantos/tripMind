from django.contrib import admin

from support.models import SupportTicket


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("email", "subject", "status", "created_at")
    search_fields = ("email", "subject")
    list_filter = ("status",)

# Register your models here.

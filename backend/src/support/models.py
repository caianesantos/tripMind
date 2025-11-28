from django.db import models


class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ("aberto", "Aberto"),
        ("respondido", "Respondido"),
        ("fechado", "Fechado"),
    ]

    name = models.CharField(max_length=120)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="aberto")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.email} - {self.subject or 'Suporte'}"

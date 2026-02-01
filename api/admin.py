from django.contrib import admin
from .models import Veterinarian, Pet, Appointment, Reminder

# Modelleri admin panelinde görünür yapıyoruz
admin.site.register(Veterinarian)
admin.site.register(Pet)
admin.site.register(Appointment)
admin.site.register(Reminder)
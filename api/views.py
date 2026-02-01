from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Veterinarian, Pet, Appointment, Reminder
from .serializers import (
    VeterinarianSerializer,
    PetSerializer,
    AppointmentSerializer,
    ReminderSerializer,
    UserRegisterSerializer,
)


# -------------------------
# Register (Public)
# -------------------------
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"id": user.id, "username": user.username},
            status=status.HTTP_201_CREATED
        )


# -------------------------
# Veterinarians
# (şimdilik login olan herkes görebilsin)
# -------------------------
class VeterinarianViewSet(viewsets.ModelViewSet):
    queryset = Veterinarian.objects.all()
    serializer_class = VeterinarianSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Veterinarian.objects.all().order_by("-id")



# -------------------------
# Pets (Kullanıcı izolasyonu)
# -------------------------
class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Pet.objects.filter(owner=self.request.user).order_by("-id")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# -------------------------
# Appointments (Kullanıcı izolasyonu)
# -------------------------
class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # sadece kullanıcının pet'lerine ait randevular
        return Appointment.objects.filter(pet__owner=self.request.user).order_by("-date_time")

    def perform_create(self, serializer):
        pet = serializer.validated_data.get("pet")
        if pet and pet.owner != self.request.user:
            raise PermissionDenied("Bu pet size ait değil.")
        serializer.save()


# -------------------------
# Reminders (Kullanıcı izolasyonu)
# Not: Reminder modelin pet'e bağlıysa bu doğru.
# Eğer Reminder'da direkt user alanı varsa haber ver, ona göre filtreyi değiştiririz.
# -------------------------
class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reminder.objects.filter(pet__owner=self.request.user).order_by("-id")

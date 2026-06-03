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


import os
import tempfile

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from ultralytics import YOLO


MODEL_PATH = os.path.join(settings.BASE_DIR, "ml_models", "best.pt")

yolo_model = None


def get_yolo_model():
    global yolo_model

    if yolo_model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

        yolo_model = YOLO(MODEL_PATH)

    return yolo_model


class SkinDiseasePredictView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        image_file = request.FILES.get("image")

        if not image_file:
            return Response(
                {"error": "Image file is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        temp_path = None

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
                for chunk in image_file.chunks():
                    temp_file.write(chunk)

                temp_path = temp_file.name

            model = get_yolo_model()

            results = model.predict(
                source=temp_path,
                conf=0.25,
                save=False,
                verbose=False
            )

            predictions = []

            if results and len(results) > 0:
                result = results[0]

                if result.boxes is not None:
                    for box in result.boxes:
                        cls_id = int(box.cls[0])
                        class_name = model.names[cls_id]
                        confidence = float(box.conf[0])

                        x1, y1, x2, y2 = box.xyxy[0].tolist()

                        predictions.append({
                            "class": class_name,
                            "confidence": round(confidence, 4),
                            "box": [
                                round(x1, 2),
                                round(y1, 2),
                                round(x2, 2),
                                round(y2, 2)
                            ]
                        })

            return Response({
                "message": "Prediction completed successfully.",
                "predictions": predictions
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
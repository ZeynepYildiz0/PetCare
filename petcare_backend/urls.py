from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import VeterinarianViewSet, PetViewSet, AppointmentViewSet, ReminderViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import RegisterView
from api.views import SkinDiseasePredictView

# API Yönlendiricisi (Router)
router = DefaultRouter()
router.register(r'veterinarians', VeterinarianViewSet, basename='veterinarians')
router.register(r'pets', PetViewSet, basename='pets')
router.register(r'appointments', AppointmentViewSet, basename='appointments')
router.register(r'reminders', ReminderViewSet, basename='reminders')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)), # Tüm API adreslerini buraya bağladık
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/register/", RegisterView.as_view(), name="register"),
    path("api/skin-disease-predict/", SkinDiseasePredictView.as_view(), name="skin_disease_predict"),
]
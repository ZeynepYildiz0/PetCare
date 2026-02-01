from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta, date
from django.contrib.auth.models import User


from .models import Veterinarian, Pet, Appointment, Reminder

# Veterinerleri JSON'a çevir
class VeterinarianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veterinarian
        fields = '__all__'

# Evcil Hayvanları JSON'a çevir
class PetSerializer(serializers.ModelSerializer):
    computed_age = serializers.SerializerMethodField()
    owner_username = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = Pet
        fields = [
            "id",
            "computed_age",
            "name",
            "species",
            "age",
            "birth_date",
            "weight_kg",
            "notes",
            "photo_url",
            "gender",
            "created_at",
            "updated_at",
            "owner",
            "owner_username",
        ]

    def get_computed_age(self, obj):
        # birth_date varsa onu baz al, yoksa age alanını dön
        if obj.birth_date:
            from datetime import date
            today = date.today()
            years = today.year - obj.birth_date.year
            if (today.month, today.day) < (obj.birth_date.month, obj.birth_date.day):
                years -= 1
            return max(years, 0)
        return obj.age
    
# Randevuları JSON'a çevir
class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'
        depth = 1

    def validate(self, attrs):
        """Basit slot: aynı veteriner için çakışan randevu olmasın."""
        vet = attrs.get('vet', getattr(self.instance, 'vet', None))
        date_time = attrs.get('date_time', getattr(self.instance, 'date_time', None))
        duration = attrs.get('duration_minutes', getattr(self.instance, 'duration_minutes', 30))

        if vet is None or date_time is None:
            return attrs

        # geçmiş tarih engeli (opsiyonel ama iyi):
        if date_time < timezone.now():
            raise serializers.ValidationError("Randevu tarihi geçmiş olamaz.")

        new_start = date_time
        new_end = date_time + timedelta(minutes=int(duration or 30))

        # Aday çakışmaları kaba filtrele (yakın zaman aralığı)
        window_start = new_start - timedelta(minutes=180)
        window_end = new_end + timedelta(minutes=180)

        qs = Appointment.objects.filter(vet=vet, date_time__gte=window_start, date_time__lte=window_end)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        for appt in qs:
            appt_start = appt.date_time
            appt_end = appt.date_time + timedelta(minutes=int(appt.duration_minutes or 30))
            overlaps = appt_start < new_end and new_start < appt_end
            if overlaps and appt.status != 'CANCELLED':
                raise serializers.ValidationError(
                    f"Bu veteriner için seçtiğiniz saat dolu. Çakışan randevu: {appt_start.strftime('%Y-%m-%d %H:%M')}"
                )

        return attrs


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = '__all__'

    def validate(self, attrs):
        repeat = attrs.get('repeat', getattr(self.instance, 'repeat', 'ONCE'))
        weekday = attrs.get('weekday', getattr(self.instance, 'weekday', None))
        if repeat == 'WEEKLY' and weekday is None:
            raise serializers.ValidationError("repeat=WEEKLY ise weekday (0-6) zorunlu.")
        if repeat != 'WEEKLY' and weekday is not None:
            # kullanıcı yanlışlıkla doldurursa temiz kural
            attrs['weekday'] = None
        return attrs
from django.contrib.auth.models import User
from rest_framework import serializers

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "password", "first_name", "last_name", "email"]

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            email=validated_data.get("email", ""),
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


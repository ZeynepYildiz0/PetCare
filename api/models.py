from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# 1. Veteriner Modeli (Sadece Admin ekler/onaylar)
class Veterinarian(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Sisteme üye olan kişiyle bağlanır
    clinic_name = models.CharField(max_length=100, verbose_name="Klinik Adı")
    specialization = models.CharField(max_length=100, verbose_name="Uzmanlık")
    city = models.CharField(max_length=50, verbose_name="Şehir")
    is_approved = models.BooleanField(default=False, verbose_name="Onaylı mı?")  # Admin onayı için

    def __str__(self):
        return f"{self.clinic_name} - Dr. {self.user.first_name}"

# 2. Evcil Hayvan Modeli (Kullanıcıya ait)
class Pet(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('U', 'Unknown'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pets")
    name = models.CharField(max_length=50)
    species = models.CharField(max_length=50)  # Kedi, Köpek vs.

    # UI'da yaş girişi var; ama daha sağlıklısı doğum tarihi.
    # İkisini de destekliyoruz: age opsiyonel, birth_date opsiyonel.
    age = models.PositiveIntegerField(null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)

    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    # Şimdilik dosya upload yerine URL tutuyoruz (frontend ile kolay).
    photo_url = models.URLField(blank=True, null=True)

    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default='U')

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.owner.username})"

# 3. Randevu Modeli (MHRS Mantığı)
class Appointment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Bekliyor'),
        ('CONFIRMED', 'Onaylandı'),
        ('COMPLETED', 'Tamamlandı'),
        ('CANCELLED', 'İptal'),
    ]

    pet = models.ForeignKey(Pet, on_delete=models.CASCADE)
    vet = models.ForeignKey(Veterinarian, on_delete=models.CASCADE)
    date_time = models.DateTimeField()

    # Basit slot mantığı: her randevu varsayılan 30 dk kabul edilir.
    duration_minutes = models.PositiveIntegerField(default=30)

    # UI'da "Checkup / Vaccination" gibi bir başlık var.
    appointment_type = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.pet.name} - {self.vet.clinic_name}"


class Reminder(models.Model):
    REMINDER_TYPE_CHOICES = [
        ('APPOINTMENT', 'Appointment'),
        ('MEAL', 'Meal'),
        ('MEDICATION', 'Medication'),
        ('CUSTOM', 'Custom'),
    ]

    REPEAT_CHOICES = [
        ('ONCE', 'Once'),
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reminders')
    pet = models.ForeignKey(Pet, on_delete=models.SET_NULL, null=True, blank=True, related_name='reminders')
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPE_CHOICES, default='CUSTOM')
    title = models.CharField(max_length=100)

    remind_at = models.DateTimeField()
    repeat = models.CharField(max_length=10, choices=REPEAT_CHOICES, default='ONCE')
    # weekly için: 0=Monday ... 6=Sunday
    weekday = models.PositiveSmallIntegerField(null=True, blank=True)

    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.owner.username})"
# 🐾 PetCare – Veterinary Clinic Management System

PetCare, veteriner kliniklerinin günlük operasyonlarını dijitalleştirmek ve kolaylaştırmak amacıyla geliştirilmiş bir yönetim sistemidir.  
Randevu yönetimi, hasta takibi ve temel klinik süreçlerin daha düzenli yürütülmesini hedefler.

---

## 🚀 Proje Amacı

Bu proje, bir veteriner kliniğinde:
- Hasta (pet) bilgilerinin düzenli tutulmasını
- Sahip–pet ilişkisinin yönetilmesini
- Randevu süreçlerinin dijitalleştirilmesini
amaçlamaktadır.

Aynı zamanda yazılım geliştirme sürecinde **gerçek bir sistem analizi ve uygulama pratiği** kazanmak hedeflenmiştir.

---

## 🛠️ Kullanılan Teknolojiler

- **Backend:** Python / Django  
- **Frontend:** HTML, CSS, JavaScript  
- **Database:** SQLite (geliştirme aşamasında)  
- **Version Control:** Git & GitHub  

> Proje geliştirme süreci devam etmektedir.

---

## 📂 Proje Yapısı

```text
petcare/
│
├── backend/
│   ├── manage.py
│   └── ...
│
├── frontend/
│   ├── templates/
│   └── static/
│
├── README.md
└── requirements.txt

## Run Backend
```powershell
cd C:\Users\zeynep\Desktop\petcare
.\venv\Scripts\Activate.ps1
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py runserver

Frontend
URL: http://localhost:5173/

Demo Flow
Register/Login (JWT)
Add Pet
Create Appointment
User Isolation: each user sees only their own pets/appointments

- Admin panel: `http://127.0.0.1:8000/admin/`
- API Base env: `frontend/.env -> VITE_API_BASE=http://127.0.0.1:8000/api`

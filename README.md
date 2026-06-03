# PetCare - Django REST + React (Vite)

## Tech Stack
- Backend: Django + Django REST Framework + SimpleJWT
- Frontend: React + Vite
- DB: SQLite

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
# 🐾 PetCare – AI-Supported Veterinary Appointment and Pet Health System

![Python](https://img.shields.io/badge/Python-3.x-blue)
![Django](https://img.shields.io/badge/Django-REST_Framework-green)
![React](https://img.shields.io/badge/React-Frontend-blue)
![YOLO](https://img.shields.io/badge/YOLO-AI_Model-orange)
![Status](https://img.shields.io/badge/Status-In_Progress-yellow)
![License](https://img.shields.io/badge/License-Educational-lightgrey)

PetCare is a web-based veterinary appointment and pet health management system designed to help pet owners manage their pets, appointments, reminders, vaccination information, and AI-supported skin analysis processes through a user-friendly platform.

The project consists of two main components:

1. A full-stack web application for pet and appointment management
2. An AI-supported dog skin disease detection module using a YOLO-based object detection model

This project was developed as a real-world software engineering practice, focusing on backend–frontend integration, artificial intelligence integration, database management, and user-centered interface design.

---

## 🎯 Project Objectives

The main goals of this project are to:

* Allow pet owners to manage their pet records digitally
* Create and track veterinary appointments
* Provide reminder and vaccination information features
* Integrate an AI-supported dog skin disease detection system
* Develop a full-stack web application using modern technologies
* Gain practical experience in software engineering, AI integration, and project architecture

---

## 🧠 AI-Supported Skin Disease Detection Module

PetCare includes an artificial intelligence module that analyzes dog skin images and produces prediction results using a trained YOLO-based object detection model.

The model was trained on annotated dog skin disease images and integrated into the web application. Users can upload a dog skin image through the interface, and the system processes the image to detect possible skin disease regions.

### AI Module Features

* Image upload through the web interface
* YOLO-based object detection model integration
* Detection of possible dog skin disease areas
* Prediction result display on the frontend
* Backend endpoint for AI model inference
* Model file stored under the `ml_models/` directory

> Note: The AI-supported analysis feature is designed for educational and assistive purposes only. It does not provide a medical diagnosis. For accurate diagnosis and treatment, a veterinarian should always be consulted.

---

## 🛠 Technologies Used

| Layer            | Technologies                          |
| ---------------- | ------------------------------------- |
| Backend          | Python, Django, Django REST Framework |
| Frontend         | React, Vite, HTML, CSS, JavaScript    |
| Database         | SQLite                                |
| AI Model         | YOLO-based Object Detection Model     |
| Machine Learning | Ultralytics YOLO, PyTorch             |
| Tools            | Git, GitHub, VS Code                  |

---

## 📂 Project Structure

```text
PetCare/
│
├── api/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── migrations/
│
├── petcare_backend/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── ml_models/
│   └── best.pt
│
├── db.sqlite3
├── manage.py
├── package.json
└── README.md
```

---

## 🚀 Main Features

### Pet Management

* Add and manage pet information
* Store pet details in the database
* Organize pet records through the backend system

### Appointment Management

* Create veterinary appointments
* Track appointment information
* Manage appointment types and dates

### Reminder and Vaccination Information

* Provide reminder-related features for pet owners
* Display vaccination information in a user-friendly way

### AI Skin Analysis

* Upload dog skin images
* Analyze images using the trained YOLO model
* Display AI prediction results on the frontend
* Support pet owners with preliminary visual analysis

---

## 🧩 Backend Overview

The backend was developed using Django and Django REST Framework.

The backend is responsible for:

* Managing database models
* Handling API requests
* Processing pet and appointment data
* Connecting the frontend with the database
* Running the AI model prediction endpoint
* Returning prediction results to the frontend

---

## 🎨 Frontend Overview

The frontend was developed using React and Vite.

The frontend provides:

* A user-friendly interface
* Pet management pages
* Appointment screens
* Reminder and vaccination information sections
* AI-supported skin analysis upload page
* Dynamic communication with the Django backend

---

## 🤖 Machine Learning Model

The AI model used in this project is a YOLO-based object detection model trained for dog skin disease detection.

The trained model file is located in:

```text
ml_models/best.pt
```

The model is integrated into the backend and used to process uploaded images. After the image is analyzed, the prediction results are returned to the frontend and displayed to the user.

This integration demonstrates how machine learning models can be used inside real-world web applications.

---

## 🧠 What I Learned From This Project

Through developing PetCare, I gained experience in:

* Building a full-stack web application
* Developing REST API endpoints with Django REST Framework
* Creating frontend pages with React
* Connecting frontend and backend systems
* Managing project versions with Git and GitHub
* Working with SQLite database operations
* Integrating a YOLO-based AI model into a web application
* Understanding AI model inference in real software systems
* Improving UI/UX design for practical user needs
* Organizing a software project with multiple components

This project improved my problem-solving, software architecture, project planning, artificial intelligence integration, and full-stack development skills.

---

## 📌 Project Status

The project is currently in progress.

Completed and ongoing parts include:

* Backend API structure
* Frontend interface development
* Pet and appointment management features
* AI model integration
* Dog skin disease detection module
* UI/UX improvements
* Result display improvements for the AI analysis feature

---

## ⚠️ Disclaimer

The AI-supported skin analysis feature is not a medical diagnosis tool. It is developed for educational and assistive purposes. Pet owners should always consult a professional veterinarian for diagnosis and treatment.

---

## 👩‍💻 Developer

**Zeynep Yıldız**
Software Engineering Student
GitHub: [ZeynepYildiz0](https://github.com/ZeynepYildiz0)

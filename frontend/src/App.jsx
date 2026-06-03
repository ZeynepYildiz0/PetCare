import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const [activePage, setActivePage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vets, setVets] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("Köpek");
  const [petGender, setPetGender] = useState("F");
  const [petAge, setPetAge] = useState(1);

  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedVetId, setSelectedVetId] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [notes, setNotes] = useState("");
  const [skinImage, setSkinImage] = useState(null);
  const [skinImagePreview, setSkinImagePreview] = useState("");
  const [skinPredictions, setSkinPredictions] = useState([]);
  const [skinLoading, setSkinLoading] = useState(false);
  const [skinAnalyzed, setSkinAnalyzed] = useState(false);

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE,
    });

    if (token) {
      instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    return instance;
  }, [token]);

  function flashSuccess(message) {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(""), 2500);
  }

  function goToPage(pageName) {
    setActivePage(pageName);
    setSidebarOpen(false);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    setToken("");
    setPets([]);
    setAppointments([]);
    setVets([]);
    setActivePage("home");
    setSidebarOpen(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await axios.post(`${API_BASE}/token/`, {
        username,
        password,
      });

      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      setToken(res.data.access);
      setPassword("");
      flashSuccess("Login successful.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Login failed. Please check your username and password.");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setErrorMsg("");

    try {
      await axios.post(`${API_BASE}/register/`, {
        username,
        password,
      });

      const res = await axios.post(`${API_BASE}/token/`, {
        username,
        password,
      });

      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      setToken(res.data.access);
      setPassword("");
      flashSuccess("Account created successfully.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Registration failed. This username may already be taken.");
    }
  }

  async function loadAll() {
    setLoading(true);
    setErrorMsg("");

    try {
      const [petsRes, appsRes, vetsRes] = await Promise.all([
        api.get("/pets/"),
        api.get("/appointments/"),
        api.get("/veterinarians/"),
      ]);

      setPets(petsRes.data || []);
      setAppointments(appsRes.data || []);
      setVets(vetsRes.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadAll();
    }
  }, [token]);

  function getPetImage(pet) {
    if (pet.photo_url) return pet.photo_url;

    if (pet.species === "Cat" || pet.species === "Kedi") {
      return "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600";
    }

    return "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600";
  }

  async function submitPet(e) {
    e.preventDefault();
    setErrorMsg("");

    try {
      await api.post("/pets/", {
        name: petName,
        species: petSpecies,
        gender: petGender,
        age: Number(petAge),
      });

      flashSuccess("Pet added successfully.");

      setPetName("");
      setPetSpecies("Köpek");
      setPetGender("F");
      setPetAge(1);

      await loadAll();
      setActivePage("pets");
    } catch (err) {
      console.error(err);
      setErrorMsg("Pet could not be added. Please check the form fields.");
    }
  }

  async function submitAppointment(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedPetId || !selectedVetId || !dateStr || !timeStr) {
      setErrorMsg("Pet, veterinarian, date and time are required.");
      return;
    }

    const isoDate = new Date(`${dateStr}T${timeStr}:00`).toISOString();

    try {
      await api.post("/appointments/", {
        pet: Number(selectedPetId),
        vet: Number(selectedVetId),
        date_time: isoDate,
        duration_minutes: 30,
        notes: notes || "",
        status: "PENDING",
      });

      flashSuccess("Appointment created successfully.");

      setSelectedPetId("");
      setSelectedVetId("");
      setDateStr("");
      setTimeStr("");
      setNotes("");

      await loadAll();
      setActivePage("appointments");
    } catch (err) {
      console.error(err);

      const detail =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.detail;

      setErrorMsg(detail || "Appointment could not be created. The selected time may be unavailable.");
    }
  }

  function handleSkinImageChange(e) {
  const file = e.target.files?.[0];

  if (!file) return;

  setSkinImage(file);
  setSkinImagePreview(URL.createObjectURL(file));
  setSkinPredictions([]);
  setSkinAnalyzed(false);
}

async function submitSkinPrediction(e) {
  e.preventDefault();

  setErrorMsg("");
  setSuccessMsg("");
  setSkinPredictions([]);
  setSkinAnalyzed(false);

  if (!skinImage) {
    setErrorMsg("Please select an image before starting the analysis.");
    return;
  }

  const formData = new FormData();
  formData.append("image", skinImage);

  try {
    setSkinLoading(true);

    const res = await api.post("/skin-disease-predict/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setSkinPredictions(res.data.predictions || []);
    setSkinAnalyzed(true);
    flashSuccess("Skin analysis completed successfully.");
  } catch (err) {
    console.error(err);
    setErrorMsg("Skin analysis failed. Please check the backend and model endpoint.");
  } finally {
    setSkinLoading(false);
  }
}

  const upcomingAppointments = appointments.slice(0, 3);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">🐾 PetCare</div>

          <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>

          <p>
            {isRegister
              ? "Create an account to manage your pets and appointments."
              : "Login to continue to your PetCare dashboard."}
          </p>

          {errorMsg && <div className="alert error">{errorMsg}</div>}
          {successMsg && <div className="alert success">{successMsg}</div>}

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="auth-form">
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className="primary-btn" type="submit">
              {isRegister ? "Register" : "Login"}
            </button>

            <button
              type="button"
              className="text-btn"
              onClick={() => setIsRegister((value) => !value)}
            >
              {isRegister
                ? "Already have an account? Login"
                : "Do not have an account? Register"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="site">
      <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
        <div className="sidebar-header">
          <div className="brand-small">🐾 PetCare</div>

          <button className="close-btn" onClick={() => setSidebarOpen(false)}>
            ×
          </button>
        </div>

        <nav className="sidebar-menu">
          <button onClick={() => goToPage("account")}>My Account</button>
          <button onClick={() => goToPage("appointments")}>My Appointments</button>
          <button onClick={() => goToPage("pets")}>My Pets</button>
          <button onClick={() => goToPage("reminders")}>Daily Reminders</button>
          <button onClick={() => goToPage("makeAppointment")}>Make An Appointment</button>
          <button onClick={() => goToPage("vaccination")}>Vaccination Schedule</button>
          <button onClick={() => goToPage("skinAnalysis")}>Skin Analysis</button>
        </nav>
      </aside>

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      <header className="topbar">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>

        <div className="brand">🐾 PetCare</div>

        <nav className="desktop-nav">
          <button
            onClick={() => goToPage("home")}
            className={activePage === "home" ? "active" : ""}
          >
            Home
          </button>

          <button
            onClick={() => goToPage("skinAnalysis")}
            className={activePage === "skinAnalysis" ? "active" : ""}
          >
            Skin Analysis
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="page-container">
        {loading && <div className="alert info">Loading...</div>}
        {errorMsg && <div className="alert error">{errorMsg}</div>}
        {successMsg && <div className="alert success">{successMsg}</div>}

        {activePage === "home" && (
          <HomePage
            pets={pets}
            upcomingAppointments={upcomingAppointments}
            goToPage={goToPage}
            getPetImage={getPetImage}
          />
        )}

        {activePage === "account" && (
          <AccountPage
            username={username}
            pets={pets}
            appointments={appointments}
            vets={vets}
            onBack={() => goToPage("home")}
          />
        )}

        {activePage === "pets" && (
          <PetsPage
            pets={pets}
            getPetImage={getPetImage}
            goToPage={goToPage}
            onBack={() => goToPage("home")}
          />
        )}

        {activePage === "addPet" && (
          <AddPetPage
            petName={petName}
            setPetName={setPetName}
            petSpecies={petSpecies}
            setPetSpecies={setPetSpecies}
            petGender={petGender}
            setPetGender={setPetGender}
            petAge={petAge}
            setPetAge={setPetAge}
            submitPet={submitPet}
            onBack={() => goToPage("pets")}
          />
        )}

        {activePage === "appointments" && (
          <AppointmentsPage
            appointments={appointments}
            goToPage={goToPage}
            onBack={() => goToPage("home")}
          />
        )}

        {activePage === "makeAppointment" && (
          <MakeAppointmentPage
            pets={pets}
            vets={vets}
            selectedPetId={selectedPetId}
            setSelectedPetId={setSelectedPetId}
            selectedVetId={selectedVetId}
            setSelectedVetId={setSelectedVetId}
            dateStr={dateStr}
            setDateStr={setDateStr}
            timeStr={timeStr}
            setTimeStr={setTimeStr}
            notes={notes}
            setNotes={setNotes}
            submitAppointment={submitAppointment}
            onBack={() => goToPage("home")}
          />
        )}

        {activePage === "reminders" && (
          <RemindersPage onBack={() => goToPage("home")} />
        )}

       {activePage === "vaccination" && (
  <VaccinationPage onBack={() => goToPage("home")} goToPage={goToPage} />
)}

        {activePage === "skinAnalysis" && (
  <SkinAnalysisPage
    onBack={() => goToPage("home")}
    skinImage={skinImage}
    skinImagePreview={skinImagePreview}
    skinPredictions={skinPredictions}
    skinLoading={skinLoading}
    skinAnalyzed={skinAnalyzed}
    handleSkinImageChange={handleSkinImageChange}
    submitSkinPrediction={submitSkinPrediction}
  />
)}
      </main>
    </div>
  );
}

function HomePage({ pets, upcomingAppointments, goToPage, getPetImage }) {
  return (
    <>
      <section className="hero-section">
        <div>
          <span className="eyebrow">Veterinary Care Platform</span>
          <h1>Keep your furry friend healthy and organized.</h1>
          <p>
            Manage pet profiles, track appointments, follow reminders and access
            AI-supported skin analysis from a single PetCare dashboard.
          </p>
        </div>

        <div className="hero-card">
          <strong>{pets.length}</strong>
          <span>Registered Pets</span>
        </div>
      </section>


      <section className="feature-grid">
        <FeatureCard
          icon="👤"
          title="My Account"
          text="View and manage your personal account information."
          onClick={() => goToPage("account")}
        />

        <FeatureCard
          icon="📅"
          title="My Appointments"
          text="Check upcoming and previous veterinary appointments."
          onClick={() => goToPage("appointments")}
        />

        <FeatureCard
          icon="🐶"
          title="My Pets"
          text="See all registered pets and their basic information."
          onClick={() => goToPage("pets")}
        />

        <FeatureCard
          icon="⏰"
          title="Daily Reminders"
          text="Track feeding, medication, care routines and reminder times."
          onClick={() => goToPage("reminders")}
        />

        <FeatureCard
          icon="➕"
          title="Make An Appointment"
          text="Create a new veterinary appointment for your pet."
          onClick={() => goToPage("makeAppointment")}
        />

        <FeatureCard
          icon="💉"
          title="Vaccination Schedule"
          text="Keep vaccination dates visible and organized."
          onClick={() => goToPage("vaccination")}
        />

        <FeatureCard
          icon="🔍"
          title="Skin Analysis"
          text="Upload a dog skin image and get a preliminary AI-supported result."
          onClick={() => goToPage("skinAnalysis")}
          extraClass="ai-card"
        />
      </section>

      <section className="content-grid">
        <div className="section-card">
          <div className="section-title">
            <h2>My Pets</h2>
            <button onClick={() => goToPage("pets")}>View All</button>
          </div>

          {pets.length === 0 ? (
            <p className="empty-text">No pets have been added yet.</p>
          ) : (
            <div className="pet-grid">
              {pets.slice(0, 4).map((pet) => (
                <article className="pet-card" key={pet.id}>
                  <img src={getPetImage(pet)} alt={pet.name} />

                  <div>
                    <h3>{pet.name}</h3>
                    <p>{pet.species}</p>
                    <small>
                      {pet.gender === "M" ? "Male" : pet.gender === "F" ? "Female" : "Unknown"} •{" "}
                      {pet.computed_age ?? pet.age ?? "-"} years old
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="section-card">
          <div className="section-title">
            <h2>Upcoming Appointments</h2>
            <button onClick={() => goToPage("appointments")}>View All</button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <p className="empty-text">No appointments yet.</p>
          ) : (
            <div className="appointment-list">
              {upcomingAppointments.map((appointment) => (
                <article className="appointment-card" key={appointment.id}>
                  <h3>
                    {new Date(appointment.date_time).toLocaleDateString()}{" "}
                    {new Date(appointment.date_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </h3>

                  <p>
                    Pet: {appointment.pet?.name ?? appointment.pet} • Clinic:{" "}
                    {appointment.vet?.clinic_name ?? "-"}
                  </p>

                  <span>{appointment.status}</span>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function FeatureCard({ icon, title, text, onClick, extraClass = "" }) {
  return (
    <button className={`feature-card ${extraClass}`} onClick={onClick}>
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </button>
  );
}

function PageShell({ title, children, onBack }) {
  return (
    <section className="page-shell">
      <button className="back-btn" onClick={onBack}>
        ← Back to Home
      </button>

      <h1>{title}</h1>

      {children}
    </section>
  );
}

function AccountPage({ username, pets, appointments, vets, onBack }) {
  return (
    <PageShell title="My Account" onBack={onBack}>
      <div className="account-grid">
        <div className="profile-card">
          <div className="profile-avatar">👤</div>
          <h2>{username || "PetCare User"}</h2>
          <p>Pet owner account</p>
        </div>

        <div className="info-list">
          <div>
            <strong>Registered Pets</strong>
            <span>{pets.length}</span>
          </div>

          <div>
            <strong>Total Appointments</strong>
            <span>{appointments.length}</span>
          </div>

          <div>
            <strong>Available Veterinarians</strong>
            <span>{vets.length}</span>
          </div>

          <div>
            <strong>Account Status</strong>
            <span>Active</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function PetsPage({ pets, getPetImage, goToPage, onBack }) {
  return (
    <PageShell title="My Pets" onBack={onBack}>
      <div className="page-actions">
        <button className="primary-action" onClick={() => goToPage("addPet")}>
          + Add New Pet
        </button>
      </div>

      {pets.length === 0 ? (
        <p className="empty-text">No pets have been added yet.</p>
      ) : (
        <div className="large-card-grid">
          {pets.map((pet) => (
            <article className="large-pet-card" key={pet.id}>
              <img src={getPetImage(pet)} alt={pet.name} />

              <div>
                <h3>{pet.name}</h3>
                <p>{pet.species}</p>
                <small>
                  {pet.gender === "M" ? "Male" : pet.gender === "F" ? "Female" : "Unknown"} •{" "}
                  {pet.computed_age ?? pet.age ?? "-"} years old
                </small>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function AddPetPage({
  petName,
  setPetName,
  petSpecies,
  setPetSpecies,
  petGender,
  setPetGender,
  petAge,
  setPetAge,
  submitPet,
  onBack,
}) {
  return (
    <PageShell title="Add New Pet" onBack={onBack}>
      <form className="form-card" onSubmit={submitPet}>
        <label>
          Pet Name
          <input
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Example: Luna"
            required
          />
        </label>

        <label>
          Species
          <select value={petSpecies} onChange={(e) => setPetSpecies(e.target.value)}>
            <option value="Köpek">Dog</option>
            <option value="Kedi">Cat</option>
            <option value="Belirsiz">Unknown</option>
          </select>
        </label>

        <label>
          Gender
          <select value={petGender} onChange={(e) => setPetGender(e.target.value)}>
            <option value="F">Female</option>
            <option value="M">Male</option>
            <option value="U">Unknown</option>
          </select>
        </label>

        <label>
          Age
          <input
            type="number"
            min="0"
            value={petAge}
            onChange={(e) => setPetAge(e.target.value)}
            placeholder="Age"
          />
        </label>

        <button className="primary-action" type="submit">
          Save Pet
        </button>
      </form>
    </PageShell>
  );
}

function AppointmentsPage({ appointments, goToPage, onBack }) {
  return (
    <PageShell title="My Appointments" onBack={onBack}>
      <div className="page-actions">
        <button className="primary-action" onClick={() => goToPage("makeAppointment")}>
          + Make Appointment
        </button>
      </div>

      {appointments.length === 0 ? (
        <p className="empty-text">No appointments yet.</p>
      ) : (
        <div className="appointment-page-list">
          {appointments.map((appointment) => (
            <article className="appointment-page-card" key={appointment.id}>
              <div>
                <h3>
                  {new Date(appointment.date_time).toLocaleDateString()}{" "}
                  {new Date(appointment.date_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </h3>

                <p>
                  Pet: {appointment.pet?.name ?? appointment.pet} • Clinic:{" "}
                  {appointment.vet?.clinic_name ?? "-"}
                </p>

                <small>{appointment.notes || "No notes"}</small>
              </div>

              <span>{appointment.status}</span>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function MakeAppointmentPage({
  pets,
  vets,
  selectedPetId,
  setSelectedPetId,
  selectedVetId,
  setSelectedVetId,
  dateStr,
  setDateStr,
  timeStr,
  setTimeStr,
  notes,
  setNotes,
  submitAppointment,
  onBack,
}) {
  return (
    <PageShell title="Make An Appointment" onBack={onBack}>
      <form className="form-card" onSubmit={submitAppointment}>
        <label>
          Pet
          <select value={selectedPetId} onChange={(e) => setSelectedPetId(e.target.value)} required>
            <option value="">Select pet</option>

            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} ({pet.species})
              </option>
            ))}
          </select>
        </label>

        <label>
          Veterinarian
          <select value={selectedVetId} onChange={(e) => setSelectedVetId(e.target.value)} required>
            <option value="">Select veterinarian</option>

            {vets.map((vet) => (
              <option key={vet.id} value={vet.id}>
                {vet.clinic_name} - {vet.specialization} ({vet.city})
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} required />
        </label>

        <label>
          Time
          <input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} required />
        </label>

        <label className="full-field">
          Notes
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note"
          />
        </label>

        <button className="primary-action" type="submit">
          Create Appointment
        </button>
      </form>
    </PageShell>
  );
}

function RemindersPage({ onBack }) {
  const [reminders, setReminders] = useState([
    {
      id: 1,
      type: "Food",
      title: "Morning food",
      time: "09:00",
      note: "Dry food portion",
      done: false,
    },
    {
      id: 2,
      type: "Medication",
      title: "Evening medicine",
      time: "21:00",
      note: "Give after meal",
      done: false,
    },
  ]);

  const [reminderType, setReminderType] = useState("Food");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderNote, setReminderNote] = useState("");

  function addReminder(e) {
    e.preventDefault();

    if (!reminderTitle || !reminderTime) {
      return;
    }

    const newReminder = {
      id: Date.now(),
      type: reminderType,
      title: reminderTitle,
      time: reminderTime,
      note: reminderNote,
      done: false,
    };

    setReminders([newReminder, ...reminders]);

    setReminderType("Food");
    setReminderTitle("");
    setReminderTime("");
    setReminderNote("");
  }

  function toggleReminder(id) {
    setReminders(
      reminders.map((reminder) =>
        reminder.id === id
          ? { ...reminder, done: !reminder.done }
          : reminder
      )
    );
  }

  function deleteReminder(id) {
    setReminders(reminders.filter((reminder) => reminder.id !== id));
  }

  const completedCount = reminders.filter((reminder) => reminder.done).length;

  return (
    <PageShell title="Daily Reminders" onBack={onBack}>
      <div className="reminder-dashboard">
        <div className="tracker-summary">
          <div className="tracker-card">
            <span>🍽️</span>
            <strong>Food Tracking</strong>
            <p>Track food brands, meal times and daily feeding routines.</p>
          </div>

          <div className="tracker-card">
            <span>💊</span>
            <strong>Medication Tracking</strong>
            <p>Record medicine names, reminder times and care notes.</p>
          </div>

          <div className="tracker-card">
            <span>⏰</span>
            <strong>Reminder Alarm</strong>
            <p>Create time-based reminders for daily pet care tasks.</p>
          </div>

          <div className="tracker-card">
            <span>✅</span>
            <strong>{completedCount}/{reminders.length}</strong>
            <p>Completed reminders today.</p>
          </div>
        </div>

        <form className="reminder-form" onSubmit={addReminder}>
          <h2>Create New Reminder</h2>

          <label>
            Reminder Type
            <select value={reminderType} onChange={(e) => setReminderType(e.target.value)}>
              <option value="Food">Food</option>
              <option value="Medication">Medication</option>
              <option value="Water">Water</option>
              <option value="Walk">Walk</option>
              <option value="Care">General Care</option>
            </select>
          </label>

          <label>
            Reminder Title
            <input
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              placeholder="Example: Royal Canin morning food"
            />
          </label>

          <label>
            Time
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </label>

          <label className="full-field">
            Note
            <input
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
              placeholder="Example: 80 grams, after walk, give with water..."
            />
          </label>

          <button className="primary-action" type="submit">
            Add Reminder
          </button>
        </form>

        <div className="reminder-list-panel">
          <h2>Today's Tracking List</h2>

          {reminders.length === 0 ? (
            <p className="empty-text">No reminders created yet.</p>
          ) : (
            <div className="reminder-list">
              {reminders.map((reminder) => (
                <article
                  className={reminder.done ? "reminder-item done" : "reminder-item"}
                  key={reminder.id}
                >
                  <div className="reminder-time">
                    <strong>{reminder.time}</strong>
                    <span>{reminder.type}</span>
                  </div>

                  <div className="reminder-content">
                    <h3>{reminder.title}</h3>
                    <p>{reminder.note || "No note added."}</p>
                  </div>

                  <div className="reminder-actions">
                    <button type="button" onClick={() => toggleReminder(reminder.id)}>
                      {reminder.done ? "Undo" : "Done"}
                    </button>

                    <button type="button" onClick={() => deleteReminder(reminder.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function ReminderCard({ icon, title, text }) {
  return (
    <article className="reminder-card">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function VaccinationPage({ onBack, goToPage }) {
  return (
    <PageShell title="Vaccination Schedule" onBack={onBack}>
      <div className="vaccine-intro">
        <h2>Keep vaccination dates under control.</h2>
        <p>
          This schedule helps pet owners remember common vaccination and parasite treatment periods.
          For exact medical planning, always follow your veterinarian's recommendation.
        </p>
      </div>

      <div className="vaccine-table">
        <div className="vaccine-row header">
          <span>Vaccine / Treatment</span>
          <span>Recommended Period</span>
          <span>Status</span>
        </div>

        <div className="vaccine-row">
          <span>Rabies Vaccine</span>
          <span>Yearly</span>
          <span>Follow-up needed</span>
        </div>

        <div className="vaccine-row">
          <span>Mixed Vaccine</span>
          <span>Yearly</span>
          <span>Follow-up needed</span>
        </div>

        <div className="vaccine-row">
          <span>Parasite Treatment</span>
          <span>Every 2–3 months</span>
          <span>Follow-up needed</span>
        </div>

        <div className="vaccine-row">
          <span>Leptospirosis Vaccine</span>
          <span>According to vet plan</span>
          <span>Optional</span>
        </div>

        <div className="vaccine-row">
          <span>Kennel Cough Vaccine</span>
          <span>According to lifestyle risk</span>
          <span>Optional</span>
        </div>
      </div>

      <div className="vaccine-appointment-box">
        <div>
          <h2>Need a vaccination appointment?</h2>
          <p>
            You can create a veterinary appointment directly from here and add vaccination details
            in the appointment note.
          </p>
        </div>

        <button className="primary-action" onClick={() => goToPage("makeAppointment")}>
          Make An Appointment
        </button>
      </div>
    </PageShell>
  );
}

function SkinAnalysisPage({
  onBack,
  skinImage,
  skinImagePreview,
  skinPredictions,
  skinLoading,
  skinAnalyzed,
  handleSkinImageChange,
  submitSkinPrediction,
}) {
  const topPrediction =
    skinPredictions.length > 0
      ? [...skinPredictions].sort((a, b) => b.confidence - a.confidence)[0]
      : null;

  return (
    <PageShell title="Dog Skin Analysis" onBack={onBack}>
      <div className="skin-analysis-layout">
        <section className="skin-upload-panel">
          <div className="skin-page-intro">
            <span className="skin-badge">AI Supported Analysis</span>

            <h2>Upload a dog skin image</h2>

            <p>
              Upload a clear photo of the affected skin area. The system will analyze the image
              and return a preliminary disease prediction with confidence score.
            </p>

            <p className="medical-warning">
              This result does not replace veterinary diagnosis. It is only a supportive early
              information tool.
            </p>
          </div>

          <form className="skin-upload-form" onSubmit={submitSkinPrediction}>
            <label className="skin-upload-box">
              <input type="file" accept="image/*" onChange={handleSkinImageChange} />

              <span>Choose Image</span>

              <small>
                Recommended: clear, close-up image of the affected skin area
              </small>
            </label>

            {skinImage && (
              <div className="selected-file-name">
                Selected file: <strong>{skinImage.name}</strong>
              </div>
            )}

            <button className="primary-action skin-analyze-button" type="submit" disabled={skinLoading}>
              {skinLoading ? "Analyzing..." : "Analyze Image"}
            </button>
          </form>
        </section>

        <section className="skin-preview-panel">
          <h2>Image Preview</h2>

          {skinImagePreview ? (
            <div className="skin-preview-card">
              <img src={skinImagePreview} alt="Selected dog skin preview" />
            </div>
          ) : (
            <div className="skin-empty-preview">
              <span>🖼️</span>
              <p>No image selected yet.</p>
            </div>
          )}
        </section>
      </div>

      <section className="skin-result-section">
        <h2>Prediction Result</h2>

        {!skinAnalyzed && !skinLoading && (
          <p className="empty-text">
            No analysis has been performed yet. Upload an image and click Analyze Image.
          </p>
        )}

        {skinAnalyzed && skinPredictions.length === 0 && (
          <p className="empty-text">
            No suspicious skin disease region was detected with sufficient confidence.
          </p>
        )}

        {topPrediction && (
          <div className="top-prediction-card">
            <span>Most likely result</span>

            <h3>{topPrediction.class}</h3>

            <p>{(topPrediction.confidence * 100).toFixed(2)}% confidence</p>
          </div>
        )}

        {skinPredictions.length > 0 && (
          <div className="prediction-grid">
            {skinPredictions.map((prediction, index) => (
              <article className="prediction-card" key={index}>
                <div>
                  <strong>{prediction.class}</strong>
                  <p>Confidence: {(prediction.confidence * 100).toFixed(2)}%</p>
                </div>

                <small>
                  Bounding box: [{prediction.box.join(", ")}]
                </small>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

export default App;
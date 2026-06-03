import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

function App() {
  // auth
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  // data
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vets, setVets] = useState([]);

  // ui state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // forms
  const [showPetForm, setShowPetForm] = useState(false);
  const [showAppForm, setShowAppForm] = useState(false);

  // pet form fields
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("Kedi");
  const [petGender, setPetGender] = useState("F");
  const [petAge, setPetAge] = useState(1);

  // appointment form fields
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedVetId, setSelectedVetId] = useState("");
  const [dateStr, setDateStr] = useState(""); // YYYY-MM-DD
  const [timeStr, setTimeStr] = useState(""); // HH:MM
  const [notes, setNotes] = useState("");

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE });

    if (token) {
      instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    // refresh on 401
    instance.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;
        if (error?.response?.status === 401 && !original._retry) {
          original._retry = true;
          const refresh = localStorage.getItem("refresh_token");
          if (!refresh) {
            handleLogout();
            return Promise.reject(error);
          }
          try {
            const refreshRes = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
            const newAccess = refreshRes.data.access;
            localStorage.setItem("access_token", newAccess);
            setToken(newAccess);
            original.headers["Authorization"] = `Bearer ${newAccess}`;
            return axios(original);
          } catch (e) {
            handleLogout();
            return Promise.reject(e);
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [token]);

  function flashSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 2000);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await axios.post(`${API_BASE}/token/`, { username, password });
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      setToken(res.data.access);
      setPassword("");
      flashSuccess("Giriş başarılı");
    } catch (err) {
      console.error(err);
      setErrorMsg("Giriş başarısız. Kullanıcı adı/şifre yanlış olabilir.");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setErrorMsg("");
    try {
      await axios.post(`${API_BASE}/register/`, { username, password });
      // auto login
      const res = await axios.post(`${API_BASE}/token/`, { username, password });
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      setToken(res.data.access);
      setPassword("");
      flashSuccess("Kayıt + giriş başarılı");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.password?.[0] ||
        "Kayıt başarısız. Bu kullanıcı adı alınmış olabilir.";
      setErrorMsg(msg);
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken("");
    setPets([]);
    setAppointments([]);
    setVets([]);
    setShowPetForm(false);
    setShowAppForm(false);
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
      setErrorMsg("Veriler çekilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
      flashSuccess("Pet eklendi ✅");
      setShowPetForm(false);
      setPetName("");
      setPetAge(1);
      await loadAll();
    } catch (err) {
      console.error(err);
      setErrorMsg("Pet eklenemedi. Alanları kontrol et.");
    }
  }

  async function submitAppointment(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedPetId || !selectedVetId || !dateStr || !timeStr) {
      setErrorMsg("Pet, Veteriner, Tarih ve Saat zorunlu.");
      return;
    }

    // ISO datetime üret (local)
    const iso = new Date(`${dateStr}T${timeStr}:00`).toISOString();

    try {
      await api.post("/appointments/", {
        pet: Number(selectedPetId),
        vet: Number(selectedVetId),
        date_time: iso,
        duration_minutes: 30,
        notes: notes || "",
        status: "PENDING",
      });
      flashSuccess("Randevu oluşturuldu ✅");
      setShowAppForm(false);
      setNotes("");
      await loadAll();
    } catch (err) {
      console.error(err);
      const detail = err?.response?.data?.non_field_errors?.[0] || err?.response?.data?.detail;
      setErrorMsg(detail || "Randevu oluşturulamadı. (Çakışma olabilir)");
    }
  }

  // LOGIN SCREEN
  if (!token) {
    return (
      <div className="app" style={{ maxWidth: 420, margin: "40px auto" }}>
        <h2 style={{ marginBottom: 8 }}>PetCare {isRegister ? "Register" : "Login"}</h2>
        <p style={{ marginTop: 0, opacity: 0.8 }}>Devam etmek için {isRegister ? "kayıt ol" : "giriş yap"}.</p>

        {errorMsg && <p style={{ color: "crimson", marginTop: 12 }}>{errorMsg}</p>}
        {successMsg && <p style={{ color: "green", marginTop: 12 }}>{successMsg}</p>}

        <form
          onSubmit={isRegister ? handleRegister : handleLogin}
          style={{ display: "grid", gap: 12, marginTop: 16 }}
        >
          <input placeholder="Kullanıcı adı" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input
            placeholder="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn" type="submit">
            {isRegister ? "Kayıt Ol" : "Giriş Yap"}
          </button>

          <button
            type="button"
            onClick={() => setIsRegister((v) => !v)}
            style={{ background: "transparent", border: "none", cursor: "pointer", opacity: 0.8 }}
          >
            {isRegister ? "Zaten hesabın var mı? Giriş yap" : "Hesabın yok mu? Kayıt ol"}
          </button>
        </form>

        <small style={{ display: "block", marginTop: 16, opacity: 0.7 }}>Backend: {API_BASE}</small>
      </div>
    );
  }

  // MAIN UI
  return (
    <div className="app">
      <header>
        <div className="brand">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2138/2138440.png"
            alt="PetCare logo"
            className="paw-icon"
          />
          PetCare
        </div>

        <button className="btn" onClick={handleLogout} style={{ marginLeft: "auto" }}>
          Çıkış
        </button>
      </header>

      <main>
        {loading && <p style={{ textAlign: "center", marginTop: 16 }}>Yükleniyor...</p>}
        {errorMsg && <p style={{ textAlign: "center", marginTop: 16, color: "crimson" }}>{errorMsg}</p>}
        {successMsg && <p style={{ textAlign: "center", marginTop: 16, color: "green" }}>{successMsg}</p>}

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => setShowPetForm((v) => !v)}>
            + Yeni Pet
          </button>
          <button className="btn" onClick={() => setShowAppForm((v) => !v)}>
            + Yeni Randevu
          </button>
          <button className="btn" onClick={loadAll}>
            Yenile
          </button>
        </div>

        {/* Pet Form */}
        {showPetForm && (
          <section className="hero" style={{ marginTop: 16 }}>
            <h2>Yeni Pet Ekle</h2>
            <form onSubmit={submitPet} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
              <input placeholder="Adı" value={petName} onChange={(e) => setPetName(e.target.value)} required />
              <select value={petSpecies} onChange={(e) => setPetSpecies(e.target.value)}>
                <option value="Kedi">Kedi</option>
                <option value="Köpek">Köpek</option>
                <option value="Belirsiz">Belirsiz</option>
              </select>
              <select value={petGender} onChange={(e) => setPetGender(e.target.value)}>
                <option value="F">Dişi</option>
                <option value="M">Erkek</option>
              </select>
              <input
                type="number"
                min="0"
                placeholder="Yaş"
                value={petAge}
                onChange={(e) => setPetAge(e.target.value)}
              />
              <button className="btn" type="submit">Kaydet</button>
            </form>
          </section>
        )}

        {/* Appointment Form */}
        {showAppForm && (
          <section className="hero" style={{ marginTop: 16 }}>
            <h2>Yeni Randevu Oluştur</h2>
            <form onSubmit={submitAppointment} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
              <select value={selectedPetId} onChange={(e) => setSelectedPetId(e.target.value)} required>
                <option value="">Pet seç</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>

              <select value={selectedVetId} onChange={(e) => setSelectedVetId(e.target.value)} required>
                <option value="">Veteriner seç</option>
                {vets.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.clinic_name} - {v.specialization} ({v.city})
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} required />
                <input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} required />
              </div>

              <input placeholder="Not (opsiyonel)" value={notes} onChange={(e) => setNotes(e.target.value)} />

              <button className="btn" type="submit">Randevu Oluştur</button>
            </form>
            <small style={{ opacity: 0.75 }}>
              Slot mantığı yok: saat doluysa backend hata dönebilir, burada gösteriyoruz.
            </small>
          </section>
        )}

        {/* My Pets */}
        <section className="pets-section" style={{ marginTop: 24 }}>
          <h2 className="pets-title">My Pets</h2>
          {pets.length === 0 ? (
            <p style={{ textAlign: "center" }}>Henüz hiç hayvan eklenmemiş.</p>
          ) : (
            pets.map((pet) => (
              <article className="pet-card" key={pet.id}>
                <img
                  src={
                    pet.photo_url
                      ? pet.photo_url
                      : pet.species === "Kedi" || pet.species === "Cat"
                      ? "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300"
                      : "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300"
                  }
                  alt={pet.name}
                />
                <div className="pet-info">
                  <h3>{pet.name}</h3>
                  <p>
                    {pet.species} • {pet.computed_age ?? pet.age ?? "-"} Yaşında •{" "}
                    {pet.gender === "M" ? "Erkek" : pet.gender === "F" ? "Dişi" : "Belirsiz"}
                  </p>
                  <small>Sahibi: {pet.owner_username ?? pet.owner}</small>
                </div>
              </article>
            ))
          )}
        </section>

        {/* Appointments */}
        <section className="pets-section" style={{ marginTop: 24 }}>
          <h2 className="pets-title">Appointments</h2>
          {appointments.length === 0 ? (
            <p style={{ textAlign: "center" }}>Henüz randevu yok.</p>
          ) : (
            appointments.map((app) => (
              <article className="pet-card" key={app.id}>
                <div className="pet-info">
                  <h3>
                    {new Date(app.date_time).toLocaleDateString()}{" "}
                    {new Date(app.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </h3>
                  <p>
                    Pet: {app.pet?.name ?? app.pet} • Klinik: {app.vet?.clinic_name ?? "-"} • Durum: {app.status}
                  </p>
                  <small>{app.notes || ""}</small>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      <footer>
        <small>© 2025 PetCare Clinic • Made with ♥</small>
      </footer>
    </div>
  );
}

export default App;

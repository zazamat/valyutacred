"use client";

import { useState } from "react";
import Link from "next/link";

const defaultApplications = [
  {
    id: 1,
    name: "Elvin Məmmədov",
    phone: "+994 50 111 22 33",
    bank: "Kapital Bank",
    type: "Nağd kredit",
    amount: 12000,
    amountLabel: "12 000 AZN",
    salary: 900,
    salaryLabel: "900 AZN",
    status: "Yeni",
    date: "2026-03-19",
    workplace: "Azersun",
    note: "İlkin yoxlama gözləyir",
  },
  {
    id: 2,
    name: "Aysel Həsənova",
    phone: "+994 55 444 55 66",
    bank: "ABB",
    type: "Biznes krediti",
    amount: 20000,
    amountLabel: "20 000 AZN",
    salary: 1500,
    salaryLabel: "1 500 AZN",
    status: "Baxılır",
    date: "2026-03-18",
    workplace: "Şəxsi biznes",
    note: "Sənədlər dəqiqləşdirilir",
  },
  {
    id: 3,
    name: "Murad Əliyev",
    phone: "+994 70 777 88 99",
    bank: "Unibank",
    type: "İpoteka",
    amount: 85000,
    amountLabel: "85 000 AZN",
    salary: 2500,
    salaryLabel: "2 500 AZN",
    status: "Göndərildi",
    date: "2026-03-17",
    workplace: "SOCAR",
    note: "Banka yönləndirilib",
  },
  {
    id: 4,
    name: "Nigar Qasımova",
    phone: "+994 51 333 22 11",
    bank: "Yelo Bank",
    type: "Kart krediti",
    amount: 3500,
    amountLabel: "3 500 AZN",
    salary: 700,
    salaryLabel: "700 AZN",
    status: "Yeni",
    date: "2026-03-19",
    workplace: "Kontakt Home",
    note: "Əlavə əlaqə tələb olunur",
  },
  {
    id: 5,
    name: "Rəşad Səfərli",
    phone: "+994 12 555 44 33",
    bank: "Kapital Bank",
    type: "Nağd kredit",
    amount: 7000,
    amountLabel: "7 000 AZN",
    salary: 1100,
    salaryLabel: "1 100 AZN",
    status: "Baxılır",
    date: "2026-03-16",
    workplace: "Bravo",
    note: "Operator baxışındadır",
  },
  {
    id: 6,
    name: "Sevinc Məmmədli",
    phone: "+994 77 888 99 00",
    bank: "ABB",
    type: "İpoteka",
    amount: 60000,
    amountLabel: "60 000 AZN",
    salary: 3200,
    salaryLabel: "3 200 AZN",
    status: "Yeni",
    date: "2026-03-15",
    workplace: "PAŞA Holding",
    note: "Yüksək prioritet lead",
  },
];

function loadApplicationsFromStorage() {
  try {
    const stored = localStorage.getItem("valyutacred_applications");

    if (!stored) {
      localStorage.setItem(
        "valyutacred_applications",
        JSON.stringify(defaultApplications)
      );
      return defaultApplications;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(
        "valyutacred_applications",
        JSON.stringify(defaultApplications)
      );
      return defaultApplications;
    }

    return parsed;
  } catch (error) {
    localStorage.setItem(
      "valyutacred_applications",
      JSON.stringify(defaultApplications)
    );
    return defaultApplications;
  }
}

function formatNumber(value) {
  return Number(value).toLocaleString("en-US");
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HomePage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    bank: "",
    type: "",
    amount: "",
    salary: "",
    workplace: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSuccessMessage("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedWorkplace = form.workplace.trim();

    const amountNumber = Number(form.amount);
    const salaryNumber = Number(form.salary);

    if (!trimmedName || !trimmedPhone || !form.type || !form.amount || !form.salary) {
      alert("Zəhmət olmasa tələb olunan sahələri doldurun.");
      return;
    }

    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      alert("Kredit məbləğini düzgün daxil edin.");
      return;
    }

    if (Number.isNaN(salaryNumber) || salaryNumber <= 0) {
      alert("Maaş məbləğini düzgün daxil edin.");
      return;
    }

    setIsSubmitting(true);

    try {
      const existingApplications = loadApplicationsFromStorage();
      const maxId = existingApplications.reduce((max, item) => {
        return item.id > max ? item.id : max;
      }, 0);

      const newApplication = {
        id: maxId + 1,
        name: trimmedName,
        phone: trimmedPhone,
        bank: form.bank || "Təyin edilməyib",
        type: form.type,
        amount: amountNumber,
        amountLabel: `${formatNumber(amountNumber)} AZN`,
        salary: salaryNumber,
        salaryLabel: `${formatNumber(salaryNumber)} AZN`,
        status: "Yeni",
        date: getTodayString(),
        workplace: trimmedWorkplace || "Qeyd olunmayıb",
        note: "Saytdan daxil olan yeni müraciət",
      };

      const updatedApplications = [newApplication, ...existingApplications];

      localStorage.setItem(
        "valyutacred_applications",
        JSON.stringify(updatedApplications)
      );

      setForm({
        name: "",
        phone: "",
        bank: "",
        type: "",
        amount: "",
        salary: "",
        workplace: "",
      });

      setSuccessMessage(
        "Müraciət uğurla göndərildi. Admin paneldə artıq görünür."
      );
    } catch (error) {
      alert("Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "18px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "30px",
                fontWeight: 800,
                color: "#047857",
                lineHeight: 1.1,
              }}
            >
              ValyutaCred
            </div>
            <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
              Kredit müraciətlərinin toplanması və idarə olunması platforması
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/login"
              style={{
                background: "#fff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                padding: "10px 16px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Admin giriş
            </Link>

            <Link
              href="/admin/applications"
              style={{
                background: "#059669",
                color: "#fff",
                borderRadius: "12px",
                padding: "10px 16px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Müraciətlər
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
              alignItems: "start",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                padding: "28px",
                boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  borderRadius: "999px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 700,
                  marginBottom: "16px",
                }}
              >
                Onlayn müraciət
              </div>

              <h1
                style={{
                  fontSize: "36px",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                Kredit müraciətinizi indi göndərin
              </h1>

              <p
                style={{
                  marginTop: "14px",
                  fontSize: "16px",
                  lineHeight: 1.8,
                  color: "#475569",
                }}
              >
                Məlumatlarınızı daxil edin. Müraciət avtomatik olaraq admin panelə
                düşəcək və operator tərəfindən yoxlanılacaq.
              </p>

              <div
                style={{
                  marginTop: "24px",
                  display: "grid",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "15px" }}>Sadə müraciət</div>
                  <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                    Login və qeydiyyat olmadan müraciət etmək mümkündür.
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "15px" }}>Admin nəzarəti</div>
                  <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                    Daxil olan müraciətlər admin paneldə görünür və statuslandırılır.
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "15px" }}>Gələcək genişlənmə</div>
                  <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                    Sonrakı mərhələdə bank kabineti, faizlər və məhsul təsdiqi əlavə olunacaq.
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                padding: "28px",
                boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
                Müraciət formu
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
                Tələb olunan sahələri doldurun
              </div>

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
                <input
                  type="text"
                  placeholder="Ad və soyad *"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    fontSize: "15px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <input
                  type="text"
                  placeholder="Telefon nömrəsi *"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    fontSize: "15px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <select
                  value={form.bank}
                  onChange={(e) => handleChange("bank", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    fontSize: "15px",
                    background: "#fff",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Bank seçin (istəyə bağlı)</option>
                  <option value="Kapital Bank">Kapital Bank</option>
                  <option value="ABB">ABB</option>
                  <option value="Unibank">Unibank</option>
                  <option value="Yelo Bank">Yelo Bank</option>
                </select>

                <select
                  value={form.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    fontSize: "15px",
                    background: "#fff",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Kredit növü seçin *</option>
                  <option value="Nağd kredit">Nağd kredit</option>
                  <option value="Biznes krediti">Biznes krediti</option>
                  <option value="İpoteka">İpoteka</option>
                  <option value="Kart krediti">Kart krediti</option>
                </select>

                <input
                  type="number"
                  placeholder="Kredit məbləği (AZN) *"
                  value={form.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    fontSize: "15px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <input
                  type="number"
                  placeholder="Aylıq maaş / gəlir (AZN) *"
                  value={form.salary}
                  onChange={(e) => handleChange("salary", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    fontSize: "15px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <input
                  type="text"
                  placeholder="İş yeri"
                  value={form.workplace}
                  onChange={(e) => handleChange("workplace", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    fontSize: "15px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    marginTop: "4px",
                    width: "100%",
                    background: isSubmitting ? "#94a3b8" : "#059669",
                    color: "#fff",
                    border: "none",
                    borderRadius: "14px",
                    padding: "14px 18px",
                    fontWeight: 700,
                    fontSize: "16px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Göndərilir..." : "Müraciəti göndər"}
                </button>

                {successMessage ? (
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "14px",
                      color: "#166534",
                      background: "#dcfce7",
                      border: "1px solid #bbf7d0",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      lineHeight: 1.6,
                    }}
                  >
                    {successMessage}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

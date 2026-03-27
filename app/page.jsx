export const dynamic = "force-dynamic";
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

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

    if (!Array.isArray(parsed)) {
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

const banks = ["Kapital Bank", "ABB", "Unibank", "Yelo Bank"];
const loanTypes = ["Nağd kredit", "Biznes krediti", "İpoteka", "Kart krediti"];

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

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedWorkplace = form.workplace.trim();

    const amountNumber = Number(form.amount);
    const salaryNumber = Number(form.salary);

    if (
      !trimmedName ||
      !trimmedPhone ||
      !form.type ||
      !form.amount ||
      !form.salary
    ) {
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
    setSuccessMessage("");

    const noteText = [
      "Saytdan daxil olan yeni müraciət",
      form.bank ? `Bank: ${form.bank}` : "Bank: Təyin edilməyib",
      form.type ? `Kredit növü: ${form.type}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      const { error } = await supabase.from("applications").insert([
        {
          full_name: trimmedName,
          phone: trimmedPhone,
          amount: amountNumber,
          monthly_income: salaryNumber,
          workplace: trimmedWorkplace || "Qeyd olunmayıb",
          note: noteText,
          status: "new",
        },
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
        alert("Bazaya yazılarkən xəta baş verdi: " + error.message);
        return;
      }

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
        note: noteText,
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
        "Müraciət uğurla göndərildi. Məlumat bazaya və admin axınına əlavə olundu."
      );
    } catch (error) {
      console.error("Submit error:", error);
      alert("Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eefbf5 45%, #ffffff 100%)",
        color: "#0f172a",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(10px)",
          background: "rgba(255,255,255,0.9)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #059669, #10b981)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "22px",
                boxShadow: "0 10px 25px rgba(5,150,105,0.25)",
                flexShrink: 0,
              }}
            >
              ₼
            </div>
            <div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "#047857",
                  lineHeight: 1.1,
                }}
              >
                ValyutaCred
              </div>
              <div
                style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}
              >
                Kredit müraciət və lead platforması
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/login"
              style={{
                textDecoration: "none",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                background: "#fff",
                padding: "10px 16px",
                borderRadius: "12px",
                fontWeight: 700,
              }}
            >
              Admin giriş
            </Link>

            <Link
              href="/admin/applications"
              style={{
                textDecoration: "none",
                color: "#fff",
                background: "linear-gradient(135deg, #059669, #10b981)",
                padding: "10px 16px",
                borderRadius: "12px",
                fontWeight: 700,
                boxShadow: "0 10px 25px rgba(5,150,105,0.22)",
              }}
            >
              Müraciətlər
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "36px 20px 24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(16,185,129,0.03))",
                border: "1px solid #d1fae5",
                borderRadius: "28px",
                padding: "32px",
                boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-40px",
                  right: "-40px",
                  width: "180px",
                  height: "180px",
                  borderRadius: "999px",
                  background: "rgba(16,185,129,0.10)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-60px",
                  left: "-50px",
                  width: "200px",
                  height: "200px",
                  borderRadius: "999px",
                  background: "rgba(5,150,105,0.08)",
                }}
              />

              <div style={{ position: "relative", zIndex: 2 }}>
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
                  Sürətli onlayn müraciət
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(32px, 5vw, 54px)",
                    lineHeight: 1.06,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Kredit müraciətini
                  <span style={{ color: "#059669" }}> 1 dəqiqəyə </span>
                  göndər
                </h1>

                <p
                  style={{
                    marginTop: "18px",
                    fontSize: "17px",
                    lineHeight: 1.8,
                    color: "#475569",
                    maxWidth: "680px",
                  }}
                >
                  ValyutaCred vasitəsilə müraciətinizi rahat şəkildə göndərin.
                  Daxil olan məlumat admin panelə ötürülür, yoxlanılır və
                  sonrakı mərhələdə bank yönləndirməsinə hazırlanır.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                    marginTop: "24px",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      border: "1px solid #dcfce7",
                      borderRadius: "18px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        color: "#059669",
                      }}
                    >
                      4+
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#475569",
                        marginTop: "6px",
                      }}
                    >
                      Bank seçimi üçün baza
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      border: "1px solid #dcfce7",
                      borderRadius: "18px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        color: "#059669",
                      }}
                    >
                      100%
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#475569",
                        marginTop: "6px",
                      }}
                    >
                      Admin panelə ötürülmə
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      border: "1px solid #dcfce7",
                      borderRadius: "18px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        color: "#059669",
                      }}
                    >
                      24/7
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#475569",
                        marginTop: "6px",
                      }}
                    >
                      Onlayn müraciət imkanı
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                    marginTop: "24px",
                  }}
                >
                  {[
                    "Qeydiyyat olmadan müraciət göndərmək mümkündür",
                    "Məlumatlar operator baxışı üçün sistemə düşür",
                    "Sonrakı mərhələdə bank kabineti və məhsul təsdiqi əlavə olunacaq",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        color: "#334155",
                        fontSize: "15px",
                        lineHeight: 1.6,
                      }}
                    >
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "999px",
                          background: "#dcfce7",
                          color: "#166534",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: "1px",
                        }}
                      >
                        ✓
                      </div>
                      <div>{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "28px",
                padding: "28px",
                boxShadow: "0 20px 55px rgba(15,23,42,0.08)",
              }}
            >
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: 800,
                    lineHeight: 1.1,
                  }}
                >
                  Müraciət formu
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "14px",
                    color: "#64748b",
                    lineHeight: 1.7,
                  }}
                >
                  Tələb olunan məlumatları daxil edin. Müraciət birbaşa
                  sistemə düşəcək.
                </div>
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
                    background: "#fff",
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
                    background: "#fff",
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                  }}
                >
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
                    <option value="">Bank seçin</option>
                    {banks.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
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
                    <option value="">Kredit növü *</option>
                    {loanTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                  }}
                >
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
                      background: "#fff",
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
                      background: "#fff",
                    }}
                  />
                </div>

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
                    background: "#fff",
                  }}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "15px 18px",
                    border: "none",
                    borderRadius: "16px",
                    fontSize: "16px",
                    fontWeight: 800,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    color: "#fff",
                    background: isSubmitting
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #059669, #10b981)",
                    boxShadow: isSubmitting
                      ? "none"
                      : "0 14px 30px rgba(5,150,105,0.24)",
                  }}
                >
                  {isSubmitting ? "Göndərilir..." : "Müraciəti göndər"}
                </button>

                {successMessage ? (
                  <div
                    style={{
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

                <div
                  style={{
                    marginTop: "4px",
                    padding: "14px",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    color: "#64748b",
                    lineHeight: 1.7,
                  }}
                >
                  Müraciəti göndərməklə məlumatların operator tərəfindən
                  baxılmasına razılıq vermiş olursunuz.
                </div>
              </form>
            </div>
          </div>
        </section>

        <section
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "8px 20px 26px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              {
                title: "Sadə proses",
                text: "İstifadəçi uzun qeydiyyat olmadan birbaşa müraciət göndərir.",
              },
              {
                title: "Admin nəzarəti",
                text: "Müraciətlər paneldə görünür, yoxlanılır və statuslandırılır.",
              },
              {
                title: "Bank genişlənməsi",
                text: "Sonrakı mərhələdə bank kabineti və məhsul təsdiqi aktiv olacaq.",
              },
              {
                title: "Gələcək kalkulyator",
                text: "Faiz, müddət və məbləğ müqayisəsi ayrıca məhsul blokunda qurulacaq.",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "22px",
                  padding: "22px",
                  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#475569",
                    lineHeight: 1.75,
                  }}
                >
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "6px 20px 44px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a, #1e293b)",
              color: "#fff",
              borderRadius: "28px",
              padding: "30px",
              boxShadow: "0 20px 50px rgba(15,23,42,0.18)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: 800,
                    lineHeight: 1.15,
                  }}
                >
                  Admin panel artıq işləyir
                </div>
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "15px",
                    color: "rgba(255,255,255,0.78)",
                    lineHeight: 1.8,
                  }}
                >
                  İndi daxil olan müraciətləri idarə etmək, filtrləmək və
                  status dəyişmək mümkündür. Növbəti mərhələdə bank kabineti və
                  məhsul təsdiq axını əlavə ediləcək.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                }}
              >
                <Link
                  href="/admin/applications"
                  style={{
                    textDecoration: "none",
                    background: "#10b981",
                    color: "#fff",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    fontWeight: 800,
                  }}
                >
                  Müraciətləri aç
                </Link>

                <Link
                  href="/login"
                  style={{
                    textDecoration: "none",
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.18)",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    fontWeight: 800,
                  }}
                >
                  Admin login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
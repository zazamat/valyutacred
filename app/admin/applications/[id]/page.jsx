"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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

function getStatusStyles(status) {
  if (status === "Yeni") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
    };
  }

  if (status === "Baxılır") {
    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  if (status === "Göndərildi") {
    return {
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (status === "Rədd edildi") {
    return {
      background: "#fee2e2",
      color: "#991b1b",
    };
  }

  return {
    background: "#e2e8f0",
    color: "#334155",
  };
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [applications, setApplications] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("");
  const [currentNote, setCurrentNote] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    try {
      const auth = localStorage.getItem("valyutacred_auth");

      if (!auth) {
        router.push("/login");
        return;
      }

      const parsed = JSON.parse(auth);

      if (parsed.role !== "super_admin" && parsed.role !== "admin") {
        router.push("/login");
        return;
      }

      setApplications(loadApplicationsFromStorage());
      setIsCheckingAuth(false);
    } catch (error) {
      localStorage.removeItem("valyutacred_auth");
      router.push("/login");
    }
  }, [router]);

  const application = useMemo(() => {
    return applications.find((item) => String(item.id) === String(params.id));
  }, [applications, params.id]);

  useEffect(() => {
    if (application) {
      setCurrentStatus(application.status);
      setCurrentNote(application.note || "");
    }
  }, [application]);

  if (isCheckingAuth) {
    return null;
  }

  if (!application) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          fontFamily: "Arial, sans-serif",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "24px",
            padding: "24px",
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: "28px" }}>Müraciət tapılmadı</h1>
          <Link
            href="/admin/applications"
            style={{
              display: "inline-block",
              marginTop: "12px",
              textDecoration: "none",
              background: "#059669",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "12px",
              fontWeight: 700,
            }}
          >
            Müraciətlərə qayıt
          </Link>
        </div>
      </div>
    );
  }

  const statusStyles = getStatusStyles(currentStatus);

  function handleSave() {
    const updatedApplications = applications.map((item) => {
      if (item.id === application.id) {
        return {
          ...item,
          status: currentStatus,
          note: currentNote,
        };
      }

      return item;
    });

    setApplications(updatedApplications);
    localStorage.setItem(
      "valyutacred_applications",
      JSON.stringify(updatedApplications)
    );
    setSaveMessage("Dəyişikliklər yadda saxlanıldı");
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
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
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
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#047857" }}>
              Müraciət detalı
            </div>
            <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
              #{application.id} — {application.name}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/admin/applications"
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
              Müraciətlərə qayıt
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "28px", fontWeight: 800 }}>{application.name}</div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "8px" }}>
                Müraciət tarixi: {application.date}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "16px",
                  background: "#f8fafc",
                }}
              >
                <div style={{ fontSize: "13px", color: "#64748b" }}>Telefon</div>
                <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "8px", wordBreak: "break-word" }}>
                  {application.phone}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "16px",
                  background: "#f8fafc",
                }}
              >
                <div style={{ fontSize: "13px", color: "#64748b" }}>Bank</div>
                <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "8px" }}>
                  {application.bank}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "16px",
                  background: "#f8fafc",
                }}
              >
                <div style={{ fontSize: "13px", color: "#64748b" }}>Kredit növü</div>
                <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "8px" }}>
                  {application.type}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "16px",
                  background: "#f8fafc",
                }}
              >
                <div style={{ fontSize: "13px", color: "#64748b" }}>Kredit məbləği</div>
                <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "8px" }}>
                  {application.amountLabel}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "16px",
                  background: "#f8fafc",
                }}
              >
                <div style={{ fontSize: "13px", color: "#64748b" }}>Maaş</div>
                <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "8px" }}>
                  {application.salaryLabel}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "16px",
                  background: "#f8fafc",
                }}
              >
                <div style={{ fontSize: "13px", color: "#64748b" }}>İş yeri</div>
                <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "8px", wordBreak: "break-word" }}>
                  {application.workplace}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "20px",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "18px",
              }}
            >
              <div style={{ fontSize: "14px", color: "#64748b" }}>Mövcud qeyd</div>
              <div style={{ marginTop: "8px", fontSize: "15px", lineHeight: 1.7, wordBreak: "break-word" }}>
                {currentNote || "Qeyd yoxdur"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "20px",
              alignContent: "start",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                padding: "20px",
                boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: 800, marginBottom: "14px" }}>
                Cari status
              </div>

              <span
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: statusStyles.background,
                  color: statusStyles.color,
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                {currentStatus}
              </span>

              <div style={{ marginTop: "18px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                  Statusu dəyiş
                </div>

                <select
                  value={currentStatus}
                  onChange={(e) => {
                    setCurrentStatus(e.target.value);
                    setSaveMessage("");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    fontSize: "14px",
                    background: "#fff",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="Yeni">Yeni</option>
                  <option value="Baxılır">Baxılır</option>
                  <option value="Göndərildi">Göndərildi</option>
                  <option value="Rədd edildi">Rədd edildi</option>
                </select>
              </div>

              <div style={{ marginTop: "18px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                  Operator qeydi
                </div>

                <textarea
                  value={currentNote}
                  onChange={(e) => {
                    setCurrentNote(e.target.value);
                    setSaveMessage("");
                  }}
                  rows={6}
                  placeholder="Qeyd əlavə et..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    fontSize: "14px",
                    background: "#fff",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "Arial, sans-serif",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                onClick={handleSave}
                style={{
                  marginTop: "16px",
                  width: "100%",
                  background: "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Yadda saxla
              </button>

              {saveMessage ? (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "14px",
                    color: "#166534",
                    background: "#dcfce7",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                    padding: "10px 12px",
                  }}
                >
                  {saveMessage}
                </div>
              ) : null}
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                padding: "20px",
                boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: 800, marginBottom: "10px" }}>
                Qeyd
              </div>
              <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
                Bu mərhələdə dəyişiklik localStorage üzərində saxlanılır. Sonrakı addımda status və qeyd real backend və databaza ilə bağlanacaq.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

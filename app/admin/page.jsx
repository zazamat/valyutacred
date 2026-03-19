"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const cards = [
  {
    title: "Müraciətlər",
    value: "2 500+",
    desc: "Daxil olan kredit müraciətləri",
  },
  {
    title: "Aktiv təşkilatlar",
    value: "12",
    desc: "Sistemə qoşulmuş tərəfdaşlar",
  },
  {
    title: "Bu gün",
    value: "48",
    desc: "Yeni müraciət sayı",
  },
  {
    title: "Konversiya",
    value: "18%",
    desc: "Təxmini ilkin dönüşüm",
  },
];

const leads = [
  {
    name: "Elvin Məmmədov",
    phone: "+994 50 111 22 33",
    organizationType: "Bank",
    organization: "Kapital Bank",
    product: "Nağd kredit",
    amount: "12 000 AZN",
    status: "Yeni",
  },
  {
    name: "Aysel Həsənova",
    phone: "+994 55 444 55 66",
    organizationType: "BOKT",
    organization: "Finoko",
    product: "Biznes krediti",
    amount: "20 000 AZN",
    status: "Baxılır",
  },
  {
    name: "Murad Əliyev",
    phone: "+994 70 777 88 99",
    organizationType: "Bank",
    organization: "Unibank",
    product: "İpoteka",
    amount: "85 000 AZN",
    status: "Göndərildi",
  },
];

export default function AdminPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

      setIsCheckingAuth(false);
    } catch (error) {
      localStorage.removeItem("valyutacred_auth");
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 992);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  if (isCheckingAuth) {
    return null;
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
            alignItems: isMobile ? "flex-start" : "center",
            gap: "16px",
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "#059669",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "22px",
                flexShrink: 0,
              }}
            >
              ₼
            </div>
            <div>
              <div
                style={{
                  fontSize: isMobile ? "18px" : "20px",
                  fontWeight: 800,
                  color: "#047857",
                  lineHeight: 1.2,
                }}
              >
                ValyutaCred Admin
              </div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                Lead və müraciət idarəetmə paneli
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <Link
              href="/"
              style={{
                background: "#fff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                padding: "10px 16px",
                textDecoration: "none",
                fontWeight: 700,
                textAlign: "center",
                flex: isMobile ? "1 1 160px" : "0 0 auto",
              }}
            >
              Sayta qayıt
            </Link>

            <Link
              href="/admin/organizations"
              style={{
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "10px 16px",
                fontWeight: 700,
                textAlign: "center",
                textDecoration: "none",
                flex: isMobile ? "1 1 180px" : "0 0 auto",
              }}
            >
              Yeni təşkilat əlavə et
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 20px" }}>
          <div style={{ marginBottom: "24px" }}>
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
                marginBottom: "14px",
              }}
            >
              Admin panel
            </div>
            <h1
              style={{
                fontSize: isMobile ? "28px" : "36px",
                margin: 0,
                fontWeight: 800,
                lineHeight: 1.15,
              }}
            >
              Müraciətlər və platforma statistikası
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "#475569",
                lineHeight: 1.7,
                marginTop: "10px",
              }}
            >
              Buradan müraciətləri, təşkilatları, məhsulları, statusları və ümumi axını idarə etmək mümkündür.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            {cards.map((card) => (
              <div
                key={card.title}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
                }}
              >
                <div style={{ fontSize: "14px", color: "#64748b" }}>{card.title}</div>
                <div
                  style={{
                    fontSize: "34px",
                    fontWeight: 800,
                    color: "#059669",
                    marginTop: "8px",
                  }}
                >
                  {card.value}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#475569",
                    marginTop: "8px",
                    lineHeight: 1.6,
                  }}
                >
                  {card.desc}
                </div>
              </div>
            ))}
          </div>

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
                overflow: "hidden",
                boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: isMobile ? "20px" : "22px", fontWeight: 800 }}>
                    Son müraciətlər
                  </div>
                  <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                    Kredit müraciətlərinin cari siyahısı
                  </div>
                </div>

                <button
                  style={{
                    background: "#fff",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Filtr
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "900px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Ad</th>
                      <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Telefon</th>
                      <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Növ</th>
                      <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Təşkilat</th>
                      <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Məhsul</th>
                      <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Məbləğ</th>
                      <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.name}>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>{lead.name}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>{lead.phone}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>{lead.organizationType}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>{lead.organization}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>{lead.product}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>{lead.amount}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "6px 10px",
                              borderRadius: "999px",
                              background:
                                lead.status === "Yeni"
                                  ? "#dbeafe"
                                  : lead.status === "Baxılır"
                                  ? "#fef3c7"
                                  : "#dcfce7",
                              color:
                                lead.status === "Yeni"
                                  ? "#1d4ed8"
                                  : lead.status === "Baxılır"
                                  ? "#92400e"
                                  : "#166534",
                              fontWeight: 700,
                              fontSize: "12px",
                            }}
                          >
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
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
                  Sürətli əməliyyatlar
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  <button
                    style={{
                      background: "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    + Yeni müraciət əlavə et
                  </button>

                  <Link
                    href="/admin/organizations"
                    style={{
                      display: "block",
                      background: "#fff",
                      color: "#0f172a",
                      border: "1px solid #cbd5e1",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      fontWeight: 700,
                      textAlign: "left",
                      textDecoration: "none",
                    }}
                  >
                    Təşkilatları idarə et
                  </Link>

                  <Link
                    href="/admin/applications"
                    style={{
                      display: "block",
                      background: "#fff",
                      color: "#0f172a",
                      border: "1px solid #cbd5e1",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      fontWeight: 700,
                      textAlign: "left",
                      textDecoration: "none",
                    }}
                  >
                    Statusları yenilə
                  </Link>
                </div>
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
                  Növbəti addım
                </div>
                <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
                  Sonrakı mərhələdə bu panelə real login, rol əsaslı giriş, təşkilat kabineti, məhsul idarəsi və lead status dəyişimi əlavə ediləcək.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

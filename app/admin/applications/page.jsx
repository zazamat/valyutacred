"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const applications = [
  {
    id: 1,
    name: "Elvin Məmmədov",
    phone: "+994 50 111 22 33",
    bank: "Kapital Bank",
    type: "Nağd kredit",
    amount: "12 000 AZN",
    status: "Yeni",
  },
  {
    id: 2,
    name: "Aysel Həsənova",
    phone: "+994 55 444 55 66",
    bank: "ABB",
    type: "Biznes krediti",
    amount: "20 000 AZN",
    status: "Baxılır",
  },
  {
    id: 3,
    name: "Murad Əliyev",
    phone: "+994 70 777 88 99",
    bank: "Unibank",
    type: "İpoteka",
    amount: "85 000 AZN",
    status: "Göndərildi",
  },
  {
    id: 4,
    name: "Nigar Qasımova",
    phone: "+994 51 333 22 11",
    bank: "Yelo Bank",
    type: "Kart krediti",
    amount: "3 500 AZN",
    status: "Yeni",
  },
];

export default function ApplicationsPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#047857" }}>
              Müraciətlər
            </div>
            <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
              Bütün kredit müraciətlərinin siyahısı
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/admin"
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
              Admin panelə qayıt
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 20px" }}>
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
              <div style={{ fontSize: "22px", fontWeight: 800 }}>Müraciət siyahısı</div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                Status dəyişimi üçün ilkin səhifə
              </div>
            </div>

            <button
              style={{
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Yeni müraciət
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
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>ID</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Ad</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Telefon</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Bank</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Məhsul</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Məbləğ</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Status</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                      #{item.id}
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                      {item.name}
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                      {item.phone}
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                      {item.bank}
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                      {item.type}
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                      {item.amount}
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background:
                            item.status === "Yeni"
                              ? "#dbeafe"
                              : item.status === "Baxılır"
                              ? "#fef3c7"
                              : "#dcfce7",
                          color:
                            item.status === "Yeni"
                              ? "#1d4ed8"
                              : item.status === "Baxılır"
                              ? "#92400e"
                              : "#166534",
                          fontWeight: 700,
                          fontSize: "12px",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                      <Link
                        href={`/admin/applications/${item.id}`}
                        style={{
                          display: "inline-block",
                          background: "#fff",
                          color: "#0f172a",
                          border: "1px solid #cbd5e1",
                          borderRadius: "10px",
                          padding: "8px 12px",
                          textDecoration: "none",
                          fontWeight: 700,
                        }}
                      >
                        Bax
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

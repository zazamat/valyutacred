"use client";
export const dynamic = "force-dynamic";

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

const getStatusBadgeStyle = (status) => {
  const map = {
    Yeni: {
      background: "#dbeafe",
      color: "#1d4ed8",
    },
    Baxılır: {
      background: "#fef3c7",
      color: "#92400e",
    },
    Göndərildi: {
      background: "#dcfce7",
      color: "#166534",
    },
  };

  return {
    ...styles.statusBadge,
    ...(map[status] || map["Yeni"]),
  };
};

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
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };

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
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Müraciətlər və platforma statistikası</h1>
          <p style={styles.subtitle}>
            Buradan müraciətləri, təşkilatları, məhsulları, statusları və ümumi axını idarə etmək mümkündür.
          </p>
        </div>
      </div>

      <div
        style={{
          ...styles.cardsGrid,
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {cards.map((card) => (
          <div key={card.title} style={styles.card}>
            <div style={styles.cardLabel}>{card.title}</div>
            <div style={styles.cardValue}>{card.value}</div>
            <div style={styles.cardDesc}>{card.desc}</div>
          </div>
        ))}
      </div>

      <div style={styles.sectionsGrid}>
        <div style={styles.tablePanel}>
          <div style={styles.tablePanelHeader}>
            <div>
              <div
                style={{
                  ...styles.sectionTitle,
                  fontSize: isMobile ? "20px" : "22px",
                }}
              >
                Son müraciətlər
              </div>
              <div style={styles.sectionDesc}>
                Kredit müraciətlərinin cari siyahısı
              </div>
            </div>

            <button type="button" style={styles.filterButton}>
              Filtr
            </button>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <th style={styles.th}>Ad</th>
                  <th style={styles.th}>Telefon</th>
                  <th style={styles.th}>Növ</th>
                  <th style={styles.th}>Təşkilat</th>
                  <th style={styles.th}>Məhsul</th>
                  <th style={styles.th}>Məbləğ</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.name}>
                    <td style={styles.td}>{lead.name}</td>
                    <td style={styles.td}>{lead.phone}</td>
                    <td style={styles.td}>{lead.organizationType}</td>
                    <td style={styles.td}>{lead.organization}</td>
                    <td style={styles.td}>{lead.product}</td>
                    <td style={styles.td}>{lead.amount}</td>
                    <td style={styles.td}>
                      <span style={getStatusBadgeStyle(lead.status)}>{lead.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            ...styles.sideGrid,
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
          }}
        >
          <div style={styles.sidePanel}>
            <div style={styles.sidePanelTitle}>Sürətli əməliyyatlar</div>

            <div style={styles.actionsStack}>
              <Link href="/admin/applications" style={styles.primaryAction}>
                Müraciətləri aç
              </Link>

              <Link href="/admin/organizations" style={styles.secondaryAction}>
                Təşkilatları idarə et
              </Link>

              <Link href="/admin/products" style={styles.secondaryAction}>
                Məhsulları idarə et
              </Link>

              <Link href="/admin/requirements" style={styles.secondaryAction}>
                Şərtləri idarə et
              </Link>
            </div>
          </div>

          <div style={styles.sidePanel}>
            <div style={styles.sidePanelTitle}>Növbəti addım</div>
            <p style={styles.sidePanelText}>
              Sonrakı mərhələdə bu panelə real müraciət siyahısı, rol əsaslı giriş, təşkilat kabineti,
              məhsul idarəsi və lead status dəyişimi əlavə ediləcək.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "56px",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    fontSize: "16px",
    color: "#475569",
    lineHeight: 1.7,
    maxWidth: "920px",
  },
  cardsGrid: {
    display: "grid",
    gap: "16px",
    marginBottom: "28px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
  },
  cardLabel: {
    fontSize: "14px",
    color: "#64748b",
  },
  cardValue: {
    fontSize: "34px",
    fontWeight: 800,
    color: "#059669",
    marginTop: "8px",
  },
  cardDesc: {
    fontSize: "14px",
    color: "#475569",
    marginTop: "8px",
    lineHeight: 1.6,
  },
  sectionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
  },
  tablePanel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
  },
  tablePanelHeader: {
    padding: "20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontWeight: 800,
    color: "#0f172a",
  },
  sectionDesc: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "6px",
  },
  filterButton: {
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
  },
  tableHeadRow: {
    background: "#f8fafc",
    textAlign: "left",
  },
  th: {
    padding: "14px 16px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #f1f5f9",
  },
  statusBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "12px",
  },
  sideGrid: {
    display: "grid",
    gap: "20px",
    alignContent: "start",
  },
  sidePanel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
  },
  sidePanelTitle: {
    fontSize: "20px",
    fontWeight: 800,
    marginBottom: "14px",
    color: "#0f172a",
  },
  sidePanelText: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: 1.7,
    margin: 0,
  },
  actionsStack: {
    display: "grid",
    gap: "12px",
  },
  primaryAction: {
    display: "block",
    background: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    padding: "12px 14px",
    fontWeight: 700,
    textAlign: "left",
    textDecoration: "none",
  },
  secondaryAction: {
    display: "block",
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 14px",
    fontWeight: 700,
    textAlign: "left",
    textDecoration: "none",
  },
};
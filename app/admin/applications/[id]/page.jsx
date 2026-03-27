"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

const STATUS_OPTIONS = [
  { value: "new", label: "Yeni" },
  { value: "reviewing", label: "Baxılır" },
  { value: "approved", label: "Təsdiqləndi" },
  { value: "rejected", label: "Rədd edildi" },
];

const DISTRIBUTION_OPTIONS = [
  { value: "open_market", label: "Çoxlu təşkilata açıq" },
  { value: "only_selected", label: "Seçilmiş təşkilat" },
];

function getStatusLabel(status) {
  if (status === "processing") return "Baxılır";
  if (status === "sent") return "Göndərildi";
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || status || "-";
}

function getStatusStyles(status) {
  if (status === "new") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    };
  }

  if (status === "reviewing" || status === "processing") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
    };
  }

  if (status === "approved" || status === "sent") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  }

  if (status === "rejected") {
    return {
      background: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    };
  }

  return {
    background: "#e2e8f0",
    color: "#334155",
    border: "1px solid #cbd5e1",
  };
}

function getDistributionLabel(value) {
  return DISTRIBUTION_OPTIONS.find((item) => item.value === value)?.label || "-";
}

function getDistributionStyles(value) {
  if (value === "open_market") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  }

  if (value === "only_selected") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    };
  }

  return {
    background: "#e2e8f0",
    color: "#334155",
    border: "1px solid #cbd5e1",
  };
}

function formatMoney(value) {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("az-AZ").format(number)} AZN`;
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("az-AZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function extractBankFromNote(note) {
  if (!note) return "-";
  const match = note.match(/Bank:\s*([^|]+)/i);
  return match?.[1]?.trim() || "-";
}

function extractTypeFromNote(note) {
  if (!note) return "-";
  const match = note.match(/Kredit növü:\s*([^|]+)/i);
  return match?.[1]?.trim() || "-";
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [application, setApplication] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");

  const derivedData = useMemo(() => {
    if (!application) return null;

    return {
      bank: extractBankFromNote(application.note),
      productType: extractTypeFromNote(application.note),
    };
  }, [application]);

  const organizationMap = useMemo(() => {
    const map = {};
    organizations.forEach((item) => {
      map[item.id] = item.name;
    });
    return map;
  }, [organizations]);

  useEffect(() => {
    async function fetchData() {
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

        setLoading(true);
        setPageMessage("");

        const [applicationRes, organizationsRes] = await Promise.all([
          supabase.from("applications").select("*").eq("id", id).single(),
          supabase.from("organizations").select("id, name").order("id", { ascending: true }),
        ]);

        if (applicationRes.error) {
          setApplication(null);
          setPageMessage("Müraciət yüklənmədi: " + applicationRes.error.message);
          setLoading(false);
          return;
        }

        if (organizationsRes.error) {
          setApplication(applicationRes.data || null);
          setOrganizations([]);
          setPageMessage("Təşkilatlar yüklənmədi: " + organizationsRes.error.message);
          setLoading(false);
          return;
        }

        setApplication(applicationRes.data || null);
        setOrganizations(organizationsRes.data || []);
        setLoading(false);
      } catch (error) {
        setApplication(null);
        setOrganizations([]);
        setPageMessage("Səhifə yüklənmədi.");
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id, router]);

  if (loading) {
    return <div style={styles.loadingBox}>Yüklənir...</div>;
  }

  if (!application) {
    return (
      <div>
        <div style={styles.topRow}>
          <div style={styles.header}>
            <h1 style={styles.title}>Müraciət tapılmadı</h1>
            <p style={styles.subtitle}>
              Bu ID ilə uyğun müraciət görünmədi və ya məlumat yüklənmədi.
            </p>
          </div>

          <div style={styles.topActions}>
            <button
              type="button"
              style={styles.backLink}
              onClick={() => router.push("/admin/applications")}
            >
              ← Müraciətlərə qayıt
            </button>
          </div>
        </div>

        {pageMessage ? <div style={styles.messageBox}>{pageMessage}</div> : null}
      </div>
    );
  }

  const badgeStyle = getStatusStyles(application.status);
  const distributionStyle = getDistributionStyles(application.distribution_type);

  return (
    <div>
      <div style={styles.topRow}>
        <div style={styles.header}>
          <h1 style={styles.title}>Müraciət detalı</h1>
          <p style={styles.subtitle}>
            Bu səhifə həm admin baxışı, həm də gələcək user kabinetinin əsas strukturu kimi düşünülüb.
          </p>
        </div>

        <div style={styles.topActions}>
          <button
            type="button"
            style={styles.backLink}
            onClick={() => router.push("/admin/applications")}
          >
            ← Müraciətlərə qayıt
          </button>
        </div>
      </div>

      {pageMessage ? <div style={styles.messageBox}>{pageMessage}</div> : null}

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Müraciət ID</div>
          <div style={styles.summaryValue}>#{application.id}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Tarix</div>
          <div style={styles.summaryValueSmall}>{formatDateTime(application.created_at)}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Status</div>
          <div>
            <span style={{ ...styles.statusBadge, ...badgeStyle }}>
              {getStatusLabel(application.status)}
            </span>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Məbləğ</div>
          <div style={styles.summaryValueSmall}>{formatMoney(application.amount)}</div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Şəxsi məlumatlar</h2>
            <p style={styles.panelDesc}>
              User kabineti üçün də əsas olacaq məlumat bloku.
            </p>
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Ad soyad</div>
              <div style={styles.infoValue}>{application.full_name || "-"}</div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Telefon</div>
              <div style={styles.infoValue}>{application.phone || "-"}</div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>İş yeri</div>
              <div style={styles.infoValue}>{application.workplace || "-"}</div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Aylıq gəlir</div>
              <div style={styles.infoValue}>{formatMoney(application.monthly_income)}</div>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Kredit məlumatları</h2>
            <p style={styles.panelDesc}>
              Mövcud müraciətin maliyyə və məhsul detalları.
            </p>
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Məbləğ</div>
              <div style={styles.infoValue}>{formatMoney(application.amount)}</div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Bank</div>
              <div style={styles.infoValue}>{derivedData?.bank || "-"}</div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Kredit növü</div>
              <div style={styles.infoValue}>{derivedData?.productType || "-"}</div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Müraciət tarixi</div>
              <div style={styles.infoValue}>{formatDateTime(application.created_at)}</div>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Paylaşım məlumatları</h2>
            <p style={styles.panelDesc}>
              Müraciətin hansı qayda ilə paylaşıldığını göstərir.
            </p>
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Paylaşım tipi</div>
              <div style={styles.infoValue}>
                <span style={{ ...styles.statusBadge, ...distributionStyle }}>
                  {getDistributionLabel(application.distribution_type)}
                </span>
              </div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Seçilmiş təşkilat</div>
              <div style={styles.infoValue}>
                {application.distribution_type === "only_selected"
                  ? organizationMap[application.selected_organization_id] || "-"
                  : "-"}
              </div>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Qeyd və sistem məlumatı</h2>
            <p style={styles.panelDesc}>
              Hazırda mövcud note sahəsi. Sonradan admin/private qeydlər ayrıca ayrılacaq.
            </p>
          </div>

          <div style={styles.noteBox}>{application.note || "Qeyd yoxdur."}</div>
        </section>
      </div>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Gələcək genişlənmə üçün placeholder bloklar</h2>
          <p style={styles.panelDesc}>
            Bu hissələr sonradan user kabineti və daha zəngin müraciət axını üçün doldurulacaq.
          </p>
        </div>

        <div style={styles.futureGrid}>
          <div style={styles.futureCard}>
            <div style={styles.futureTitle}>Məhsul uyğunluğu</div>
            <div style={styles.futureText}>
              Fərdi / Biznes → təşkilat növü → təşkilat → məhsul növü → məhsul axını burada görünəcək.
            </div>
          </div>

          <div style={styles.futureCard}>
            <div style={styles.futureTitle}>Status timeline</div>
            <div style={styles.futureText}>
              New, reviewing, approved, rejected və gələcək tarixçə bu blokda göstəriləcək.
            </div>
          </div>

          <div style={styles.futureCard}>
            <div style={styles.futureTitle}>Sənəd və əlavə fayllar</div>
            <div style={styles.futureText}>
              User sənədləri, müqavilə, fayl əlavələri və digər upload-lar burada yer alacaq.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  loadingBox: {
    padding: "40px",
    fontSize: "15px",
    color: "#475569",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  header: {},
  topActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
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
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  messageBox: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #dbe4ee",
    borderRadius: "18px",
    padding: "14px 16px",
    marginBottom: "18px",
    fontSize: "14px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  summaryCard: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
  },
  summaryValue: {
    fontSize: "30px",
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.1,
  },
  summaryValueSmall: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.3,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
    marginBottom: "18px",
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "28px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  panelHeader: {
    marginBottom: "18px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 900,
    color: "#0f172a",
  },
  panelDesc: {
    marginTop: "8px",
    marginBottom: 0,
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#64748b",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  infoItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "14px",
  },
  infoLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
  },
  infoValue: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  noteBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "16px",
    minHeight: "120px",
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#334155",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  futureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },
  futureCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "16px",
  },
  futureTitle: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "8px",
  },
  futureText: {
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#64748b",
  },
};
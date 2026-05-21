"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { ORGANIZATION_STATUSES, APPROVAL_STATUSES } from "../../../../lib/admin-options";

const getLabel = (list, value) =>
  list.find((item) => item.value === value)?.label || value || "-";

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "0";
  return new Intl.NumberFormat("az-AZ").format(Number(value || 0));
};

const formatBoolean = (value) => {
  if (value === true) return "Bəli";
  if (value === false) return "Xeyr";
  return "-";
};

const getBadgeStyle = (value) => {
  const map = {
    active: { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" },
    inactive: { background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb" },
    draft: { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" },
    archived: { background: "#e5e7eb", color: "#374151", border: "1px solid #d1d5db" },
    pending: { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" },
    approved: { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" },
    rejected: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" },
    incomplete: { background: "#ffedd5", color: "#9a3412", border: "1px solid #fed7aa" },
  };

  return { ...styles.badge, ...(map[value] || map.inactive) };
};

export default function OrganizationProfilePage() {
  const params = useParams();
  const organizationId = params?.id;

  const [organization, setOrganization] = useState(null);
  const [organizationTypes, setOrganizationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    if (!organizationId) return;

    setLoading(true);
    setMessage("");

    const [organizationRes, typesRes] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", organizationId).single(),
      supabase.from("organization_types").select("*").order("id", { ascending: true }),
    ]);

    if (organizationRes.error) {
      setMessage("Təşkilat yüklənmədi: " + organizationRes.error.message);
      setOrganization(null);
    } else {
      setOrganization(organizationRes.data || null);
    }

    if (typesRes.error) {
      setMessage((prev) =>
        prev
          ? `${prev} | Təşkilat növləri yüklənmədi: ${typesRes.error.message}`
          : "Təşkilat növləri yüklənmədi: " + typesRes.error.message
      );
    } else {
      setOrganizationTypes(typesRes.data || []);
    }

    setLoading(false);
  };

  const typeMap = useMemo(() => {
    const map = {};
    organizationTypes.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [organizationTypes]);

  if (loading) {
    return <div style={styles.loadingBox}>Yüklənir...</div>;
  }

  if (!organization) {
    return (
      <div>
        <div style={styles.messageBox}>{message || "Təşkilat tapılmadı."}</div>
        <Link href="/admin/organizations" style={styles.secondaryBtn}>
          Təşkilatlara qayıt
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{organization.name || "Təşkilat profili"}</h1>
          <p style={styles.subtitle}>
            Təşkilat profili, əlaqə məlumatları və lead ayarları.
          </p>
        </div>

        <div style={styles.headerActions}>
          <Link href="/admin/organizations" style={styles.secondaryBtn}>
            Təşkilatlar
          </Link>
          <Link
            href={`/admin/organizations/settings?edit=${organization.id}`}
            style={styles.primaryBtn}
          >
            Edit
          </Link>
        </div>
      </div>

      {message ? <div style={styles.messageBox}>{message}</div> : null}

      <div style={styles.panelGrid}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Əsas məlumatlar</h2>
          </div>

          <div style={styles.infoGrid}>
            <Info label="Təşkilat növü" value={typeMap[organization.organization_type_id]?.name || "-"} />
            <Info label="Website" value={organization.website || "-"} />
            <Info label="Əlaqədar şəxs" value={organization.contact_person || "-"} />
            <Info label="Telefon" value={organization.phone || "-"} />
            <Info label="Email" value={organization.email || "-"} />
            <Info label="Region" value={organization.region || "-"} />
            <Info label="Ünvan" value={organization.address || "-"} />
            <Info label="Qeyd" value={organization.note || "-"} />
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Status</h2>
          </div>

          <div style={styles.badgeRow}>
            <span style={getBadgeStyle(organization.status)}>
              {getLabel(ORGANIZATION_STATUSES, organization.status)}
            </span>
            <span style={getBadgeStyle(organization.approval_status)}>
              {getLabel(APPROVAL_STATUSES, organization.approval_status)}
            </span>
          </div>
        </section>
      </div>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Lead</h2>
        </div>

        <div style={styles.statsGrid}>
          <Stat label="Balans" value={`${formatNumber(organization.balance)} AZN`} />
          <Stat label="Default lead qiyməti" value={`${formatNumber(organization.lead_price)} AZN`} />
          <Stat label="Lead ala bilər" value={formatBoolean(organization.can_receive_leads)} />
          <Stat
            label="Open market lead ala bilər"
            value={formatBoolean(organization.can_buy_open_market_leads)}
          />
          <Stat label="Kabinet aktivdir" value={formatBoolean(organization.cabinet_enabled)} />
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoItem}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  loadingBox: {
    padding: "40px",
    fontSize: "15px",
    color: "#475569",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "48px",
    fontWeight: 800,
    color: "#0f172a",
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    fontSize: "16px",
    color: "#475569",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  panelGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)",
    gap: "16px",
    marginBottom: "16px",
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "24px",
    padding: "20px",
  },
  panelHeader: {
    marginBottom: "16px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    color: "#0f172a",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  infoItem: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
    background: "#f8fafc",
  },
  infoLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "6px",
  },
  infoValue: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f172a",
    wordBreak: "break-word",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },
  statCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
    background: "#f8fafc",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: 850,
    color: "#0f172a",
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  badge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 700,
    display: "inline-block",
  },
  messageBox: {
    background: "#f8fafc",
    border: "1px solid #dbe4ee",
    borderRadius: "18px",
    padding: "14px 16px",
    marginBottom: "18px",
    fontSize: "14px",
    color: "#334155",
  },
  primaryBtn: {
    minHeight: "40px",
    borderRadius: "12px",
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#ffffff",
    padding: "0 16px",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtn: {
    minHeight: "40px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 16px",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

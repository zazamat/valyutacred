"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

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

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("az-AZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const updatedKey = searchParams.get("updated");

  const [applications, setApplications] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [distributionFilter, setDistributionFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = useCallback(async () => {
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

      const [applicationsRes, organizationsRes] = await Promise.all([
        supabase.from("applications").select("*").order("id", { ascending: false }),
        supabase.from("organizations").select("id, name").order("id", { ascending: true }),
      ]);

      if (applicationsRes.error) {
        setPageMessage("Müraciətlər yüklənmədi: " + applicationsRes.error.message);
        setLoading(false);
        return;
      }

      if (organizationsRes.error) {
        setPageMessage("Təşkilatlar yüklənmədi: " + organizationsRes.error.message);
        setLoading(false);
        return;
      }

      setApplications(applicationsRes.data || []);
      setOrganizations(organizationsRes.data || []);
      setLoading(false);
    } catch (error) {
      localStorage.removeItem("valyutacred_auth");
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData, updatedKey]);

  const organizationMap = useMemo(() => {
    const map = {};
    organizations.forEach((item) => {
      map[item.id] = item.name;
    });
    return map;
  }, [organizations]);

  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      const s = search.trim().toLowerCase();

      const matchesSearch =
        !s ||
        (item.full_name || "").toLowerCase().includes(s) ||
        (item.phone || "").toLowerCase().includes(s) ||
        String(item.id).includes(s);

      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;

      const matchesDistribution =
        distributionFilter === "all"
          ? true
          : item.distribution_type === distributionFilter;

      return matchesSearch && matchesStatus && matchesDistribution;
    });
  }, [applications, search, statusFilter, distributionFilter]);

  async function updateStatus(id, currentStatus) {
    const normalizedCurrent =
      currentStatus === "processing"
        ? "reviewing"
        : currentStatus === "sent"
        ? "approved"
        : currentStatus;

    const currentIndex = STATUS_OPTIONS.findIndex(
      (item) => item.value === normalizedCurrent
    );

    const nextStatus =
      currentIndex === -1
        ? "new"
        : STATUS_OPTIONS[(currentIndex + 1) % STATUS_OPTIONS.length].value;

    setUpdatingId(id);
    setPageMessage("");

    const { data, error } = await supabase
      .from("applications")
      .update({ status: nextStatus })
      .eq("id", id)
      .select("*")
      .single();

    setUpdatingId(null);

    if (error) {
      setPageMessage("Status yenilənmədi: " + error.message);
      return;
    }

    if (!data) {
      setPageMessage("Status DB-də yenilənmədi.");
      return;
    }

    setApplications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: data.status } : item
      )
    );

    setPageMessage("Müraciətin statusu yeniləndi.");
  }

  if (loading) {
    return <div style={styles.loadingBox}>Yüklənir...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Müraciətlər</h1>
          <p style={styles.subtitle}>
            Burada daxil olan kredit müraciətlərini axtara, paylaşım tipinə görə ayıra, statusunu dəyişə və detal səhifəsinə keçə bilərsən.
          </p>
        </div>
      </div>

      {pageMessage ? <div style={styles.messageBox}>{pageMessage}</div> : null}

      <div style={styles.panel}>
        <div style={styles.filtersRow}>
          <div>
            <label style={styles.label}>Axtarış</label>
            <input
              placeholder="ID, ad soyad və ya telefon"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">Hamısı</option>
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Paylaşım tipi</label>
            <select
              value={distributionFilter}
              onChange={(e) => setDistributionFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">Hamısı</option>
              {DISTRIBUTION_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.summaryRow}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Ümumi müraciət</div>
            <div style={styles.summaryValue}>{applications.length}</div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Filtrdən keçən</div>
            <div style={styles.summaryValue}>{filteredApplications.length}</div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Çoxlu təşkilata açıq</div>
            <div style={styles.summaryValue}>
              {applications.filter((item) => item.distribution_type === "open_market").length}
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Seçilmiş təşkilat</div>
            <div style={styles.summaryValue}>
              {applications.filter((item) => item.distribution_type === "only_selected").length}
            </div>
          </div>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Tarix</th>
                <th style={styles.th}>Ad soyad</th>
                <th style={styles.th}>Telefon</th>
                <th style={styles.th}>Məbləğ</th>
                <th style={styles.th}>Aylıq gəlir</th>
                <th style={styles.th}>Paylaşım tipi</th>
                <th style={styles.th}>Təşkilat</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Əməliyyat</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplications.map((item) => {
                const statusStyle = getStatusStyles(item.status);
                const distributionStyle = getDistributionStyles(item.distribution_type);

                return (
                  <tr key={item.id}>
                    <td style={styles.td}>#{item.id}</td>
                    <td style={styles.td}>{formatDate(item.created_at)}</td>
                    <td style={styles.tdStrong}>{item.full_name || "-"}</td>
                    <td style={styles.td}>{item.phone || "-"}</td>
                    <td style={styles.td}>{formatMoney(item.amount)}</td>
                    <td style={styles.td}>{formatMoney(item.monthly_income)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...distributionStyle }}>
                        {getDistributionLabel(item.distribution_type)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {item.distribution_type === "only_selected"
                        ? organizationMap[item.selected_organization_id] || "-"
                        : "-"}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...statusStyle }}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionsCell}>
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          onClick={() => updateStatus(item.id, item.status)}
                          disabled={updatingId === item.id}
                        >
                          {updatingId === item.id ? "Yenilənir..." : "Status dəyiş"}
                        </button>

                        <Link
                          href={`/admin/applications/${item.id}`}
                          style={styles.primaryLink}
                        >
                          Bax
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filteredApplications.length ? (
            <div style={styles.emptyBox}>Uyğun müraciət tapılmadı.</div>
          ) : null}
        </div>
      </div>
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
  messageBox: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #dbe4ee",
    borderRadius: "18px",
    padding: "14px 16px",
    marginBottom: "18px",
    fontSize: "14px",
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "28px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  filtersRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    height: "48px",
    boxSizing: "border-box",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "0 14px",
    fontSize: "15px",
    color: "#0f172a",
    outline: "none",
  },
  select: {
    width: "100%",
    height: "48px",
    boxSizing: "border-box",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "0 14px",
    fontSize: "15px",
    color: "#0f172a",
    outline: "none",
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  summaryCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "16px",
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
  },
  summaryValue: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#0f172a",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1180px",
  },
  tableHeadRow: {
    background: "#f8fafc",
    textAlign: "left",
  },
  th: {
    padding: "14px 16px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#334155",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#334155",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  tdStrong: {
    padding: "14px 16px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: 700,
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "32px",
    padding: "0 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  actionsCell: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    background: "#059669",
    color: "#ffffff",
    border: "1px solid #059669",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  emptyBox: {
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "18px",
    padding: "18px",
    color: "#64748b",
    textAlign: "center",
    fontSize: "14px",
    marginTop: "16px",
  },
};
"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

function normalizeStatus(status) {
  if (status === "processing") return "reviewing";
  if (status === "sent") return "approved";
  return status || "new";
}

function getStatusLabel(status) {
  const normalized = normalizeStatus(status);
  return (
    STATUS_OPTIONS.find((item) => item.value === normalized)?.label ||
    normalized ||
    "-"
  );
}

function getStatusStyles(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "new") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    };
  }

  if (normalized === "reviewing") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
    };
  }

  if (normalized === "approved") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  }

  if (normalized === "rejected") {
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
  return (
    DISTRIBUTION_OPTIONS.find((item) => item.value === value)?.label || "-"
  );
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

  const [applications, setApplications] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [distributionFilter, setDistributionFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

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

        const [applicationsRes, organizationsRes] = await Promise.all([
          supabase.from("applications").select("*").order("id", { ascending: false }),
          supabase.from("organizations").select("id, name").order("id", { ascending: true }),
        ]);

        if (applicationsRes.error) {
          setPageMessage("Müraciətlər yüklənmədi: " + applicationsRes.error.message);
          setApplications([]);
          setOrganizations([]);
          setLoading(false);
          return;
        }

        if (organizationsRes.error) {
          setPageMessage("Təşkilatlar yüklənmədi: " + organizationsRes.error.message);
          setApplications(applicationsRes.data || []);
          setOrganizations([]);
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
    }

    fetchData();
  }, [router]);

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

      const normalizedStatus = normalizeStatus(item.status);

      const matchesStatus =
        statusFilter === "all" ? true : normalizedStatus === statusFilter;

      const matchesDistribution =
        distributionFilter === "all"
          ? true
          : item.distribution_type === distributionFilter;

      return matchesSearch && matchesStatus && matchesDistribution;
    });
  }, [applications, search, statusFilter, distributionFilter]);

  async function updateStatus(id, nextStatus) {
    const applicationId = Number(id);

    setUpdatingId(applicationId);
    setPageMessage("");

    const { data: updatedRows, error: updateError } = await supabase
      .from("applications")
      .update({ status: nextStatus })
      .eq("id", applicationId)
      .select("id, status");

    if (updateError) {
      setUpdatingId(null);
      setPageMessage("Status yenilənmədi: " + updateError.message);
      return;
    }

    const updatedRow = Array.isArray(updatedRows) ? updatedRows[0] : null;

    if (!updatedRow) {
      setUpdatingId(null);
      setPageMessage("DB update etmədi.");
      return;
    }

    setApplications((prev) =>
      prev.map((item) =>
        Number(item.id) === applicationId
          ? { ...item, status: updatedRow.status }
          : item
      )
    );

    setUpdatingId(null);
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
            Burada daxil olan kredit müraciətlərini axtara, paylaşım tipinə görə ayıra,
            statusunu dəyişə və detal səhifəsinə keçə bilərsən.
          </p>
        </div>
      </div>

      {pageMessage ? <div style={styles.messageBox}>{pageMessage}</div> : null}

      <div style={styles.panel}>
        <div style={styles.filtersRow}>
          <div style={styles.filterItem}>
            <label style={styles.label}>Axtarış</label>
            <input
              placeholder="ID, ad soyad və ya telefon"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.filterItem}>
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

          <div style={styles.filterItem}>
            <label style={styles.label}>Paylaşım tipi</label>
            <select
              value={distributionFilter}
              onChange={(e) => setDistributionFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">Hamısı</option>
              <option value="open_market">Çoxlu təşkilata açıq</option>
              <option value="only_selected">Seçilmiş təşkilat</option>
            </select>
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
                const distributionStyle = getDistributionStyles(item.distribution_type);
                const currentStatusStyle = getStatusStyles(item.status);

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
                      <select
                        value={normalizeStatus(item.status)}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        disabled={updatingId === item.id}
                        style={{
                          ...styles.statusSelect,
                          ...currentStatusStyle,
                          ...(updatingId === item.id ? styles.statusSelectDisabled : {}),
                        }}
                      >
                        {STATUS_OPTIONS.map((statusItem) => (
                          <option key={statusItem.value} value={statusItem.value}>
                            {statusItem.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actionsCell}>
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
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  filterItem: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#334155",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "14px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    padding: "0 14px",
    fontSize: "14px",
    color: "#0f172a",
    outline: "none",
  },
  select: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "14px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    padding: "0 14px",
    fontSize: "14px",
    color: "#0f172a",
    outline: "none",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
  },
  table: {
    width: "100%",
    minWidth: "1180px",
    borderCollapse: "separate",
    borderSpacing: 0,
    background: "#ffffff",
  },
  tableHeadRow: {
    background: "#f8fafc",
  },
  th: {
    textAlign: "left",
    padding: "16px 14px",
    fontSize: "13px",
    fontWeight: 800,
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px",
    fontSize: "14px",
    color: "#334155",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  tdStrong: {
    padding: "14px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#0f172a",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  badge: {
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
  statusSelect: {
    minWidth: "140px",
    minHeight: "38px",
    borderRadius: "999px",
    padding: "0 12px",
    fontSize: "13px",
    fontWeight: 700,
    outline: "none",
    cursor: "pointer",
  },
  statusSelectDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  actionsCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "38px",
    padding: "0 14px",
    borderRadius: "12px",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  emptyBox: {
    padding: "18px",
    fontSize: "14px",
    color: "#64748b",
    background: "#ffffff",
  },
};
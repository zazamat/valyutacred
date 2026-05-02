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

const CUSTOMER_TYPE_LABELS = {
  individual: "Fərdi",
  business: "Biznes",
};

function normalizeStatus(status) {
  if (status === "processing") return "reviewing";
  if (status === "sent") return "approved";
  return status || "new";
}

function getStatusLabel(status) {
  return (
    STATUS_OPTIONS.find((item) => item.value === normalizeStatus(status))
      ?.label || "-"
  );
}

function getDistributionLabel(value) {
  return DISTRIBUTION_OPTIONS.find((item) => item.value === value)?.label || "-";
}

function getStatusStyles(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "new") {
    return { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" };
  }

  if (normalized === "reviewing") {
    return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
  }

  if (normalized === "approved") {
    return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
  }

  if (normalized === "rejected") {
    return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" };
  }

  return { background: "#e2e8f0", color: "#334155", border: "1px solid #cbd5e1" };
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${new Intl.NumberFormat("az-AZ").format(Number(value))} AZN`;
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

function downloadCsv(rows) {
  const headers = [
    "ID",
    "Tarix",
    "Ad soyad",
    "Telefon",
    "Email",
    "Müştəri tipi",
    "Kredit növü",
    "Bank",
    "Məbləğ",
    "Müddət",
    "Paylaşım tipi",
    "Status",
  ];

  const body = rows.map((item) => [
    item.id,
    formatDate(item.created_at),
    item.full_name || "",
    item.phone || "",
    item.email || "",
    CUSTOMER_TYPE_LABELS[item.customer_type] || item.customer_type || "",
    item.credit_type || "",
    item.organization || "",
    item.amount || "",
    item.term_months ? `${item.term_months} ay` : "",
    getDistributionLabel(item.distribution_type),
    getStatusLabel(item.status),
  ]);

  const csv = [headers, ...body]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "vabank-muracietler.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function ApplicationsPage() {
  const router = useRouter();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [distributionFilter, setDistributionFilter] = useState("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [creditTypeFilter, setCreditTypeFilter] = useState("all");
  const [rowLimit, setRowLimit] = useState("25");

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

        const { data, error } = await supabase
          .from("applications")
          .select("*")
          .order("id", { ascending: false });

        if (error) {
          setPageMessage("Müraciətlər yüklənmədi: " + error.message);
          setApplications([]);
          setLoading(false);
          return;
        }

        setApplications(data || []);
        setLoading(false);
      } catch (error) {
        localStorage.removeItem("valyutacred_auth");
        router.push("/login");
      }
    }

    fetchData();
  }, [router]);

  const banks = useMemo(() => {
    return Array.from(
      new Set(applications.map((item) => item.organization).filter(Boolean))
    );
  }, [applications]);

  const creditTypes = useMemo(() => {
    return Array.from(
      new Set(applications.map((item) => item.credit_type).filter(Boolean))
    );
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      const s = search.trim().toLowerCase();

      const matchesSearch =
        !s ||
        (item.full_name || "").toLowerCase().includes(s) ||
        (item.phone || "").toLowerCase().includes(s) ||
        (item.email || "").toLowerCase().includes(s) ||
        String(item.id).includes(s);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : normalizeStatus(item.status) === statusFilter;

      const matchesDistribution =
        distributionFilter === "all"
          ? true
          : item.distribution_type === distributionFilter;

      const matchesBank =
        bankFilter === "all" ? true : item.organization === bankFilter;

      const matchesCustomerType =
        customerTypeFilter === "all"
          ? true
          : item.customer_type === customerTypeFilter;

      const matchesCreditType =
        creditTypeFilter === "all"
          ? true
          : item.credit_type === creditTypeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDistribution &&
        matchesBank &&
        matchesCustomerType &&
        matchesCreditType
      );
    });
  }, [
    applications,
    search,
    statusFilter,
    distributionFilter,
    bankFilter,
    customerTypeFilter,
    creditTypeFilter,
  ]);

  const visibleApplications = useMemo(() => {
    if (rowLimit === "all") return filteredApplications;
    return filteredApplications.slice(0, Number(rowLimit));
  }, [filteredApplications, rowLimit]);

  if (loading) {
    return <div style={styles.loadingBox}>Yüklənir...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Müraciətlər</h1>
        <p style={styles.subtitle}>
          Yeni public müraciət formundan daxil olan bütün müraciətlər burada idarə olunur.
        </p>
      </div>

      {pageMessage ? <div style={styles.messageBox}>{pageMessage}</div> : null}

      <div style={styles.panel}>
        <div style={styles.filters}>
          <input
            placeholder="ID, ad, telefon və ya email ilə axtar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
            <option value="all">Bütün statuslar</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          <select value={distributionFilter} onChange={(e) => setDistributionFilter(e.target.value)} style={styles.select}>
            <option value="all">Bütün paylaşım tipləri</option>
            <option value="open_market">Çoxlu təşkilata açıq</option>
            <option value="only_selected">Seçilmiş təşkilat</option>
          </select>

          <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value)} style={styles.select}>
            <option value="all">Bütün banklar</option>
            {banks.map((bank) => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>

          <select value={customerTypeFilter} onChange={(e) => setCustomerTypeFilter(e.target.value)} style={styles.select}>
            <option value="all">Bütün müştəri tipləri</option>
            <option value="individual">Fərdi</option>
            <option value="business">Biznes</option>
          </select>

          <select value={creditTypeFilter} onChange={(e) => setCreditTypeFilter(e.target.value)} style={styles.select}>
            <option value="all">Bütün kredit növləri</option>
            {creditTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div style={styles.toolbar}>
          <div style={styles.resultText}>
            Tapıldı: <strong>{filteredApplications.length}</strong> müraciət
          </div>

          <div style={styles.toolbarActions}>
            <select value={rowLimit} onChange={(e) => setRowLimit(e.target.value)} style={styles.smallSelect}>
              <option value="10">10 göstər</option>
              <option value="25">25 göstər</option>
              <option value="50">50 göstər</option>
              <option value="all">Hamısını göstər</option>
            </select>

            <button type="button" onClick={() => downloadCsv(filteredApplications)} style={styles.exportBtn}>
              CSV export
            </button>

            <button type="button" onClick={() => window.print()} style={styles.exportBtn}>
              Çap / PDF
            </button>
          </div>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Tarix</th>
                <th style={styles.th}>Ad soyad</th>
                <th style={styles.th}>Telefon</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Müştəri tipi</th>
                <th style={styles.th}>Kredit növü</th>
                <th style={styles.th}>Bank</th>
                <th style={styles.th}>Məbləğ</th>
                <th style={styles.th}>Müddət</th>
                <th style={styles.th}>Paylaşım tipi</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Əməliyyat</th>
              </tr>
            </thead>

            <tbody>
              {visibleApplications.map((item) => {
                const statusStyle = getStatusStyles(item.status);

                return (
                  <tr key={item.id}>
                    <td style={styles.td}>#{item.id}</td>
                    <td style={styles.td}>{formatDate(item.created_at)}</td>
                    <td style={styles.tdStrong}>{item.full_name || "-"}</td>
                    <td style={styles.td}>{item.phone || "-"}</td>
                    <td style={styles.td}>{item.email || "-"}</td>
                    <td style={styles.td}>{CUSTOMER_TYPE_LABELS[item.customer_type] || item.customer_type || "-"}</td>
                    <td style={styles.td}>{item.credit_type || "-"}</td>
                    <td style={styles.td}>{item.organization || "-"}</td>
                    <td style={styles.td}>{formatMoney(item.amount)}</td>
                    <td style={styles.td}>{item.term_months ? `${item.term_months} ay` : "-"}</td>
                    <td style={styles.td}>{getDistributionLabel(item.distribution_type)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...statusStyle }}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <Link href={`/admin/applications/${item.id}`} style={styles.detailBtn}>
                        Bax
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!visibleApplications.length ? (
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
    fontWeight: 700,
    color: "#0f172a",
  },

  subtitle: {
    marginTop: "10px",
    fontSize: "16px",
    color: "#475569",
    lineHeight: 1.7,
  },

  messageBox: {
    background: "#f8fafc",
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
  },

  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },

  input: {
    minHeight: "46px",
    borderRadius: "14px",
    border: "1px solid #dbe4ee",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
  },

  select: {
    minHeight: "46px",
    borderRadius: "14px",
    border: "1px solid #dbe4ee",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  resultText: {
    fontSize: "14px",
    color: "#475569",
  },

  toolbarActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  smallSelect: {
    minHeight: "40px",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    padding: "0 12px",
    fontSize: "13px",
    background: "#ffffff",
  },

  exportBtn: {
    minHeight: "40px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 14px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },

  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
  },

  table: {
    width: "100%",
    minWidth: "1500px",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f8fafc",
    fontSize: "13px",
    fontWeight: 700,
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "14px",
    fontSize: "14px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    whiteSpace: "nowrap",
  },

  tdStrong: {
    padding: "14px",
    fontSize: "14px",
    fontWeight: 700,
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    whiteSpace: "nowrap",
  },

  badge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 600,
    display: "inline-block",
  },

  detailBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "38px",
    padding: "0 14px",
    borderRadius: "12px",
    background: "#0f172a",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 600,
  },

  emptyBox: {
    padding: "20px",
    fontSize: "14px",
    color: "#64748b",
  },
};
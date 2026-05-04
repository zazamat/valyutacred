"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const RISK_OPTIONS = [
  { value: "all", label: "Bütün risklər" },
  { value: "active", label: "Problemli" },
  { value: "under_review", label: "Araşdırılır" },
  { value: "none", label: "Risksiz" },
];

const COLUMN_STORAGE_KEY = "vabank_applications_visible_columns";

const TABLE_COLUMNS = [
  { key: "id", label: "ID", exportable: true },
  { key: "date", label: "Tarix", exportable: true },
  { key: "fullName", label: "Ad soyad", exportable: true },
  { key: "phone", label: "Telefon", exportable: true },
  { key: "email", label: "Email", exportable: true },
  { key: "customerType", label: "Müştəri tipi", exportable: true },
  { key: "customerType", label: "Müştəri tipi", exportable: true },
  { key: "creditType", label: "Kredit növü", exportable: true },
  { key: "organization", label: "Bank", exportable: true },
  { key: "amount", label: "Məbləğ", exportable: true },
  { key: "term", label: "Müddət", exportable: true },
  { key: "distribution", label: "Paylaşım tipi", exportable: true },
  { key: "risk", label: "Risk", exportable: true, align: "center" },
  { key: "status", label: "Status", exportable: true },
  { key: "action", label: "Əməliyyat", exportable: false },
];

const DEFAULT_VISIBLE_COLUMNS = TABLE_COLUMNS.map((column) => column.key);

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

function getRiskLabel(status) {
  if (status === "active") return "Problemli";
  if (status === "under_review") return "Araşdırılır";
  return "";
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

function getRiskStyles(status) {
  if (status === "active") {
    return {
      background: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    };
  }

  if (status === "under_review") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
    };
  }

  return {
    background: "transparent",
    color: "transparent",
    border: "1px solid transparent",
  };
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getExportValue(columnKey, item, riskMap) {
  const risk = riskMap[Number(item.id)];

  const values = {
    id: item.id,
    date: formatDate(item.created_at),
    fullName: item.full_name || "",
    phone: item.phone || "",
    email: item.email || "",
    customerType: CUSTOMER_TYPE_LABELS[item.customer_type] || item.customer_type || "",
    creditType: item.credit_type || "",
    organization: item.organization || "",
    amount: item.amount || "",
    term: item.term_months ? `${item.term_months} ay` : "",
    distribution: getDistributionLabel(item.distribution_type),
    risk: getRiskLabel(risk?.status),
    status: getStatusLabel(item.status),
  };

  return values[columnKey] ?? "";
}

function getExportColumns(visibleColumns) {
  return visibleColumns.filter((column) => column.exportable);
}

function downloadCsv(rows, riskMap, visibleColumns) {
  const exportColumns = getExportColumns(visibleColumns);
  const headers = exportColumns.map((column) => column.label);

  const body = rows.map((item) =>
    exportColumns.map((column) => getExportValue(column.key, item, riskMap))
  );

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

function downloadExcel(rows, riskMap, visibleColumns) {
  const exportColumns = getExportColumns(visibleColumns);

  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              ${exportColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (item) => `
                  <tr>
                    ${exportColumns
                      .map(
                        (column) =>
                          `<td>${escapeHtml(getExportValue(column.key, item, riskMap))}</td>`
                      )
                      .join("")}
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "vabank-muracietler.xls";
  link.click();
  URL.revokeObjectURL(url);
}

async function copyRows(rows, riskMap, visibleColumns, setPageMessage) {
  const exportColumns = getExportColumns(visibleColumns);
  const headers = exportColumns.map((column) => column.label);

  const body = rows.map((item) =>
    exportColumns.map((column) => getExportValue(column.key, item, riskMap))
  );

  const text = [headers, ...body].map((row) => row.join("\t")).join("\n");

  try {
    await navigator.clipboard.writeText(text);
    setPageMessage("Cədvəl məlumatları kopyalandı.");
  } catch (error) {
    setPageMessage("Kopyalama alınmadı.");
  }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [customerFlags, setCustomerFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [distributionFilter, setDistributionFilter] = useState("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [creditTypeFilter, setCreditTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [rowLimit, setRowLimit] = useState("25");
  const [exportOpen, setExportOpen] = useState(false);
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);
  const [draggedColumnKey, setDraggedColumnKey] = useState(null);

  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_VISIBLE_COLUMNS;

    try {
      const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;

      if (!Array.isArray(parsed) || !parsed.length) {
        return DEFAULT_VISIBLE_COLUMNS;
      }

      const allowedKeys = TABLE_COLUMNS.map((column) => column.key);
      const cleanKeys = parsed.filter((key) => allowedKeys.includes(key));

      return cleanKeys.length ? cleanKeys : DEFAULT_VISIBLE_COLUMNS;
    } catch (error) {
      return DEFAULT_VISIBLE_COLUMNS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumnKeys));
    } catch (error) {}
  }, [visibleColumnKeys]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [applicationsRes, flagsRes] = await Promise.all([
          supabase
            .from("applications")
            .select("*")
            .order("id", { ascending: false }),

          supabase
            .from("customer_flags")
            .select("id, application_id, status, created_at")
            .in("status", ["active", "under_review"])
            .order("id", { ascending: false }),
        ]);

        if (applicationsRes.error) {
          setPageMessage("Müraciətlər yüklənmədi: " + applicationsRes.error.message);
          setApplications([]);
          setCustomerFlags([]);
          setLoading(false);
          return;
        }

        if (flagsRes.error) {
          setPageMessage("Risk məlumatları yüklənmədi: " + flagsRes.error.message);
          setCustomerFlags([]);
        } else {
          setCustomerFlags(flagsRes.data || []);
        }

        setApplications(applicationsRes.data || []);
        setLoading(false);
      } catch (error) {
        setPageMessage("Müraciətlər yüklənmədi.");
        setApplications([]);
        setCustomerFlags([]);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

    const visibleColumns = useMemo(() => {
    return visibleColumnKeys
      .map((key) => TABLE_COLUMNS.find((column) => column.key === key))
      .filter(Boolean);
  }, [visibleColumnKeys]);

  const orderedColumnsForPanel = useMemo(() => {
    const visibleOrdered = visibleColumnKeys
      .map((key) => TABLE_COLUMNS.find((column) => column.key === key))
      .filter(Boolean);

    const hiddenColumns = TABLE_COLUMNS.filter(
      (column) => !visibleColumnKeys.includes(column.key)
    );

    return [...visibleOrdered, ...hiddenColumns];
  }, [visibleColumnKeys]);

  const riskMap = useMemo(() => {
    const map = {};

    customerFlags.forEach((flag) => {
      const applicationId = Number(flag.application_id);
      if (!applicationId) return;

      const existing = map[applicationId];

      if (!existing) {
        map[applicationId] = flag;
        return;
      }

      if (existing.status !== "active" && flag.status === "active") {
        map[applicationId] = flag;
      }
    });

    return map;
  }, [customerFlags]);

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
      const risk = riskMap[Number(item.id)];

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

      const matchesRisk =
        riskFilter === "all"
          ? true
          : riskFilter === "none"
          ? !risk
          : risk?.status === riskFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDistribution &&
        matchesBank &&
        matchesCustomerType &&
        matchesCreditType &&
        matchesRisk
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
    riskFilter,
    riskMap,
  ]);

  const visibleApplications = useMemo(() => {
    if (rowLimit === "all") return filteredApplications;
    return filteredApplications.slice(0, Number(rowLimit));
  }, [filteredApplications, rowLimit]);

  function toggleColumn(columnKey) {
    setVisibleColumnKeys((prev) => {
      if (prev.includes(columnKey)) {
        if (prev.length === 1) return prev;
        return prev.filter((key) => key !== columnKey);
      }

      return [...prev, columnKey];
    });
  }

    function moveColumn(columnKey, direction) {
    setVisibleColumnKeys((prev) => {
      const currentIndex = prev.indexOf(columnKey);

      if (currentIndex === -1) return prev;

      const nextIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const next = [...prev];
      const temp = next[currentIndex];
      next[currentIndex] = next[nextIndex];
      next[nextIndex] = temp;

      return next;
    });
  }
    function moveColumnByDrag(targetColumnKey) {
    if (!draggedColumnKey || draggedColumnKey === targetColumnKey) return;

    setVisibleColumnKeys((prev) => {
      const fromIndex = prev.indexOf(draggedColumnKey);
      const toIndex = prev.indexOf(targetColumnKey);

      if (fromIndex === -1 || toIndex === -1) return prev;

      const next = [...prev];
      const [movedColumn] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedColumn);

      return next;
    });

    setDraggedColumnKey(null);
  }
  function selectAllColumns() {
    setVisibleColumnKeys(DEFAULT_VISIBLE_COLUMNS);
  }
  function resetColumns() {
    setVisibleColumnKeys(DEFAULT_VISIBLE_COLUMNS);
  }

  function renderCell(columnKey, item) {
    const statusStyle = getStatusStyles(item.status);
    const risk = riskMap[Number(item.id)];
    const riskStyle = getRiskStyles(risk?.status);

    if (columnKey === "id") return `#${item.id}`;
    if (columnKey === "date") return formatDate(item.created_at);
    if (columnKey === "fullName") return item.full_name || "-";
    if (columnKey === "phone") return item.phone || "-";
    if (columnKey === "email") return item.email || "-";
    if (columnKey === "customerType") return CUSTOMER_TYPE_LABELS[item.customer_type] || item.customer_type || "-";
    if (columnKey === "creditType") return item.credit_type || "-";
    if (columnKey === "organization") return item.organization || "-";
    if (columnKey === "amount") return formatMoney(item.amount);
    if (columnKey === "term") return item.term_months ? `${item.term_months} ay` : "-";
    if (columnKey === "distribution") return getDistributionLabel(item.distribution_type);

    if (columnKey === "risk") {
      return risk ? (
        <span
          title={getRiskLabel(risk.status)}
          style={{ ...styles.riskIcon, ...riskStyle }}
        >
          !
        </span>
      ) : (
        <span style={styles.noRisk}></span>
      );
    }

    if (columnKey === "status") {
      return (
        <span style={{ ...styles.badge, ...statusStyle }}>
          {getStatusLabel(item.status)}
        </span>
      );
    }

    if (columnKey === "action") {
      return (
        <Link href={`/admin/applications/${item.id}`} style={styles.detailBtn}>
          Bax
        </Link>
      );
    }

    return "-";
  }

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

          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={styles.select}>
            {RISK_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.toolbar}>
          <div style={styles.resultText}>
            Tapıldı: <strong>{filteredApplications.length}</strong> müraciət
          </div>

          <div style={styles.toolbarActions}>
            <label style={styles.showLabel}>Göstər</label>

            <select value={rowLimit} onChange={(e) => setRowLimit(e.target.value)} style={styles.smallSelect}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="all">Hamısı</option>
            </select>

            <button
              type="button"
              onClick={() => setColumnPanelOpen(true)}
              style={styles.columnBtn}
            >
              Sütun seç
            </button>

            <div style={styles.exportWrap}>
              <button
                type="button"
                onClick={() => setExportOpen((prev) => !prev)}
                style={styles.exportBtn}
              >
                Export
              </button>

              {exportOpen ? (
                <div style={styles.exportMenu}>
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      window.print();
                    }}
                    style={styles.exportMenuItem}
                  >
                    Çap / PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      copyRows(filteredApplications, riskMap, visibleColumns, setPageMessage);
                    }}
                    style={styles.exportMenuItem}
                  >
                    Kopyala
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      downloadCsv(filteredApplications, riskMap, visibleColumns);
                    }}
                    style={styles.exportMenuItem}
                  >
                    CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      downloadExcel(filteredApplications, riskMap, visibleColumns);
                    }}
                    style={styles.exportMenuItem}
                  >
                    Excel file
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    style={column.align === "center" ? styles.thCenter : styles.th}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleApplications.map((item) => (
                <tr key={item.id}>
                  {visibleColumns.map((column) => {
                    const isStrong = column.key === "fullName";
                    const isCenter = column.align === "center";

                    return (
                      <td
                        key={column.key}
                        style={
                          isCenter
                            ? styles.tdCenter
                            : isStrong
                            ? styles.tdStrong
                            : styles.td
                        }
                      >
                        {renderCell(column.key, item)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {!visibleApplications.length ? (
            <div style={styles.emptyBox}>Uyğun müraciət tapılmadı.</div>
          ) : null}
        </div>
      </div>

      {columnPanelOpen ? (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Sütun seçimi</h2>
                <p style={styles.modalSubtitle}>
                  Əsas cədvəldə görünəcək sütunları seçin.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setColumnPanelOpen(false)}
                style={styles.modalClose}
              >
                ×
              </button>
            </div>

            <div style={styles.columnsGrid}>
                            {orderedColumnsForPanel.map((column) => {
                const isVisible = visibleColumnKeys.includes(column.key);
                const visibleIndex = visibleColumnKeys.indexOf(column.key);

                return (
                                    <div
                    key={column.key}
                    draggable={isVisible}
                    onDragStart={() => {
                      if (isVisible) setDraggedColumnKey(column.key);
                    }}
                    onDragOver={(e) => {
                      if (isVisible) e.preventDefault();
                    }}
                    onDrop={() => {
                      if (isVisible) moveColumnByDrag(column.key);
                    }}
                    onDragEnd={() => setDraggedColumnKey(null)}
                    style={{
                      ...styles.columnOptionRow,
                      ...(draggedColumnKey === column.key ? styles.columnOptionRowDragging : {}),
                      ...(!isVisible ? styles.columnOptionRowHidden : {}),
                    }}
                  >
                                        <span
                      title="Sütunu tutub sürüşdür"
                      style={{
                        ...styles.dragHandle,
                        ...(!isVisible ? styles.dragHandleDisabled : {}),
                      }}
                    >
                      ≡
                    </span>
                    <label style={styles.columnOption}>
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumn(column.key)}
                        style={styles.checkbox}
                      />
                      <span>{column.label}</span>
                    </label>

                    <div style={styles.columnMoveActions}>
                      <button
                        type="button"
                        onClick={() => moveColumn(column.key, "up")}
                        disabled={!isVisible || visibleIndex <= 0}
                        style={{
                          ...styles.moveBtn,
                          ...(!isVisible || visibleIndex <= 0 ? styles.moveBtnDisabled : {}),
                        }}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveColumn(column.key, "down")}
                        disabled={
                          !isVisible || visibleIndex === visibleColumnKeys.length - 1
                        }
                        style={{
                          ...styles.moveBtn,
                          ...(!isVisible || visibleIndex === visibleColumnKeys.length - 1
                            ? styles.moveBtnDisabled
                            : {}),
                        }}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={styles.modalFooter}>
              <div style={styles.modalFooterLeft}>
                <button type="button" onClick={selectAllColumns} style={styles.secondaryBtn}>
                  Hamısını seç
                </button>

                <button type="button" onClick={resetColumns} style={styles.secondaryBtn}>
                  Sıfırla
                </button>
              </div>

              <button
                type="button"
                onClick={() => setColumnPanelOpen(false)}
                style={styles.primaryBtn}
              >
                Təsdiq et
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
    color: "#334155",
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
    fontFamily: "inherit",
  },

  select: {
    minHeight: "46px",
    borderRadius: "14px",
    border: "1px solid #dbe4ee",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    fontFamily: "inherit",
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
    alignItems: "center",
  },

  showLabel: {
    fontSize: "14px",
    color: "#334155",
  },

  smallSelect: {
    minHeight: "40px",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    padding: "0 12px",
    fontSize: "13px",
    background: "#ffffff",
    fontFamily: "inherit",
  },

  columnBtn: {
    minHeight: "40px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 16px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  exportWrap: {
    position: "relative",
  },

  exportBtn: {
    minHeight: "40px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 16px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  exportMenu: {
    position: "absolute",
    right: 0,
    top: "46px",
    width: "170px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "6px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
    zIndex: 20,
  },

  exportMenuItem: {
    width: "100%",
    minHeight: "38px",
    border: "0",
    borderRadius: "10px",
    background: "#ffffff",
    textAlign: "left",
    padding: "0 12px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#334155",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
  },

  table: {
    width: "100%",
    minWidth: "1300px",
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

  thCenter: {
    textAlign: "center",
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

  tdCenter: {
    padding: "14px",
    fontSize: "14px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    whiteSpace: "nowrap",
    textAlign: "center",
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

  riskIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: 900,
    lineHeight: 1,
  },

  noRisk: {
    width: "28px",
    height: "28px",
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

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  modal: {
    width: "min(760px, 100%)",
    background: "#ffffff",
    borderRadius: "24px",
    border: "1px solid #dbe4ee",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.25)",
    overflow: "hidden",
  },

  modalHeader: {
    padding: "20px 22px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    color: "#0f172a",
  },

  modalSubtitle: {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  modalClose: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    fontSize: "28px",
    lineHeight: 1,
    cursor: "pointer",
    color: "#64748b",
  },

  columnsGrid: {
    padding: "22px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
  },

  columnOption: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minHeight: "40px",
    fontSize: "14px",
    color: "#0f172a",
    cursor: "pointer",
  },

    columnOptionRow: {
    minHeight: "44px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    background: "#ffffff",
  },
  columnOptionRowDragging: {
    opacity: 0.45,
    border: "1px dashed #0f172a",
    background: "#f8fafc",
  },

  columnOptionRowHidden: {
    opacity: 0.55,
  },

  dragHandle: {
    width: "24px",
    minWidth: "24px",
    height: "30px",
    borderRadius: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: "22px",
    fontWeight: 800,
    cursor: "grab",
    userSelect: "none",
  },

  dragHandleDisabled: {
    cursor: "not-allowed",
    opacity: 0.35,
  },
  columnMoveActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  moveBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  moveBtnDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
  },

  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },

  modalFooter: {
    padding: "18px 22px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  modalFooterLeft: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  secondaryBtn: {
    minHeight: "40px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 14px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  primaryBtn: {
    minHeight: "40px",
    borderRadius: "12px",
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#ffffff",
    padding: "0 18px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
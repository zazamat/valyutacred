"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { labelFor } from "../../../lib/labels";
import {
  PermissionDenied,
  useOrganizationPermissions,
} from "../_components/OrganizationPermissionsContext";
import {
  EmptyState,
  PageHeader,
  SectionPanel,
} from "../_components/OrganizationPlaceholders";

const COLUMN_STORAGE_KEY = "vabank_org_applications_columns";

const MATCH_SELECT = `
  id,
  application_id,
  referral_id,
  source,
  visibility_status,
  lead_fee_status,
  success_fee_status,
  monetization_model,
  assigned_at,
  matched_at,
  applications (
    id,
    created_at,
    full_name,
    phone,
    email,
    customer_type,
    credit_type,
    amount,
    term_months,
    status,
    distribution_type,
    referral_id,
    credit_result_status,
    lead_fee_amount,
    success_fee_amount
  )
`;

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${new Intl.NumberFormat("az-AZ").format(Number(value) || 0)} AZN`;
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

function normalizeRows(matches) {
  return matches.map((match) => {
    const application = Array.isArray(match.applications)
      ? match.applications[0]
      : match.applications;

    return { ...match, application: application || null };
  });
}

function getStatusStyle(status) {
  if (status === "approved" || status === "sent" || status === "disbursed") {
    return styles.badgeSuccess;
  }
  if (status === "rejected" || status === "customer_declined" || status === "expired") {
    return styles.badgeDanger;
  }
  if (status === "reviewing" || status === "processing" || status === "under_review") {
    return styles.badgeWarning;
  }
  return styles.badgeInfo;
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob(["\uFEFF" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function OrganizationApplicationsPage() {
  const tableSectionRef = useRef(null);
  const { hasPermission } = useOrganizationPermissions();
  const canViewDetail = hasPermission("can_view_application_detail");
  const canViewContact = hasPermission("can_view_customer_contact");
  const canViewMonetization = hasPermission("can_view_monetization");
  const canExportData = hasPermission("can_export_data");

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [rowLimit, setRowLimit] = useState("25");
  const [exportOpen, setExportOpen] = useState(false);
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);
  const [tableAvailableWidth, setTableAvailableWidth] = useState(0);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(window.localStorage.getItem(COLUMN_STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const section = tableSectionRef.current;
    if (!section) return undefined;

    const updateWidth = () => {
      setTableAvailableWidth(section.getBoundingClientRect().width);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasPermission("can_view_applications")) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadApplications() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("application_organization_matches")
        .select(MATCH_SELECT)
        .in("source", ["only_selected", "admin_assigned"])
        .eq("visibility_status", "assigned")
        .order("matched_at", { ascending: false });

      if (!active) return;

      if (error) {
        setMatches([]);
        setErrorMessage("Müraciətlər yüklənmədi: " + error.message);
        setLoading(false);
        return;
      }

      setMatches(normalizeRows(data || []));
      setLoading(false);
    }

    loadApplications();

    return () => {
      active = false;
    };
  }, [hasPermission]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: "referral",
        label: "Referral",
        width: 160,
        render: (match) => {
          const application = match.application || {};
          const value = application.referral_id || match.referral_id || "-";
          return (
            <div style={styles.primaryCell}>
              {application.id && canViewDetail ? (
                <Link href={`/organization/applications/${application.id}`} style={styles.detailLink}>
                  {value}
                </Link>
              ) : (
                value
              )}
              <div style={styles.cellMeta}>Match #{match.id}</div>
            </div>
          );
        },
        exportValue: (match) => match.application?.referral_id || match.referral_id || "",
      },
      {
        key: "customer",
        label: "Müştəri",
        width: 190,
        render: (match) => {
          const application = match.application || {};
          const value = application.full_name || "-";
          return (
            <div style={styles.primaryCell}>
              {application.id && canViewDetail ? (
                <Link href={`/organization/applications/${application.id}`} style={styles.detailLink}>
                  {value}
                </Link>
              ) : (
                value
              )}
              <div style={styles.cellMeta}>Müraciət #{application.id || match.application_id}</div>
            </div>
          );
        },
        exportValue: (match) => match.application?.full_name || "",
      },
      {
        key: "contact",
        label: "Əlaqə",
        width: 190,
        hidden: !canViewContact,
        render: (match) => (
          <div>
            {match.application?.phone || "-"}
            <div style={styles.cellMeta}>{match.application?.email || "-"}</div>
          </div>
        ),
        exportValue: (match) =>
          `${match.application?.phone || ""} ${match.application?.email || ""}`.trim(),
      },
      {
        key: "customer_type",
        label: "Tip",
        width: 130,
        render: (match) => labelFor(match.application?.customer_type),
        exportValue: (match) => labelFor(match.application?.customer_type, ""),
      },
      {
        key: "credit_type",
        label: "Kredit",
        width: 165,
        render: (match) => match.application?.credit_type || "-",
        exportValue: (match) => match.application?.credit_type || "",
      },
      {
        key: "amount",
        label: "Məbləğ",
        width: 150,
        render: (match) => (
          <div>
            {formatMoney(match.application?.amount)}
            <div style={styles.cellMeta}>
              {match.application?.term_months ? `${match.application.term_months} ay` : "-"}
            </div>
          </div>
        ),
        exportValue: (match) => formatMoney(match.application?.amount),
      },
      {
        key: "status",
        label: "Status",
        width: 145,
        render: (match) => (
          <span style={{ ...styles.badge, ...getStatusStyle(match.application?.status) }}>
            {labelFor(match.application?.status)}
          </span>
        ),
        exportValue: (match) => labelFor(match.application?.status, ""),
      },
      {
        key: "result",
        label: "Nəticə",
        width: 170,
        render: (match) => (
          <span style={{ ...styles.badge, ...getStatusStyle(match.application?.credit_result_status) }}>
            {labelFor(match.application?.credit_result_status)}
          </span>
        ),
        exportValue: (match) => labelFor(match.application?.credit_result_status, ""),
      },
      {
        key: "model",
        label: "Ödəniş modeli",
        width: 190,
        hidden: !canViewMonetization,
        render: (match) => (
          <div>
            {labelFor(match.monetization_model)}
            <div style={styles.cellMeta}>{labelFor(match.lead_fee_status || "not_charged")}</div>
          </div>
        ),
        exportValue: (match) => labelFor(match.monetization_model, ""),
      },
      {
        key: "source",
        label: "Mənbə",
        width: 190,
        render: (match) => labelFor(match.source),
        exportValue: (match) => labelFor(match.source, ""),
      },
      {
        key: "date",
        label: "Tarix",
        width: 145,
        render: (match) => formatDate(match.assigned_at || match.matched_at),
        exportValue: (match) => formatDate(match.assigned_at || match.matched_at),
      },
      {
        key: "action",
        label: "Əməliyyat",
        width: 120,
        render: (match) =>
          match.application?.id && canViewDetail ? (
            <Link href={`/organization/applications/${match.application.id}`} style={styles.actionBtn}>
              Bax
            </Link>
          ) : (
            "-"
          ),
        exportValue: () => "",
      },
    ];

    return baseColumns.filter((column) => !column.hidden);
  }, [canViewContact, canViewDetail, canViewMonetization]);

  const activeVisibleKeys = useMemo(() => {
    const availableKeys = columns.map((column) => column.key);
    const nextKeys = Array.isArray(visibleColumnKeys)
      ? visibleColumnKeys.filter((key) => availableKeys.includes(key))
      : availableKeys;
    return nextKeys.length ? nextKeys : availableKeys;
  }, [columns, visibleColumnKeys]);

  const visibleColumns = useMemo(
    () => columns.filter((column) => activeVisibleKeys.includes(column.key)),
    [columns, activeVisibleKeys]
  );

  const tableWidth = useMemo(
    () => visibleColumns.reduce((sum, column) => sum + column.width, 0),
    [visibleColumns]
  );

  const tableShellWidth = useMemo(() => {
    const visualTableWidth = tableWidth + 4;
    if (!tableAvailableWidth) return visualTableWidth;
    return Math.min(visualTableWidth, tableAvailableWidth);
  }, [tableAvailableWidth, tableWidth]);

  const filteredMatches = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return matches.filter((match) => {
      const application = match.application || {};
      const matchesSearch =
        !needle ||
        [
          application.referral_id,
          match.referral_id,
          application.full_name,
          canViewContact ? application.phone : "",
          canViewContact ? application.email : "",
          application.credit_type,
          labelFor(application.customer_type, ""),
          labelFor(application.status, ""),
          labelFor(application.credit_result_status, ""),
          labelFor(match.source, ""),
          labelFor(match.monetization_model, ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle);

      const matchesStatus =
        statusFilter === "all" ? true : application.status === statusFilter;
      const matchesResult =
        resultFilter === "all" ? true : application.credit_result_status === resultFilter;

      return matchesSearch && matchesStatus && matchesResult;
    });
  }, [matches, search, canViewContact, statusFilter, resultFilter]);

  const pagedMatches = useMemo(() => {
    if (rowLimit === "all") return filteredMatches;
    return filteredMatches.slice(0, Number(rowLimit));
  }, [filteredMatches, rowLimit]);

  const summary = useMemo(() => {
    return {
      assigned: matches.length,
      pending: matches.filter((item) => item.application?.credit_result_status === "pending").length,
      disbursed: matches.filter((item) => item.application?.credit_result_status === "disbursed").length,
    };
  }, [matches]);

  const statusOptions = useMemo(
    () => Array.from(new Set(matches.map((item) => item.application?.status).filter(Boolean))),
    [matches]
  );

  const resultOptions = useMemo(
    () =>
      Array.from(
        new Set(matches.map((item) => item.application?.credit_result_status).filter(Boolean))
      ),
    [matches]
  );

  const persistColumns = (keys) => {
    setVisibleColumnKeys(keys);
    window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(keys));
  };

  const toggleColumn = (key) => {
    const nextKeys = activeVisibleKeys.includes(key)
      ? activeVisibleKeys.filter((item) => item !== key)
      : [...activeVisibleKeys, key];
    persistColumns(nextKeys.length ? nextKeys : columns.map((column) => column.key));
  };

  const exportRows = (format) => {
    const exportColumns = visibleColumns.filter((column) => column.key !== "action");
    const headers = exportColumns.map((column) => column.label);
    const rows = filteredMatches.map((match) =>
      exportColumns.map((column) => column.exportValue(match))
    );
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");

    if (format === "print") {
      window.print();
      return;
    }

    downloadTextFile(
      format === "excel" ? "bank-muracietleri.xls" : "bank-muracietleri.csv",
      csv,
      format === "excel"
        ? "application/vnd.ms-excel;charset=utf-8"
        : "text/csv;charset=utf-8"
    );
  };

  if (!hasPermission("can_view_applications")) {
    return <PermissionDenied />;
  }

  return (
    <div>
      <PageHeader
        kicker="Müraciətlər"
        title="Bank müraciətləri"
        subtitle="Bankınıza yönləndirilmiş müraciətlər və onların kredit nəticələri."
      />

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Təyin edilmiş müraciətlər</div>
          <div style={styles.summaryValue}>{loading ? "-" : summary.assigned}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Gözləyən nəticələr</div>
          <div style={styles.summaryValue}>{loading ? "-" : summary.pending}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Kredit verilib</div>
          <div style={styles.summaryValue}>{loading ? "-" : summary.disbursed}</div>
        </div>
      </div>

      <SectionPanel
        title="Müraciət siyahısı"
        desc="Siyahıda yalnız bankınıza təyin edilmiş müraciətlər göstərilir."
      >
        <div style={styles.filterPanel}>
          <div style={styles.filters}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ad, referral, telefon və ya kredit növü"
              style={styles.input}
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={styles.select}
            >
              <option value="all">Bütün statuslar</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {labelFor(status)}
                </option>
              ))}
            </select>
            <select
              value={resultFilter}
              onChange={(event) => setResultFilter(event.target.value)}
              style={styles.select}
            >
              <option value="all">Bütün nəticələr</option>
              {resultOptions.map((status) => (
                <option key={status} value={status}>
                  {labelFor(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.tableToolbar}>
          <div style={styles.resultText}>
            Tapıldı: <strong>{filteredMatches.length}</strong> müraciət
          </div>

          <div style={styles.toolbarActions}>
            <label style={styles.showLabel}>Göstər</label>
            <select
              value={rowLimit}
              onChange={(event) => setRowLimit(event.target.value)}
              style={styles.smallSelect}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="all">Hamısı</option>
            </select>

            <button type="button" style={styles.columnBtn} onClick={() => setColumnPanelOpen(true)}>
              Sütun seç
            </button>

            {canExportData ? (
              <div style={styles.exportWrap}>
                <button
                  type="button"
                  style={styles.exportBtn}
                  onClick={() => setExportOpen((value) => !value)}
                >
                  Export
                </button>
                {exportOpen ? (
                  <div style={styles.exportMenu}>
                    <button type="button" style={styles.exportMenuItem} onClick={() => exportRows("print")}>
                      Çap / PDF
                    </button>
                    <button type="button" style={styles.exportMenuItem} onClick={() => exportRows("csv")}>
                      CSV
                    </button>
                    <button type="button" style={styles.exportMenuItem} onClick={() => exportRows("excel")}>
                      Excel file
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {loading ? <div style={styles.stateBox}>Müraciətlər yüklənir...</div> : null}
        {!loading && errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}
        {!loading && !errorMessage && !matches.length ? (
          <EmptyState
            title="Bank üçün müraciət tapılmadı"
            desc="Bankınıza müraciət təyin edildikdən sonra siyahı burada görünəcək."
          />
        ) : null}

        {!loading && !errorMessage && matches.length ? (
          <div ref={tableSectionRef} style={styles.tableSection}>
            <div style={{ ...styles.tableShell, width: `${tableShellWidth}px` }}>
              <div style={styles.tableScroll}>
                <table
                  style={{
                    ...styles.table,
                    width: `${tableWidth}px`,
                    minWidth: `${tableWidth}px`,
                  }}
                >
                  <colgroup>
                    {visibleColumns.map((column) => (
                      <col key={column.key} style={{ width: `${column.width}px` }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      {visibleColumns.map((column) => (
                        <th key={column.key} style={styles.th}>
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {pagedMatches.map((match) => (
                      <tr key={match.id}>
                        {visibleColumns.map((column) => (
                          <td key={column.key} style={styles.td}>
                            {column.render(match)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!pagedMatches.length ? (
                <div style={styles.emptyBox}>Filterlərə uyğun müraciət tapılmadı.</div>
              ) : null}
            </div>
          </div>
        ) : null}
      </SectionPanel>

      {columnPanelOpen ? (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Sütun seçimi</h2>
                <p style={styles.modalSubtitle}>Cədvəldə görünəcək sütunları seçin.</p>
              </div>

              <button type="button" onClick={() => setColumnPanelOpen(false)} style={styles.modalClose}>
                x
              </button>
            </div>

            <div style={styles.columnsGrid}>
              {columns.map((column) => {
                const isVisible = activeVisibleKeys.includes(column.key);
                return (
                  <div
                    key={column.key}
                    style={{
                      ...styles.columnOptionRow,
                      ...(!isVisible ? styles.columnOptionRowHidden : {}),
                    }}
                  >
                    <label style={styles.columnOption}>
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumn(column.key)}
                        style={styles.checkbox}
                      />
                      <span>{column.label}</span>
                    </label>
                  </div>
                );
              })}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => persistColumns(columns.map((column) => column.key))}
                style={styles.secondaryBtn}
              >
                Hamısını seç
              </button>

              <button type="button" onClick={() => setColumnPanelOpen(false)} style={styles.primaryBtn}>
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
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "18px",
    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 650,
    marginBottom: "8px",
  },
  summaryValue: {
    fontSize: "30px",
    fontWeight: 800,
    color: "#059669",
  },
  filterPanel: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "16px",
    padding: "18px",
    marginBottom: "14px",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
  },
  input: {
    minHeight: "46px",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    padding: "0 14px",
    fontSize: "14px",
    color: "#0f172a",
    outline: "none",
    fontFamily: "inherit",
  },
  select: {
    minHeight: "46px",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    padding: "0 14px",
    fontSize: "14px",
    color: "#0f172a",
    background: "#ffffff",
    outline: "none",
    fontFamily: "inherit",
  },
  tableToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "14px",
    padding: "12px 14px",
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
    color: "#0f172a",
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
    border: 0,
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
  stateBox: {
    minHeight: "88px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "18px",
    color: "#475569",
    fontSize: "14px",
    fontWeight: 650,
    display: "flex",
    alignItems: "center",
  },
  errorBox: {
    minHeight: "88px",
    borderRadius: "14px",
    border: "1px solid #fecaca",
    background: "#fff7f7",
    padding: "18px",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: 650,
    lineHeight: 1.55,
  },
  tableSection: {
    width: "100%",
  },
  tableShell: {
    display: "block",
    maxWidth: "100%",
    alignSelf: "flex-start",
  },
  tableScroll: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    background: "#ffffff",
  },
  table: {
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },
  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  td: {
    padding: "14px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    color: "#334155",
    fontSize: "14px",
    verticalAlign: "top",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  primaryCell: {
    color: "#0f172a",
    fontWeight: 750,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cellMeta: {
    marginTop: "6px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  detailLink: {
    color: "#047857",
    textDecoration: "none",
    fontWeight: 800,
  },
  actionBtn: {
    display: "inline-flex",
    minHeight: "36px",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#0f172a",
    color: "#ffffff",
    padding: "0 14px",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
  },
  badge: {
    display: "inline-flex",
    minHeight: "30px",
    alignItems: "center",
    borderRadius: "999px",
    padding: "0 10px",
    fontSize: "12px",
    fontWeight: 750,
    whiteSpace: "nowrap",
  },
  badgeInfo: {
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  badgeWarning: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
  },
  badgeSuccess: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },
  badgeDanger: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
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
    maxHeight: "90vh",
    background: "#ffffff",
    borderRadius: "18px",
    border: "1px solid #dbe4ee",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.25)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    padding: "20px 22px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexShrink: 0,
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
    fontSize: "16px",
    cursor: "pointer",
    color: "#64748b",
  },
  columnsGrid: {
    padding: "22px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
    overflowY: "auto",
    flex: 1,
    minHeight: 0,
  },
  columnOptionRow: {
    minHeight: "44px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    background: "#ffffff",
  },
  columnOptionRowHidden: {
    opacity: 0.55,
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
    flexShrink: 0,
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

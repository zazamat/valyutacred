"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { PERMISSION_KEYS, PERMISSION_LABELS, yesNo } from "../../../../lib/labels";

const COLUMN_STORAGE_KEY = "vabank_org_permissions_visible_columns";

const TABLE_COLUMNS = [
  { key: "organization", label: "Təşkilat", width: 220, exportable: true },
  { key: "cabinet", label: "Kabinet", width: 120, exportable: true },
  ...PERMISSION_KEYS.map((key) => ({
    key,
    label: PERMISSION_LABELS[key],
    width: 170,
    exportable: true,
  })),
  { key: "updated_at", label: "Yenilənmə tarixi", width: 170, exportable: true },
];

const DEFAULT_VISIBLE_COLUMNS = [
  "organization",
  "cabinet",
  "can_view_applications",
  "can_view_application_detail",
  "can_view_customer_contact",
  "can_view_balance",
  "can_manage_products",
  "can_export_data",
];

function downloadFile(name, content, type) {
  const blob = new Blob(["\uFEFF" + content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(value) {
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

function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

export default function OrganizationPermissionsPanel({ organizations = [] }) {
  const tableSectionRef = useRef(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowLimit, setRowLimit] = useState("10");
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [tableAvailableWidth, setTableAvailableWidth] = useState(0);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_VISIBLE_COLUMNS;
    try {
      const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      const allowed = TABLE_COLUMNS.map((column) => column.key);
      const clean = Array.isArray(parsed)
        ? parsed.filter((key) => allowed.includes(key))
        : DEFAULT_VISIBLE_COLUMNS;
      return clean.length ? clean : DEFAULT_VISIBLE_COLUMNS;
    } catch {
      return DEFAULT_VISIBLE_COLUMNS;
    }
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumnKeys));
    } catch {}
  }, [visibleColumnKeys]);

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

  const organizationMap = useMemo(() => {
    const map = {};
    organizations.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [organizations]);

  async function loadPermissions() {
    setLoading(true);
    setMessage("");

    let response;

    try {
      response = await withTimeout(
        supabase
          .from("organization_permissions")
          .select(
            "organization_id, can_view_applications, can_view_application_detail, can_view_customer_contact, can_update_application_status, can_update_credit_result, can_view_monetization, can_buy_leads, can_view_balance, can_manage_products, can_export_data, updated_at"
          )
          .order("organization_id", { ascending: true }),
        5000,
        "Permissions query timed out"
      );
    } catch {
      setPermissions([]);
      setMessage("İcazələr yüklənmədi: sorğu vaxtı bitdi.");
      setLoading(false);
      return;
    }

    const { data, error } = response;

    if (error) {
      setPermissions([]);
      setMessage("İcazələr yüklənmədi: " + error.message);
      setLoading(false);
      return;
    }

    setPermissions(data || []);
    setLoading(false);
  }

  const rows = useMemo(() => {
    return permissions.map((item) => {
      const organization = organizationMap[item.organization_id] || {};
      return {
        ...item,
        organization_name: organization.name || `Təşkilat #${item.organization_id}`,
        cabinet_enabled: !!organization.cabinet_enabled,
        organization_status: organization.status || "-",
      };
    });
  }, [permissions, organizationMap]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesSearch =
        !query ||
        [item.organization_name, item.organization_id]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "cabinet_on" && item.cabinet_enabled) ||
        (statusFilter === "cabinet_off" && !item.cabinet_enabled);
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const visibleRows = useMemo(
    () => filteredRows.slice(0, Number(rowLimit)),
    [filteredRows, rowLimit]
  );

  const visibleColumns = useMemo(
    () =>
      visibleColumnKeys
        .map((key) => TABLE_COLUMNS.find((column) => column.key === key))
        .filter(Boolean),
    [visibleColumnKeys]
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

  const orderedColumnsForPanel = useMemo(() => {
    const visibleOrdered = visibleColumnKeys
      .map((key) => TABLE_COLUMNS.find((column) => column.key === key))
      .filter(Boolean);
    const hiddenColumns = TABLE_COLUMNS.filter(
      (column) => !visibleColumnKeys.includes(column.key)
    );
    return [...visibleOrdered, ...hiddenColumns];
  }, [visibleColumnKeys]);

  async function togglePermission(row, key, value) {
    setSavingId(`${row.organization_id}-${key}`);
    setMessage("");

    const { data, error } = await supabase
      .from("organization_permissions")
      .update({ [key]: value })
      .eq("organization_id", row.organization_id)
      .select()
      .single();

    if (error) {
      setMessage("İcazə yenilənmədi: " + error.message);
      setSavingId(null);
      return;
    }

    setPermissions((prev) =>
      prev.map((item) =>
        item.organization_id === row.organization_id ? data : item
      )
    );
    setSavingId(null);
    setMessage("İcazə yeniləndi.");
  }

  function getExportValue(columnKey, row) {
    if (columnKey === "organization") return row.organization_name;
    if (columnKey === "cabinet") return yesNo(row.cabinet_enabled);
    if (columnKey === "updated_at") return formatDate(row.updated_at);
    if (PERMISSION_KEYS.includes(columnKey)) return yesNo(row[columnKey]);
    return row[columnKey] ?? "";
  }

  function exportCsv() {
    const columns = visibleColumns.filter((column) => column.exportable);
    const csv = [
      columns.map((column) => column.label),
      ...visibleRows.map((row) =>
        columns.map((column) => getExportValue(column.key, row))
      ),
    ]
      .map((line) =>
        line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");
    downloadFile("organization-permissions.csv", csv, "text/csv;charset=utf-8;");
  }

  function exportExcel() {
    const columns = visibleColumns.filter((column) => column.exportable);
    const html = `
      <html><head><meta charset="UTF-8" /></head><body>
        <table border="1">
          <thead><tr>${columns
            .map((column) => `<th>${escapeHtml(column.label)}</th>`)
            .join("")}</tr></thead>
          <tbody>${visibleRows
            .map(
              (row) =>
                `<tr>${columns
                  .map(
                    (column) =>
                      `<td>${escapeHtml(getExportValue(column.key, row))}</td>`
                  )
                  .join("")}</tr>`
            )
            .join("")}</tbody>
        </table>
      </body></html>
    `;
    downloadFile(
      "organization-permissions.xls",
      html,
      "application/vnd.ms-excel;charset=utf-8;"
    );
  }

  function printTable() {
    setExportOpen(false);
    window.print();
  }

  function toggleColumn(columnKey) {
    setVisibleColumnKeys((prev) => {
      if (prev.includes(columnKey)) {
        if (prev.length === 1) return prev;
        return prev.filter((key) => key !== columnKey);
      }
      return [...prev, columnKey];
    });
  }

  return (
    <section style={styles.panel}>
      <div style={styles.panelHeader}>
        <div>
          <h2 style={styles.panelTitle}>Kabinet icazələri</h2>
          <p style={styles.panelDesc}>
            Hər təşkilat üçün bank kabinetində açıq olacaq bölmələri idarə edin.
          </p>
        </div>
      </div>

      {message ? <div style={styles.messageBox}>{message}</div> : null}

      <div style={styles.filterPanel}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Təşkilat axtar"
          style={styles.input}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={styles.select}
        >
          <option value="all">Bütün kabinetlər</option>
          <option value="cabinet_on">Kabinet aktiv</option>
          <option value="cabinet_off">Kabinet deaktiv</option>
        </select>
      </div>

      <div style={styles.tableToolbar}>
        <div style={styles.resultText}>
          Tapıldı: <strong>{filteredRows.length}</strong> təşkilat
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
          </select>

          <button
            type="button"
            onClick={() => setColumnPanelOpen(true)}
            style={styles.toolbarButton}
          >
            Sütun seç
          </button>

          <div style={styles.exportWrap}>
            <button
              type="button"
              onClick={() => setExportOpen((prev) => !prev)}
              style={styles.toolbarButton}
            >
              Export
            </button>

            {exportOpen ? (
              <div style={styles.exportMenu}>
                <button type="button" onClick={printTable} style={styles.exportMenuItem}>
                  Çap / PDF
                </button>
                <button type="button" onClick={exportCsv} style={styles.exportMenuItem}>
                  CSV
                </button>
                <button type="button" onClick={exportExcel} style={styles.exportMenuItem}>
                  Excel
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

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
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumns.length} style={styles.emptyCell}>
                      İcazələr yüklənir...
                    </td>
                  </tr>
                ) : null}

                {!loading && !visibleRows.length ? (
                  <tr>
                    <td colSpan={visibleColumns.length} style={styles.emptyCell}>
                      Uyğun təşkilat tapılmadı.
                    </td>
                  </tr>
                ) : null}

                {!loading
                  ? visibleRows.map((row) => (
                      <tr key={row.organization_id}>
                        {visibleColumns.map((column) => {
                          if (column.key === "organization") {
                            return (
                              <td key={column.key} style={styles.tdStrong}>
                                {row.organization_name}
                                <div style={styles.cellMeta}>
                                  ID #{row.organization_id}
                                </div>
                              </td>
                            );
                          }

                          if (column.key === "cabinet") {
                            return (
                              <td key={column.key} style={styles.td}>
                                {yesNo(row.cabinet_enabled)}
                              </td>
                            );
                          }

                          if (column.key === "updated_at") {
                            return (
                              <td key={column.key} style={styles.td}>
                                {formatDate(row.updated_at)}
                              </td>
                            );
                          }

                          return (
                            <td key={column.key} style={styles.td}>
                              <label style={styles.switchLabel}>
                                <input
                                  type="checkbox"
                                  checked={!!row[column.key]}
                                  disabled={
                                    savingId ===
                                    `${row.organization_id}-${column.key}`
                                  }
                                  onChange={(event) =>
                                    togglePermission(
                                      row,
                                      column.key,
                                      event.target.checked
                                    )
                                  }
                                />
                                <span>{yesNo(row[column.key])}</span>
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {columnPanelOpen ? (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Sütun seç</h3>
                <p style={styles.modalDesc}>Görünən sütunları idarə edin.</p>
              </div>
              <button
                type="button"
                onClick={() => setColumnPanelOpen(false)}
                style={styles.modalClose}
              >
                x
              </button>
            </div>

            <div style={styles.columnsGrid}>
              {orderedColumnsForPanel.map((column) => (
                <label key={column.key} style={styles.columnOption}>
                  <input
                    type="checkbox"
                    checked={visibleColumnKeys.includes(column.key)}
                    onChange={() => toggleColumn(column.key)}
                  />
                  <span>{column.label}</span>
                </label>
              ))}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setVisibleColumnKeys(DEFAULT_VISIBLE_COLUMNS)}
                style={styles.toolbarButton}
              >
                Sıfırla
              </button>
              <button
                type="button"
                onClick={() => setColumnPanelOpen(false)}
                style={styles.primaryButton}
              >
                Təsdiq et
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const styles = {
  panel: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    marginBottom: "20px",
  },
  panelHeader: {
    marginBottom: "16px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 850,
    color: "#0f172a",
  },
  panelDesc: {
    margin: "7px 0 0",
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
  },
  messageBox: {
    background: "#f8fafc",
    border: "1px solid #dbe4ee",
    borderRadius: "16px",
    padding: "12px 14px",
    marginBottom: "14px",
    fontSize: "14px",
    color: "#334155",
  },
  filterPanel: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
  },
  input: {
    minHeight: "44px",
    borderRadius: "13px",
    border: "1px solid #dbe4ee",
    padding: "0 13px",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  select: {
    minHeight: "44px",
    borderRadius: "13px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    padding: "0 13px",
    fontSize: "14px",
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
    borderRadius: "16px",
    padding: "12px 14px",
    marginBottom: "14px",
  },
  resultText: {
    fontSize: "14px",
    color: "#475569",
  },
  toolbarActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  showLabel: {
    fontSize: "14px",
    color: "#334155",
  },
  smallSelect: {
    minHeight: "38px",
    borderRadius: "11px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    padding: "0 10px",
    fontSize: "13px",
  },
  toolbarButton: {
    minHeight: "38px",
    borderRadius: "11px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 13px",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  primaryButton: {
    minHeight: "38px",
    borderRadius: "11px",
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#ffffff",
    padding: "0 14px",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  exportWrap: {
    position: "relative",
  },
  exportMenu: {
    position: "absolute",
    right: 0,
    top: "44px",
    width: "150px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "6px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
    zIndex: 20,
  },
  exportMenuItem: {
    width: "100%",
    minHeight: "36px",
    border: 0,
    borderRadius: "10px",
    background: "#ffffff",
    textAlign: "left",
    padding: "0 10px",
    fontSize: "13px",
    color: "#334155",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  tableSection: {
    width: "100%",
  },
  tableShell: {
    display: "block",
    maxWidth: "100%",
  },
  tableScroll: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    background: "#ffffff",
  },
  table: {
    tableLayout: "fixed",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "13px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  td: {
    padding: "12px 13px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    color: "#334155",
    fontSize: "14px",
    verticalAlign: "top",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  tdStrong: {
    padding: "12px 13px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 800,
    verticalAlign: "top",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  emptyCell: {
    padding: "18px",
    color: "#64748b",
    fontSize: "14px",
  },
  cellMeta: {
    marginTop: "5px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 500,
  },
  switchLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
    color: "#334155",
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
    borderRadius: "22px",
    border: "1px solid #dbe4ee",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a",
  },
  modalDesc: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },
  modalClose: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    cursor: "pointer",
  },
  columnsGrid: {
    padding: "20px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    overflowY: "auto",
  },
  columnOption: {
    minHeight: "42px",
    border: "1px solid #e2e8f0",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 12px",
    fontSize: "14px",
    color: "#0f172a",
  },
  modalFooter: {
    padding: "16px 20px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },
};

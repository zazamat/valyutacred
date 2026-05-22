"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

const PRODUCT_STATUSES = [
  { value: "draft", label: "Qaralama" },
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Deaktiv" },
  { value: "archived", label: "Arxiv" },
];

const APPROVAL_STATUSES = [
  { value: "pending", label: "Gözləyir" },
  { value: "approved", label: "Təsdiqlənib" },
  { value: "rejected", label: "Rədd edilib" },
];

const ACTIVE_FILTERS = [
  { value: "all", label: "Bütün aktivliklər" },
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Deaktiv" },
];

const COLUMN_STORAGE_KEY = "vabank_products_visible_columns";

const TABLE_COLUMNS = [
  { key: "productName", label: "Məhsul adı", exportable: true, width: 180 },
  { key: "creditForm", label: "Kredit forması", exportable: true, width: 160 },
  { key: "organizationType", label: "Təşkilat növü", exportable: true, width: 150 },
  { key: "organization", label: "Təşkilat", exportable: true, width: 170 },
  { key: "currency", label: "Valyuta", exportable: true, width: 95 },
  { key: "amount", label: "Məbləğ", exportable: true, width: 190 },
  { key: "term", label: "Müddət", exportable: true, width: 145 },
  { key: "interest", label: "Faiz", exportable: true, width: 165 },
  { key: "commission", label: "Komissiya", exportable: true, width: 155 },
  { key: "status", label: "Status", exportable: true, width: 160 },
  { key: "approval", label: "Approval", exportable: true, width: 160 },
  { key: "active", label: "Aktiv", exportable: true, width: 110 },
  { key: "requirements", label: "Şərtlər", exportable: true, width: 280 },
  { key: "action", label: "Əməliyyat", exportable: false, width: 150 },
];

const DEFAULT_VISIBLE_COLUMNS = TABLE_COLUMNS.map((column) => column.key);

const getLabel = (list, value) =>
  list.find((item) => item.value === value)?.label || value || "-";

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("az-AZ").format(Number(value || 0));
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
  };

  return { ...styles.badge, ...(map[value] || map.inactive) };
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getExportColumns(visibleColumns) {
  return visibleColumns.filter((column) => column.exportable);
}

function downloadCsv(rows, columns, getValue) {
  const exportColumns = getExportColumns(columns);
  const headers = exportColumns.map((column) => column.label);
  const body = rows.map((item) => exportColumns.map((column) => getValue(column.key, item)));
  const csv = [headers, ...body]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "vabank-mehsullar.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(rows, columns, getValue) {
  const exportColumns = getExportColumns(columns);
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
                      .map((column) => `<td>${escapeHtml(getValue(column.key, item))}</td>`)
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
  link.download = "vabank-mehsullar.xls";
  link.click();
  URL.revokeObjectURL(url);
}

async function copyRows(rows, columns, getValue, setMessage) {
  const exportColumns = getExportColumns(columns);
  const headers = exportColumns.map((column) => column.label);
  const body = rows.map((item) => exportColumns.map((column) => getValue(column.key, item)));
  const text = [headers, ...body].map((row) => row.join("\t")).join("\n");

  try {
    await navigator.clipboard.writeText(text);
    setMessage("Cədvəl məlumatları kopyalandı.");
  } catch {
    setMessage("Kopyalama alınmadı.");
  }
}

export default function ProductsPage() {
  const tableSectionRef = useRef(null);

  const [creditForms, setCreditForms] = useState([]);
  const [organizationTypes, setOrganizationTypes] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [products, setProducts] = useState([]);
  const [requirementTypes, setRequirementTypes] = useState([]);
  const [productRequirements, setProductRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [creditFormFilter, setCreditFormFilter] = useState("all");
  const [organizationTypeFilter, setOrganizationTypeFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [rowLimit, setRowLimit] = useState("25");
  const [exportOpen, setExportOpen] = useState(false);
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);
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
    loadData();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumnKeys));
    } catch {}
  }, [visibleColumnKeys]);

  useEffect(() => {
    const section = tableSectionRef.current;
    if (!section) return undefined;

    const updateAvailableWidth = () => {
      setTableAvailableWidth(Math.floor(section.getBoundingClientRect().width));
    };

    updateAvailableWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateAvailableWidth);
      return () => window.removeEventListener("resize", updateAvailableWidth);
    }

    const observer = new ResizeObserver(updateAvailableWidth);
    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const [
      formsRes,
      orgTypesRes,
      orgsRes,
      productsRes,
      requirementTypesRes,
      productRequirementsRes,
    ] = await Promise.all([
      supabase.from("credit_forms").select("*").order("id", { ascending: true }),
      supabase.from("organization_types").select("*").order("id", { ascending: true }),
      supabase.from("organizations").select("*").order("id", { ascending: true }),
      supabase.from("products").select("*").order("id", { ascending: false }),
      supabase
        .from("requirement_types")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
      supabase.from("product_requirements").select("*").order("id", { ascending: true }),
    ]);

    const errors = [];

    if (formsRes.error) errors.push("Kredit formaları yüklənmədi: " + formsRes.error.message);
    else setCreditForms(formsRes.data || []);

    if (orgTypesRes.error)
      errors.push("Təşkilat növləri yüklənmədi: " + orgTypesRes.error.message);
    else setOrganizationTypes(orgTypesRes.data || []);

    if (orgsRes.error) errors.push("Təşkilatlar yüklənmədi: " + orgsRes.error.message);
    else setOrganizations(orgsRes.data || []);

    if (productsRes.error) errors.push("Məhsullar yüklənmədi: " + productsRes.error.message);
    else setProducts(productsRes.data || []);

    if (requirementTypesRes.error)
      errors.push("Şərt növləri yüklənmədi: " + requirementTypesRes.error.message);
    else setRequirementTypes(requirementTypesRes.data || []);

    if (productRequirementsRes.error)
      errors.push("Məhsul şərtləri yüklənmədi: " + productRequirementsRes.error.message);
    else setProductRequirements(productRequirementsRes.data || []);

    if (errors.length) setMessage(errors.join(" | "));
    setLoading(false);
  };

  const creditFormMap = useMemo(() => {
    const map = {};
    creditForms.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [creditForms]);

  const typeMap = useMemo(() => {
    const map = {};
    organizationTypes.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [organizationTypes]);

  const orgMap = useMemo(() => {
    const map = {};
    organizations.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [organizations]);

  const requirementsByProductId = useMemo(() => {
    const map = {};
    productRequirements.forEach((item) => {
      if (!map[item.product_id]) map[item.product_id] = [];
      map[item.product_id].push(item);
    });
    return map;
  }, [productRequirements]);

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

  const tableStyle = useMemo(
    () => ({
      ...styles.table,
      width: `${tableWidth}px`,
      minWidth: `${tableWidth}px`,
    }),
    [tableWidth]
  );

  const tableShellWidth = useMemo(() => {
    const visualTableWidth = tableWidth + 4;
    if (!tableAvailableWidth) return visualTableWidth;
    return Math.min(visualTableWidth, tableAvailableWidth);
  }, [tableAvailableWidth, tableWidth]);

  const tableShellStyle = useMemo(
    () => ({
      ...styles.tableShell,
      width: `${tableShellWidth}px`,
    }),
    [tableShellWidth]
  );

  const orderedColumnsForPanel = useMemo(() => {
    const visibleOrdered = visibleColumnKeys
      .map((key) => TABLE_COLUMNS.find((column) => column.key === key))
      .filter(Boolean);

    const hiddenColumns = TABLE_COLUMNS.filter(
      (column) => !visibleColumnKeys.includes(column.key)
    );

    return [...visibleOrdered, ...hiddenColumns];
  }, [visibleColumnKeys]);

  const filteredOrganizations = useMemo(() => {
    if (organizationTypeFilter === "all") return organizations;
    return organizations.filter(
      (item) => String(item.organization_type_id) === String(organizationTypeFilter)
    );
  }, [organizations, organizationTypeFilter]);

  const renderProductCommission = (item) => {
    if (!item.has_commission || item.commission_type === "none") return "Yoxdur";

    if (item.commission_type === "percent") {
      return item.commission_percent !== null && item.commission_percent !== undefined
        ? `${item.commission_percent} %`
        : "-";
    }

    if (item.commission_type === "fixed") {
      return item.commission_amount !== null && item.commission_amount !== undefined
        ? `${formatNumber(item.commission_amount)} ${item.currency || "AZN"}`
        : "-";
    }

    if (Number(item.commission_amount || 0) > 0) {
      return `${formatNumber(item.commission_amount)} ${item.currency || "AZN"}`;
    }

    return "Yoxdur";
  };

  const renderRequirementSummary = (productId) => {
    const relatedRequirements = requirementsByProductId[productId] || [];
    if (!relatedRequirements.length) return "-";

    return relatedRequirements
      .map((req) => {
        const definition = requirementTypes.find((item) => item.id === req.requirement_type_id);
        if (!definition) return null;

        if (req.value_boolean !== null && req.value_boolean !== undefined) {
          return `${definition.name}: ${req.value_boolean ? "Bəli" : "Xeyr"}`;
        }

        if (req.value_number !== null && req.value_number !== undefined) {
          return `${definition.name}: ${req.value_number}${definition.unit ? ` ${definition.unit}` : ""}`;
        }

        if (req.value_text) {
          return `${definition.name}: ${req.value_text}${definition.unit ? ` ${definition.unit}` : ""}`;
        }

        return null;
      })
      .filter(Boolean)
      .join(" | ");
  };

  const getCellValue = (columnKey, item) => {
    const creditForm = creditFormMap[item.credit_form_id]?.name || "-";
    const organizationType = typeMap[item.organization_type_id]?.name || "-";
    const organization = orgMap[item.organization_id]?.name || "-";

    const values = {
      productName: item.product_name || "-",
      creditForm,
      organizationType,
      organization,
      currency: item.currency || "-",
      amount: `${formatNumber(item.min_amount)} - ${formatNumber(item.max_amount)} ${item.currency || "AZN"}`,
      term: `${item.min_term_months ?? "-"} - ${item.max_term_months ?? "-"} ay`,
      interest: `${item.min_interest ?? "-"} / ${item.default_interest ?? "-"} / ${item.max_interest ?? "-"} %`,
      commission: renderProductCommission(item),
      status: getLabel(PRODUCT_STATUSES, item.status),
      approval: getLabel(APPROVAL_STATUSES, item.approval_status),
      active: item.is_active ? "Aktiv" : "Deaktiv",
      requirements: renderRequirementSummary(item.id),
    };

    return values[columnKey] ?? "";
  };

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const query = search.trim().toLowerCase();
      const creditFormName = creditFormMap[item.credit_form_id]?.name || "";
      const organizationName = orgMap[item.organization_id]?.name || "";

      const matchesSearch =
        !query ||
        (item.product_name || "").toLowerCase().includes(query) ||
        organizationName.toLowerCase().includes(query) ||
        creditFormName.toLowerCase().includes(query);

      const matchesCreditForm =
        creditFormFilter === "all" || String(item.credit_form_id) === String(creditFormFilter);

      const matchesOrganizationType =
        organizationTypeFilter === "all" ||
        String(item.organization_type_id) === String(organizationTypeFilter);

      const matchesOrganization =
        organizationFilter === "all" || String(item.organization_id) === String(organizationFilter);

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesApproval =
        approvalFilter === "all" || item.approval_status === approvalFilter;
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" ? item.is_active : !item.is_active);

      return (
        matchesSearch &&
        matchesCreditForm &&
        matchesOrganizationType &&
        matchesOrganization &&
        matchesStatus &&
        matchesApproval &&
        matchesActive
      );
    });
  }, [
    products,
    search,
    creditFormFilter,
    organizationTypeFilter,
    organizationFilter,
    statusFilter,
    approvalFilter,
    activeFilter,
    creditFormMap,
    orgMap,
  ]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, Number(rowLimit)),
    [filteredProducts, rowLimit]
  );

  const toggleColumn = (columnKey) => {
    setVisibleColumnKeys((prev) => {
      if (prev.includes(columnKey)) {
        if (prev.length === 1) return prev;
        return prev.filter((key) => key !== columnKey);
      }

      return [...prev, columnKey];
    });
  };

  const moveColumn = (columnKey, direction) => {
    setVisibleColumnKeys((prev) => {
      const currentIndex = prev.indexOf(columnKey);
      if (currentIndex === -1) return prev;

      const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const next = [...prev];
      const temp = next[currentIndex];
      next[currentIndex] = next[nextIndex];
      next[nextIndex] = temp;

      return next;
    });
  };

  const selectAllColumns = () => {
    setVisibleColumnKeys(DEFAULT_VISIBLE_COLUMNS);
  };

  const resetColumns = () => {
    setVisibleColumnKeys(DEFAULT_VISIBLE_COLUMNS);
  };

  const updateProductStatus = async (item, nextStatus) => {
    if (!nextStatus || nextStatus === item.status) return;

    const { error } = await supabase
      .from("products")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      setMessage("Məhsul statusu dəyişmədi: " + error.message);
      return;
    }

    setMessage("Məhsul statusu yeniləndi.");
    loadData();
  };

  const updateProductApproval = async (item, nextStatus) => {
    if (!nextStatus || nextStatus === item.approval_status) return;

    const { error } = await supabase
      .from("products")
      .update({ approval_status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      setMessage("Approval status dəyişmədi: " + error.message);
      return;
    }

    setMessage("Approval status yeniləndi.");
    loadData();
  };

  const deleteProduct = async (item) => {
    const confirmed = window.confirm(
      `"${item.product_name}" məhsulunu silmək istədiyinizə əminsiniz?`
    );
    if (!confirmed) return;

    const { error } = await supabase.from("products").delete().eq("id", item.id);

    if (error) {
      setMessage("Məhsul silinmədi: " + error.message);
      return;
    }

    setMessage("Məhsul silindi.");
    loadData();
  };

  const renderCell = (columnKey, item) => {
    if (columnKey === "productName") return item.product_name || "-";

    if (columnKey === "status") {
      return (
        <select
          value={item.status || "draft"}
          onChange={(e) => updateProductStatus(item, e.target.value)}
          style={styles.statusSelect}
          aria-label="Product status"
        >
          {PRODUCT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      );
    }

    if (columnKey === "approval") {
      return (
        <select
          value={item.approval_status || "pending"}
          onChange={(e) => updateProductApproval(item, e.target.value)}
          style={styles.statusSelect}
          aria-label="Approval status"
        >
          {APPROVAL_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      );
    }

    if (columnKey === "active") {
      return (
        <span style={getBadgeStyle(item.is_active ? "active" : "inactive")}>
          {item.is_active ? "Aktiv" : "Deaktiv"}
        </span>
      );
    }

    if (columnKey === "requirements") {
      return (
        <span title={renderRequirementSummary(item.id)} style={styles.ellipsisCell}>
          {renderRequirementSummary(item.id)}
        </span>
      );
    }

    if (columnKey === "action") {
      return (
        <div style={styles.actionGroup}>
          <Link href={`/admin/products/settings?edit=${item.id}`} style={styles.editBtn}>
            Edit
          </Link>
          <button type="button" onClick={() => deleteProduct(item)} style={styles.deleteBtn}>
            Sil
          </button>
        </div>
      );
    }

    return getCellValue(columnKey, item) || "-";
  };

  if (loading) {
    return <div style={styles.loadingBox}>Yüklənir...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Məhsullar</h1>
        <p style={styles.subtitle}>
          Məhsulları filterlə, status və approval vəziyyətini idarə et, görünən nəticələri export et.
        </p>
      </div>

      {message ? <div style={styles.messageBox}>{message}</div> : null}

      <div style={styles.filterPanel}>
        <div style={styles.filters}>
          <input
            placeholder="Məhsul, təşkilat və ya kredit forması axtar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />

          <select
            value={creditFormFilter}
            onChange={(e) => setCreditFormFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">Bütün kredit formaları</option>
            {creditForms.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={organizationTypeFilter}
            onChange={(e) => {
              setOrganizationTypeFilter(e.target.value);
              setOrganizationFilter("all");
            }}
            style={styles.select}
          >
            <option value="all">Bütün təşkilat növləri</option>
            {organizationTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={organizationFilter}
            onChange={(e) => setOrganizationFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">Bütün təşkilatlar</option>
            {filteredOrganizations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
            <option value="all">Bütün statuslar</option>
            {PRODUCT_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)} style={styles.select}>
            <option value="all">Bütün approval</option>
            {APPROVAL_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} style={styles.select}>
            {ACTIVE_FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.tableToolbar}>
        <div style={styles.resultText}>
          Tapıldı: <strong>{filteredProducts.length}</strong> məhsul
        </div>

        <div style={styles.toolbarActions}>
          <label style={styles.showLabel}>Göstər</label>
          <select value={rowLimit} onChange={(e) => setRowLimit(e.target.value)} style={styles.smallSelect}>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
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
                    copyRows(visibleProducts, visibleColumns, getCellValue, setMessage);
                  }}
                  style={styles.exportMenuItem}
                >
                  Kopyala
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    downloadCsv(visibleProducts, visibleColumns, getCellValue);
                  }}
                  style={styles.exportMenuItem}
                >
                  CSV
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    downloadExcel(visibleProducts, visibleColumns, getCellValue);
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

      <div ref={tableSectionRef} style={styles.tableSection}>
        <div style={tableShellStyle}>
          <div style={styles.tableScroll}>
            <table style={tableStyle}>
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
                {visibleProducts.map((item) => (
                  <tr key={item.id}>
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        style={column.key === "productName" ? styles.tdStrong : styles.td}
                      >
                        {renderCell(column.key, item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!visibleProducts.length ? <div style={styles.emptyBox}>Uyğun məhsul tapılmadı.</div> : null}
        </div>
      </div>

      {columnPanelOpen ? (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Sütun seçimi</h2>
                <p style={styles.modalSubtitle}>
                  Məhsullar cədvəlində görünəcək sütunları seçin və sıralayın.
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
                        disabled={!isVisible || visibleIndex === visibleColumnKeys.length - 1}
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
  filterPanel: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "22px",
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
  tableToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "18px",
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
    borderRadius: "20px",
    background: "#ffffff",
  },
  table: {
    tableLayout: "fixed",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "13px 14px",
    background: "#f8fafc",
    fontSize: "13px",
    fontWeight: 700,
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  td: {
    padding: "12px 14px",
    fontSize: "14px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "#334155",
  },
  tdStrong: {
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: 700,
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "#0f172a",
  },
  ellipsisCell: {
    display: "inline-block",
    maxWidth: "260px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    verticalAlign: "bottom",
  },
  badge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 600,
    display: "inline-block",
  },
  statusSelect: {
    minHeight: "38px",
    minWidth: "132px",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 10px",
    fontSize: "13px",
    fontWeight: 600,
    outline: "none",
    fontFamily: "inherit",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  editBtn: {
    minHeight: "36px",
    borderRadius: "11px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 12px",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    minHeight: "36px",
    borderRadius: "11px",
    border: "1px solid #fecaca",
    background: "#ffffff",
    color: "#b91c1c",
    padding: "0 12px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
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
    borderRadius: "24px",
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
    fontSize: "28px",
    lineHeight: 1,
    cursor: "pointer",
    color: "#64748b",
    flexShrink: 0,
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
    borderRadius: "14px",
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
  modalFooter: {
    padding: "18px 22px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    flexShrink: 0,
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

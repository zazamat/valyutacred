"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { labelFor } from "../../lib/labels";
import { useOrganizationPermissions } from "./_components/OrganizationPermissionsContext";
import {
  EmptyState,
  PageHeader,
  SectionPanel,
  pageStyles,
} from "./_components/OrganizationPlaceholders";

const MATCH_SELECT = `
  id,
  application_id,
  source,
  visibility_status,
  lead_fee_status,
  success_fee_status,
  monetization_model,
  matched_at,
  assigned_at,
  applications (
    id,
    referral_id,
    created_at,
    full_name,
    credit_type,
    amount,
    status,
    credit_result_status,
    lead_fee_amount,
    success_fee_amount
  )
`;

const TRANSACTION_SELECT = `
  id,
  transaction_type,
  amount,
  direction,
  status,
  created_at
`;

function normalizeRows(matches) {
  return matches.map((match) => {
    const application = Array.isArray(match.applications)
      ? match.applications[0]
      : match.applications;

    return { ...match, application: application || null };
  });
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "0 AZN";
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

function isCurrentMonth(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getStatusTone(status) {
  if (status === "approved" || status === "disbursed" || status === "sent") {
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

function buildDonutGradient(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (!total) return "#f1f5f9";

  let cursor = 0;
  const stops = items
    .filter((item) => item.value > 0)
    .map((item) => {
      const start = cursor;
      const end = cursor + (item.value / total) * 100;
      cursor = end;
      return `${item.color} ${start}% ${end}%`;
    });

  return `conic-gradient(${stops.join(", ")})`;
}

function buildApplicationTrend(matches) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    return { key: dateKey(date), label: formatDayLabel(date), value: 0 };
  });
  const lookup = new Map(days.map((item) => [item.key, item]));

  matches.forEach((match) => {
    const rawDate = match.application?.created_at || match.assigned_at || match.matched_at;
    const date = rawDate ? startOfDay(new Date(rawDate)) : null;
    if (!date || Number.isNaN(date.getTime())) return;

    const item = lookup.get(dateKey(date));
    if (item) item.value += 1;
  });

  return days;
}

function sumTransactions(transactions, predicate) {
  return transactions
    .filter(predicate)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function MiniBarChart({ items, emptyTitle, emptyDesc }) {
  const max = Math.max(...items.map((item) => item.value), 0);

  if (!max) {
    return (
      <div style={styles.chartEmpty}>
        <strong>{emptyTitle}</strong>
        <span>{emptyDesc}</span>
      </div>
    );
  }

  return (
    <div style={styles.barChart}>
      {items.map((item) => {
        const height = Math.max(8, Math.round((item.value / max) * 100));
        return (
          <div key={item.key || item.label} style={styles.barItem} title={`${item.label}: ${item.value}`}>
            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  height: `${height}%`,
                  background: item.color || "#16a34a",
                }}
              />
            </div>
            <span>{item.shortLabel || item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function OrganizationDashboardPage() {
  const { organization, hasPermission } = useOrganizationPermissions();
  const canViewApplications = hasPermission("can_view_applications");
  const canViewBalance = hasPermission("can_view_balance");
  const [matches, setMatches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!canViewApplications && !canViewBalance) {
      setLoading(false);
      return;
    }

    if (canViewBalance && !organization?.id) return;

    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setErrorMessage("");

      const matchesQuery = canViewApplications
        ? supabase
            .from("application_organization_matches")
            .select(MATCH_SELECT)
            .in("source", ["only_selected", "admin_assigned"])
            .eq("visibility_status", "assigned")
            .order("matched_at", { ascending: false })
        : Promise.resolve({ data: [], error: null });

      const transactionsQuery = canViewBalance
        ? supabase
            .from("organization_balance_transactions")
            .select(TRANSACTION_SELECT)
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null });

      const [matchesRes, transactionsRes] = await Promise.all([
        matchesQuery,
        transactionsQuery,
      ]);

      if (!active) return;

      if (matchesRes.error) {
        setMatches([]);
        setTransactions(transactionsRes.data || []);
        setErrorMessage("Dashboard məlumatları yüklənmədi: " + matchesRes.error.message);
        setLoading(false);
        return;
      }

      if (transactionsRes.error) {
        setMatches(normalizeRows(matchesRes.data || []));
        setTransactions([]);
        setErrorMessage("Balans əməliyyatları yüklənmədi: " + transactionsRes.error.message);
        setLoading(false);
        return;
      }

      setMatches(normalizeRows(matchesRes.data || []));
      setTransactions(transactionsRes.data || []);
      setLoading(false);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [canViewApplications, canViewBalance, organization?.id]);

  const dashboard = useMemo(() => {
    const spentThisMonth = transactions
      .filter(
        (item) =>
          item.direction === "debit" &&
          item.status === "completed" &&
          isCurrentMonth(item.created_at)
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      newApplications: matches.filter((item) => item.application?.status === "new").length,
      inReview: matches.filter((item) =>
        ["reviewing", "processing", "under_review"].includes(item.application?.status) ||
        ["pending", "under_review"].includes(item.application?.credit_result_status)
      ).length,
      approved: matches.filter(
        (item) => item.application?.credit_result_status === "approved"
      ).length,
      rejected: matches.filter(
        (item) => item.application?.credit_result_status === "rejected"
      ).length,
      disbursed: matches.filter(
        (item) => item.application?.credit_result_status === "disbursed"
      ).length,
      spentThisMonth,
      balance: organization?.balance ?? 0,
    };
  }, [matches, transactions, organization]);

  const stats = [
    {
      title: "Yeni müraciətlər",
      value: loading ? "-" : dashboard.newApplications,
      desc: "Yeni daxil olan müraciətlər",
      color: "#16a34a",
    },
    {
      title: "Baxılır",
      value: loading ? "-" : dashboard.inReview,
      desc: "Hazırda bank baxışında",
      color: "#f59e0b",
    },
    {
      title: "Cari balans",
      value: canViewBalance ? formatMoney(dashboard.balance) : "-",
      desc: canViewBalance ? "Təşkilat balansı" : "Balans üçün icazə tələb olunur",
      color: "#2563eb",
    },
    {
      title: "Bu ay xərclənib",
      value: loading ? "-" : formatMoney(dashboard.spentThisMonth),
      desc: "Tamamlanmış məxaric balans əməliyyatlarına əsasən hesablanır.",
      color: "#0f766e",
    },
  ];

  const recentMatches = matches.slice(0, 6);
  const completedDebitCount = transactions.filter(
    (item) => item.direction === "debit" && item.status === "completed"
  ).length;
  const pendingDebitCount = transactions.filter(
    (item) => item.direction === "debit" && item.status === "pending"
  ).length;
  const statusChart = [
    { key: "new", label: "Yeni", value: dashboard.newApplications, color: "#16a34a" },
    { key: "review", label: "Baxılır", value: dashboard.inReview, color: "#f59e0b" },
    {
      key: "approved",
      label: "Təsdiqlənib",
      value: dashboard.approved + dashboard.disbursed,
      color: "#2563eb",
    },
    { key: "rejected", label: "Rədd edilib", value: dashboard.rejected, color: "#dc2626" },
  ];
  const statusTotal = statusChart.reduce((sum, item) => sum + item.value, 0);
  const trend = buildApplicationTrend(matches);
  const trendPreview = trend.map((item, index) => ({
    ...item,
    shortLabel: index % 5 === 0 || index === trend.length - 1 ? item.label : "",
    color: item.value ? "#16a34a" : "#cbd5e1",
  }));
  const expenseChart = [
    {
      key: "lead_fee",
      label: "Lead haqqı",
      value: sumTransactions(
        transactions,
        (item) => item.transaction_type === "lead_fee" && item.direction === "debit" && item.status === "completed"
      ),
      color: "#16a34a",
    },
    {
      key: "success_fee",
      label: "Uğur komissiyası",
      value: sumTransactions(
        transactions,
        (item) => item.transaction_type === "success_fee" && item.direction === "debit" && item.status === "completed"
      ),
      color: "#2563eb",
    },
    {
      key: "manual_adjustment",
      label: "Manual düzəliş",
      value: sumTransactions(
        transactions,
        (item) =>
          item.transaction_type === "manual_adjustment" &&
          item.direction === "debit" &&
          item.status === "completed"
      ),
      color: "#64748b",
    },
  ];
  const expenseTotal = expenseChart.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      <PageHeader
        kicker="Bank kabineti"
        title="Dashboard"
        subtitle="Müraciətlər, kredit nəticələri, komissiya xərcləri və balans üzrə gündəlik baxış."
      />

      {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}

      <section style={pageStyles.section}>
        <div style={styles.kpiGrid}>
          {stats.map((item) => (
            <div key={item.title} style={styles.visualKpi}>
              <span style={{ ...styles.kpiAccent, background: item.color }} />
              <div>
                <div style={styles.kpiTitle}>{item.title}</div>
                <div style={styles.kpiValue}>{item.value}</div>
                {item.desc ? <div style={styles.kpiDesc}>{item.desc}</div> : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.visualGrid}>
        <SectionPanel
          title="Müraciət statusları"
          desc="Yeni, baxışda olan və nəticələnmiş müraciətlərin bölgüsü."
        >
          <div style={styles.donutWrap}>
            <div
              style={{
                ...styles.donut,
                background: buildDonutGradient(statusChart),
              }}
            >
              <div style={styles.donutInner}>
                <strong>{statusTotal}</strong>
                <span>müraciət</span>
              </div>
            </div>
            <div style={styles.legendList}>
              {statusChart.map((item) => (
                <div key={item.key} style={styles.legendRow}>
                  <span style={{ ...styles.legendDot, background: item.color }} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </SectionPanel>

        <SectionPanel
          title="Son 30 gün trendi"
          desc="Bankınıza yönləndirilən müraciətlərin gündəlik dinamikası."
        >
          <MiniBarChart
            items={trendPreview}
            emptyTitle="Son 30 gündə müraciət yoxdur"
            emptyDesc="Yeni müraciətlər gəldikcə trend avtomatik dolacaq."
          />
        </SectionPanel>

        <SectionPanel
          title="Komissiya xülasəsi"
          desc="Tamamlanmış məxaric əməliyyatlarının tip üzrə bölgüsü."
        >
          <div style={styles.expenseSummary}>
            <div style={styles.expenseTotal}>
              <span>Ümumi xərc</span>
              <strong>{formatMoney(expenseTotal)}</strong>
            </div>
            <MiniBarChart
              items={expenseChart.map((item) => ({
                ...item,
                shortLabel: item.label.split(" ")[0],
              }))}
              emptyTitle="Xərc əməliyyatı yoxdur"
              emptyDesc="Lead haqqı və uğur komissiyası yarandıqca qrafik dolacaq."
            />
          </div>
        </SectionPanel>
      </section>

      <section style={pageStyles.bottomGrid}>
        <SectionPanel
          title="Son müraciətlər"
          desc="Bankınıza yönləndirilmiş ən son müraciətlər."
        >
          {loading ? <div style={styles.stateBox}>Məlumatlar yüklənir...</div> : null}

          {!loading && !recentMatches.length ? (
            <EmptyState
              title="Hələ müraciət yoxdur"
              desc="Bankınıza müraciət təyin edildikdən sonra siyahı burada görünəcək."
            />
          ) : null}

          {!loading && recentMatches.length ? (
            <div style={styles.list}>
              {recentMatches.map((match) => {
                const app = match.application || {};
                return (
                  <Link
                    key={match.id}
                    href={`/organization/applications/${app.id}`}
                    style={styles.recentItem}
                  >
                    <div style={styles.recentMain}>
                      <div style={styles.recentTitle}>{app.full_name || "Müştəri"}</div>
                      <div style={styles.recentMeta}>
                        {app.referral_id || `Müraciət #${app.id}`} · {app.credit_type || "-"} · {formatMoney(app.amount)}
                      </div>
                    </div>
                    <div style={styles.recentSide}>
                      <span style={{ ...styles.badge, ...getStatusTone(app.credit_result_status || app.status) }}>
                        {labelFor(app.credit_result_status || app.status)}
                      </span>
                      <span style={styles.dateText}>{formatDate(match.assigned_at || match.matched_at)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </SectionPanel>

        <SectionPanel
          title="Balans xülasəsi"
          desc="Xərclər balans əməliyyatları tarixçəsindən hesablanır."
        >
          <div style={styles.feeList}>
            <div style={styles.feeRow}>
              <span>Tamamlanmış məxaric əməliyyatları</span>
              <strong>{completedDebitCount}</strong>
            </div>
            <div style={styles.feeRow}>
              <span>Gözləyən məxaric əməliyyatları</span>
              <strong>{pendingDebitCount}</strong>
            </div>
            <div style={styles.feeRow}>
              <span>Əsas monetizasiya modeli</span>
              <strong>{labelFor(organization?.monetization_model)}</strong>
            </div>
          </div>
        </SectionPanel>
      </section>
    </div>
  );
}

const styles = {
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  visualKpi: {
    minHeight: "132px",
    borderRadius: "8px",
    border: "1px solid #dbe7df",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 58%, #ecfdf5 100%)",
    padding: "18px",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "flex-start",
  },
  kpiAccent: {
    position: "absolute",
    inset: "0 auto 0 0",
    width: "5px",
  },
  kpiTitle: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 750,
  },
  kpiValue: {
    marginTop: "8px",
    color: "#0f172a",
    fontSize: "28px",
    lineHeight: 1.1,
    fontWeight: 900,
  },
  kpiDesc: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.45,
  },
  visualGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
    marginBottom: "18px",
  },
  donutWrap: {
    display: "grid",
    gridTemplateColumns: "132px minmax(0, 1fr)",
    alignItems: "center",
    gap: "18px",
  },
  donut: {
    width: "132px",
    height: "132px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.06)",
  },
  donutInner: {
    width: "78px",
    height: "78px",
    borderRadius: "50%",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
    color: "#0f172a",
    fontSize: "12px",
  },
  legendList: {
    display: "grid",
    gap: "9px",
  },
  legendRow: {
    minHeight: "34px",
    borderRadius: "8px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    display: "grid",
    gridTemplateColumns: "10px 1fr auto",
    alignItems: "center",
    gap: "9px",
    padding: "0 10px",
    color: "#334155",
    fontSize: "13px",
  },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  barChart: {
    minHeight: "176px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(8px, 1fr))",
    alignItems: "end",
    gap: "5px",
    paddingTop: "8px",
  },
  barItem: {
    minWidth: 0,
    display: "grid",
    gridTemplateRows: "132px 22px",
    alignItems: "end",
    gap: "8px",
    color: "#64748b",
    fontSize: "10px",
    textAlign: "center",
  },
  barTrack: {
    height: "132px",
    borderRadius: "8px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: "8px 8px 0 0",
    transition: "height 160ms ease",
  },
  chartEmpty: {
    minHeight: "176px",
    borderRadius: "8px",
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    color: "#64748b",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: "6px",
    textAlign: "center",
    padding: "20px",
    fontSize: "13px",
  },
  expenseSummary: {
    display: "grid",
    gap: "14px",
  },
  expenseTotal: {
    minHeight: "62px",
    borderRadius: "8px",
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    color: "#166534",
  },
  errorBox: {
    minHeight: "70px",
    borderRadius: "14px",
    border: "1px solid #fecaca",
    background: "#fff7f7",
    padding: "16px",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: 650,
    marginBottom: "18px",
  },
  stateBox: {
    minHeight: "80px",
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
  list: {
    display: "grid",
    gap: "10px",
  },
  recentItem: {
    minHeight: "74px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    textDecoration: "none",
  },
  recentMain: {
    minWidth: 0,
  },
  recentTitle: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#0f172a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  recentMeta: {
    marginTop: "5px",
    fontSize: "13px",
    color: "#64748b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  recentSide: {
    display: "grid",
    justifyItems: "end",
    gap: "6px",
    flexShrink: 0,
  },
  dateText: {
    fontSize: "12px",
    color: "#64748b",
  },
  badge: {
    display: "inline-flex",
    minHeight: "28px",
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
  feeList: {
    display: "grid",
    gap: "10px",
  },
  feeRow: {
    minHeight: "54px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    color: "#334155",
    fontSize: "14px",
  },
};

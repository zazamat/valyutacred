"use client";

import { useEffect, useMemo, useState } from "react";
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
  StatCard,
  pageStyles,
} from "../_components/OrganizationPlaceholders";

const TRANSACTION_SELECT = `
  id,
  organization_id,
  application_id,
  referral_id,
  transaction_type,
  amount,
  direction,
  balance_before,
  balance_after,
  description,
  source,
  status,
  created_at
`;

function formatMoney(value) {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isCurrentMonth(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("az-AZ", {
    month: "short",
  }).format(date);
}

function sumTransactions(transactions, predicate) {
  return transactions
    .filter(predicate)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function buildExpenseTrend(transactions) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: monthKey(date),
      label: formatMonthLabel(date),
      value: 0,
      color: "#16a34a",
    };
  });
  const lookup = new Map(months.map((item) => [item.key, item]));

  transactions.forEach((item) => {
    if (item.direction !== "debit" || item.status !== "completed") return;
    const date = item.created_at ? new Date(item.created_at) : null;
    if (!date || Number.isNaN(date.getTime())) return;

    const bucket = lookup.get(monthKey(date));
    if (bucket) bucket.value += Number(item.amount || 0);
  });

  return months;
}

function getTone(value) {
  if (value === "credit" || value === "completed") return styles.badgeSuccess;
  if (value === "debit" || value === "pending") return styles.badgeWarning;
  if (value === "cancelled" || value === "refunded") return styles.badgeDanger;
  return styles.badgeNeutral;
}

function MiniBarChart({ items, emptyTitle, emptyDesc, money = false }) {
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
        const titleValue = money ? formatMoney(item.value) : item.value;
        return (
          <div key={item.key || item.label} style={styles.barItem} title={`${item.label}: ${titleValue}`}>
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

export default function OrganizationBalancePage() {
  const { organization, hasPermission } = useOrganizationPermissions();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!hasPermission("can_view_balance")) {
      setLoading(false);
      return;
    }

    if (!organization?.id) return;

    let active = true;

    async function loadBalance() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("organization_balance_transactions")
        .select(TRANSACTION_SELECT)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!active) return;

      if (error) {
        setTransactions([]);
        setErrorMessage("Balans əməliyyatları yüklənmədi: " + error.message);
        setLoading(false);
        return;
      }

      setTransactions(data || []);
      setLoading(false);
    }

    loadBalance();

    return () => {
      active = false;
    };
  }, [hasPermission, organization?.id]);

  const summary = useMemo(() => {
    const spentThisMonth = transactions
      .filter(
        (item) =>
          item.direction === "debit" &&
          item.status === "completed" &&
          isCurrentMonth(item.created_at)
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const blocked = transactions
      .filter((item) => item.direction === "debit" && item.status === "pending")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      balance: organization?.balance ?? 0,
      spentThisMonth,
      blocked,
    };
  }, [transactions, organization]);

  const expenseDistribution = useMemo(
    () => [
      {
        key: "lead_fee",
        label: labelFor("lead_fee"),
        shortLabel: "Lead",
        value: sumTransactions(
          transactions,
          (item) => item.transaction_type === "lead_fee" && item.direction === "debit" && item.status === "completed"
        ),
        color: "#16a34a",
      },
      {
        key: "success_fee",
        label: labelFor("success_fee"),
        shortLabel: "Uğur",
        value: sumTransactions(
          transactions,
          (item) => item.transaction_type === "success_fee" && item.direction === "debit" && item.status === "completed"
        ),
        color: "#2563eb",
      },
      {
        key: "manual_adjustment",
        label: labelFor("manual_adjustment"),
        shortLabel: "Düzəliş",
        value: sumTransactions(
          transactions,
          (item) =>
            item.transaction_type === "manual_adjustment" &&
            item.direction === "debit" &&
            item.status === "completed"
        ),
        color: "#64748b",
      },
      {
        key: "refund",
        label: labelFor("refund"),
        shortLabel: "Geri",
        value: sumTransactions(
          transactions,
          (item) => item.transaction_type === "refund" && item.status === "completed"
        ),
        color: "#0f766e",
      },
    ],
    [transactions]
  );
  const expenseTrend = useMemo(() => buildExpenseTrend(transactions), [transactions]);
  const expenseTotal = expenseDistribution.reduce((sum, item) => sum + item.value, 0);

  if (!hasPermission("can_view_balance")) {
    return <PermissionDenied />;
  }

  return (
    <div>
      <PageHeader
        kicker="Maliyyə"
        title="Balans"
        subtitle="Cari balans, bu ay üzrə xərclər və balans əməliyyatları üzrə tarixçə."
      />

      {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}

      <section style={pageStyles.section}>
        <div style={pageStyles.cardsGrid}>
          <StatCard
            title="Cari balans"
            value={loading ? "-" : formatMoney(summary.balance)}
            desc="Təşkilatın cari balans göstəricisi."
          />
          <StatCard
            title="Bu ay xərclənib"
            value={loading ? "-" : formatMoney(summary.spentThisMonth)}
            desc="Bu ay tamamlanmış məxaric əməliyyatlarının cəmi."
          />
          <StatCard
            title="Bloklanmış məbləğ"
            value={loading ? "-" : formatMoney(summary.blocked)}
            desc="Gözləyən məxaric əməliyyatları üzrə bloklanmış məbləğ."
          />
        </div>
      </section>

      <section style={styles.visualGrid}>
        <SectionPanel
          title="Xərclərin bölgüsü"
          desc="Tamamlanmış əməliyyatlar tip üzrə qruplaşdırılır."
        >
          <div style={styles.chartHeader}>
            <div>
              <span>Ümumi aktivlik</span>
              <strong>{formatMoney(expenseTotal)}</strong>
            </div>
          </div>
          <MiniBarChart
            items={expenseDistribution}
            money
            emptyTitle="Bu dövr üzrə xərc əməliyyatı yoxdur"
            emptyDesc="Əməliyyatlar yarandıqca qrafiklər avtomatik dolacaq."
          />
        </SectionPanel>

        <SectionPanel
          title="Son 6 ay xərc trendi"
          desc="Tamamlanmış məxaric əməliyyatlarının aylıq dinamikası."
        >
          <MiniBarChart
            items={expenseTrend}
            money
            emptyTitle="Bu dövr üzrə xərc əməliyyatı yoxdur"
            emptyDesc="Əməliyyatlar yarandıqca qrafiklər avtomatik dolacaq."
          />
        </SectionPanel>
      </section>

      <SectionPanel
        title="Son əməliyyatlar"
        desc="Balans artırmaları, lead haqqı, uğur komissiyası, bloklama və geri ödəniş əməliyyatları."
      >
        {loading ? <div style={styles.stateBox}>Balans əməliyyatları yüklənir...</div> : null}

        {!loading && !transactions.length ? (
          <EmptyState
            title="Balans əməliyyatları hələ yoxdur"
            desc="Lead haqqı, uğur komissiyası və balans artırmaları aktivləşdikdən sonra əməliyyatlar burada görünəcək."
          />
        ) : null}

        {!loading && transactions.length ? (
          <div style={styles.tableShell}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Tarix</th>
                  <th style={styles.th}>Tip</th>
                  <th style={styles.th}>Referral ID</th>
                  <th style={styles.th}>Təsvir</th>
                  <th style={styles.th}>İstiqamət</th>
                  <th style={styles.thRight}>Məbləğ</th>
                  <th style={styles.thRight}>Əvvəlki balans</th>
                  <th style={styles.thRight}>Son balans</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{formatDate(item.created_at)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...styles.badgeNeutral }}>
                        {labelFor(item.transaction_type)}
                      </span>
                    </td>
                    <td style={styles.tdStrong}>
                      {item.referral_id || (item.application_id ? `#${item.application_id}` : "-")}
                    </td>
                    <td style={styles.td}>{item.description || labelFor(item.source)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...getTone(item.direction) }}>
                        {labelFor(item.direction)}
                      </span>
                    </td>
                    <td style={styles.tdRight}>{formatMoney(item.amount)}</td>
                    <td style={styles.tdRight}>{formatMoney(item.balance_before)}</td>
                    <td style={styles.tdRight}>{formatMoney(item.balance_after)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...getTone(item.status) }}>
                        {labelFor(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </SectionPanel>
    </div>
  );
}

const styles = {
  visualGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
    marginBottom: "18px",
  },
  chartHeader: {
    minHeight: "68px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%)",
    border: "1px solid #dbeafe",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#0f172a",
    marginBottom: "14px",
  },
  barChart: {
    minHeight: "184px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(36px, 1fr))",
    alignItems: "end",
    gap: "10px",
    paddingTop: "8px",
  },
  barItem: {
    minWidth: 0,
    display: "grid",
    gridTemplateRows: "132px 24px",
    alignItems: "end",
    gap: "8px",
    color: "#64748b",
    fontSize: "11px",
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
    minHeight: "184px",
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
    minHeight: "76px",
    borderRadius: "14px",
    border: "1px solid #fecaca",
    background: "#fff7f7",
    padding: "18px",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: 650,
    lineHeight: 1.55,
    marginBottom: "18px",
  },
  tableShell: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    background: "#ffffff",
  },
  table: {
    width: "100%",
    minWidth: "1180px",
    tableLayout: "fixed",
    borderCollapse: "collapse",
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
  },
  thRight: {
    textAlign: "right",
    padding: "14px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    color: "#334155",
    fontSize: "14px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  tdStrong: {
    padding: "14px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  tdRight: {
    padding: "14px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 800,
    textAlign: "right",
    whiteSpace: "nowrap",
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
  badgeNeutral: {
    background: "#f8fafc",
    color: "#475569",
    border: "1px solid #e2e8f0",
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
};

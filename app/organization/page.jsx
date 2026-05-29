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
  StatCard,
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
    { title: "Yeni müraciətlər", value: loading ? "-" : dashboard.newApplications },
    { title: "Baxılır", value: loading ? "-" : dashboard.inReview },
    { title: "Təsdiqlənib", value: loading ? "-" : dashboard.approved },
    { title: "Rədd edilib", value: loading ? "-" : dashboard.rejected },
    { title: "Kredit verilib", value: loading ? "-" : dashboard.disbursed },
    {
      title: "Bu ay xərclənib",
      value: loading ? "-" : formatMoney(dashboard.spentThisMonth),
      desc: "Tamamlanmış məxaric balans əməliyyatlarına əsasən hesablanır.",
    },
    {
      title: "Cari balans",
      value: canViewBalance ? formatMoney(dashboard.balance) : "-",
      desc: canViewBalance ? "Təşkilat balansı." : "Balans üçün icazə tələb olunur.",
    },
  ];

  const recentMatches = matches.slice(0, 6);
  const completedDebitCount = transactions.filter(
    (item) => item.direction === "debit" && item.status === "completed"
  ).length;
  const pendingDebitCount = transactions.filter(
    (item) => item.direction === "debit" && item.status === "pending"
  ).length;

  return (
    <div>
      <PageHeader
        kicker="Bank kabineti"
        title="Dashboard"
        subtitle="Müraciətlər, kredit nəticələri, komissiya xərcləri və balans üzrə gündəlik baxış."
      />

      {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}

      <section style={pageStyles.section}>
        <div style={pageStyles.cardsGrid}>
          {stats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>
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

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

const MATCH_SELECT = `
  id,
  lead_fee_status,
  success_fee_status,
  monetization_model,
  matched_at,
  assigned_at,
  applications (
    id,
    referral_id,
    full_name,
    lead_fee_amount,
    success_fee_amount,
    credit_result_status
  )
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

function chargeAmount(match) {
  const app = match.application || {};
  const leadAmount =
    match.lead_fee_status === "charged" || match.lead_fee_status === "paid"
      ? Number(app.lead_fee_amount || 0)
      : 0;
  const successAmount =
    match.success_fee_status === "calculated" ||
    match.success_fee_status === "invoiced" ||
    match.success_fee_status === "paid"
      ? Number(app.success_fee_amount || 0)
      : 0;

  return leadAmount + successAmount;
}

export default function OrganizationBalancePage() {
  const { organization, hasPermission } = useOrganizationPermissions();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!hasPermission("can_view_balance")) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadBalance() {
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
        setErrorMessage("Balans məlumatları yüklənmədi: " + error.message);
        setLoading(false);
        return;
      }

      setMatches(normalizeRows(data || []));
      setLoading(false);
    }

    loadBalance();

    return () => {
      active = false;
    };
  }, [hasPermission]);

  const summary = useMemo(() => {
    const now = new Date();
    const thisMonthMatches = matches.filter((match) => {
      const date = new Date(match.assigned_at || match.matched_at || "");
      return (
        !Number.isNaN(date.getTime()) &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
    const spentThisMonth = thisMonthMatches.reduce(
      (sum, match) => sum + chargeAmount(match),
      0
    );
    const blocked = matches
      .filter((match) => match.success_fee_status === "pending")
      .reduce((sum, match) => sum + Number(match.application?.success_fee_amount || 0), 0);

    return {
      balance: organization?.balance ?? 0,
      spentThisMonth,
      blocked,
    };
  }, [matches, organization]);

  const transactions = useMemo(() => {
    return matches
      .map((match) => {
        const amount = chargeAmount(match);
        if (!amount) return null;
        return {
          id: match.id,
          date: match.assigned_at || match.matched_at,
          title: match.application?.referral_id || `Müraciət #${match.application?.id}`,
          customer: match.application?.full_name || "-",
          model: labelFor(match.monetization_model),
          amount,
        };
      })
      .filter(Boolean)
      .slice(0, 8);
  }, [matches]);

  if (!hasPermission("can_view_balance")) {
    return <PermissionDenied />;
  }

  return (
    <div>
      <PageHeader
        kicker="Maliyyə"
        title="Balans"
        subtitle="Cari balans, bu ay üzrə xərclər və müraciətlərə bağlı komissiya hərəkətləri."
      />

      {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}

      <section style={pageStyles.section}>
        <div style={pageStyles.cardsGrid}>
          <StatCard
            title="Cari balans"
            value={loading ? "-" : formatMoney(summary.balance)}
            desc="Admin panelində təyin edilmiş təşkilat balansı."
          />
          <StatCard
            title="Bu ay xərclənib"
            value={loading ? "-" : formatMoney(summary.spentThisMonth)}
            desc="Bu ay tutulmuş lead və uğur komissiyaları."
          />
          <StatCard
            title="Bloklanmış məbləğ"
            value={loading ? "-" : formatMoney(summary.blocked)}
            desc="Nəticəsi gözlənən uğur komissiyası məbləğləri."
          />
        </div>
      </section>

      <SectionPanel
        title="Son əməliyyatlar"
        desc="Müraciətlər üzrə komissiya tutulmaları burada görünür."
      >
        {loading ? <div style={styles.stateBox}>Balans məlumatları yüklənir...</div> : null}

        {!loading && !transactions.length ? (
          <EmptyState
            title="Balans əməliyyatları hələ yoxdur"
            desc="Balans əməliyyatları aktivləşdirildikdən sonra xərclər burada görünəcək."
          />
        ) : null}

        {!loading && transactions.length ? (
          <div style={styles.tableShell}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Tarix</th>
                  <th style={styles.th}>Müraciət</th>
                  <th style={styles.th}>Müştəri</th>
                  <th style={styles.th}>Model</th>
                  <th style={styles.thRight}>Məbləğ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{formatDate(item.date)}</td>
                    <td style={styles.tdStrong}>{item.title}</td>
                    <td style={styles.td}>{item.customer}</td>
                    <td style={styles.td}>{item.model}</td>
                    <td style={styles.tdRight}>{formatMoney(item.amount)}</td>
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
    minWidth: "780px",
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
  },
  thRight: {
    textAlign: "right",
    padding: "14px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
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
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 800,
    textAlign: "right",
    whiteSpace: "nowrap",
  },
};

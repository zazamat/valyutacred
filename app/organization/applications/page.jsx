"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  EmptyState,
  PageHeader,
  SectionPanel,
} from "../_components/OrganizationPlaceholders";

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
    credit_result_status
  )
`;

const CUSTOMER_TYPE_LABELS = {
  individual: "Ferdi",
  business: "Biznes",
};

const STATUS_LABELS = {
  new: "Yeni",
  reviewing: "Baxilir",
  processing: "Baxilir",
  approved: "Tesdiqlendi",
  sent: "Tesdiqlendi",
  rejected: "Redd edildi",
};

const CREDIT_RESULT_LABELS = {
  pending: "Gozleyir",
  under_review: "Baxilir",
  approved: "Tesdiqlenib",
  rejected: "Imtina edilib",
  customer_declined: "Musteri imtina edib",
  disbursed: "Kredit verilib",
  expired: "Muddeti bitib",
  unknown: "Melum deyil",
};

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

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "-";
}

function getCreditResultLabel(status) {
  return CREDIT_RESULT_LABELS[status] || status || "-";
}

function getStatusStyle(status) {
  if (status === "approved" || status === "sent") {
    return styles.badgeSuccess;
  }

  if (status === "rejected") {
    return styles.badgeDanger;
  }

  if (status === "reviewing" || status === "processing") {
    return styles.badgeWarning;
  }

  return styles.badgeInfo;
}

function normalizeRows(matches) {
  return matches.map((match) => {
    const application = Array.isArray(match.applications)
      ? match.applications[0]
      : match.applications;

    return {
      ...match,
      application: application || null,
    };
  });
}

export default function OrganizationApplicationsPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
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
        setErrorMessage("Muracietler yuklenmedi: " + error.message);
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
  }, []);

  const summary = useMemo(() => {
    const assigned = matches.length;
    const pending = matches.filter(
      (item) => item.application?.credit_result_status === "pending"
    ).length;

    return { assigned, pending };
  }, [matches]);

  return (
    <div>
      <PageHeader
        kicker="Muracietler"
        title="Muracietlerim"
        subtitle="Teskilata yonlendirilmis muracietler RLS ile qorunan match modeli uzerinden oxunur."
        badge="Read-only MVP"
      />

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Teyin edilmis muracietler</div>
          <div style={styles.summaryValue}>{loading ? "-" : summary.assigned}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Gozleyen neticeler</div>
          <div style={styles.summaryValue}>{loading ? "-" : summary.pending}</div>
        </div>
      </div>

      <SectionPanel
        title="Muraciet siyahisi"
        desc="Ilk MVP yalniz only_selected ve admin_assigned assigned match-leri gosterir."
      >
        {loading ? (
          <div style={styles.stateBox}>Muracietler yuklenir...</div>
        ) : null}

        {!loading && errorMessage ? (
          <div style={styles.errorBox}>{errorMessage}</div>
        ) : null}

        {!loading && !errorMessage && !matches.length ? (
          <EmptyState
            title="Teskilat ucun muraciet tapilmadi"
            desc="RLS qaydalarina gore yalniz bu teskilata aid assigned match-ler gosterilir."
          />
        ) : null}

        {!loading && !errorMessage && matches.length ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Referral</th>
                  <th style={styles.th}>Musteri</th>
                  <th style={styles.th}>Elaqe</th>
                  <th style={styles.th}>Tip</th>
                  <th style={styles.th}>Kredit</th>
                  <th style={styles.th}>Mebleg</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Netice</th>
                  <th style={styles.th}>Tarix</th>
                </tr>
              </thead>

              <tbody>
                {matches.map((match) => {
                  const application = match.application || {};
                  const statusStyle = getStatusStyle(application.status);

                  return (
                    <tr key={match.id}>
                      <td style={styles.tdStrong}>
                        {application.referral_id || match.referral_id || "-"}
                        <div style={styles.cellMeta}>Match #{match.id}</div>
                      </td>
                      <td style={styles.tdStrong}>
                        {application.full_name || "-"}
                        <div style={styles.cellMeta}>
                          App #{application.id || match.application_id}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {application.phone || "-"}
                        <div style={styles.cellMeta}>{application.email || "-"}</div>
                      </td>
                      <td style={styles.td}>
                        {CUSTOMER_TYPE_LABELS[application.customer_type] ||
                          application.customer_type ||
                          "-"}
                      </td>
                      <td style={styles.td}>{application.credit_type || "-"}</td>
                      <td style={styles.td}>
                        {formatMoney(application.amount)}
                        <div style={styles.cellMeta}>
                          {application.term_months
                            ? `${application.term_months} ay`
                            : "-"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...statusStyle }}>
                          {getStatusLabel(application.status)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {getCreditResultLabel(application.credit_result_status)}
                        <div style={styles.cellMeta}>
                          {match.lead_fee_status || "not_charged"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {formatDate(match.assigned_at || match.matched_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </SectionPanel>
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
    borderRadius: "18px",
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

  stateBox: {
    minHeight: "88px",
    borderRadius: "16px",
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
    borderRadius: "16px",
    border: "1px solid #fecaca",
    background: "#fff7f7",
    padding: "18px",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: 650,
    lineHeight: 1.55,
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    background: "#ffffff",
  },

  table: {
    width: "100%",
    minWidth: "1080px",
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
    fontSize: "12px",
    fontWeight: 750,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
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

  tdStrong: {
    padding: "14px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 750,
    verticalAlign: "top",
    whiteSpace: "nowrap",
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
};

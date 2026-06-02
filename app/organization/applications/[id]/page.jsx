"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { labelFor } from "../../../../lib/labels";
import {
  PermissionDenied,
  useOrganizationPermissions,
} from "../../_components/OrganizationPermissionsContext";
import {
  EmptyState,
  SectionPanel,
} from "../../_components/OrganizationPlaceholders";

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
    phone,
    email,
    customer_type,
    credit_type,
    amount,
    term_months,
    interest_rate,
    status,
    distribution_type,
    credit_result_status,
    credit_result_source,
    credit_confirmed_at,
    credit_confirmed_by,
    credit_disbursed_amount,
    credit_disbursed_date,
    lead_fee_enabled,
    lead_fee_amount,
    success_fee_enabled,
    success_fee_type,
    success_fee_percent,
    success_fee_fixed_amount,
    success_fee_amount
  )
`;

const CREDIT_RESULT_OPTIONS = [
  { value: "under_review", label: "Baxılır" },
  { value: "disbursed", label: "Kredit verilib" },
  { value: "rejected", label: "İmtina edilib" },
  { value: "customer_declined", label: "Müştəri imtina edib" },
];

const EDITABLE_CREDIT_STATUSES = new Set(
  CREDIT_RESULT_OPTIONS.map((item) => item.value)
);

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${new Intl.NumberFormat("az-AZ").format(Number(value) || 0)} AZN`;
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value)}%`;
}

function formatDateTime(value) {
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

function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeMatch(match) {
  if (!match) return null;
  const application = Array.isArray(match.applications)
    ? match.applications[0]
    : match.applications;
  return { ...match, application: application || null };
}

function Badge({ children, tone = "neutral" }) {
  return <span style={{ ...styles.badge, ...styles[tone] }}>{children}</span>;
}

function InfoGrid({ children }) {
  return <div style={styles.infoGrid}>{children}</div>;
}

function Info({ label, value }) {
  return (
    <div style={styles.infoItem}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>
        {value === null || value === undefined || value === "" ? "-" : value}
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div style={styles.metricItem}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

function OverviewCard({ title, icon, children }) {
  return (
    <article style={styles.overviewCard}>
      <div style={styles.overviewCardHeader}>
        <span style={styles.overviewIcon}>{icon}</span>
        <h2 style={styles.overviewTitle}>{title}</h2>
      </div>
      <div style={styles.overviewRows}>{children}</div>
    </article>
  );
}

function OverviewRow({ label, value, badgeTone }) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <div style={styles.overviewRow}>
      <span style={styles.overviewLabel}>{label}</span>
      {badgeTone && !isEmpty ? (
        <Badge tone={badgeTone}>{value}</Badge>
      ) : (
        <strong style={styles.overviewValue}>{isEmpty ? "-" : value}</strong>
      )}
    </div>
  );
}

function getTone(status) {
  if (status === "approved" || status === "disbursed" || status === "sent") return "success";
  if (status === "rejected" || status === "customer_declined" || status === "expired") return "danger";
  if (status === "pending" || status === "under_review" || status === "reviewing" || status === "processing") {
    return "warning";
  }
  return "neutral";
}

function getEditableCreditStatus(status) {
  return EDITABLE_CREDIT_STATUSES.has(status) ? status : "under_review";
}

function getMonetizationText(match, application) {
  const model = match?.monetization_model || "not_applicable";
  const leadAmount = formatMoney(application?.lead_fee_amount);
  const successAmount = formatMoney(application?.success_fee_amount);
  const successRate = formatPercent(application?.success_fee_percent);

  return {
    title: `Bu müraciət üzrə model: ${labelFor(model)}`,
    lead:
      model === "success_fee_only"
        ? "Lead haqqı tətbiq olunmur."
        : `Lead haqqı: ${leadAmount}. Status: ${labelFor(match?.lead_fee_status || "not_charged")}.`,
    success:
      model === "lead_fee_only"
        ? "Uğur komissiyası tətbiq olunmur."
        : `Uğur komissiyası: ${successAmount}. ${
            application?.success_fee_type === "percent" ? `Faiz: ${successRate}. ` : ""
          }Status: ${labelFor(match?.success_fee_status || "not_applicable")}.`,
  };
}

export default function OrganizationApplicationDetailPage() {
  const params = useParams();
  const id = params?.id;
  const { hasPermission } = useOrganizationPermissions();
  const canViewContact = hasPermission("can_view_customer_contact");
  const canViewMonetization = hasPermission("can_view_monetization");
  const canUpdateCreditResult = hasPermission("can_update_credit_result");

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [creditResultStatus, setCreditResultStatus] = useState("under_review");
  const [creditDisbursedAmount, setCreditDisbursedAmount] = useState("");
  const [creditDisbursedDate, setCreditDisbursedDate] = useState("");
  const [creditResultNote, setCreditResultNote] = useState("");
  const [creditResultLoading, setCreditResultLoading] = useState(false);
  const [creditResultMessage, setCreditResultMessage] = useState("");
  const [creditResultError, setCreditResultError] = useState("");

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadMatch() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("application_organization_matches")
        .select(MATCH_SELECT)
        .eq("application_id", Number(id))
        .in("source", ["only_selected", "admin_assigned"])
        .eq("visibility_status", "assigned")
        .limit(1);

      if (!active) return;

      if (error) {
        setMatch(null);
        setErrorMessage("Müraciət yüklənmədi: " + error.message);
        setLoading(false);
        return;
      }

      const [firstMatch] = data || [];
      setMatch(normalizeMatch(firstMatch));
      setLoading(false);
    }

    loadMatch();

    return () => {
      active = false;
    };
  }, [id]);

  const application = match?.application;

  useEffect(() => {
    if (!application?.id) return;

    setCreditResultStatus(getEditableCreditStatus(application.credit_result_status));
    setCreditDisbursedAmount(
      application.credit_disbursed_amount === null ||
        application.credit_disbursed_amount === undefined
        ? ""
        : String(application.credit_disbursed_amount)
    );
    setCreditDisbursedDate(formatDateInput(application.credit_disbursed_date));
    setCreditResultNote("");
    setCreditResultMessage("");
    setCreditResultError("");
  }, [application?.id]);

  const summary = useMemo(() => {
    return {
      referral: application?.referral_id || "-",
      customer: application?.full_name || "-",
      phone: canViewContact ? application?.phone || "-" : "-",
      email: canViewContact ? application?.email || "-" : "-",
      amount: formatMoney(application?.amount),
      term: application?.term_months ? `${application.term_months} ay` : "-",
      interest: formatPercent(application?.interest_rate),
      type: labelFor(application?.customer_type),
      product: application?.credit_type || "-",
      result: labelFor(application?.credit_result_status || application?.status),
      leadFee: canViewMonetization ? formatMoney(application?.lead_fee_amount) : "-",
      referralValue: canViewMonetization
        ? application?.success_fee_type === "percent"
          ? formatPercent(application?.success_fee_percent)
          : formatMoney(application?.success_fee_fixed_amount ?? application?.success_fee_amount)
        : "-",
    };
  }, [application, canViewContact, canViewMonetization]);

  const monetization = useMemo(
    () => getMonetizationText(match, application),
    [match, application]
  );

  async function submitCreditResult(event) {
    event.preventDefault();

    if (!match?.id || !application?.id) {
      setCreditResultError("Müraciət məlumatı tapılmadı.");
      return;
    }

    if (Number(match.application_id) !== Number(application.id)) {
      setCreditResultError("Müraciət uyğunluğu təsdiqlənmədi.");
      return;
    }

    if (!canUpdateCreditResult) {
      setCreditResultError("Bu müraciət üzrə kredit nəticəsini yeniləmək üçün icazə tələb olunur.");
      return;
    }

    const nextStatus = creditResultStatus.trim();
    const cleanNote = creditResultNote.trim();

    if (!EDITABLE_CREDIT_STATUSES.has(nextStatus)) {
      setCreditResultError("Kredit nəticəsi üçün düzgün status seçilməlidir.");
      return;
    }

    const isDisbursed = nextStatus === "disbursed";
    let disbursedAmount = null;
    let disbursedDate = null;

    if (isDisbursed) {
      const amount = Number(creditDisbursedAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        setCreditResultError("Kredit verilib seçiləndə verilən kredit məbləği 0-dan böyük olmalıdır.");
        return;
      }

      if (!creditDisbursedDate) {
        setCreditResultError("Kredit verilib seçiləndə kreditin verilmə tarixi daxil edilməlidir.");
        return;
      }

      disbursedAmount = amount;
      disbursedDate = creditDisbursedDate;
    }

    setCreditResultLoading(true);
    setCreditResultError("");
    setCreditResultMessage("");

    const { data, error } = await supabase.rpc(
      "update_organization_credit_result",
      {
        p_match_id: Number(match.id),
        p_credit_result_status: nextStatus,
        p_credit_disbursed_amount: disbursedAmount,
        p_credit_disbursed_date: disbursedDate,
        p_note: cleanNote || null,
      }
    );

    if (error) {
      setCreditResultError("Kredit nəticəsi yenilənmədi: " + error.message);
      setCreditResultLoading(false);
      return;
    }

    const updatedRow = Array.isArray(data) ? data[0] : data;

    if (!updatedRow) {
      setCreditResultError("Kredit nəticəsi yenilənmədi: RPC nəticəsi boş qayıtdı.");
      setCreditResultLoading(false);
      return;
    }

    const updatedApplication = { ...application, ...updatedRow };

    setMatch((current) =>
      current
        ? {
            ...current,
            application: {
              ...(current.application || {}),
              ...updatedApplication,
            },
          }
        : current
    );
    setCreditResultLoading(false);

    setCreditResultMessage("Kredit nəticəsi yadda saxlandı.");
    setCreditResultNote("");
  }

  if (!hasPermission("can_view_application_detail")) {
    return <PermissionDenied />;
  }

  return (
    <div>
      <header style={styles.header}>
        <div style={styles.headerMain}>
          <h1 style={styles.pageTitle}>Qərar Paneli</h1>
          <p style={styles.subtitle}>
            Müraciət üzrə müştəri məlumatı, kredit şərtləri və qərar paneli.
          </p>
        </div>

        <div style={styles.headerActions}>
          <Link href="/organization/applications" style={styles.backLink}>
            Müraciətlərə qayıt
          </Link>

          {application ? (
            <div style={styles.profileCard}>
              <div style={styles.profileAvatar}>
                {(application.full_name || "?").trim().slice(0, 1).toUpperCase()}
              </div>
              <div style={styles.profileInfo}>
                <div style={styles.profileName}>{application.full_name || "-"}</div>
                <div style={styles.profilePhone}>{summary.phone}</div>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {loading ? <div style={styles.stateBox}>Müraciət yüklənir...</div> : null}
      {!loading && errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}
      {!loading && !errorMessage && !match ? (
        <EmptyState
          title="Müraciət tapılmadı"
          desc="Bu müraciət bankınıza təyin edilməyib və ya oxuma icazəsi yoxdur."
        />
      ) : null}

      {!loading && !errorMessage && match && application ? (
        <>
          <section style={styles.overviewGrid}>
            <OverviewCard title="Müştəri və əlaqə" icon="ID">
              <OverviewRow label="Referal kodu" value={summary.referral} />
              <OverviewRow label="Telefon" value={summary.phone} />
              <OverviewRow label="Email" value={summary.email} />
            </OverviewCard>

            <OverviewCard title="Kredit şərtləri" icon="AZN">
              <OverviewRow label="Məbləğ" value={summary.amount} />
              <OverviewRow label="Müddət" value={summary.term} />
              <OverviewRow label="Faiz" value={summary.interest} />
            </OverviewCard>

            <OverviewCard title="Müraciət məlumatı" icon="APP">
              <OverviewRow label="Tipi" value={summary.type} />
              <OverviewRow label="Məhsul" value={summary.product} />
              <OverviewRow
                label="Status"
                value={summary.result}
                badgeTone={getTone(application.credit_result_status || application.status)}
              />
            </OverviewCard>

            <OverviewCard title="Referral və dəyər" icon="%">
              <OverviewRow label="Lead qiyməti" value={summary.leadFee} />
              <OverviewRow label="Referral" value={summary.referralValue} />
              <OverviewRow label="Model" value={canViewMonetization ? labelFor(match.monetization_model) : "-"} />
            </OverviewCard>
          </section>

          <section style={styles.resultPanel}>
            <div style={styles.resultPanelHeader}>
              <div>
                <h2 style={styles.resultPanelTitle}>Kredit qərarı</h2>
                <p style={styles.resultPanelDesc}>
                  Bank nümayəndəsi bu müraciət üzrə yekun kredit qərarını burada qeyd edə bilər.
                </p>
              </div>
              <Badge tone={getTone(application.credit_result_status)}>
                {labelFor(application.credit_result_status)}
              </Badge>
            </div>
              {canUpdateCreditResult ? (
                <form onSubmit={submitCreditResult} style={styles.resultForm}>
                  {creditResultMessage ? (
                    <div style={styles.inlineMessage}>{creditResultMessage}</div>
                  ) : null}

                  {creditResultError ? (
                    <div style={styles.inlineError}>{creditResultError}</div>
                  ) : null}

                  <div style={styles.formGrid}>
                    <label style={styles.formBlock}>
                      <span style={styles.formLabel}>Kredit nəticəsi</span>
                      <select
                        value={creditResultStatus}
                        onChange={(event) => setCreditResultStatus(event.target.value)}
                        disabled={creditResultLoading}
                        style={{
                          ...styles.select,
                          ...(creditResultLoading ? styles.disabledControl : {}),
                        }}
                      >
                        {CREDIT_RESULT_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    {creditResultStatus === "disbursed" ? (
                      <>
                        <label style={styles.formBlock}>
                          <span style={styles.formLabel}>Verilən kredit məbləği</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={creditDisbursedAmount}
                            onChange={(event) => setCreditDisbursedAmount(event.target.value)}
                            disabled={creditResultLoading}
                            style={{
                              ...styles.input,
                              ...(creditResultLoading ? styles.disabledControl : {}),
                            }}
                          />
                        </label>

                        <label style={styles.formBlock}>
                          <span style={styles.formLabel}>Kreditin verilmə tarixi</span>
                          <input
                            type="date"
                            value={creditDisbursedDate}
                            onChange={(event) => setCreditDisbursedDate(event.target.value)}
                            disabled={creditResultLoading}
                            style={{
                              ...styles.input,
                              ...(creditResultLoading ? styles.disabledControl : {}),
                            }}
                          />
                        </label>
                      </>
                    ) : null}
                  </div>

                  <label style={styles.formBlock}>
                    <span style={styles.formLabel}>Qeyd</span>
                    <textarea
                      value={creditResultNote}
                      onChange={(event) => setCreditResultNote(event.target.value)}
                      placeholder="Kredit qərarı ilə bağlı qeyd yazın"
                      disabled={creditResultLoading}
                      style={{
                        ...styles.textarea,
                        ...(creditResultLoading ? styles.disabledControl : {}),
                      }}
                    />
                  </label>

                  <div style={styles.formFooter}>
                    <div style={styles.formHint}>
                      Success fee və balans əməliyyatları bu paneldən dəyişdirilmir.
                    </div>
                    <button
                      type="submit"
                      disabled={creditResultLoading}
                      style={{
                        ...styles.primaryButton,
                        ...(creditResultLoading ? styles.disabledButton : {}),
                      }}
                    >
                      {creditResultLoading ? "Yadda saxlanılır..." : "Nəticəni yadda saxla"}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={styles.infoState}>
                  Bu müraciət üzrə kredit nəticəsini yeniləmək üçün icazə tələb olunur.
                </div>
              )}
          </section>

          <section style={styles.detailGrid}>
            <SectionPanel
              title="Komissiya və xərc xülasəsi"
              desc="Bu müraciət üzrə tətbiq olunan ödəniş modeli."
            >
              {canViewMonetization ? (
                <>
                  <div style={styles.monetizationIntro}>
                    <strong>{monetization.title}</strong>
                  </div>

                  <div style={styles.metricGrid}>
                    <MiniMetric label="Lead haqqı" value={formatMoney(application.lead_fee_amount)} />
                    <MiniMetric
                      label="Lead statusu"
                      value={
                        <Badge tone={getTone(match.lead_fee_status)}>
                          {labelFor(match.lead_fee_status || "not_charged")}
                        </Badge>
                      }
                    />
                    <MiniMetric label="Uğur komissiyası" value={formatMoney(application.success_fee_amount)} />
                    <MiniMetric
                      label="Uğur statusu"
                      value={
                        <Badge tone={getTone(match.success_fee_status)}>
                          {labelFor(match.success_fee_status || "not_applicable")}
                        </Badge>
                      }
                    />
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Komissiya məlumatı gizlidir"
                  desc="Bu bölməni görmək üçün monetizasiya icazəsi tələb olunur."
                />
              )}
            </SectionPanel>

            <SectionPanel title="Qeydlər" desc="Bank nümayəndəsi üçün yığcam əməliyyat qeydi.">
              <div style={styles.noteBox}>
                Müştəri ilə əlaqə və bankdaxili qərar qeydləri daxili prosesinizdə saxlanmalıdır.
              </div>
            </SectionPanel>
          </section>
        </>
      ) : null}
    </div>
  );
}

const styles = {
  header: {
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    flexWrap: "wrap",
  },
  headerMain: {
    display: "grid",
    gap: "6px",
    minWidth: 0,
    maxWidth: "760px",
  },
  pageTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "24px",
    lineHeight: 1.2,
    fontWeight: 650,
  },
  subtitle: {
    margin: 0,
    color: "#475569",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
  },
  profileCard: {
    minWidth: "260px",
    borderRadius: "16px",
    border: "1px solid #e6edf5",
    background: "#ffffff",
    padding: "13px",
    display: "grid",
    gridTemplateColumns: "42px 1fr",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 6px 18px rgba(15,23,42,0.035)",
  },
  profileAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "#f0fdf4",
    color: "#15803d",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: 700,
  },
  profileInfo: {
    minWidth: 0,
  },
  profileName: {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: 650,
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  profilePhone: {
    marginTop: "4px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 500,
  },
  backLink: {
    display: "inline-flex",
    minHeight: "34px",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    borderRadius: "999px",
    border: "1px solid #bbf7d0",
    background: "#ffffff",
    color: "#047857",
    padding: "0 13px",
    fontSize: "12px",
    fontWeight: 600,
    textDecoration: "none",
  },
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
  },
  overviewCard: {
    minHeight: "150px",
    borderRadius: "16px",
    border: "1px solid #e6edf5",
    background: "#ffffff",
    padding: "14px",
    display: "grid",
    alignContent: "start",
    gap: "11px",
    boxShadow: "0 4px 14px rgba(15,23,42,0.03)",
  },
  overviewCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  overviewIcon: {
    minWidth: "28px",
    height: "28px",
    borderRadius: "10px",
    background: "#f8fafc",
    color: "#475569",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 650,
  },
  overviewTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 650,
    lineHeight: 1.25,
  },
  overviewRows: {
    display: "grid",
  },
  overviewRow: {
    display: "grid",
    gridTemplateColumns: "96px minmax(0, 1fr)",
    alignItems: "center",
    gap: "10px",
    minHeight: "30px",
    padding: "7px 0",
    borderTop: "1px solid #f1f5f9",
  },
  overviewLabel: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 500,
    lineHeight: 1.3,
  },
  overviewValue: {
    color: "#1e293b",
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1.35,
    wordBreak: "break-word",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
    alignItems: "start",
    marginBottom: "16px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },
  infoItem: {
    background: "#fbfdff",
    border: "1px solid #edf2f7",
    borderRadius: "12px",
    padding: "12px",
    minWidth: 0,
  },
  infoLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: 500,
    marginBottom: "6px",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#1e293b",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  badge: {
    display: "inline-flex",
    minHeight: "26px",
    alignItems: "center",
    borderRadius: "999px",
    padding: "0 9px",
    fontSize: "11px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  neutral: {
    background: "#f8fafc",
    color: "#475569",
    border: "1px solid #e6edf5",
  },
  warning: {
    background: "#fffbeb",
    color: "#854d0e",
    border: "1px solid #fef3c7",
  },
  success: {
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #dcfce7",
  },
  danger: {
    background: "#fff1f2",
    color: "#991b1b",
    border: "1px solid #ffe4e6",
  },
  monetizationIntro: {
    borderRadius: "12px",
    border: "1px solid #e6edf5",
    background: "#f8fafc",
    color: "#334155",
    padding: "12px",
    display: "grid",
    gap: "7px",
    marginBottom: "14px",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
  },
  metricItem: {
    minHeight: "66px",
    borderRadius: "12px",
    border: "1px solid #edf2f7",
    background: "#fbfdff",
    padding: "12px",
    display: "grid",
    alignContent: "center",
    gap: "7px",
  },
  metricLabel: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 500,
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#1e293b",
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1.4,
  },
  resultPanel: {
    marginBottom: "14px",
    background: "#ffffff",
    border: "1px solid #e6edf5",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.035)",
  },
  resultPanelHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  resultPanelTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: 650,
    lineHeight: 1.25,
  },
  resultPanelDesc: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  resultForm: {
    display: "grid",
    gap: "14px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  formBlock: {
    display: "grid",
    gap: "7px",
    minWidth: 0,
  },
  formLabel: {
    fontSize: "13px",
    color: "#475569",
    fontWeight: 750,
  },
  select: {
    minHeight: "44px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 12px",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
  },
  input: {
    minHeight: "44px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 12px",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
  },
  textarea: {
    minHeight: "96px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "12px",
    fontSize: "14px",
    lineHeight: 1.5,
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
  },
  formFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  formHint: {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.45,
  },
  primaryButton: {
    minHeight: "44px",
    borderRadius: "12px",
    border: "1px solid #16a34a",
    background: "#16a34a",
    color: "#ffffff",
    padding: "0 16px",
    fontSize: "14px",
    fontWeight: 800,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  disabledControl: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  inlineMessage: {
    borderRadius: "12px",
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    color: "#166534",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: 700,
  },
  inlineError: {
    borderRadius: "12px",
    border: "1px solid #fecaca",
    background: "#fff7f7",
    color: "#b91c1c",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.5,
  },
  infoState: {
    minHeight: "72px",
    borderRadius: "12px",
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.5,
  },
  noteGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "12px",
  },
  noteBox: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "14px",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.55,
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
};

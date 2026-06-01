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

function getTone(status) {
  if (status === "approved" || status === "disbursed" || status === "sent") return "success";
  if (status === "rejected" || status === "customer_declined" || status === "expired") return "danger";
  if (status === "pending" || status === "under_review" || status === "reviewing" || status === "processing") {
    return "warning";
  }
  return "neutral";
}

function getWorkflowSteps(match, application) {
  const resultStatus = application?.credit_result_status;
  const isRejected =
    resultStatus === "rejected" ||
    resultStatus === "customer_declined" ||
    resultStatus === "expired";
  const isSuccess = resultStatus === "disbursed" || resultStatus === "approved";
  const isReview =
    !resultStatus ||
    resultStatus === "pending" ||
    resultStatus === "under_review" ||
    resultStatus === "reviewing" ||
    resultStatus === "processing";

  return [
    {
      title: "Müraciət yaradıldı",
      desc: formatDateTime(application?.created_at),
      tone: "complete",
    },
    {
      title: "Banka təyin edildi",
      desc: formatDateTime(match?.assigned_at || match?.matched_at),
      tone: match?.visibility_status === "assigned" ? "complete" : "info",
    },
    {
      title: "Baxılır",
      desc: isReview ? "Bank qərarı gözlənilir" : "Baxış tamamlanıb",
      tone: isReview ? "pending" : "complete",
    },
    {
      title: "Nəticə",
      desc: labelFor(resultStatus),
      tone: isRejected ? "danger" : isSuccess ? "complete" : "info",
    },
  ];
}

function WorkflowStrip({ steps }) {
  return (
    <section style={styles.workflowStrip}>
      {steps.map((step, index) => (
        <div key={step.title} style={{ ...styles.workflowStep, ...styles[`workflowStep${step.tone}`] }}>
          <div style={{ ...styles.workflowDot, ...styles[`workflow${step.tone}`] }}>
            {index + 1}
          </div>
          <div style={styles.workflowBody}>
            <div style={styles.workflowTitle}>{step.title}</div>
            <div style={styles.workflowDesc}>{step.desc}</div>
          </div>
        </div>
      ))}
    </section>
  );
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
      amount: formatMoney(application?.amount),
      result: labelFor(application?.credit_result_status),
    };
  }, [application]);

  const monetization = useMemo(
    () => getMonetizationText(match, application),
    [match, application]
  );

  const workflowSteps = useMemo(
    () => getWorkflowSteps(match, application),
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
          <Link href="/organization/applications" style={styles.backLink}>
            Müraciətlərə qayıt
          </Link>
          <div style={styles.kicker}>Müraciət detalı</div>
          <h1 style={styles.title}>Müraciət {summary.referral}</h1>
          <p style={styles.subtitle}>
            Banka təyin edilmiş müraciət üzrə müştəri məlumatı, kredit şərtləri və qərar paneli.
          </p>
        </div>

        {application ? (
          <div style={styles.headerBadges}>
            <div style={styles.headerBadgeBlock}>
              <span style={styles.headerBadgeLabel}>Kredit nəticəsi</span>
              <Badge tone={getTone(application.credit_result_status)}>
                {labelFor(application.credit_result_status)}
              </Badge>
            </div>
          </div>
        ) : null}
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
          <WorkflowStrip steps={workflowSteps} />

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
            <SectionPanel title="Müraciət və kredit" desc="Müraciətin bank baxışı üçün əsas kredit parametrləri.">
              <InfoGrid>
                <Info label="Referral ID" value={application.referral_id} />
                <Info label="Kredit növü" value={application.credit_type} />
                <Info label="Məbləğ" value={formatMoney(application.amount)} />
                <Info label="Müddət" value={application.term_months ? `${application.term_months} ay` : "-"} />
                <Info label="Yaranma tarixi" value={formatDateTime(application.created_at)} />
                <Info label="Təyin edilmə tarixi" value={formatDateTime(match.assigned_at || match.matched_at)} />
                <Info label="Paylaşım tipi" value={labelFor(application.distribution_type || match.source)} />
              </InfoGrid>
            </SectionPanel>

            <SectionPanel title="Müştəri" desc="Əlaqə məlumatları yalnız icazə olduqda göstərilir.">
              <InfoGrid>
                <Info label="Ad soyad" value={application.full_name} />
                {canViewContact ? (
                  <>
                    <Info label="Telefon" value={application.phone} />
                    <Info label="Email" value={application.email} />
                  </>
                ) : (
                  <Info label="Əlaqə məlumatları" value="Bu istifadəçi üçün gizlidir" />
                )}
                <Info label="Müştəri tipi" value={labelFor(application.customer_type)} />
              </InfoGrid>
            </SectionPanel>
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
    gap: "8px",
    minWidth: 0,
    maxWidth: "760px",
  },
  kicker: {
    color: "#059669",
    fontSize: "13px",
    fontWeight: 800,
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "34px",
    lineHeight: 1.12,
    fontWeight: 850,
    wordBreak: "break-word",
  },
  subtitle: {
    margin: 0,
    color: "#475569",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  headerBadges: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  headerBadgeBlock: {
    minHeight: "62px",
    minWidth: "160px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    padding: "10px 12px",
    display: "grid",
    alignContent: "center",
    gap: "7px",
    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
  },
  headerBadgeLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 700,
  },
  backLink: {
    display: "inline-flex",
    minHeight: "36px",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    borderRadius: "10px",
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    color: "#047857",
    padding: "0 12px",
    fontSize: "13px",
    fontWeight: 800,
    textDecoration: "none",
  },
  workflowStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  workflowStep: {
    position: "relative",
    minHeight: "98px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    padding: "14px",
    display: "grid",
    gridTemplateColumns: "38px 1fr",
    gap: "10px",
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
  },
  workflowStepcomplete: {
    borderColor: "#bbf7d0",
    background: "#f0fdf4",
  },
  workflowSteppending: {
    borderColor: "#fde68a",
    background: "#fffbeb",
  },
  workflowStepdanger: {
    borderColor: "#fecaca",
    background: "#fff7f7",
  },
  workflowStepinfo: {
    borderColor: "#bfdbfe",
    background: "#eff6ff",
  },
  workflowDot: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 900,
    zIndex: 1,
  },
  workflowcomplete: {
    background: "#16a34a",
  },
  workflowpending: {
    background: "#f59e0b",
  },
  workflowdanger: {
    background: "#dc2626",
  },
  workflowinfo: {
    background: "#2563eb",
  },
  workflowBody: {
    minWidth: 0,
    zIndex: 1,
  },
  workflowTitle: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 850,
    lineHeight: 1.3,
  },
  workflowDesc: {
    marginTop: "5px",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.45,
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
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "13px",
    minWidth: 0,
  },
  infoLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 700,
    marginBottom: "7px",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: 650,
    color: "#0f172a",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  badge: {
    display: "inline-flex",
    minHeight: "32px",
    alignItems: "center",
    borderRadius: "999px",
    padding: "0 10px",
    fontSize: "12px",
    fontWeight: 750,
    whiteSpace: "nowrap",
  },
  neutral: {
    background: "#f8fafc",
    color: "#475569",
    border: "1px solid #e2e8f0",
  },
  warning: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
  },
  success: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },
  danger: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },
  monetizationIntro: {
    borderRadius: "14px",
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "14px",
    display: "grid",
    gap: "7px",
    marginBottom: "14px",
    fontSize: "14px",
    lineHeight: 1.55,
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
  },
  metricItem: {
    minHeight: "74px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "12px",
    display: "grid",
    alignContent: "center",
    gap: "7px",
  },
  metricLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 800,
    lineHeight: 1.4,
  },
  resultPanel: {
    marginBottom: "16px",
    background: "#ffffff",
    border: "1px solid #bbf7d0",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 14px 32px rgba(22, 163, 74, 0.08)",
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
    fontSize: "18px",
    fontWeight: 800,
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

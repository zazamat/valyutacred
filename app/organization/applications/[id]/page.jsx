"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { labelFor, yesNo } from "../../../../lib/labels";
import {
  PermissionDenied,
  useOrganizationPermissions,
} from "../../_components/OrganizationPermissionsContext";
import {
  EmptyState,
  PageHeader,
  SectionPanel,
  pageStyles,
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

const APPLICATION_UPDATE_SELECT = `
  id,
  referral_id,
  credit_result_status,
  credit_result_source,
  credit_confirmed_at,
  credit_confirmed_by,
  credit_disbursed_amount,
  credit_disbursed_date
`;

const CREDIT_RESULT_OPTIONS = [
  { value: "under_review", label: "Baxılır" },
  { value: "approved", label: "Təsdiqlənib" },
  { value: "rejected", label: "İmtina edilib" },
  { value: "customer_declined", label: "Müştəri imtina edib" },
  { value: "disbursed", label: "Kredit verilib" },
  { value: "expired", label: "Müddəti bitib" },
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

function readOrganizationUserSnapshot() {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem("valyutacred_auth");
    const auth = raw ? JSON.parse(raw) : null;

    return {
      userId: auth?.user_id || null,
      email: auth?.email || "",
      role: auth?.role || "organization_user",
    };
  } catch {
    return {};
  }
}

function getCreditResultAuditValues(item) {
  return {
    credit_result_status: item?.credit_result_status || null,
    credit_disbursed_amount: item?.credit_disbursed_amount ?? null,
    credit_disbursed_date: item?.credit_disbursed_date || null,
    credit_result_source: item?.credit_result_source || null,
    credit_confirmed_at: item?.credit_confirmed_at || null,
    credit_confirmed_by: item?.credit_confirmed_by || null,
  };
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
      status: labelFor(application?.status),
    };
  }, [application]);

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
    const updatePayload = {
      credit_result_status: nextStatus,
      credit_result_source: "organization_cabinet",
      credit_confirmed_at: new Date().toISOString(),
      credit_confirmed_by: "",
    };

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

      updatePayload.credit_disbursed_amount = amount;
      updatePayload.credit_disbursed_date = creditDisbursedDate;
    }

    const organizationUser = readOrganizationUserSnapshot();
    updatePayload.credit_confirmed_by =
      organizationUser.email || organizationUser.userId || "organization_user";

    const oldValues = getCreditResultAuditValues(application);

    setCreditResultLoading(true);
    setCreditResultError("");
    setCreditResultMessage("");

    const { data, error } = await supabase
      .from("applications")
      .update(updatePayload)
      .eq("id", Number(match.application_id))
      .select(APPLICATION_UPDATE_SELECT)
      .limit(1);

    if (error) {
      setCreditResultError("Kredit nəticəsi yenilənmədi: " + error.message);
      setCreditResultLoading(false);
      return;
    }

    const [updatedRow] = data || [];

    if (!updatedRow) {
      setCreditResultError("Kredit nəticəsi yenilənmədi: yenilənəcək müraciət tapılmadı.");
      setCreditResultLoading(false);
      return;
    }

    const updatedApplication = { ...application, ...updatedRow };
    const newValues = getCreditResultAuditValues(updatedApplication);

    const { error: logError } = await supabase
      .from("application_status_logs")
      .insert([
        {
          application_id: application.id,
          referral_id: application.referral_id || null,
          status_type: "credit_result_status",
          old_status: application.credit_result_status || null,
          new_status: nextStatus,
          changed_by_user_id: organizationUser.userId || null,
          changed_by_role: "organization_user",
          changed_by_email: organizationUser.email || "",
          source: "organization_cabinet",
          note: cleanNote || null,
          old_values: oldValues,
          new_values: newValues,
        },
      ]);

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

    if (logError) {
      setCreditResultError(
        "Nəticə yeniləndi, amma audit log yazılmadı: " + logError.message
      );
      return;
    }

    setCreditResultMessage("Kredit nəticəsi yadda saxlandı.");
    setCreditResultNote("");
  }

  if (!hasPermission("can_view_application_detail")) {
    return <PermissionDenied />;
  }

  return (
    <div>
      <PageHeader
        kicker="Müraciət detalı"
        title={`Müraciət ${summary.referral}`}
        subtitle="Müştəri, kredit nəticəsi və ödəniş modeli üzrə bank baxışı."
      />

      <div style={styles.backRow}>
        <Link href="/organization/applications" style={styles.backLink}>
          Müraciətlərə qayıt
        </Link>
      </div>

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
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Müştəri</div>
              <div style={styles.summaryValue}>{summary.customer}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Kredit məbləği</div>
              <div style={styles.summaryValue}>{summary.amount}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Müraciət statusu</div>
              <div style={styles.summaryValueSmall}>
                <Badge tone={getTone(application.status)}>{summary.status}</Badge>
              </div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Kredit nəticəsi</div>
              <div style={styles.summaryValueSmall}>
                <Badge tone={getTone(application.credit_result_status)}>
                  {summary.result}
                </Badge>
              </div>
            </div>
          </div>

          <section style={pageStyles.bottomGrid}>
            <SectionPanel title="Müraciət xülasəsi" desc="Bankınıza yönləndirilmiş müraciətin əsas parametrləri.">
              <InfoGrid>
                <Info label="Referral ID" value={application.referral_id} />
                <Info label="Yaranma tarixi" value={formatDateTime(application.created_at)} />
                <Info label="Mənbə" value={labelFor(match.source)} />
                <Info label="Təyin edilmə tarixi" value={formatDateTime(match.assigned_at)} />
              </InfoGrid>
            </SectionPanel>

            <SectionPanel title="Müştəri məlumatları" desc="Əlaqə məlumatları yalnız icazə olduqda göstərilir.">
              <InfoGrid>
                <Info label="Ad soyad" value={application.full_name} />
                <Info label="Müştəri tipi" value={labelFor(application.customer_type)} />
                {canViewContact ? (
                  <>
                    <Info label="Telefon" value={application.phone} />
                    <Info label="Email" value={application.email} />
                  </>
                ) : (
                  <Info label="Əlaqə məlumatları" value="Bu istifadəçi üçün gizlidir" />
                )}
              </InfoGrid>
            </SectionPanel>
          </section>

          <section style={{ ...pageStyles.bottomGrid, marginTop: 18 }}>
            <SectionPanel title="Kredit məlumatları" desc="Müraciətdə seçilmiş kredit şərtləri.">
              <InfoGrid>
                <Info label="Kredit növü" value={application.credit_type} />
                <Info label="Məbləğ" value={formatMoney(application.amount)} />
                <Info label="Müddət" value={application.term_months ? `${application.term_months} ay` : "-"} />
                <Info label="Paylanma tipi" value={labelFor(application.distribution_type)} />
              </InfoGrid>
            </SectionPanel>

            <SectionPanel title="Status və nəticə" desc="Müraciətin cari vəziyyəti və kredit qərarı.">
              <InfoGrid>
                <Info
                  label="Müraciət statusu"
                  value={<Badge tone={getTone(application.status)}>{labelFor(application.status)}</Badge>}
                />
                <Info
                  label="Kredit nəticəsi"
                  value={
                    <Badge tone={getTone(application.credit_result_status)}>
                      {labelFor(application.credit_result_status)}
                    </Badge>
                  }
                />
                <Info label="Görünürlük" value={labelFor(match.visibility_status)} />
                <Info label="Uyğunlaşma tarixi" value={formatDateTime(match.matched_at)} />
              </InfoGrid>
            </SectionPanel>
          </section>

          <div style={{ marginTop: 18 }}>
            <SectionPanel
              title="Kredit nəticəsini yenilə"
              desc="Bank nümayəndəsi bu müraciət üzrə kredit qərarını burada qeyd edə bilər."
            >
              {canUpdateCreditResult ? (
                <form onSubmit={submitCreditResult} style={styles.resultForm}>
                  {creditResultMessage ? (
                    <div style={styles.inlineMessage}>{creditResultMessage}</div>
                  ) : null}

                  {creditResultError ? (
                    <div style={styles.inlineError}>{creditResultError}</div>
                  ) : null}

                  <div style={styles.currentResultRow}>
                    <span>Cari nəticə</span>
                    <Badge tone={getTone(application.credit_result_status)}>
                      {labelFor(application.credit_result_status)}
                    </Badge>
                  </div>

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
            </SectionPanel>
          </div>

          <div style={{ marginTop: 18 }}>
            <SectionPanel
              title="Komissiya və xərc məlumatı"
              desc="Bu müraciət üzrə bankın hansı ödəniş modelinə düşdüyü."
            >
              {canViewMonetization ? (
                <>
                  <div style={styles.monetizationIntro}>
                    <strong>{monetization.title}</strong>
                    <span>{monetization.lead}</span>
                    <span>{monetization.success}</span>
                  </div>

                  <InfoGrid>
                    <Info label="Lead haqqı aktivdir" value={yesNo(application.lead_fee_enabled)} />
                    <Info label="Lead haqqı" value={formatMoney(application.lead_fee_amount)} />
                    <Info
                      label="Lead haqqı statusu"
                      value={
                        <Badge tone={getTone(match.lead_fee_status)}>
                          {labelFor(match.lead_fee_status || "not_charged")}
                        </Badge>
                      }
                    />
                    <Info label="Uğur komissiyası aktivdir" value={yesNo(application.success_fee_enabled)} />
                    <Info label="Uğur komissiyası tipi" value={application.success_fee_type || "-"} />
                    <Info label="Uğur komissiyası faizi" value={formatPercent(application.success_fee_percent)} />
                    <Info label="Sabit uğur komissiyası" value={formatMoney(application.success_fee_fixed_amount)} />
                    <Info label="Hesablanan uğur komissiyası" value={formatMoney(application.success_fee_amount)} />
                    <Info
                      label="Uğur komissiyası statusu"
                      value={
                        <Badge tone={getTone(match.success_fee_status)}>
                          {labelFor(match.success_fee_status || "not_applicable")}
                        </Badge>
                      }
                    />
                  </InfoGrid>
                </>
              ) : (
                <EmptyState
                  title="Komissiya məlumatı gizlidir"
                  desc="Bu bölməni görmək üçün monetizasiya icazəsi tələb olunur."
                />
              )}
            </SectionPanel>
          </div>

          <div style={{ marginTop: 18 }}>
            <SectionPanel title="Qeydlər" desc="Bank nümayəndəsi üçün əməliyyat qeydləri.">
              <div style={styles.noteGrid}>
                <div style={styles.noteBox}>
                  Müraciət məlumatları bank baxışı üçün açılıb. Kredit nəticəsi icazə olduqda bu səhifədən yenilənə bilər.
                </div>
                <div style={styles.noteBox}>
                  Müştəri ilə əlaqə saxlanılıbsa, nəticə daxili bank prosesinizdə qeyd olunmalıdır.
                </div>
              </div>
            </SectionPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}

const styles = {
  backRow: {
    marginTop: "-8px",
    marginBottom: "18px",
  },
  backLink: {
    display: "inline-flex",
    minHeight: "38px",
    alignItems: "center",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 12px",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
  },
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
    minWidth: 0,
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 650,
    marginBottom: "8px",
  },
  summaryValue: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.25,
    wordBreak: "break-word",
  },
  summaryValueSmall: {
    minHeight: "34px",
    display: "flex",
    alignItems: "center",
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
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    color: "#065f46",
    padding: "14px",
    display: "grid",
    gap: "7px",
    marginBottom: "14px",
    fontSize: "14px",
    lineHeight: 1.55,
  },
  resultForm: {
    display: "grid",
    gap: "14px",
  },
  currentResultRow: {
    minHeight: "54px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 700,
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

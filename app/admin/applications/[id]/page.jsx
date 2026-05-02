"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

const STATUS_OPTIONS = [
  { value: "new", label: "Yeni" },
  { value: "reviewing", label: "Baxılır" },
  { value: "approved", label: "Təsdiqləndi" },
  { value: "rejected", label: "Rədd edildi" },
];

const DISTRIBUTION_OPTIONS = [
  { value: "open_market", label: "Çoxlu təşkilata açıq" },
  { value: "only_selected", label: "Seçilmiş təşkilat" },
];

const CUSTOMER_TYPE_LABELS = {
  individual: "Fərdi",
  business: "Biznes",
};

const EMPLOYMENT_TYPE_LABELS = {
  official: "Rəsmi iş yeri",
  business_owner: "Biznes sahibi",
  freelancer: "Freelancer",
  self_employed: "Fərdi fəaliyyət",
  other: "Digər",
};

const FLAG_STATUS_LABELS = {
  active: "Aktiv",
  under_review: "Araşdırılır",
  resolved: "Həll edildi",
  rejected: "Rədd edildi",
};

function normalizeStatus(status) {
  if (status === "processing") return "reviewing";
  if (status === "sent") return "approved";
  return status || "new";
}

function getDistributionLabel(value) {
  return DISTRIBUTION_OPTIONS.find((item) => item.value === value)?.label || "-";
}

function getDistributionStyles(value) {
  if (value === "open_market") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  }

  if (value === "only_selected") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    };
  }

  return {
    background: "#e2e8f0",
    color: "#334155",
    border: "1px solid #cbd5e1",
  };
}

function getFlagStatusStyles(status) {
  if (status === "active") {
    return {
      background: "#fff1f2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    };
  }

  if (status === "under_review") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
    };
  }

  if (status === "resolved") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  }

  return {
    background: "#e2e8f0",
    color: "#334155",
    border: "1px solid #cbd5e1",
  };
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("az-AZ").format(number)} AZN`;
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

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [application, setApplication] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [customerFlags, setCustomerFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [flagReason, setFlagReason] = useState("");
  const [flagLoading, setFlagLoading] = useState(false);
  const [flagMessage, setFlagMessage] = useState("");

  const organizationMap = useMemo(() => {
    const map = {};
    organizations.forEach((item) => {
      map[item.id] = item.name;
    });
    return map;
  }, [organizations]);

  const activeFlagExists = useMemo(() => {
    return customerFlags.some((item) => item.status === "active");
  }, [customerFlags]);

  async function fetchData() {
    try {
      const auth = localStorage.getItem("valyutacred_auth");

      if (!auth) {
        router.push("/login");
        return;
      }

      const parsed = JSON.parse(auth);

      if (parsed.role !== "super_admin" && parsed.role !== "admin") {
        router.push("/login");
        return;
      }

      setLoading(true);
      setPageMessage("");

      const [applicationRes, organizationsRes, flagsRes] = await Promise.all([
        supabase.from("applications").select("*").eq("id", Number(id)).single(),
        supabase
          .from("organizations")
          .select("id, name")
          .order("id", { ascending: true }),
        supabase
          .from("customer_flags")
          .select("*")
          .eq("application_id", Number(id))
          .order("id", { ascending: false }),
      ]);

      if (applicationRes.error) {
        setApplication(null);
        setPageMessage("Müraciət yüklənmədi: " + applicationRes.error.message);
        setLoading(false);
        return;
      }

      setApplication(applicationRes.data || null);
      setOrganizations(organizationsRes.data || []);
      setCustomerFlags(flagsRes.data || []);

      if (organizationsRes.error) {
        setPageMessage("Təşkilatlar yüklənmədi: " + organizationsRes.error.message);
      }

      if (flagsRes.error) {
        setPageMessage("Problemli müştəri qeydləri yüklənmədi: " + flagsRes.error.message);
      }

      setLoading(false);
    } catch (error) {
      setApplication(null);
      setOrganizations([]);
      setCustomerFlags([]);
      setPageMessage("Səhifə yüklənmədi.");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function updateStatus(nextStatus) {
    if (!application?.id) return;

    setUpdatingStatus(true);
    setPageMessage("");

    const { data, error } = await supabase
      .from("applications")
      .update({ status: nextStatus })
      .eq("id", Number(application.id))
      .select("*")
      .single();

    if (error) {
      setPageMessage("Status yenilənmədi: " + error.message);
      setUpdatingStatus(false);
      return;
    }

    setApplication(data);
    setPageMessage("Müraciətin statusu yeniləndi.");
    setUpdatingStatus(false);
  }

  async function createProblemFlag() {
    if (!application?.id) return;

    if (activeFlagExists) {
      setFlagMessage("Bu müraciət üzrə artıq aktiv problemli müştəri qeydi var.");
      return;
    }

    setFlagLoading(true);
    setFlagMessage("");

    const { data, error } = await supabase
      .from("customer_flags")
      .insert([
        {
          application_id: application.id,
          phone: application.phone || "",
          email: application.email || "",
          customer_name: application.full_name || "",
          flagged_by_organization_id: application.selected_organization_id || null,
          reason: flagReason || null,
          status: "active",
        },
      ])
      .select("*")
      .single();

    if (error) {
      setFlagMessage("Problemli müştəri qeyd olunmadı: " + error.message);
      setFlagLoading(false);
      return;
    }

    setCustomerFlags((prev) => [data, ...prev]);
    setFlagMessage("Müştəri problemli kimi qeyd edildi.");
    setFlagReason("");
    setFlagLoading(false);
  }

  if (loading) {
    return <div style={styles.loadingBox}>Yüklənir...</div>;
  }

  if (!application) {
    return (
      <div>
        <div style={styles.topRow}>
          <div>
            <h1 style={styles.title}>Müraciət tapılmadı</h1>
            <p style={styles.subtitle}>Bu ID ilə uyğun müraciət görünmədi.</p>
          </div>

          <button
            type="button"
            style={styles.backLink}
            onClick={() => router.push("/admin/applications")}
          >
            ← Müraciətlərə qayıt
          </button>
        </div>

        {pageMessage ? <div style={styles.messageBox}>{pageMessage}</div> : null}
      </div>
    );
  }

  const distributionStyle = getDistributionStyles(application.distribution_type);

  const selectedOrganizationName =
    application.distribution_type === "only_selected"
      ? organizationMap[application.selected_organization_id] ||
        application.organization ||
        "-"
      : "-";

  return (
    <div>
      <div style={styles.topRow}>
        <div>
          <h1 style={styles.title}>Müraciət detalı</h1>
          <p style={styles.subtitle}>
            Yeni public müraciət formundan gələn bütün əsas məlumatlar burada göstərilir.
          </p>
        </div>

        <button
          type="button"
          style={styles.backLink}
          onClick={() => router.push("/admin/applications")}
        >
          ← Müraciətlərə qayıt
        </button>
      </div>

      {pageMessage ? <div style={styles.messageBox}>{pageMessage}</div> : null}

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Müraciət ID</div>
          <div style={styles.summaryValue}>#{application.id}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Tarix</div>
          <div style={styles.summaryValueSmall}>
            {formatDateTime(application.created_at)}
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Status</div>

          <select
            value={normalizeStatus(application.status)}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updatingStatus}
            style={{
              ...styles.adminSelect,
              ...(updatingStatus ? styles.disabled : {}),
            }}
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Məbləğ</div>
          <div style={styles.summaryValueSmall}>{formatMoney(application.amount)}</div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <section style={styles.panel}>
          <PanelHeader
            title="Şəxsi məlumatlar"
            desc="Müştərinin müraciət zamanı daxil etdiyi əsas məlumatlar."
          />

          <div style={styles.infoGrid}>
            <Info label="Ad soyad" value={application.full_name} />
            <Info label="Telefon" value={application.phone} />
            <Info label="Email / login" value={application.email} />
            <Info
              label="Müştəri tipi"
              value={
                CUSTOMER_TYPE_LABELS[application.customer_type] ||
                application.customer_type
              }
            />
            <Info label="Region / şəhər" value={application.region} />
            <Info label="Aylıq gəlir" value={formatMoney(application.monthly_income)} />
            <Info
              label="İş vəziyyəti"
              value={
                EMPLOYMENT_TYPE_LABELS[application.employment_type] ||
                application.employment_type
              }
            />
            <Info label="İş yeri" value={application.workplace} />
            <Info label="VÖEN" value={application.voen} />
          </div>
        </section>

        <section style={styles.panel}>
          <PanelHeader
            title="Kredit məlumatları"
            desc="Seçilmiş məhsul, bank və kalkulyator nəticəsi."
          />

          <div style={styles.infoGrid}>
            <Info label="Kredit növü" value={application.credit_type} />
            <Info label="Bank / təşkilat" value={application.organization} />
            <Info
              label="Seçilmiş təşkilat ID"
              value={application.selected_organization_id}
            />
            <Info label="Məbləğ" value={formatMoney(application.amount)} />
            <Info
              label="Müddət"
              value={application.term_months ? `${application.term_months} ay` : "-"}
            />
            <Info label="Faiz" value={formatPercent(application.interest_rate)} />
            <Info
              label="Təxmini aylıq ödəniş"
              value={formatMoney(application.monthly_payment)}
            />
          </div>
        </section>

        <section style={styles.panel}>
          <PanelHeader
            title="Paylaşım məlumatları"
            desc="Müraciətin marketplace və ya yalnız seçilmiş təşkilat axını."
          />

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Paylaşım tipi</div>
              <div style={styles.infoValue}>
                <span style={{ ...styles.statusBadge, ...distributionStyle }}>
                  {getDistributionLabel(application.distribution_type)}
                </span>
              </div>
            </div>

            <Info label="Seçilmiş təşkilat" value={selectedOrganizationName} />
          </div>
        </section>

        <section style={styles.panel}>
          <PanelHeader
            title="Problemli müştəri"
            desc="Müştərini problemli kimi işarələ və səbəb qeyd et."
          />

          {flagMessage ? <div style={styles.inlineMessage}>{flagMessage}</div> : null}

          <div style={styles.formBlock}>
            <label style={styles.formLabel}>Səbəb (istəyə uyğun)</label>

            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="İmtina səbəbi və ya problem qeydi yazın"
              style={styles.textarea}
            />
          </div>

          <button
            type="button"
            onClick={createProblemFlag}
            disabled={flagLoading || activeFlagExists}
            style={{
              ...styles.dangerButton,
              ...(flagLoading || activeFlagExists ? styles.disabled : {}),
            }}
          >
            {flagLoading
              ? "Qeyd olunur..."
              : activeFlagExists
              ? "Aktiv problemli qeyd var"
              : "Problemli müştəri kimi işarələ"}
          </button>

          <div style={styles.flagListBlock}>
            <div style={styles.flagListTitle}>Mövcud problemli qeydlər</div>

            {!customerFlags.length ? (
              <div style={styles.emptyFlagBox}>
                Bu müraciət üzrə problemli qeyd yoxdur.
              </div>
            ) : (
              <div style={styles.flagList}>
                {customerFlags.map((flag) => {
                  const flagStatusStyle = getFlagStatusStyles(flag.status);

                  return (
                    <div key={flag.id} style={styles.flagItem}>
                      <div style={styles.flagTop}>
                        <span style={{ ...styles.statusBadge, ...flagStatusStyle }}>
                          {FLAG_STATUS_LABELS[flag.status] || flag.status || "-"}
                        </span>

                        <span style={styles.flagDate}>
                          {formatDateTime(flag.created_at)}
                        </span>
                      </div>

                      <div style={styles.flagReasonText}>
                        {flag.reason || "Səbəb qeyd olunmayıb."}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section style={styles.panel}>
          <PanelHeader title="Qeyd" desc="Müştərinin əlavə qeydi." />

          <div style={styles.noteBox}>
            {application.note || "Qeyd yoxdur."}
          </div>
        </section>
      </div>

      <section style={styles.panel}>
        <PanelHeader
          title="Gələcək kabinet strukturu"
          desc="Bu bloklar sonradan müştəri kabineti və lead axını üçün genişləndiriləcək."
        />

        <div style={styles.futureGrid}>
          <div style={styles.futureCard}>
            <div style={styles.futureTitle}>Status timeline</div>
            <div style={styles.futureText}>
              Status dəyişiklikləri və tarixçəsi ayrıca göstəriləcək.
            </div>
          </div>

          <div style={styles.futureCard}>
            <div style={styles.futureTitle}>Problemli müştəri / etiraz</div>
            <div style={styles.futureText}>
              Bank imtinası, problemli qeyd və “Etiraz et” axını burada bağlanacaq.
            </div>
          </div>

          <div style={styles.futureCard}>
            <div style={styles.futureTitle}>Sənədlər</div>
            <div style={styles.futureText}>
              Müştərinin yüklədiyi arayış, müqavilə və digər fayllar burada görünəcək.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PanelHeader({ title, desc }) {
  return (
    <div style={styles.panelHeader}>
      <h2 style={styles.panelTitle}>{title}</h2>
      <p style={styles.panelDesc}>{desc}</p>
    </div>
  );
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

const styles = {
  loadingBox: {
    padding: "40px",
    fontSize: "15px",
    color: "#475569",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "56px",
    lineHeight: 1.05,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    fontSize: "16px",
    color: "#475569",
    lineHeight: 1.7,
    maxWidth: "920px",
  },

  backLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
  },

  messageBox: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #dbe4ee",
    borderRadius: "18px",
    padding: "14px 16px",
    marginBottom: "18px",
    fontSize: "14px",
  },

  inlineMessage: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #dbe4ee",
    borderRadius: "14px",
    padding: "12px 14px",
    marginBottom: "14px",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },

  summaryCard: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },

  summaryLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
  },

  summaryValue: {
    fontSize: "30px",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.1,
  },

  summaryValueSmall: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#0f172a",
    lineHeight: 1.3,
  },

  adminSelect: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "14px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 14px",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  disabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
    marginBottom: "18px",
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "28px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },

  panelHeader: {
    marginBottom: "18px",
  },

  panelTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    color: "#0f172a",
  },

  panelDesc: {
    marginTop: "8px",
    marginBottom: 0,
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#64748b",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },

  infoItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "14px",
  },

  infoLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
  },

  infoValue: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#0f172a",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  formBlock: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "14px",
  },

  formLabel: {
    display: "block",
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    border: "1px solid #dbe4ee",
    borderRadius: "14px",
    background: "#ffffff",
    padding: "14px",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#0f172a",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },

  dangerButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "16px",
    minHeight: "44px",
    borderRadius: "14px",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#991b1b",
    padding: "0 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  flagListBlock: {
    marginTop: "20px",
  },

  flagListTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "10px",
  },

  emptyFlagBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
    fontSize: "14px",
    color: "#64748b",
  },

  flagList: {
    display: "grid",
    gap: "10px",
  },

  flagItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
  },

  flagTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },

  flagDate: {
    fontSize: "13px",
    color: "#64748b",
  },

  flagReasonText: {
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#334155",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  noteBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "16px",
    minHeight: "120px",
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#334155",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  futureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },

  futureCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "16px",
  },

  futureTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "8px",
  },

  futureText: {
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#64748b",
  },
};
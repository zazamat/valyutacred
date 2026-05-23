const REFERRAL_PREFIX = "VB";
const REFERRAL_NUMBER_LENGTH = 6;
const DEFAULT_ATTRIBUTION_WINDOW_DAYS = 90;

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toBoolean(value, fallback = false) {
  if (value === null || value === undefined) return fallback;
  return Boolean(value);
}

function getYearPrefix(year = new Date().getFullYear()) {
  return `${REFERRAL_PREFIX}-${year}`;
}

function parseReferralSequence(referralId, year = new Date().getFullYear()) {
  const match = String(referralId || "").match(
    new RegExp(`^${REFERRAL_PREFIX}-${year}-(\\d+)$`)
  );

  return match ? Number(match[1]) : 0;
}

function formatReferralId(sequence, year = new Date().getFullYear()) {
  return `${getYearPrefix(year)}-${String(sequence).padStart(
    REFERRAL_NUMBER_LENGTH,
    "0"
  )}`;
}

export async function generateNextReferralId(
  supabase,
  year = new Date().getFullYear(),
  sequenceOffset = 0
) {
  const { data, error } = await supabase
    .from("applications")
    .select("referral_id")
    .like("referral_id", `${getYearPrefix(year)}-%`)
    .order("referral_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Referral nömrəsi yoxlanmadı: " + error.message);
  }

  const lastSequence = parseReferralSequence(data?.referral_id, year);
  return formatReferralId(lastSequence + 1 + sequenceOffset, year);
}

function resolveFeeFlags(model, settings = {}) {
  if (model === "lead_fee_only") {
    return { leadFeeEnabled: true, successFeeEnabled: false };
  }

  if (model === "success_fee_only") {
    return { leadFeeEnabled: false, successFeeEnabled: true };
  }

  if (model === "hybrid") {
    return { leadFeeEnabled: true, successFeeEnabled: true };
  }

  if (model === "free_test" || model === "disabled") {
    return { leadFeeEnabled: false, successFeeEnabled: false };
  }

  return {
    leadFeeEnabled: toBoolean(settings.lead_fee_enabled),
    successFeeEnabled: toBoolean(settings.success_fee_enabled),
  };
}

function buildSnapshotFromSettings(settings, source) {
  const model = settings?.monetization_model || "lead_fee_only";
  const { leadFeeEnabled, successFeeEnabled } = resolveFeeFlags(model, settings);
  const attributionWindowDays =
    toNumberOrNull(settings?.attribution_window_days) || DEFAULT_ATTRIBUTION_WINDOW_DAYS;
  const attributionExpiresAt = new Date(
    Date.now() + attributionWindowDays * 24 * 60 * 60 * 1000
  ).toISOString();

  return {
    monetization_model: model,
    applied_monetization_source: source,
    lead_fee_enabled: leadFeeEnabled,
    lead_fee_amount: leadFeeEnabled ? toNumberOrNull(settings?.lead_fee_amount) : null,
    lead_fee_status: "not_charged",
    success_fee_enabled: successFeeEnabled,
    success_fee_type: successFeeEnabled ? settings?.success_fee_type || "percent" : null,
    success_fee_percent:
      successFeeEnabled && (settings?.success_fee_type || "percent") === "percent"
        ? toNumberOrNull(settings?.success_fee_percent)
        : null,
    success_fee_fixed_amount:
      successFeeEnabled && settings?.success_fee_type === "fixed"
        ? toNumberOrNull(settings?.success_fee_fixed_amount)
        : null,
    success_fee_amount: 0,
    success_fee_status: successFeeEnabled ? "pending" : "not_applicable",
    credit_result_status: "pending",
    attribution_window_days: attributionWindowDays,
    attribution_expires_at: attributionExpiresAt,
    commission_dispute_status: "none",
  };
}

export async function buildMonetizationSnapshot(supabase, productId, organizationId) {
  const productQuery = supabase
    .from("products")
    .select(
      "id, organization_id, use_custom_monetization, monetization_model, lead_fee_enabled, lead_fee_amount, success_fee_enabled, success_fee_type, success_fee_percent, success_fee_fixed_amount, attribution_window_days"
    )
    .eq("id", Number(productId))
    .maybeSingle();

  const organizationQuery = supabase
    .from("organizations")
    .select(
      "id, monetization_model, lead_fee_enabled, lead_fee_amount, success_fee_enabled, success_fee_type, success_fee_percent, success_fee_fixed_amount, attribution_window_days"
    )
    .eq("id", Number(organizationId))
    .maybeSingle();

  const [productRes, organizationRes] = await Promise.all([productQuery, organizationQuery]);

  if (productRes.error) {
    throw new Error("Məhsul monetizasiya ayarı oxunmadı: " + productRes.error.message);
  }

  if (organizationRes.error) {
    throw new Error(
      "Təşkilat monetizasiya ayarı oxunmadı: " + organizationRes.error.message
    );
  }

  if (productRes.data?.use_custom_monetization) {
    return buildSnapshotFromSettings(productRes.data, "product");
  }

  if (organizationRes.data?.monetization_model) {
    return buildSnapshotFromSettings(organizationRes.data, "organization");
  }

  return buildSnapshotFromSettings(
    {
      monetization_model: "lead_fee_only",
      lead_fee_enabled: true,
      lead_fee_amount: 0,
      success_fee_enabled: false,
      attribution_window_days: DEFAULT_ATTRIBUTION_WINDOW_DAYS,
    },
    "default"
  );
}

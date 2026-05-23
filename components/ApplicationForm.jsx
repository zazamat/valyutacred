"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildMonetizationSnapshot,
  generateNextReferralId,
} from "../lib/applicationMonetization";
import { supabase } from "../lib/supabaseClient";

const emptyCreditSelection = {
  credit_form_id: "",
  organization_id: "",
  product_id: "",
  amount: 0,
  term_months: 0,
};

const initialCreditState = {
  individual: { ...emptyCreditSelection },
  business: { ...emptyCreditSelection },
};

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/ə/g, "e")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c");
}

function isCreditFormForCustomer(form, customerType) {
  const text = normalizeText(form?.name || "");

  if (customerType === "business") {
    return text.includes("biznes") || text.includes("business");
  }

  return text.includes("ferdi") || text.includes("individual");
}

function sameCreditSelection(a, b) {
  return (
    String(a.credit_form_id || "") === String(b.credit_form_id || "") &&
    String(a.organization_id || "") === String(b.organization_id || "") &&
    String(a.product_id || "") === String(b.product_id || "") &&
    Number(a.amount || 0) === Number(b.amount || 0) &&
    Number(a.term_months || 0) === Number(b.term_months || 0)
  );
}

function getDefaultAmount(product) {
  const minAmount = Number(product?.min_amount || 0);
  const maxAmount = Number(product?.max_amount || 0);

  if (minAmount > 0) return minAmount;
  if (maxAmount >= 1000) return 1000;
  if (maxAmount > 0) return maxAmount;

  return 1;
}

function isPublicOrganizationVisible(organization) {
  return (
    organization?.public_visible !== false &&
    organization?.partner_status !== "hidden"
  );
}

function getOrganizationDisplayName(organization) {
  if (!organization) return "";

  if (organization.show_brand_name === false) {
    return organization.public_display_name?.trim() || "Partnyor Bank";
  }

  return organization.name || organization.public_display_name?.trim() || "Partnyor Bank";
}

function isReferralConflict(error) {
  return error?.code === "23505" && String(error.message || "").includes("referral_id");
}

export default function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [customerType, setCustomerType] = useState("individual");
  const [creditData, setCreditData] = useState(initialCreditState);
  const [creditForms, setCreditForms] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    monthly_income: "",
    employment_type: "",
    region: "",
    voen: "",
    note: "",
    phone_country_code: "+994",
    phone: "",
    distribution_type: "",
  });

  const activeCredit = creditData[customerType];

  useEffect(() => {
    async function loadPublicProducts() {
      setDataLoading(true);
      setDataError("");

      const [formsRes, typesRes, orgsRes, productsRes] = await Promise.all([
        supabase
          .from("credit_forms")
          .select("id, name, status")
          .eq("status", "active")
          .order("id", { ascending: true }),
        supabase
          .from("product_types")
          .select("id, name, status")
          .eq("status", "active")
          .order("id", { ascending: true }),
        supabase
          .from("organizations")
          .select(
            "id, name, status, approval_status, public_visible, show_brand_name, show_logo, public_display_name, partner_status"
          )
          .eq("status", "active")
          .eq("approval_status", "approved")
          .order("id", { ascending: true }),
        supabase
          .from("products")
          .select(
            "id, product_name, credit_form_id, organization_id, product_type_id, min_amount, max_amount, min_term_months, max_term_months, default_interest, status, approval_status, is_active"
          )
          .eq("is_active", true)
          .eq("status", "active")
          .eq("approval_status", "approved")
          .order("id", { ascending: true }),
      ]);

      const failed = [formsRes, typesRes, orgsRes, productsRes].find(
        (res) => res.error
      );

      if (failed?.error) {
        setDataError("Məhsul məlumatları yüklənmədi: " + failed.error.message);
        setCreditForms([]);
        setProductTypes([]);
        setOrganizations([]);
        setDbProducts([]);
        setDataLoading(false);
        return;
      }

      const nextForms = formsRes.data || [];
      const nextTypes = typesRes.data || [];
      const nextOrgs = orgsRes.data || [];
      const nextProducts = productsRes.data || [];

      const formIds = new Set(nextForms.map((item) => Number(item.id)));
      const typeIds = new Set(nextTypes.map((item) => Number(item.id)));
      const visibleOrgs = nextOrgs.filter(isPublicOrganizationVisible);
      const orgIds = new Set(visibleOrgs.map((item) => Number(item.id)));

      setCreditForms(nextForms);
      setProductTypes(nextTypes);
      setOrganizations(visibleOrgs);
      setDbProducts(
        nextProducts.filter(
          (item) =>
            formIds.has(Number(item.credit_form_id)) &&
            typeIds.has(Number(item.product_type_id)) &&
            orgIds.has(Number(item.organization_id))
        )
      );
      setDataLoading(false);
    }

    loadPublicProducts();
  }, []);

  function getCreditFormsForType(type) {
    const matched = creditForms.filter((item) =>
      isCreditFormForCustomer(item, type)
    );

    return matched.length ? matched : creditForms;
  }

  function getProductsForSelection(selection = {}) {
    return dbProducts.filter((item) => {
      if (
        selection.credit_form_id &&
        String(item.credit_form_id) !== String(selection.credit_form_id)
      ) {
        return false;
      }

      if (
        selection.organization_id &&
        String(item.organization_id) !== String(selection.organization_id)
      ) {
        return false;
      }

      return true;
    });
  }

  useEffect(() => {
    if (dataLoading) return;

    setCreditData((prev) => {
      const current = prev[customerType] || emptyCreditSelection;
      const formsForType = getCreditFormsForType(customerType).filter((form) =>
        dbProducts.some((product) => Number(product.credit_form_id) === Number(form.id))
      );

      const creditFormId = formsForType.some(
        (item) => String(item.id) === String(current.credit_form_id)
      )
        ? current.credit_form_id
        : formsForType[0]?.id || "";

      const organizationIds = new Set(
        creditFormId
          ? getProductsForSelection({ credit_form_id: creditFormId }).map((item) =>
              Number(item.organization_id)
            )
          : []
      );
      const availableOrgs = organizations.filter((item) =>
        organizationIds.has(Number(item.id))
      );

      const organizationId = availableOrgs.some(
        (item) => String(item.id) === String(current.organization_id)
      )
        ? current.organization_id
        : "";

      const availableProducts = organizationId
        ? getProductsForSelection({
            credit_form_id: creditFormId,
            organization_id: organizationId,
          })
        : [];

      const product = availableProducts.some(
        (item) => String(item.id) === String(current.product_id)
      )
        ? availableProducts.find(
            (item) => String(item.id) === String(current.product_id)
          )
        : null;

      const nextSelection = {
        credit_form_id: creditFormId ? String(creditFormId) : "",
        organization_id: organizationId ? String(organizationId) : "",
        product_id: product?.id ? String(product.id) : "",
        amount: product ? getDefaultAmount(product) : 0,
        term_months: product ? Number(product.min_term_months || 0) : 0,
      };

      if (sameCreditSelection(current, nextSelection)) return prev;

      return {
        ...prev,
        [customerType]: nextSelection,
      };
    });
  }, [customerType, dataLoading, creditForms, productTypes, organizations, dbProducts]);

  const selectedProduct = useMemo(
    () =>
      dbProducts.find(
        (item) => String(item.id) === String(activeCredit.product_id)
      ) || null,
    [dbProducts, activeCredit.product_id]
  );

  const selectedProductType = useMemo(
    () =>
      productTypes.find(
        (item) => String(item.id) === String(selectedProduct?.product_type_id)
      ) || null,
    [productTypes, selectedProduct?.product_type_id]
  );

  const selectedOrganization = useMemo(
    () =>
      organizations.find(
        (item) => String(item.id) === String(activeCredit.organization_id)
      ) || null,
    [organizations, activeCredit.organization_id]
  );

  const availableOrganizations = useMemo(() => {
    if (!activeCredit?.credit_form_id) return [];

    const productsForForm = getProductsForSelection({
      credit_form_id: activeCredit.credit_form_id,
    });
    const ids = new Set(
      productsForForm.map((item) => Number(item.organization_id))
    );
    return organizations.filter((item) => ids.has(Number(item.id)));
  }, [activeCredit.credit_form_id, dbProducts, organizations]);

  const availableProducts = useMemo(
    () => {
      if (!activeCredit?.credit_form_id || !activeCredit?.organization_id) {
        return [];
      }

      return getProductsForSelection({
        credit_form_id: activeCredit.credit_form_id,
        organization_id: activeCredit.organization_id,
      });
    },
    [
      activeCredit.credit_form_id,
      activeCredit.organization_id,
      dbProducts,
    ]
  );

  const canCalculate =
    !!selectedProduct && Number(activeCredit.amount) > 0 && Number(activeCredit.term_months) > 0;

  const monthlyPayment = useMemo(() => {
    if (!canCalculate) return 0;

    const principal = Number(activeCredit.amount);
    const months = Number(activeCredit.term_months);
    const annualRate = Number(selectedProduct.default_interest || 0);

    if (!months) return 0;
    if (!annualRate) return Math.round(principal / months);

    const monthlyRate = annualRate / 100 / 12;

    return Math.round(
      (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
    );
  }, [
    canCalculate,
    activeCredit.amount,
    activeCredit.term_months,
    selectedProduct?.default_interest,
  ]);

  function clearError(field) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
    setNotice({ type: "", text: "" });

    if (field === "phone" || field === "phone_country_code") {
      setPhoneVerified(false);
      setOtpCode("");
      setEnteredOtp("");
      clearError("otp");
    }
  }

  function updateActiveCredit(updates) {
    setCreditData((prev) => ({
      ...prev,
      [customerType]: {
        ...prev[customerType],
        ...updates,
      },
    }));
  }

  function handleOrganizationChange(value) {
    updateActiveCredit({
      organization_id: value,
      product_id: "",
      amount: 0,
      term_months: 0,
    });
    clearError("organization_id");
    clearError("bank");
    setNotice({ type: "", text: "" });
  }

  function handleProductChange(value) {
    const product = dbProducts.find((item) => String(item.id) === String(value));

    updateActiveCredit({
      product_id: value,
      amount: product ? getDefaultAmount(product) : 0,
      term_months: product ? Number(product.min_term_months || 0) : 0,
    });
    clearError("product_id");
    setNotice({ type: "", text: "" });
  }

  function handleCreditValueChange(field, value) {
    updateActiveCredit({ [field]: value });
    clearError(field);
    setNotice({ type: "", text: "" });
  }

  function changeCustomerType(type) {
    setCustomerType(type);
    setStep(1);
    setErrors({});
    setNotice({ type: "", text: "" });
  }

  function goNext() {
    const nextErrors = {};

    if (!activeCredit.organization_id) nextErrors.bank = "Bank seçin.";
    if (!activeCredit.product_id || !selectedProduct) nextErrors.product_id = "Məhsul seçin.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setStep(2);
    setNotice({ type: "", text: "" });
  }

  function sendOtp() {
    const phoneError = validatePhone(form.phone_country_code, form.phone);

    if (phoneError) {
      setErrors((prev) => ({ ...prev, phone: phoneError }));
      return;
    }

    setOtpCode("123456");
    setEnteredOtp("");
    setPhoneVerified(false);
    clearError("phone");
    clearError("otp");

    setNotice({
      type: "success",
      text: "Test SMS kodu göndərildi: 123456",
    });
  }

  function verifyOtp() {
    if (!otpCode) {
      setErrors((prev) => ({ ...prev, otp: "Əvvəlcə SMS kod göndərin." }));
      return;
    }

    if (enteredOtp !== otpCode) {
      setErrors((prev) => ({ ...prev, otp: "SMS kod yanlışdır." }));
      return;
    }

    clearError("otp");
    setPhoneVerified(true);
    setNotice({
      type: "",
      text: "",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const nextErrors = {};

    if (!activeCredit.product_id || !selectedProduct) nextErrors.product_id = "Məhsul seçin.";
    if (Number(activeCredit.amount || 0) <= 0) nextErrors.amount = "Kredit mЙ™blЙ™Дџi 0-dan bГ¶yГјk olmalД±dД±r.";
    if (!form.full_name.trim()) nextErrors.full_name = "Ad soyad daxil edin.";
    if (!form.email.trim()) nextErrors.email = "Email daxil edin.";
    if (!form.monthly_income) nextErrors.monthly_income = "Aylıq gəliri daxil edin.";
    if (!form.employment_type) nextErrors.employment_type = "İş vəziyyətini seçin.";
    if (!form.region.trim()) nextErrors.region = "Region daxil edin.";
    if (!form.phone.trim()) nextErrors.phone = "Telefon nömrəsini daxil edin.";
    if (!phoneVerified) nextErrors.otp = "Telefon SMS kodla təsdiqlənməlidir.";
    if (!form.distribution_type) nextErrors.distribution_type = "Təklif seçimini edin.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setNotice({
        type: "error",
        text: "Məcburi sahələri tamamlayın.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setNotice({ type: "", text: "" });

      const fullPhone = `${form.phone_country_code}${form.phone.trim()}`;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: existingApplication, error: checkError } = await supabase
        .from("applications")
        .select("id, created_at")
        .eq("phone", fullPhone)
        .eq("product_id", Number(selectedProduct.id))
        .gte("created_at", thirtyDaysAgo.toISOString())
        .limit(1)
        .maybeSingle();

      if (checkError) {
        setNotice({
          type: "error",
          text: "Müraciət yoxlanarkən xəta baş verdi.",
        });
        return;
      }

      if (existingApplication) {
        setErrors((prev) => ({
          ...prev,
          submit:
            "Bu məhsul üzrə son 30 gün ərzində müraciət etmisiniz. Növbəti müraciət üçün gözləyin.",
        }));
        return;
      }

      const organizationId = Number(selectedProduct.organization_id);
      const monetizationSnapshot = await buildMonetizationSnapshot(
        supabase,
        selectedProduct.id,
        organizationId
      );

      const applicationPayload = {
        product_id: Number(selectedProduct.id),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: fullPhone,
        amount: Number(activeCredit.amount),
        status: "new",

        customer_type: customerType,
        credit_type: selectedProductType?.name || selectedProduct.product_name || "",
        organization: getOrganizationDisplayName(selectedOrganization),
        selected_organization_id: organizationId,

        term_months: Number(activeCredit.term_months),
        interest_rate: Number(selectedProduct.default_interest || 0),
        monthly_payment: monthlyPayment,

        monthly_income: Number(form.monthly_income),
        employment_type: form.employment_type,
        region: form.region.trim(),
        voen: form.voen.trim() || null,
        note: form.note.trim() || null,

        distribution_type: form.distribution_type,
        ...monetizationSnapshot,
      };

      let error = null;

      for (let attempt = 0; attempt < 100; attempt += 1) {
        const referralId = await generateNextReferralId(
          supabase,
          new Date().getFullYear(),
          attempt
        );
        const insertResult = await supabase.from("applications").insert([
          {
            ...applicationPayload,
            referral_id: referralId,
          },
        ]);

        error = insertResult.error;

        if (!isReferralConflict(error)) {
          break;
        }
      }

      if (error) {
        setErrors((prev) => ({
          ...prev,
          submit: "Xəta baş verdi: " + error.message,
        }));
        return;
      }

      setNotice({
        type: "success",
        text: "Müraciət uğurla göndərildi.",
      });

      setErrors({});
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: "Gözlənilməyən xəta baş verdi.",
      }));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const noProductsForCurrentType =
    !dataLoading &&
    !dataError &&
    availableOrganizations.length === 0;
  const noProductsForSelectedBank =
    !dataLoading &&
    !dataError &&
    !!activeCredit.organization_id &&
    availableProducts.length === 0;

  return (
    <form onSubmit={handleSubmit} style={formBox}>
      <div>
        <div style={stepBadge}>Addım {step}/2</div>
        <h2 style={title}>
          {step === 1 ? "Kredit kalkulyatoru" : "Qeydiyyat və təsdiq"}
        </h2>
        <p style={desc}>
          {step === 1
            ? "Bankı, məhsulu və kredit şərtlərini seçin."
            : "Məlumatlarınızı daxil edin və telefonu SMS kodla təsdiqləyin."}
        </p>
      </div>

      {dataError ? <div style={errorNotice}>{dataError}</div> : null}

      {noProductsForCurrentType ? (
        <div style={infoNotice}>Hazırda bu bölmə üzrə aktiv məhsul yoxdur.</div>
      ) : null}

      {notice.text && (
        <div style={notice.type === "success" ? successNotice : errorNotice}>
          {notice.text}
        </div>
      )}

      {step === 1 && (
        <>
          <div style={tabWrap}>
            <button
              type="button"
              onClick={() => changeCustomerType("individual")}
              style={customerType === "individual" ? activeTab : passiveTab}
            >
              Fərdi
            </button>

            <button
              type="button"
              onClick={() => changeCustomerType("business")}
              style={customerType === "business" ? activeTab : passiveTab}
            >
              Biznes
            </button>
          </div>

          <select
            value={activeCredit.organization_id}
            onChange={(e) => handleOrganizationChange(e.target.value)}
            style={getInputStyle(errors.bank, !activeCredit.organization_id)}
            disabled={dataLoading || !availableOrganizations.length}
          >
            <option value="">Bank seçin — məcburi</option>
            {availableOrganizations.map((org) => (
              <option key={org.id} value={org.id}>
                {getOrganizationDisplayName(org)}
              </option>
            ))}
          </select>
          {errors.bank && <div style={errorText}>{errors.bank}</div>}

          <select
            value={activeCredit.product_id}
            onChange={(e) => handleProductChange(e.target.value)}
            style={getInputStyle(errors.product_id, !activeCredit.product_id)}
            disabled={
              dataLoading ||
              !activeCredit.organization_id ||
              !availableProducts.length
            }
          >
            <option value="">
              {activeCredit.organization_id ? "Məhsul seçin — məcburi" : "Əvvəl bank seçin"}
            </option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.product_name}
              </option>
            ))}
          </select>
          {errors.product_id && <div style={errorText}>{errors.product_id}</div>}

          {noProductsForSelectedBank ? (
            <div style={infoNotice}>Seçilmiş bank üzrə aktiv məhsul tapılmadı.</div>
          ) : null}

          {selectedProductType ? (
            <div style={miniText}>Məhsul növü: {selectedProductType.name}</div>
          ) : null}

          {selectedProduct ? (
            <>
              <div style={sliderBox}>
                <div style={sliderHeader}>
                  <span>Kredit məbləği</span>
                  <strong>{formatMoney(activeCredit.amount)} AZN</strong>
                </div>

                <input
                  type="range"
                  min={Number(selectedProduct.min_amount || 0)}
                  max={Number(selectedProduct.max_amount || 0)}
                  step="100"
                  value={activeCredit.amount}
                  onChange={(e) =>
                    handleCreditValueChange("amount", Number(e.target.value))
                  }
                  style={{ width: "100%" }}
                />

                <div style={rangeText}>
                  <span>{formatMoney(selectedProduct.min_amount)} AZN</span>
                  <span>{formatMoney(selectedProduct.max_amount)} AZN</span>
                </div>
              </div>
              {errors.amount && <div style={errorText}>{errors.amount}</div>}

              <div style={sliderBox}>
                <div style={sliderHeader}>
                  <span>Müddət</span>
                  <strong>{activeCredit.term_months} ay</strong>
                </div>

                <input
                  type="range"
                  min={Number(selectedProduct.min_term_months || 0)}
                  max={Number(selectedProduct.max_term_months || 0)}
                  step="1"
                  value={activeCredit.term_months}
                  onChange={(e) =>
                    handleCreditValueChange("term_months", Number(e.target.value))
                  }
                  style={{ width: "100%" }}
                />

                <div style={rangeText}>
                  <span>{selectedProduct.min_term_months} ay</span>
                  <span>{selectedProduct.max_term_months} ay</span>
                </div>
              </div>

              <div style={resultBox}>
                {canCalculate ? (
                  <>
                    <div style={miniText}>Default faiz dərəcəsi</div>
                    <strong>{Number(selectedProduct.default_interest || 0)}%</strong>

                    <div style={{ height: "12px" }} />

                    <div style={miniText}>Təxmini aylıq ödəniş</div>
                    <div style={paymentText}>{formatMoney(monthlyPayment)} AZN</div>
                  </>
                ) : (
                  <div style={{ color: "#047857", fontWeight: 900 }}>
                    Hesablama üçün məhsul seçin.
                  </div>
                )}
              </div>
            </>
          ) : null}

          <button
            type="button"
            onClick={goNext}
            style={{
              ...submitBtn,
              opacity: selectedProduct ? 1 : 0.5,
              cursor: selectedProduct ? "pointer" : "not-allowed",
            }}
            disabled={!selectedProduct || dataLoading}
          >
            Davam et
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <input
            placeholder="Ad soyad — məcburi"
            value={form.full_name}
            onChange={(e) => handleFormChange("full_name", e.target.value)}
            style={getInputStyle(errors.full_name)}
          />
          {errors.full_name && <div style={errorText}>{errors.full_name}</div>}

          <input
            type="email"
            placeholder="Email / login — məcburi"
            value={form.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            style={getInputStyle(errors.email)}
          />
          {errors.email && <div style={errorText}>{errors.email}</div>}

          <input
            type="number"
            placeholder="Aylıq gəlir — məcburi"
            value={form.monthly_income}
            onChange={(e) => handleFormChange("monthly_income", e.target.value)}
            style={getInputStyle(errors.monthly_income)}
          />
          {errors.monthly_income && (
            <div style={errorText}>{errors.monthly_income}</div>
          )}

          <select
            value={form.employment_type}
            onChange={(e) => handleFormChange("employment_type", e.target.value)}
            style={getInputStyle(errors.employment_type, !form.employment_type)}
          >
            <option value="" disabled>
              İş vəziyyəti — məcburi
            </option>
            <option value="official">Rəsmi iş yeri</option>
            <option value="business_owner">Biznes sahibi</option>
            <option value="freelancer">Freelancer</option>
            <option value="self_employed">Fərdi fəaliyyət</option>
            <option value="other">Digər</option>
          </select>
          {errors.employment_type && (
            <div style={errorText}>{errors.employment_type}</div>
          )}

          <input
            placeholder="Şəhər / Region — məcburi"
            value={form.region}
            onChange={(e) => handleFormChange("region", e.target.value)}
            style={getInputStyle(errors.region)}
          />
          {errors.region && <div style={errorText}>{errors.region}</div>}

          {customerType === "business" && (
            <input
              placeholder="VÖEN — istəyə uyğun"
              value={form.voen}
              onChange={(e) => handleFormChange("voen", e.target.value)}
              style={input}
            />
          )}

          <textarea
            placeholder="Əlavə qeyd — istəyə uyğun"
            value={form.note}
            onChange={(e) => handleFormChange("note", e.target.value)}
            style={{ ...input, minHeight: "90px", resize: "vertical" }}
          />

          <div style={phoneGrid}>
            <select
              value={form.phone_country_code}
              onChange={(e) =>
                handleFormChange("phone_country_code", e.target.value)
              }
              style={input}
            >
              <option value="+994">🇦🇿 +994</option>
              <option value="+90">🇹🇷 +90</option>
              <option value="+1">🇺🇸 +1</option>
            </select>

            <input
              placeholder="Telefon — məcburi"
              value={form.phone}
              onChange={(e) => handleFormChange("phone", e.target.value)}
              style={getInputStyle(errors.phone)}
            />
          </div>
          {errors.phone && <div style={errorText}>{errors.phone}</div>}

          <div style={phoneGrid}>
            <button type="button" onClick={sendOtp} style={backBtn}>
              SMS kod göndər
            </button>

            <input
              placeholder="SMS kod — məcburi"
              value={enteredOtp}
              onChange={(e) => {
                setEnteredOtp(e.target.value);
                clearError("otp");
                setNotice({ type: "", text: "" });
              }}
              style={getInputStyle(errors.otp)}
            />
          </div>
          {errors.otp && <div style={errorText}>{errors.otp}</div>}

          <button type="button" onClick={verifyOtp} style={verifyBtn}>
            {phoneVerified ? "Telefon təsdiqləndi ✓" : "Kodu təsdiqlə"}
          </button>

          <div style={errors.distribution_type ? errorRadioBox : radioBox}>
            <div style={radioTitle}>Təklif seçimi — məcburi</div>

            <label style={radioRow}>
              <input
                type="radio"
                name="distribution_type"
                checked={form.distribution_type === "open_market"}
                onChange={() =>
                  handleFormChange("distribution_type", "open_market")
                }
              />
              <span>Bütün banklar təklif verə bilər</span>
            </label>

            <label style={radioRow}>
              <input
                type="radio"
                name="distribution_type"
                checked={form.distribution_type === "only_selected"}
                onChange={() =>
                  handleFormChange("distribution_type", "only_selected")
                }
              />
              <span>Yalnız seçdiyim bank təklif göndərə bilər</span>
            </label>
          </div>
          {errors.distribution_type && (
            <div style={errorText}>{errors.distribution_type}</div>
          )}

          {errors.submit && <div style={errorNotice}>{errors.submit}</div>}

          <div style={twoCol}>
            <button type="button" onClick={() => setStep(1)} style={backBtn}>
              Geri
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !phoneVerified || !form.distribution_type}
              style={{
                ...submitBtn,
                opacity: phoneVerified && form.distribution_type ? 1 : 0.5,
                cursor:
                  phoneVerified && form.distribution_type
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              {isSubmitting ? "Göndərilir..." : "Müraciəti göndər"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

function validatePhone(countryCode, phone) {
  const cleanPhone = String(phone || "").replace(/\D/g, "");

  if (!cleanPhone) {
    return "Telefon nömrəsini daxil edin.";
  }

  if (countryCode === "+994") {
    if (cleanPhone.startsWith("0")) {
      return "Nömrəni 0-sız yazın. Məsələn: 502430099";
    }

    if (cleanPhone.length !== 9) {
      return "Azərbaycan nömrəsi 9 rəqəm olmalıdır. Məsələn: 502430099";
    }
  }

  return "";
}

function formatMoney(value) {
  return String(Number(value) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function getInputStyle(hasError, isPlaceholder = false) {
  return {
    ...input,
    border: hasError ? "1px solid #dc2626" : "1px solid #cbd5e1",
    color: isPlaceholder ? "#94a3b8" : "#0f172a",
  };
}

const formBox = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "28px",
  display: "grid",
  gap: "14px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
};

const stepBadge = {
  display: "inline-flex",
  padding: "6px 12px",
  borderRadius: "999px",
  background: "#ecfdf5",
  color: "#047857",
  fontSize: "12px",
  fontWeight: 900,
  marginBottom: "10px",
};

const title = { margin: 0, fontSize: "30px", fontWeight: 950 };

const desc = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
};

const tabWrap = { display: "flex", gap: "10px" };

const activeTab = {
  flex: 1,
  padding: "12px",
  border: "none",
  borderRadius: "14px",
  background: "#059669",
  color: "#ffffff",
  fontWeight: 900,
  cursor: "pointer",
};

const passiveTab = {
  flex: 1,
  padding: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "14px",
  background: "#ffffff",
  fontWeight: 900,
  cursor: "pointer",
};

const input = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "14px",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
  background: "#ffffff",
};

const sliderBox = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "16px",
};

const sliderHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "10px",
  color: "#0f172a",
};

const rangeText = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "12px",
  color: "#64748b",
  marginTop: "6px",
};

const resultBox = {
  background: "#ecfdf5",
  border: "1px solid #a7f3d0",
  borderRadius: "18px",
  padding: "16px",
};

const miniText = {
  color: "#047857",
  fontSize: "13px",
  fontWeight: 800,
};

const paymentText = {
  fontSize: "30px",
  fontWeight: 950,
  color: "#059669",
};

const submitBtn = {
  border: "none",
  borderRadius: "14px",
  padding: "15px",
  background: "#059669",
  color: "#ffffff",
  fontWeight: 950,
  fontSize: "15px",
  cursor: "pointer",
};

const backBtn = {
  border: "1px solid #cbd5e1",
  borderRadius: "14px",
  padding: "15px",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 950,
  fontSize: "15px",
  cursor: "pointer",
};

const verifyBtn = {
  border: "none",
  borderRadius: "14px",
  padding: "15px",
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: 950,
  fontSize: "15px",
  cursor: "pointer",
};

const phoneGrid = {
  display: "grid",
  gridTemplateColumns: "130px 1fr",
  gap: "10px",
};

const twoCol = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "10px",
};

const radioBox = {
  display: "grid",
  gap: "10px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "14px",
};

const errorRadioBox = {
  ...radioBox,
  border: "1px solid #dc2626",
};

const radioTitle = {
  fontSize: "13px",
  fontWeight: 900,
  color: "#475569",
};

const radioRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "14px",
  lineHeight: 1.5,
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
};

const errorText = {
  marginTop: "-8px",
  fontSize: "12px",
  color: "#dc2626",
  fontWeight: 700,
};

const successNotice = {
  background: "#ecfdf5",
  border: "1px solid #a7f3d0",
  color: "#047857",
  borderRadius: "14px",
  padding: "12px 14px",
  fontSize: "13px",
  fontWeight: 800,
};

const infoNotice = {
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  color: "#475569",
  borderRadius: "14px",
  padding: "12px 14px",
  fontSize: "13px",
  fontWeight: 800,
};

const errorNotice = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#dc2626",
  borderRadius: "14px",
  padding: "12px 14px",
  fontSize: "13px",
  fontWeight: 800,
};

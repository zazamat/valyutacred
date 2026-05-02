"use client";

import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const banks = [
  { id: 1, name: "Kapital Bank" },
  { id: 2, name: "Avtogold" },
];

const products = {
  individual: {
    "Nağd kredit": { minAmount: 500, maxAmount: 30000, minTerm: 6, maxTerm: 60, defaultRate: 18 },
    Avtokredit: { minAmount: 5000, maxAmount: 80000, minTerm: 12, maxTerm: 60, defaultRate: 14 },
    İpoteka: { minAmount: 20000, maxAmount: 250000, minTerm: 60, maxTerm: 300, defaultRate: 8 },
    "Lombard krediti": { minAmount: 300, maxAmount: 20000, minTerm: 3, maxTerm: 36, defaultRate: 24 },
  },
  business: {
    "Biznes krediti": { minAmount: 5000, maxAmount: 150000, minTerm: 12, maxTerm: 84, defaultRate: 16 },
  },
};

const initialCreditState = {
  individual: { credit_type: "Nağd kredit", bank: "", amount: 500, term_months: 6 },
  business: { credit_type: "Biznes krediti", bank: "", amount: 5000, term_months: 12 },
};

export default function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [customerType, setCustomerType] = useState("individual");
  const [creditData, setCreditData] = useState(initialCreditState);
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
  const activeProducts = products[customerType];
  const selectedProduct = activeProducts[activeCredit.credit_type];
  const canCalculate = activeCredit.credit_type && activeCredit.bank;

  const monthlyPayment = useMemo(() => {
    if (!canCalculate) return 0;

    const principal = Number(activeCredit.amount);
    const months = Number(activeCredit.term_months);
    const annualRate = selectedProduct.defaultRate;
    const monthlyRate = annualRate / 100 / 12;

    return Math.round(
      (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
    );
  }, [canCalculate, activeCredit.amount, activeCredit.term_months, selectedProduct.defaultRate]);

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

  function handleCreditChange(field, value) {
    setCreditData((prev) => ({
      ...prev,
      [customerType]: {
        ...prev[customerType],
        [field]: value,
      },
    }));

    clearError(field);
    setNotice({ type: "", text: "" });
  }

  function handleCreditTypeChange(value) {
    const product = products[customerType][value];

    setCreditData((prev) => ({
      ...prev,
      [customerType]: {
        ...prev[customerType],
        credit_type: value,
        amount: product.minAmount,
        term_months: product.minTerm,
      },
    }));

    clearError("credit_type");
    setNotice({ type: "", text: "" });
  }

  function changeCustomerType(type) {
    setCustomerType(type);
    setErrors({});
    setNotice({ type: "", text: "" });
  }

  function goNext() {
    const nextErrors = {};

    if (!activeCredit.credit_type) nextErrors.credit_type = "Kredit növünü seçin.";
    if (!activeCredit.bank) nextErrors.bank = "Bank seçin.";

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
        .eq("credit_type", activeCredit.credit_type)
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

      const { error } = await supabase.from("applications").insert([
        {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: fullPhone,
          amount: Number(activeCredit.amount),
          status: "new",

          customer_type: customerType,
          credit_type: activeCredit.credit_type,
          organization:
            banks.find((bank) => bank.id === Number(activeCredit.bank))?.name || "",
          selected_organization_id: Number(activeCredit.bank),

          term_months: Number(activeCredit.term_months),
          interest_rate: selectedProduct.defaultRate,
          monthly_payment: monthlyPayment,

          monthly_income: Number(form.monthly_income),
          employment_type: form.employment_type,
          region: form.region.trim(),
          voen: form.voen.trim() || null,
          note: form.note.trim() || null,

          distribution_type: form.distribution_type,
        },
      ]);

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

          {customerType === "individual" && (
            <>
              <select
                value={activeCredit.credit_type}
                onChange={(e) => handleCreditTypeChange(e.target.value)}
                style={getInputStyle(errors.credit_type)}
              >
                {Object.keys(activeProducts).map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>

              {errors.credit_type && (
                <div style={errorText}>{errors.credit_type}</div>
              )}
            </>
          )}

          <select
            value={activeCredit.bank}
            onChange={(e) => handleCreditChange("bank", e.target.value)}
            style={getInputStyle(errors.bank, !activeCredit.bank)}
          >
            <option value="" disabled>
              Bank seçin — məcburi
            </option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </select>
          {errors.bank && <div style={errorText}>{errors.bank}</div>}

          <div style={sliderBox}>
            <div style={sliderHeader}>
              <span>Kredit məbləği</span>
              <strong>{formatMoney(activeCredit.amount)} AZN</strong>
            </div>

            <input
              type="range"
              min={selectedProduct.minAmount}
              max={selectedProduct.maxAmount}
              step="100"
              value={activeCredit.amount}
              onChange={(e) =>
                handleCreditChange("amount", Number(e.target.value))
              }
              style={{ width: "100%" }}
            />

            <div style={rangeText}>
              <span>{formatMoney(selectedProduct.minAmount)} AZN</span>
              <span>{formatMoney(selectedProduct.maxAmount)} AZN</span>
            </div>
          </div>

          <div style={sliderBox}>
            <div style={sliderHeader}>
              <span>Müddət</span>
              <strong>{activeCredit.term_months} ay</strong>
            </div>

            <input
              type="range"
              min={selectedProduct.minTerm}
              max={selectedProduct.maxTerm}
              step="1"
              value={activeCredit.term_months}
              onChange={(e) =>
                handleCreditChange("term_months", Number(e.target.value))
              }
              style={{ width: "100%" }}
            />

            <div style={rangeText}>
              <span>{selectedProduct.minTerm} ay</span>
              <span>{selectedProduct.maxTerm} ay</span>
            </div>
          </div>

          <div style={resultBox}>
            {canCalculate ? (
              <>
                <div style={miniText}>Default faiz dərəcəsi</div>
                <strong>{selectedProduct.defaultRate}%</strong>

                <div style={{ height: "12px" }} />

                <div style={miniText}>Təxmini aylıq ödəniş</div>
                <div style={paymentText}>{formatMoney(monthlyPayment)} AZN</div>
              </>
            ) : (
              <div style={{ color: "#047857", fontWeight: 900 }}>
                Hesablama üçün bank seçin.
              </div>
            )}
          </div>

          <button type="button" onClick={goNext} style={submitBtn}>
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

const errorNotice = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#dc2626",
  borderRadius: "14px",
  padding: "12px 14px",
  fontSize: "13px",
  fontWeight: 800,
};
"use client";

import { useEffect, useMemo, useState } from "react";

const BANKS = [
  {
    id: "kapital-bank",
    name: "Kapital Bank",
    products: [
      { id: "cash", name: "Nağd kredit", rate: 15.9, min: 1000, max: 30000, months: 48 },
      { id: "auto", name: "Avtokredit", rate: 12.5, min: 5000, max: 100000, months: 60 },
    ],
  },
  {
    id: "abb",
    name: "ABB",
    products: [
      { id: "cash", name: "Nağd kredit", rate: 14.9, min: 1000, max: 40000, months: 60 },
      { id: "business", name: "Biznes krediti", rate: 17.5, min: 5000, max: 150000, months: 36 },
    ],
  },
  {
    id: "unibank",
    name: "Unibank",
    products: [
      { id: "cash", name: "Nağd kredit", rate: 16.2, min: 500, max: 25000, months: 48 },
      { id: "mortgage", name: "İpoteka", rate: 10, min: 30000, max: 250000, months: 240 },
    ],
  },
];

const FEATURED_NEWS = {
  bank: "Unibank",
  title: "Unibank 10% ilə ipoteka krediti təklif edir",
  excerpt:
    "Bank yeni kampaniya çərçivəsində ipoteka məhsulu üzrə daha aşağı faiz, çevik müddət və sürətli ilkin baxılma imkanı təqdim edir.",
  image:
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
  sourceUrl: "#",
  content:
    "Unibank yeni ipoteka təklifi ilə mənzil maliyyələşdirilməsi üzrə daha sərfəli şərtlər təqdim etdiyini açıqlayıb. Kampaniya çərçivəsində müştərilər daha aşağı faiz dərəcəsi, uzunmüddətli ödəmə planı və sürətli ilkin baxılma imkanından yararlana bilərlər. Bu təklif xüsusilə mənzil almağı planlaşdıran və aylıq ödənişini daha optimallaşdırılmış formada qurmaq istəyən istifadəçilər üçün nəzərdə tutulub.",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("az-AZ", {
    style: "currency",
    currency: "AZN",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function calculateMonthlyPayment(principal: number, annualRate: number, months: number) {
  if (!principal || !months) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

export default function Page() {
  const [bankId, setBankId] = useState("kapital-bank");
  const [productId, setProductId] = useState("cash");
  const [amount, setAmount] = useState("12000");
  const [months, setMonths] = useState("24");
  const [leadType, setLeadType] = useState("exclusive");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [salary, setSalary] = useState("");
  const [consent, setConsent] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(1280);

  useEffect(() => {
    const updateWidth = () => setScreenWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;

  const selectedBank = useMemo(() => {
    return BANKS.find((bank) => bank.id === bankId) || BANKS[0];
  }, [bankId]);

  const selectedProduct = useMemo(() => {
    return (
      selectedBank.products.find((product) => product.id === productId) ||
      selectedBank.products[0]
    );
  }, [selectedBank, productId]);

  const numericAmount = Number(amount) || selectedProduct.min;
  const numericMonths = Number(months) || selectedProduct.months;
  const payment = calculateMonthlyPayment(
    numericAmount,
    selectedProduct.rate,
    numericMonths
  );
  const totalPayment = payment * numericMonths;

  const handleBankChange = (value: string) => {
    setBankId(value);
    const nextBank = BANKS.find((bank) => bank.id === value);
    if (nextBank) {
      const nextProduct = nextBank.products[0];
      setProductId(nextProduct.id);
      setAmount(String(nextProduct.min));
      setMonths(String(Math.min(nextProduct.months, 24)));
    }
  };

  const handleProductChange = (value: string) => {
    setProductId(value);
    const nextProduct = selectedBank.products.find(
      (product) => product.id === value
    );
    if (nextProduct) {
      setAmount(String(nextProduct.min));
      setMonths(String(Math.min(nextProduct.months, 24)));
    }
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(255,255,255,0.96)",
          borderBottom: "1px solid #e2e8f0",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: isMobile ? "14px 16px" : "18px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "14px",
                background: "#059669",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "24px",
                boxShadow: "0 8px 20px rgba(5,150,105,0.22)",
                flexShrink: 0,
              }}
            >
              ₼
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#047857" }}>
                ValyutaCred
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Kredit müqayisə və müraciət platforması
              </div>
            </div>
          </div>

          <nav
            style={{
              display: "flex",
              gap: isMobile ? "14px" : "22px",
              flexWrap: "wrap",
              fontSize: "15px",
              color: "#475569",
              width: isMobile ? "100%" : "auto",
              order: isMobile ? 3 : 0,
            }}
          >
            <a href="#calculator" style={{ textDecoration: "none", color: "inherit" }}>
              Kalkulyator
            </a>
            <a href="#featured-news" style={{ textDecoration: "none", color: "inherit" }}>
              Günün xəbəri
            </a>
            <a href="#how-it-works" style={{ textDecoration: "none", color: "inherit" }}>
              Necə işləyir
            </a>
          </nav>

          <div
            style={{
              display: "flex",
              gap: "12px",
              width: isMobile ? "100%" : "auto",
              flexWrap: "wrap",
            }}
          >
            <button
              style={{
                background: "#fff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "14px",
                padding: "12px 20px",
                fontWeight: 700,
                cursor: "pointer",
                width: isMobile ? "calc(50% - 6px)" : "auto",
              }}
            >
              Daxil ol
            </button>
            <button
              onClick={() => scrollToId("application-form")}
              style={{
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "12px 20px",
                fontWeight: 700,
                cursor: "pointer",
                width: isMobile ? "calc(50% - 6px)" : "auto",
              }}
            >
              Müraciət et
            </button>
          </div>
        </div>
      </header>

      <main>
        <section
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: isMobile ? "32px 16px" : "56px 20px",
              display: "grid",
              gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1.08fr",
              gap: isMobile ? "24px" : "36px",
            }}
          >
            <div style={{ alignSelf: "center" }}>
              <div
                style={{
                  display: "inline-block",
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  borderRadius: "999px",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "18px",
                }}
              >
                Kredit axtarışı və müraciət üçün vahid platforma
              </div>

              <h1
                style={{
                  fontSize: isMobile ? "34px" : isTablet ? "42px" : "54px",
                  lineHeight: 1.08,
                  margin: "0 0 18px 0",
                  fontWeight: 800,
                }}
              >
                Krediti seç, hesabla və müraciəti dərhal göndər
              </h1>

              <p
                style={{
                  fontSize: isMobile ? "16px" : "18px",
                  lineHeight: 1.7,
                  color: "#475569",
                  margin: 0,
                  maxWidth: "560px",
                }}
              >
                Uyğun bank və kredit növünü seç, aylıq ödənişi gör və müraciətini
                bir axında tamamla.
              </p>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  marginTop: "28px",
                  maxWidth: "560px",
                }}
              >
                {[
                  "Bank və kredit məhsulunu seç",
                  "Aylıq ödənişi dərhal gör",
                  "Yalnız seçdiyin banka və ya digər banklara müraciət et",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "14px 16px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                      color: "#334155",
                    }}
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "28px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => scrollToId("calculator")}
                  style={{
                    background: "#059669",
                    color: "#fff",
                    border: "none",
                    borderRadius: "14px",
                    padding: "14px 22px",
                    fontWeight: 700,
                    cursor: "pointer",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  Kalkulyatora başla
                </button>
                <button
                  onClick={() => scrollToId("how-it-works")}
                  style={{
                    background: "#fff",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    padding: "14px 22px",
                    fontWeight: 700,
                    cursor: "pointer",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  Necə işləyir
                </button>
                <button
                  onClick={() => scrollToId("application-form")}
                  style={{
                    background: "#0f172a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "14px",
                    padding: "14px 22px",
                    fontWeight: 700,
                    cursor: "pointer",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  Müraciət et
                </button>
              </div>
            </div>

            <div
              id="calculator"
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                boxShadow: "0 14px 32px rgba(15,23,42,0.08)",
                padding: isMobile ? "18px" : "28px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "8px",
                  fontSize: isMobile ? "24px" : "30px",
                }}
              >
                Kredit kalkulyatoru
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  color: "#64748b",
                  marginTop: 0,
                  marginBottom: "22px",
                }}
              >
                Şərtləri seçin, nəticəni dərhal görün
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                    Bank
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "14px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      background: "#fff",
                    }}
                    value={bankId}
                    onChange={(e) => handleBankChange(e.target.value)}
                  >
                    {BANKS.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                    Kredit növü
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "14px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      background: "#fff",
                    }}
                    value={productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                  >
                    {selectedBank.products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "16px",
                  marginTop: "16px",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                    Məbləğ (AZN)
                  </label>
                  <input
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "14px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                    type="number"
                    value={amount}
                    min={selectedProduct.min}
                    max={selectedProduct.max}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                    Aralıq: {formatMoney(selectedProduct.min)} – {formatMoney(selectedProduct.max)}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                    Müddət (ay)
                  </label>
                  <input
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "14px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                    type="number"
                    value={months}
                    min={1}
                    max={selectedProduct.months}
                    onChange={(e) => setMonths(e.target.value)}
                  />
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                    Maksimum müddət: {selectedProduct.months} ay
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr",
                  gap: "16px",
                  background: "#f8fafc",
                  borderRadius: "18px",
                  padding: "18px",
                  marginTop: "18px",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", color: "#64748b" }}>İllik faiz</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "6px" }}>
                    {selectedProduct.rate}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "14px", color: "#64748b" }}>Aylıq ödəniş</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#059669", marginTop: "6px" }}>
                    {formatMoney(payment)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "14px", color: "#64748b" }}>Cəmi ödəniş</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "6px" }}>
                    {formatMoney(totalPayment)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "18px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: isMobile ? "14px" : "16px",
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "14px", fontSize: "18px" }}>
                  Kimdən təklif almaq istəyirsiniz?
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      border: leadType === "exclusive" ? "1px solid #059669" : "1px solid #e2e8f0",
                      background: leadType === "exclusive" ? "#ecfdf5" : "#fff",
                      borderRadius: "16px",
                      padding: "14px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="leadType"
                      value="exclusive"
                      checked={leadType === "exclusive"}
                      onChange={(e) => setLeadType(e.target.value)}
                      style={{ marginTop: "3px" }}
                    />
                    <div>
                      <div style={{ color: "#0f172a", fontWeight: 700 }}>
                        Yalnız seçdiyim bankdan
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      border: leadType === "shared" ? "1px solid #059669" : "1px solid #e2e8f0",
                      background: leadType === "shared" ? "#ecfdf5" : "#fff",
                      borderRadius: "16px",
                      padding: "14px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="leadType"
                      value="shared"
                      checked={leadType === "shared"}
                      onChange={(e) => setLeadType(e.target.value)}
                      style={{ marginTop: "3px" }}
                    />
                    <div>
                      <div style={{ color: "#0f172a", fontWeight: 700 }}>
                        Digər banklardan da təklif almaq istəyirəm
                      </div>
                    </div>
                  </label>
                </div>

                <div style={{ marginTop: "10px", fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
                  Məlumatlarınız seçiminizə uyğun olaraq banklara təqdim oluna bilər.
                </div>
              </div>

              <div id="application-form" style={{ marginTop: "18px" }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "22px",
                    marginBottom: "14px",
                  }}
                >
                  Müraciət forması
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                      Ad və soyad
                    </label>
                    <input
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "14px",
                        fontSize: "16px",
                        boxSizing: "border-box",
                      }}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Məs: Əhməd Əhmədov"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                      Telefon
                    </label>
                    <input
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "14px",
                        fontSize: "16px",
                        boxSizing: "border-box",
                      }}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+994 50 000 00 00"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "16px",
                    marginTop: "16px",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                      Email
                    </label>
                    <input
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "14px",
                        fontSize: "16px",
                        boxSizing: "border-box",
                      }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mail@example.com"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                      İş yeri
                    </label>
                    <input
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "14px",
                        fontSize: "16px",
                        boxSizing: "border-box",
                      }}
                      value={workplace}
                      onChange={(e) => setWorkplace(e.target.value)}
                      placeholder="Məs: ABC MMC"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "16px",
                    marginTop: "16px",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                      Aylıq maaş (AZN)
                    </label>
                    <input
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "14px",
                        fontSize: "16px",
                        boxSizing: "border-box",
                      }}
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="Məs: 1200"
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "14px 16px",
                        color: "#475569",
                        fontSize: "14px",
                        lineHeight: 1.6,
                      }}
                    >
                      Müraciət bankın daxili qiymətləndirməsinə uyğun olaraq yoxlanılacaq.
                    </div>
                  </div>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginTop: "16px",
                    fontSize: "14px",
                    color: "#475569",
                    lineHeight: 1.6,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={{ marginTop: "3px" }}
                  />
                  <span>
                    Şəxsi məlumatlarımın banklara təqdim edilməsinə və platformanın
                    məxfilik siyasətinə uyğun işlənməsinə razıyam.
                  </span>
                </label>
              </div>

              <div
                style={{
                  marginTop: "16px",
                  background: "#fffbeb",
                  color: "#92400e",
                  borderRadius: "16px",
                  padding: "16px",
                  lineHeight: 1.7,
                }}
              >
                Göstərilən nəticə təxmini hesablamadır. Yekun kredit şərtləri bankın
                daxili qiymətləndirməsinə əsasən dəyişə bilər.
              </div>

              <button
                onClick={() => scrollToId("application-form")}
                style={{
                  background: "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px 22px",
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                  marginTop: "16px",
                }}
              >
                Müraciəti göndər
              </button>
            </div>
          </div>
        </section>

        <section
          style={{
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: isMobile ? "20px 16px" : "24px 20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : isTablet
                  ? "1fr 1fr"
                  : "repeat(4, 1fr)",
                gap: "16px",
              }}
            >
              {[
                { value: "35+", label: "kredit məhsulu" },
                { value: "12+", label: "təşkilat" },
                { value: "2 500+", label: "müraciət" },
                { value: "24/7", label: "müraciət imkanı" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "18px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ fontSize: "34px", fontWeight: 800, color: "#059669" }}>
                    {item.value}
                  </div>
                  <div style={{ marginTop: "6px", color: "#64748b" }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="featured-news"
          style={{
            padding: isMobile ? "36px 0" : "48px 0",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "0 16px" : "0 20px" }}>
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "inline-block",
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  borderRadius: "999px",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "14px",
                }}
              >
                Günün xəbəri
              </div>
              <h2 style={{ fontSize: isMobile ? "28px" : "38px", margin: 0, fontWeight: 800 }}>
                Bank məhsulu üzrə seçilmiş sponsorlu xəbər
              </h2>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                display: "grid",
                gridTemplateColumns: isMobile || isTablet ? "1fr" : "0.95fr 1.05fr",
              }}
            >
              <div style={{ padding: isMobile ? "20px" : "32px", order: isMobile ? 2 : 1 }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#ecfdf5",
                    color: "#047857",
                    borderRadius: "999px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "16px",
                  }}
                >
                  {FEATURED_NEWS.bank}
                </div>

                <h3 style={{ fontSize: isMobile ? "24px" : "28px", lineHeight: 1.2, marginTop: 0, fontWeight: 800 }}>
                  {FEATURED_NEWS.title}
                </h3>

                <p style={{ fontSize: "16px", lineHeight: 1.8, color: "#475569" }}>
                  {FEATURED_NEWS.excerpt}
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    style={{
                      background: "#0f172a",
                      color: "#fff",
                      border: "none",
                      borderRadius: "14px",
                      padding: "14px 22px",
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: "10px",
                    }}
                    onClick={() => setIsNewsOpen(true)}
                  >
                    Davamını oxu
                  </button>

                  <button
                    onClick={() => scrollToId("how-it-works")}
                    style={{
                      background: "#fff",
                      color: "#0f172a",
                      border: "1px solid #cbd5e1",
                      borderRadius: "14px",
                      padding: "14px 22px",
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: "10px",
                    }}
                  >
                    Necə işləyir
                  </button>
                </div>
              </div>

              <div style={{ order: isMobile ? 1 : 2 }}>
                <img
                  src={FEATURED_NEWS.image}
                  alt={FEATURED_NEWS.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: isMobile ? "220px" : "320px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" style={{ padding: isMobile ? "40px 0" : "56px 0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "0 16px" : "0 20px" }}>
            <div style={{ maxWidth: "700px", marginBottom: "28px" }}>
              <div
                style={{
                  display: "inline-block",
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  borderRadius: "999px",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "14px",
                }}
              >
                Necə işləyir
              </div>
              <h2 style={{ fontSize: isMobile ? "30px" : "44px", margin: 0, fontWeight: 800 }}>
                3 addımda müraciət prosesi
              </h2>
              <p style={{ fontSize: isMobile ? "16px" : "18px", lineHeight: 1.7, color: "#475569", marginTop: "12px" }}>
                İstifadəçidən banka qədər bütün axın sadə, aydın və idarə olunan şəkildə qurulur.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr",
                gap: "20px",
              }}
            >
              {[
                {
                  title: "Bank və məhsul seçin",
                  text: "Uyğun bankı və kredit növünü seçin, məbləği və müddəti təyin edin.",
                },
                {
                  title: "Aylıq ödənişi görün",
                  text: "Faiz dərəcəsinə əsasən aylıq və ümumi ödəniş məbləği dərhal hesablanır.",
                },
                {
                  title: "Müraciəti tamamlayın",
                  text: "Formanı doldurun və yalnız seçdiyiniz banka və ya digər banklara açıq müraciət edin.",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "24px",
                    padding: isMobile ? "22px" : "28px",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                  }}
                >
                  <div style={{ color: "#059669", fontWeight: 800, marginBottom: "10px" }}>
                    Addım {index + 1}
                  </div>
                  <h3 style={{ marginTop: 0, fontSize: isMobile ? "21px" : "24px", fontWeight: 800 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: 1.8, color: "#475569" }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                onClick={() => scrollToId("application-form")}
                style={{
                  background: "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px 22px",
                  fontWeight: 700,
                  cursor: "pointer",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Müraciət et
              </button>

              <button
                onClick={() => scrollToId("calculator")}
                style={{
                  background: "#fff",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  borderRadius: "14px",
                  padding: "14px 22px",
                  fontWeight: 700,
                  cursor: "pointer",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Kalkulyatora qayıt
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer
        style={{
          background: "#fff",
          borderTop: "1px solid #e2e8f0",
          marginTop: "40px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: isMobile ? "32px 16px" : "42px 20px",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1.2fr 1fr 1fr 1fr",
            gap: "24px",
          }}
        >
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#047857" }}>
              ValyutaCred
            </div>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#475569", maxWidth: "280px" }}>
              Kredit müraciətlərini sadələşdirən və banklarla istifadəçi arasında
              strukturlaşdırılmış axın yaradan platforma.
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: "12px" }}>Platforma</div>
            <div style={{ marginBottom: "8px" }}>
              <a href="#calculator" style={{ color: "#475569", textDecoration: "none" }}>Kalkulyator</a>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <a href="#featured-news" style={{ color: "#475569", textDecoration: "none" }}>Günün xəbəri</a>
            </div>
            <div>
              <a href="#how-it-works" style={{ color: "#475569", textDecoration: "none" }}>Necə işləyir</a>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: "12px" }}>Hüquqi</div>
            <div style={{ marginBottom: "8px", color: "#475569" }}>Məxfilik siyasəti</div>
            <div style={{ marginBottom: "8px", color: "#475569" }}>İstifadəçi razılaşması</div>
            <div style={{ marginBottom: "8px", color: "#475569" }}>Cookie siyasəti</div>
            <div style={{ color: "#475569" }}>FAQ</div>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: "12px" }}>Əlaqə</div>
            <div style={{ marginBottom: "8px", color: "#475569" }}>Bakı, Azərbaycan</div>
            <div style={{ marginBottom: "8px", color: "#475569" }}>info@valyutacred.az</div>
            <div style={{ color: "#475569" }}>+994 12 000 00 00</div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            textAlign: "center",
            padding: "18px",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          © 2026 ValyutaCred. Bütün hüquqlar qorunur.
        </div>
      </footer>

      {isNewsOpen && (
        <div
          onClick={() => setIsNewsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                padding: isMobile ? "16px" : "20px 24px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: "#047857", fontWeight: 800 }}>
                  {FEATURED_NEWS.bank}
                </div>
                <div style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 800, marginTop: "6px" }}>
                  {FEATURED_NEWS.title}
                </div>
              </div>

              <button
                onClick={() => setIsNewsOpen(false)}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  borderRadius: "999px",
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                  fontSize: "20px",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: isMobile ? "16px" : "24px" }}>
              <div
                style={{
                  padding: isMobile ? "18px" : "24px",
                  borderRadius: "20px",
                  background: "linear-gradient(to right, #ecfdf5, #f0f9ff)",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    background: "#fff",
                    color: "#047857",
                    borderRadius: "999px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    marginBottom: "14px",
                  }}
                >
                  Sponsorlu kontent
                </div>
                <p style={{ fontSize: isMobile ? "15px" : "17px", lineHeight: 1.8, color: "#475569", margin: 0 }}>
                  {FEATURED_NEWS.content}
                </p>
              </div>

              <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <a
                  href={FEATURED_NEWS.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    background: "#fff",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    padding: "12px 20px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Orijinal xəbəri oxu →
                </a>

                <button
                  onClick={() => {
                    setIsNewsOpen(false);
                    setTimeout(() => scrollToId("application-form"), 100);
                  }}
                  style={{
                    background: "#059669",
                    color: "#fff",
                    border: "none",
                    borderRadius: "14px",
                    padding: "12px 20px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Müraciət et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

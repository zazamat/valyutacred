"use client";

import { useMemo, useState } from "react";

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

function formatMoney(value) {
  return new Intl.NumberFormat("az-AZ", {
    style: "currency",
    currency: "AZN",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function calculateMonthlyPayment(principal, annualRate, months) {
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
  const [isNewsOpen, setIsNewsOpen] = useState(false);

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

  const handleBankChange = (value) => {
    setBankId(value);
    const nextBank = BANKS.find((bank) => bank.id === value);
    if (nextBank) {
      const nextProduct = nextBank.products[0];
      setProductId(nextProduct.id);
      setAmount(String(nextProduct.min));
      setMonths(String(Math.min(nextProduct.months, 24)));
    }
  };

  const handleProductChange = (value) => {
    setProductId(value);
    const nextProduct = selectedBank.products.find(
      (product) => product.id === value
    );
    if (nextProduct) {
      setAmount(String(nextProduct.min));
      setMonths(String(Math.min(nextProduct.months, 24)));
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
            padding: "18px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
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
              gap: "22px",
              flexWrap: "wrap",
              fontSize: "15px",
              color: "#475569",
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

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              style={{
                background: "#fff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "14px",
                padding: "12px 20px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Daxil ol
            </button>
            <button
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
              padding: "56px 20px",
              display: "grid",
              gridTemplateColumns: "1fr 1.08fr",
              gap: "36px",
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
                  fontSize: "54px",
                  lineHeight: 1.08,
                  margin: "0 0 18px 0",
                  fontWeight: 800,
                }}
              >
                Krediti seç, hesabla və müraciəti dərhal göndər
              </h1>

              <p
                style={{
                  fontSize: "18px",
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

              <div style={{ display: "flex", gap: "12px", marginTop: "28px", flexWrap: "wrap" }}>
                <button
                  style={{
                    background: "#059669",
                    color: "#fff",
                    border: "none",
                    borderRadius: "14px",
                    padding: "14px 22px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Kalkulyatora başla
                </button>
                <button
                  style={{
                    background: "#fff",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    padding: "14px 22px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Necə işləyir
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
                padding: "28px",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "30px" }}>
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
                  gridTemplateColumns: "1fr 1fr",
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
                  gridTemplateColumns: "1fr 1fr",
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
                  gridTemplateColumns: "1fr 1fr 1fr",
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
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "16px",
                  marginTop: "18px",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "12px" }}>
                  Kimdən təklif almaq istəyirsiniz?
                </div>

                <label style={{ display: "block", marginBottom: "12px", color: "#334155" }}>
                  <input
                    type="radio"
                    name="leadType"
                    value="exclusive"
                    checked={leadType === "exclusive"}
                    onChange={(e) => setLeadType(e.target.value)}
                  />{" "}
                  Yalnız seçdiyim bankdan
                </label>

                <label style={{ display: "block", color: "#334155" }}>
                  <input
                    type="radio"
                    name="leadType"
                    value="shared"
                    checked={leadType === "shared"}
                    onChange={(e) => setLeadType(e.target.value)}
                  />{" "}
                  Digər banklardan da təklif almaq istəyirəm
                </label>

                <div style={{ marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
                  Məlumatlarınız seçiminizə uyğun olaraq banklara təqdim oluna bilər.
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginTop: "16px",
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

              <div style={{ marginTop: "16px" }}>
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
              padding: "24px 20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
              }}
            >
              {[
                { value: "N", label: "kredit məhsulu" },
                { value: "N", label: "təşkilat" },
                { value: "N", label: "müraciət" },
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
            padding: "48px 0",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
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
              <h2 style={{ fontSize: "38px", margin: 0, fontWeight: 800 }}>
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
                gridTemplateColumns: "0.95fr 1.05fr",
              }}
            >
              <div style={{ padding: "32px" }}>
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

                <h3 style={{ fontSize: "28px", lineHeight: 1.2, marginTop: 0, fontWeight: 800 }}>
                  {FEATURED_NEWS.title}
                </h3>

                <p style={{ fontSize: "16px", lineHeight: 1.8, color: "#475569" }}>
                  {FEATURED_NEWS.excerpt}
                </p>

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
              </div>

              <div>
                <img
                  src={FEATURED_NEWS.image}
                  alt={FEATURED_NEWS.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "320px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" style={{ padding: "56px 0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
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
              <h2 style={{ fontSize: "44px", margin: 0, fontWeight: 800 }}>
                3 addımda müraciət prosesi
              </h2>
              <p style={{ fontSize: "18px", lineHeight: 1.7, color: "#475569", marginTop: "12px" }}>
                İstifadəçidən banka qədər bütün axın sadə, aydın və idarə olunan şəkildə qurulur.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
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
                    padding: "28px",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                  }}
                >
                  <div style={{ color: "#059669", fontWeight: 800, marginBottom: "10px" }}>
                    Addım {index + 1}
                  </div>
                  <h3 style={{ marginTop: 0, fontSize: "24px", fontWeight: 800 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: 1.8, color: "#475569" }}>
                    {item.text}
                  </p>
                </div>
              ))}
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
            padding: "42px 20px",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
            gap: "30px",
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
              <a href="#calculator">Kalkulyator</a>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <a href="#featured-news">Günün xəbəri</a>
            </div>
            <div>
              <a href="#how-it-works">Necə işləyir</a>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: "12px" }}>Hüquqi</div>
            <div style={{ marginBottom: "8px" }}>
              <a href="#">Məxfilik siyasəti</a>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <a href="#">İstifadəçi razılaşması</a>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <a href="#">Cookie siyasəti</a>
            </div>
            <div>
              <a href="#">FAQ</a>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: "12px" }}>Əlaqə</div>
            <div style={{ marginBottom: "8px" }}>Bakı, Azərbaycan</div>
            <div style={{ marginBottom: "8px" }}>info@valyutacred.az</div>
            <div>+994 12 000 00 00</div>
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
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: "#047857", fontWeight: 800 }}>
                  {FEATURED_NEWS.bank}
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "6px" }}>
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
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              <div
                style={{
                  padding: "24px",
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
                <p style={{ fontSize: "17px", lineHeight: 1.8, color: "#475569", margin: 0 }}>
                  {FEATURED_NEWS.content}
                </p>
              </div>

              <div style={{ marginTop: "20px" }}>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

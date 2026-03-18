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
    "Bank yeni kampaniya çərçivəsində ipoteka məhsulu üzrə daha aşağı faiz, çevik müddət və sürətli ilkin baxılma imkanı təqdim edir. Davamını popup pəncərəsində oxuya bilərsiniz.",
  image:
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
  sourceUrl: "#",
  content:
    "Unibank yeni ipoteka təklifi ilə mənzil maliyyələşdirilməsi üzrə daha sərfəli şərtlər təqdim etdiyini açıqlayıb. Kampaniya çərçivəsində müştərilər daha aşağı faiz dərəcəsi, uzunmüddətli ödəmə planı və sürətli ilkin baxılma imkanından yararlana bilərlər. Bu təklif xüsusilə mənzil almağı planlaşdıran və aylıq ödənişini daha optimallaşdırılmış formada qurmaq istəyən istifadəçilər üçün nəzərdə tutulub.",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid #e2e8f0",
  },
  headerInner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "18px 0",
    flexWrap: "wrap",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  brandIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "#059669",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "22px",
  },
  nav: {
    display: "flex",
    gap: "24px",
    fontSize: "15px",
    color: "#475569",
    flexWrap: "wrap",
  },
  btnPrimary: {
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    padding: "12px 22px",
    cursor: "pointer",
    fontWeight: 700,
  },
  btnSecondary: {
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 22px",
    cursor: "pointer",
    fontWeight: 700,
  },
  heroWrap: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.15fr",
    gap: "36px",
    padding: "56px 0",
  },
  badge: {
    display: "inline-block",
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
    borderRadius: "999px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 700,
    marginBottom: "18px",
  },
  h1: {
    fontSize: "54px",
    lineHeight: 1.1,
    margin: "0 0 18px 0",
  },
  p: {
    fontSize: "18px",
    lineHeight: 1.7,
    color: "#475569",
  },
  checklist: {
    display: "grid",
    gap: "12px",
    marginTop: "28px",
  },
  checklistItem: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px 16px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
  },
  cardPad: {
    padding: "28px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
  },
  infoBox: {
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "16px",
  },
  statsSection: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    padding: "24px 0",
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  },
  newsSection: {
    padding: "48px 0",
  },
  newsGrid: {
    display: "grid",
    gridTemplateColumns: "0.95fr 1.05fr",
    overflow: "hidden",
    borderRadius: "24px",
  },
  newsImage: {
    width: "100%",
    height: "100%",
    minHeight: "320px",
    objectFit: "cover",
    display: "block",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 100,
  },
  modalBox: {
    width: "100%",
    maxWidth: "900px",
    maxHeight: "90vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  },
  footer: {
    background: "#fff",
    borderTop: "1px solid #e2e8f0",
    marginTop: "40px",
  },
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
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ ...styles.container, ...styles.headerInner }}>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>₼</div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#047857" }}>
                ValyutaCred
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Kredit müqayisə və müraciət platforması
              </div>
            </div>
          </div>

          <nav style={styles.nav}>
            <a href="#calculator">Kalkulyator</a>
            <a href="#featured-news">Günün xəbəri</a>
            <a href="#how-it-works">Necə işləyir</a>
          </nav>

          <div style={{ display: "flex", gap: "12px" }}>
            <button style={styles.btnSecondary}>Daxil ol</button>
            <button style={styles.btnPrimary}>Müraciət et</button>
          </div>
        </div>
      </header>

      <main>
        <section style={styles.heroWrap}>
          <div style={{ ...styles.container, ...styles.heroGrid }}>
            <div>
              <div style={styles.badge}>
                Kredit axtarışı və müraciət üçün vahid platforma
              </div>

              <h1 style={styles.h1}>
                Krediti seç, hesabla və müraciəti dərhal göndər
              </h1>

              <p style={styles.p}>
                Əsas məhsulumuz sadədir: uyğun bank və kredit növünü seçirsiniz,
                aylıq ödənişi görürsünüz və müraciətinizi bir axında tamamlayırsınız.
              </p>

              <div style={styles.checklist}>
                {[
                  "Bank və kredit məhsulunu seç",
                  "Aylıq ödənişi dərhal gör",
                  "Yalnız seçdiyin banka və ya digər banklara müraciət et",
                ].map((item) => (
                  <div key={item} style={styles.checklistItem}>
                    ✓ {item}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "28px", flexWrap: "wrap" }}>
                <button style={styles.btnPrimary}>Kalkulyatora başla</button>
                <button style={styles.btnSecondary}>Necə işləyir</button>
              </div>
            </div>

            <div style={{ ...styles.card, ...styles.cardPad }} id="calculator">
              <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "32px" }}>
                Kredit kalkulyatoru
              </h2>
              <p style={{ ...styles.p, fontSize: "15px", marginTop: 0 }}>
                Şərtləri seçin, nəticəni dərhal görün
              </p>

              <div style={{ ...styles.grid2, marginTop: "20px" }}>
                <div>
                  <label style={styles.label}>Bank</label>
                  <select
                    style={styles.input}
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
                  <label style={styles.label}>Kredit növü</label>
                  <select
                    style={styles.input}
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

              <div style={{ ...styles.grid2, marginTop: "16px" }}>
                <div>
                  <label style={styles.label}>Məbləğ (AZN)</label>
                  <input
                    style={styles.input}
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
                  <label style={styles.label}>Müddət (ay)</label>
                  <input
                    style={styles.input}
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

              <div style={{ ...styles.grid3, ...styles.infoBox, marginTop: "18px" }}>
                <div>
                  <div style={{ fontSize: "14px", color: "#64748b" }}>İllik faiz</div>
                  <div style={{ fontSize: "28px", fontWeight: 800 }}>{selectedProduct.rate}%</div>
                </div>
                <div>
                  <div style={{ fontSize: "14px", color: "#64748b" }}>Aylıq ödəniş</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#059669" }}>
                    {formatMoney(payment)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "14px", color: "#64748b" }}>Cəmi ödəniş</div>
                  <div style={{ fontSize: "28px", fontWeight: 800 }}>
                    {formatMoney(totalPayment)}
                  </div>
                </div>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px", marginTop: "18px" }}>
                <div style={{ fontWeight: 700, marginBottom: "12px" }}>
                  Kimdən təklif almaq istəyirsiniz?
                </div>

                <label style={{ display: "block", marginBottom: "10px" }}>
                  <input
                    type="radio"
                    name="leadType"
                    value="exclusive"
                    checked={leadType === "exclusive"}
                    onChange={(e) => setLeadType(e.target.value)}
                  />{" "}
                  Yalnız seçdiyim bankdan
                </label>

                <label style={{ display: "block" }}>
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

              <div style={{ ...styles.grid2, marginTop: "16px" }}>
                <div>
                  <label style={styles.label}>Ad və soyad</label>
                  <input
                    style={styles.input}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Məs: Əhməd Əhmədov"
                  />
                </div>

                <div>
                  <label style={styles.label}>Telefon</label>
                  <input
                    style={styles.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+994 50 000 00 00"
                  />
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
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

              <button style={{ ...styles.btnPrimary, width: "100%", marginTop: "16px" }}>
                Müraciəti göndər
              </button>
            </div>
          </div>
        </section>

        <section style={styles.statsSection}>
          <div style={styles.container}>
            <div style={styles.statsGrid}>
              {HERO_STATS.map((item) => (
                <div key={item.label} style={styles.statCard}>
                  <div style={{ fontSize: "34px", fontWeight: 800, color: "#059669" }}>
                    {item.value}
                  </div>
                  <div style={{ marginTop: "6px", color: "#64748b" }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="featured-news" style={{ ...styles.newsSection, background: "#f8fafc" }}>
          <div style={styles.container}>
            <div style={{ marginBottom: "20px" }}>
              <div style={styles.badge}>Günün xəbəri</div>
              <h2 style={{ fontSize: "38px", margin: 0 }}>
                Bank məhsulu üzrə seçilmiş sponsorlu xəbər
              </h2>
            </div>

            <div style={{ ...styles.card, overflow: "hidden" }}>
              <div style={styles.newsGrid}>
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

                  <h3 style={{ fontSize: "28px", lineHeight: 1.2, marginTop: 0 }}>
                    {FEATURED_NEWS.title}
                  </h3>

                  <p style={{ ...styles.p, fontSize: "16px" }}>{FEATURED_NEWS.excerpt}</p>

                  <button
                    style={{ ...styles.btnSecondary, marginTop: "10px", background: "#0f172a", color: "#fff" }}
                    onClick={() => setIsNewsOpen(true)}
                  >
                    Davamını oxu
                  </button>
                </div>

                <div>
                  <img
                    src={FEATURED_NEWS.image}
                    alt={FEATURED_NEWS.title}
                    style={styles.newsImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" style={{ padding: "56px 0" }}>
          <div style={styles.container}>
            <div style={{ maxWidth: "700px", marginBottom: "28px" }}>
              <div style={{ ...styles.badge, marginBottom: "12px" }}>Necə işləyir</div>
              <h2 style={{ fontSize: "44px", margin: 0 }}>3 addımda müraciət prosesi</h2>
              <p style={{ ...styles.p, marginTop: "12px" }}>
                İstifadəçidən banka qədər bütün axın sadə, aydın və idarə olunan şəkildə qurulur.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
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
                <div key={item.title} style={{ ...styles.card, padding: "28px" }}>
                  <div style={{ color: "#059669", fontWeight: 800, marginBottom: "10px" }}>
                    Addım {index + 1}
                  </div>
                  <h3 style={{ marginTop: 0, fontSize: "24px" }}>{item.title}</h3>
                  <p style={{ ...styles.p, fontSize: "16px" }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <div
          style={{
            ...styles.container,
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
            gap: "30px",
            padding: "42px 20px",
          }}
        >
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#047857" }}>
              ValyutaCred
            </div>
            <p style={{ ...styles.p, fontSize: "15px", maxWidth: "280px" }}>
              Kredit müraciətlərini sadələşdirən və banklarla istifadəçi arasında
              strukturlaşdırılmış axın yaradan platforma.
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: "12px" }}>Platforma</div>
            <div><a href="#calculator">Kalkulyator</a></div>
            <div><a href="#featured-news">Günün xəbəri</a></div>
            <div><a href="#how-it-works">Necə işləyir</a></div>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: "12px" }}>Hüquqi</div>
            <div><a href="#">Məxfilik siyasəti</a></div>
            <div><a href="#">İstifadəçi razılaşması</a></div>
            <div><a href="#">Cookie siyasəti</a></div>
            <div><a href="#">FAQ</a></div>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: "12px" }}>Əlaqə</div>
            <div>Bakı, Azərbaycan</div>
            <div>info@valyutacred.az</div>
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
        <div style={styles.modalBackdrop} onClick={() => setIsNewsOpen(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
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
                <p style={{ ...styles.p, fontSize: "17px", margin: 0 }}>
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
                    ...styles.btnSecondary,
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

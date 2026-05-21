import ApplicationForm from "../components/ApplicationForm";
import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ background: "#f8fafc", color: "#0f172a", minHeight: "100vh" }}>
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <a href="/" style={{ textDecoration: "none", display: "flex", gap: "12px", alignItems: "center" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "#059669",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
              }}
            >
              ₼
            </div>

            <div>
              <div
  style={{
    fontSize: "24px",
    fontWeight: 900,
    lineHeight: 1.1,
  }}
>
  <span style={{ color: "#059669" }}>Va</span>
  <span style={{ color: "#0f172a" }}>Bank</span>
</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Kredit müraciət və seçim platforması
              </div>
            </div>
          </a>

          <nav style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <a href="#how" style={navLink}>Necə işləyir</a>
            <a href="#news" style={navLink}>Günün xəbəri</a>
            <a href="#contact" style={navLink}>Əlaqə</a>
            <Link href="/login" style={loginButton}>Admin giriş</Link>
          </nav>
        </div>
      </header>

      <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "44px 20px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
            alignItems: "center",
          }}
        >
          <div>
            <div style={badge}>Onlayn kredit müraciəti</div>

            <h1
              style={{
                margin: "16px 0 0",
                fontSize: "clamp(36px, 6vw, 64px)",
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
                fontWeight: 950,
              }}
            >
              Sizə uyğun krediti daha rahat tapın
            </h1>

            <p
              style={{
                marginTop: "20px",
                maxWidth: "620px",
                fontSize: "17px",
                lineHeight: 1.8,
                color: "#475569",
              }}
            >
              Kredit müraciətinizi bir neçə addımda göndərin. Sistem müraciəti qəbul edir,
              admin paneldə saxlayır və növbəti mərhələdə uyğun təşkilatlara yönləndirməyə hazır olur.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "26px" }}>
              <a href="#application-form" style={primaryButton}>Müraciət et</a>
              <a href="#how" style={secondaryButton}>Necə işləyir?</a>
            </div>
          </div>

          <div id="application-form">
            <ApplicationForm />
          </div>
        </div>
      </section>

      <section id="how" style={{ maxWidth: "1180px", margin: "0 auto", padding: "28px 20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            ["1", "Məlumatları daxil edin", "Ad, telefon və kredit məbləğini yazaraq müraciəti göndərin."],
            ["2", "Müraciət sistemə düşür", "Məlumatlar bazaya yazılır və admin paneldə görünür."],
            ["3", "Yoxlama aparılır", "Admin müraciəti yoxlayır və statusunu dəyişə bilir."],
            ["4", "Yönləndirmə mərhələsi", "Sonrakı mərhələdə müraciət uyğun təşkilatlara yönləndiriləcək."],
          ].map(([num, title, text]) => (
            <div key={num} style={card}>
              <div style={numberBox}>{num}</div>
              <h3 style={cardTitle}>{title}</h3>
              <p style={cardText}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="news" style={{ maxWidth: "1180px", margin: "0 auto", padding: "20px 20px 44px" }}>
        <div
          style={{
            background: "#0f172a",
            color: "#ffffff",
            borderRadius: "28px",
            padding: "28px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "22px",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ ...badge, background: "rgba(255,255,255,0.08)", color: "#d1fae5", border: "1px solid rgba(255,255,255,0.12)" }}>
              Valyuta.Az-dan seçilmiş
            </div>

            <h2 style={{ margin: "14px 0 0", fontSize: "clamp(28px, 4vw, 42px)", lineHeight: 1.1 }}>
              Kredit bazarındakı yenilikləri izləyin
            </h2>

            <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
              Kredit, bank, faiz dərəcələri və maliyyə bazarı ilə bağlı seçilmiş xəbərlər burada göstəriləcək.
            </p>
          </div>

          <a href="https://valyuta.az" target="_blank" rel="noreferrer" style={darkButton}>
            Valyuta.Az-a keç →
          </a>
        </div>
      </section>

      <footer id="contact" style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            padding: "28px 20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            color: "#475569",
            fontSize: "14px",
            lineHeight: 1.8,
          }}
        >
          <strong
  style={{
    display: "block",
    fontSize: "24px",
    marginBottom: "8px",
    lineHeight: 1.1,
  }}
>
  <span style={{ color: "#059669" }}>Va</span>
  <span style={{ color: "#0f172a" }}>Bank</span>
</strong>

          <div>
            <strong style={footerTitle}>Əlaqə</strong>
            <div>Email: info@valyutacred.az</div>
            <div>Telefon: +994 50 000 00 00</div>
          </div>

          <div>
            <strong style={footerTitle}>Keçidlər</strong>
            <div><a href="#how" style={footerLink}>Necə işləyir</a></div>
            <div><a href="#news" style={footerLink}>Günün xəbəri</a></div>
            <div><Link href="/login" style={footerLink}>Admin giriş</Link></div>
          </div>
        </div>
      </footer>
    </main>
  );
}

const navLink = {
  textDecoration: "none",
  color: "#334155",
  fontWeight: 800,
  padding: "10px 12px",
};

const loginButton = {
  textDecoration: "none",
  color: "#0f172a",
  fontWeight: 900,
  padding: "10px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "14px",
  background: "#ffffff",
};

const badge = {
  display: "inline-flex",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "#ecfdf5",
  border: "1px solid #a7f3d0",
  color: "#047857",
  fontSize: "13px",
  fontWeight: 900,
};

const primaryButton = {
  textDecoration: "none",
  background: "#059669",
  color: "#ffffff",
  padding: "14px 18px",
  borderRadius: "14px",
  fontWeight: 900,
};

const secondaryButton = {
  textDecoration: "none",
  background: "#ffffff",
  color: "#0f172a",
  padding: "14px 18px",
  borderRadius: "14px",
  fontWeight: 900,
  border: "1px solid #cbd5e1",
};

const card = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "22px",
  boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
};

const numberBox = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  background: "#ecfdf5",
  color: "#059669",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 950,
  marginBottom: "14px",
};

const cardTitle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 900,
  color: "#0f172a",
};

const cardText = {
  margin: "8px 0 0",
  fontSize: "14px",
  lineHeight: 1.75,
  color: "#64748b",
};

const darkButton = {
  justifySelf: "start",
  textDecoration: "none",
  background: "#10b981",
  color: "#ffffff",
  padding: "14px 18px",
  borderRadius: "14px",
  fontWeight: 900,
};

const footerTitle = {
  display: "block",
  color: "#0f172a",
  fontSize: "16px",
  marginBottom: "8px",
};

const footerLink = {
  color: "#475569",
  textDecoration: "none",
};

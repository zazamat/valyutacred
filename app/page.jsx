import ApplicationForm from "../components/ApplicationForm";

export default function HomePage() {
  return (
    <main style={{ background: "#f8fafc", color: "#0f172a" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(248,250,252,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#0f172a",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #059669, #10b981)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "22px",
                fontWeight: 800,
                boxShadow: "0 12px 24px rgba(5,150,105,0.22)",
                flexShrink: 0,
              }}
            >
              ₼
            </div>

            <div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: "#047857",
                }}
              >
                ValyutaCred
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "4px",
                }}
              >
                Kredit müraciət və seçim platforması
              </div>
            </div>
          </a>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <a
              href="#about"
              style={{
                textDecoration: "none",
                color: "#334155",
                fontWeight: 700,
                padding: "10px 14px",
                borderRadius: "12px",
              }}
            >
              Haqqımızda
            </a>

            <a
              href="#news"
              style={{
                textDecoration: "none",
                color: "#334155",
                fontWeight: 700,
                padding: "10px 14px",
                borderRadius: "12px",
              }}
            >
              Günün xəbəri
            </a>

            <a
              href="#contact"
              style={{
                textDecoration: "none",
                color: "#334155",
                fontWeight: 700,
                padding: "10px 14px",
                borderRadius: "12px",
              }}
            >
              Əlaqə
            </a>

            <a
              href="/login"
              style={{
                textDecoration: "none",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                padding: "10px 16px",
                borderRadius: "14px",
                fontWeight: 800,
              }}
            >
              Admin giriş
            </a>
          </nav>
        </div>
      </header>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "28px 20px 18px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            overflow: "hidden",
            borderRadius: "34px",
            boxShadow: "0 22px 60px rgba(15,23,42,0.12)",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "56px 44px",
              minHeight: "430px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#047857",
                fontSize: "13px",
                fontWeight: 800,
                marginBottom: "18px",
                width: "fit-content",
              }}
            >
              Onlayn kredit müraciəti
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(34px, 5vw, 58px)",
                lineHeight: 1.05,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                maxWidth: "520px",
              }}
            >
              Sizə uyğun krediti daha rahat tapın
            </h1>

            <p
              style={{
                marginTop: "18px",
                fontSize: "16px",
                lineHeight: 1.85,
                color: "#475569",
                maxWidth: "520px",
              }}
            >
              Müraciətinizi bir neçə addımda tamamlayın, uyğun məhsulu seçin və
              sistemə göndərin. ValyutaCred istifadəçi və admin axını üçün
              hazırlanır.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "24px",
              }}
            >
              <a
                href="#application-form"
                style={{
                  textDecoration: "none",
                  background: "#059669",
                  color: "#ffffff",
                  padding: "13px 18px",
                  borderRadius: "14px",
                  fontWeight: 800,
                }}
              >
                Müraciət et
              </a>

              <a
                href="#about"
                style={{
                  textDecoration: "none",
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  padding: "13px 18px",
                  borderRadius: "14px",
                  fontWeight: 800,
                }}
              >
                Necə işləyir
              </a>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "14px",
                marginTop: "26px",
              }}
            >
              {[
                "Sürətli müraciət",
                "Admin yoxlaması",
                "Uyğun seçim axını",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "14px",
                    fontSize: "14px",
                    color: "#334155",
                    fontWeight: 700,
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#0f172a",
              color: "#ffffff",
              padding: "56px 44px",
              minHeight: "430px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                marginBottom: "18px",
                width: "fit-content",
              }}
            >
              Valyuta.Az-dan seçilmiş
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(28px, 4vw, 46px)",
                lineHeight: 1.08,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                maxWidth: "470px",
              }}
            >
              Kredit bazarındakı yenilikləri izləyin
            </h2>

            <p
              style={{
                marginTop: "18px",
                fontSize: "15px",
                lineHeight: 1.85,
                color: "rgba(255,255,255,0.76)",
                maxWidth: "470px",
              }}
            >
              Günün xəbəri, bazar dəyişiklikləri və kredit mövzusunda vacib
              məlumatları izləyin. Bu blok sonradan dinamik xəbərlə əvəz
              olunacaq.
            </p>

            <div
              style={{
                marginTop: "26px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "24px",
                padding: "18px",
                maxWidth: "470px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "180px",
                  borderRadius: "18px",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))",
                  marginBottom: "16px",
                }}
              />

              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  lineHeight: 1.35,
                }}
              >
                Kredit bazarında yeni dəyişikliklər
              </div>

              <div
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  lineHeight: 1.75,
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                Faizlər, şərtlər və bazar dinamikası ilə bağlı gündəlik vacib
                xəbərləri burada göstərə bilərik.
              </div>

              <a
                href="https://valyuta.az"
                target="_blank"
                rel="noreferrer"
                style={{
                  marginTop: "14px",
                  display: "inline-flex",
                  textDecoration: "none",
                  color: "#34d399",
                  fontWeight: 800,
                }}
              >
                Davamını oxu →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "10px 20px 10px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: "20px" }}>
            <div
              id="about"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "28px",
                padding: "28px",
                boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#059669",
                  marginBottom: "10px",
                }}
              >
                Platforma haqqında
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "34px",
                  lineHeight: 1.1,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                }}
              >
                ValyutaCred nədir?
              </h2>

              <p
                style={{
                  marginTop: "16px",
                  color: "#475569",
                  fontSize: "15px",
                  lineHeight: 1.85,
                }}
              >
                ValyutaCred istifadəçidən müraciət qəbul edən, onu sistemdə
                saxlayan və sonrakı mərhələdə təşkilatlara yönləndirməyə hazır
                vəziyyətə gətirən fintech lead platformasıdır.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "14px",
                  marginTop: "18px",
                }}
              >
                {[
                  "Sürətli müraciət axını",
                  "Admin yoxlaması",
                  "Təşkilat yönləndirməsi",
                  "Gələcək AI seçim sistemi",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "18px",
                      padding: "14px",
                      fontSize: "14px",
                      color: "#334155",
                      lineHeight: 1.6,
                      fontWeight: 700,
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div
              id="news"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "28px",
                padding: "22px",
                boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#059669",
                  marginBottom: "10px",
                }}
              >
                Günün xəbəri
              </div>

              <h3
                style={{
                  margin: "0 0 16px",
                  fontSize: "28px",
                  lineHeight: 1.15,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                }}
              >
                Valyuta.Az-dan seçilmiş
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  gap: "16px",
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    width: "120px",
                    height: "92px",
                    borderRadius: "18px",
                    background:
                      "linear-gradient(135deg, #c7d2fe 0%, #dbeafe 100%)",
                    border: "1px solid #cbd5e1",
                    flexShrink: 0,
                  }}
                />

                <div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#0f172a",
                      lineHeight: 1.35,
                    }}
                  >
                    Kredit bazarında yeni dəyişikliklər
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "14px",
                      lineHeight: 1.75,
                      color: "#64748b",
                    }}
                  >
                    Kredit şərtləri, faiz dərəcələri və bazar dinamikası ilə
                    bağlı gündəlik vacib xəbərləri buradan vurğulaya bilərik.
                  </div>

                  <a
                    href="https://valyuta.az"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      marginTop: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      textDecoration: "none",
                      color: "#059669",
                      fontWeight: 800,
                    }}
                  >
                    Davamını oxu →
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div id="application-form">
            <ApplicationForm />
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "12px 20px 12px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            {
              title: "Məlumatı daxil et",
              text: "İstifadəçi əsas məlumatlarını və müraciət detallarını doldurur.",
            },
            {
              title: "Sistemə düşsün",
              text: "Müraciət bazaya yazılır və admin tərəfində görünür.",
            },
            {
              title: "Yoxlama və yönləndirmə",
              text: "Növbəti mərhələdə uyğun təşkilata yönləndirmə axını güclənəcək.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                padding: "22px",
                boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "14px",
                  background: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  marginBottom: "14px",
                }}
              >
                ✓
              </div>

              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  marginBottom: "8px",
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  lineHeight: 1.75,
                  color: "#475569",
                }}
              >
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "10px 20px 40px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            color: "#ffffff",
            borderRadius: "30px",
            padding: "30px",
            boxShadow: "0 20px 50px rgba(15,23,42,0.16)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "18px",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "30px",
                  lineHeight: 1.15,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                }}
              >
                Müraciətinizi indi göndərin
              </div>

              <div
                style={{
                  marginTop: "10px",
                  fontSize: "15px",
                  lineHeight: 1.8,
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                Hazırkı mərhələdə sistem istifadəçi müraciətini qəbul edir,
                admin panelə ötürür və sonrakı genişlənmə üçün baza yaradır.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <a
                href="#application-form"
                style={{
                  textDecoration: "none",
                  background: "#10b981",
                  color: "#ffffff",
                  padding: "13px 18px",
                  borderRadius: "14px",
                  fontWeight: 800,
                }}
              >
                Forma keç
              </a>

              <a
                href="/admin/applications"
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.16)",
                  padding: "13px 18px",
                  borderRadius: "14px",
                  fontWeight: 800,
                }}
              >
                Müraciətlərə bax
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer
        id="contact"
        style={{
          background: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          marginTop: "10px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "28px 20px 40px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: "#047857",
                lineHeight: 1.1,
              }}
            >
              ValyutaCred
            </div>

            <div
              style={{
                marginTop: "10px",
                fontSize: "14px",
                lineHeight: 1.8,
                color: "#64748b",
              }}
            >
              Kredit müraciətlərinin qəbul, idarə və gələcək yönləndirmə axını
              üçün qurulan platforma.
            </div>
          </div>

          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "10px" }}>
              Sürətli keçidlər
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              <a href="#about" style={{ textDecoration: "none", color: "#475569" }}>
                Haqqımızda
              </a>
              <a href="#news" style={{ textDecoration: "none", color: "#475569" }}>
                Günün xəbəri
              </a>
              <a
                href="#application-form"
                style={{ textDecoration: "none", color: "#475569" }}
              >
                Müraciət formu
              </a>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "10px" }}>
              Əlaqə
            </div>

            <div
              style={{
                display: "grid",
                gap: "8px",
                fontSize: "14px",
                color: "#475569",
                lineHeight: 1.75,
              }}
            >
              <div>Email: info@valyutacred.az</div>
              <div>Telefon: +994 50 000 00 00</div>
              <div>Bakı, Azərbaycan</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "10px" }}>
              Hüquqi
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              <a href="#" style={{ textDecoration: "none", color: "#475569" }}>
                Məxfilik siyasəti
              </a>
              <a href="#" style={{ textDecoration: "none", color: "#475569" }}>
                İstifadəçi razılaşması
              </a>
              <a href="#" style={{ textDecoration: "none", color: "#475569" }}>
                FAQ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
"use client";

export const dynamic = "force-dynamic";

const stats = [
  {
    title: "Ümumi müraciətlər",
    value: "2 500+",
    desc: "Platformaya daxil olan bütün kredit müraciətləri",
    tag: "Demo",
  },
  {
    title: "Bu gün",
    value: "48",
    desc: "Bugünkü yeni müraciət sayı",
    tag: "Demo",
  },
  {
    title: "Bu ay",
    value: "1 284",
    desc: "Cari ay üzrə müraciət sayı",
    tag: "Demo",
  },
  {
    title: "Bu il",
    value: "14 760",
    desc: "İllik ümumi müraciət sayı",
    tag: "Demo",
  },
  {
    title: "Open market",
    value: "1 680",
    desc: "Bütün banklara açıq müraciətlər",
    tag: "Demo",
  },
  {
    title: "Seçilmiş bank",
    value: "820",
    desc: "Yalnız seçilmiş banka göndərilən müraciətlər",
    tag: "Demo",
  },
  {
    title: "Aktiv risk",
    value: "27",
    desc: "Problemli müştəri qeydləri",
    tag: "Demo",
  },
  {
    title: "Araşdırılır",
    value: "9",
    desc: "Araşdırma tələb edən risk qeydləri",
    tag: "Demo",
  },
];

const incomeStats = [
  {
    title: "Günlük qazanc",
    value: "420 AZN",
    desc: "Demo lead gəliri",
  },
  {
    title: "Aylıq qazanc",
    value: "12 850 AZN",
    desc: "Demo aylıq gəlir",
  },
  {
    title: "İllik qazanc",
    value: "148 600 AZN",
    desc: "Demo illik gəlir",
  },
  {
    title: "Satılmış lead",
    value: "386",
    desc: "Demo lead satış sayı",
  },
];

const regionStats = [
  { name: "Bakı", value: "1 180" },
  { name: "Abşeron", value: "420" },
  { name: "Gəncə", value: "260" },
  { name: "Sumqayıt", value: "210" },
  { name: "Quba-Xaçmaz", value: "160" },
];

export default function AdminPage() {
  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>Platforma statistikası</div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>
            VaBank admin panelində müraciətlər, gəlir modeli, risklər və platforma
            göstəriciləri üçün ümumi baxış.
          </p>
        </div>

        <div style={styles.demoNotice}>Demo struktur</div>
      </div>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Müraciət göstəriciləri</h2>
            <p style={styles.sectionDesc}>
              Əsas müraciət və risk göstəriciləri
            </p>
          </div>
        </div>

        <div style={styles.cardsGrid}>
          {stats.map((item) => (
            <div key={item.title} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.cardTitle}>{item.title}</div>
                <span style={styles.cardTag}>{item.tag}</span>
              </div>

              <div style={styles.cardValue}>{item.value}</div>
              <div style={styles.cardDesc}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Gəlir göstəriciləri</h2>
            <p style={styles.sectionDesc}>
              Hələlik demo rəqəmlərdir. Lead marketplace qoşulanda real data ilə
              əvəz olunacaq.
            </p>
          </div>
        </div>

        <div style={styles.cardsGrid}>
          {incomeStats.map((item) => (
            <div key={item.title} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.cardTitle}>{item.title}</div>
                <span style={styles.cardTag}>Demo</span>
              </div>

              <div style={styles.incomeValue}>{item.value}</div>
              <div style={styles.cardDesc}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.bottomGrid}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Regionlara görə müraciətlər</h2>
              <p style={styles.sectionDesc}>
                Demo region bölgüsü. Sonradan real region datasına bağlanacaq.
              </p>
            </div>
          </div>

          <div style={styles.regionList}>
            {regionStats.map((item) => (
              <div key={item.name} style={styles.regionRow}>
                <span>{item.name}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Sistem vəziyyəti</h2>
              <p style={styles.sectionDesc}>
                Platformanın əsas modulları üzrə ümumi status.
              </p>
            </div>
          </div>

          <div style={styles.statusList}>
            <div style={styles.statusRow}>
              <span>Admin panel</span>
              <strong style={styles.greenText}>Aktiv</strong>
            </div>

            <div style={styles.statusRow}>
              <span>Müraciətlər modulu</span>
              <strong style={styles.greenText}>Aktiv</strong>
            </div>

            <div style={styles.statusRow}>
              <span>Smart Table</span>
              <strong style={styles.greenText}>Aktiv</strong>
            </div>

            <div style={styles.statusRow}>
              <span>Lead marketplace</span>
              <strong style={styles.grayText}>Planlaşdırılıb</strong>
            </div>

            <div style={styles.statusRow}>
              <span>Bank kabineti</span>
              <strong style={styles.grayText}>Planlaşdırılıb</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },

  kicker: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#059669",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.12,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    fontSize: "15px",
    color: "#475569",
    lineHeight: 1.65,
    maxWidth: "760px",
  },

  demoNotice: {
    minHeight: "34px",
    borderRadius: "999px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    color: "#475569",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    fontSize: "13px",
    fontWeight: 700,
  },

  section: {
    marginBottom: "24px",
  },

  sectionHeader: {
    marginBottom: "12px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 750,
    color: "#0f172a",
  },

  sectionDesc: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
    minHeight: "128px",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  cardTitle: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 650,
  },

  cardTag: {
    borderRadius: "999px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: 700,
  },

  cardValue: {
    fontSize: "30px",
    fontWeight: 800,
    color: "#059669",
    letterSpacing: "-0.02em",
  },

  incomeValue: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },

  cardDesc: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#475569",
    lineHeight: 1.55,
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
  },

  panelHeader: {
    marginBottom: "16px",
  },

  regionList: {
    display: "grid",
    gap: "10px",
  },

  regionRow: {
    minHeight: "42px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "0 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    color: "#334155",
  },

  statusList: {
    display: "grid",
    gap: "10px",
  },

  statusRow: {
    minHeight: "42px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "0 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    color: "#334155",
  },

  greenText: {
    color: "#047857",
  },

  grayText: {
    color: "#64748b",
  },
};
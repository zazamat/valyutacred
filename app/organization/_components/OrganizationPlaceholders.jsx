const mutedRows = ["", "", ""];

export function PageHeader({ kicker, title, subtitle, badge }) {
  return (
    <div style={styles.header}>
      <div>
        <div style={styles.kicker}>{kicker}</div>
        <h1 style={styles.title}>{title}</h1>
        {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}
      </div>

      {badge ? <div style={styles.demoNotice}>{badge}</div> : null}
    </div>
  );
}

export function StatCard({ title, value, desc, tag }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <div style={styles.cardTitle}>{title}</div>
        {tag ? <span style={styles.cardTag}>{tag}</span> : null}
      </div>

      <div style={styles.cardValue}>{value}</div>
      {desc ? <div style={styles.cardDesc}>{desc}</div> : null}
    </div>
  );
}

export function SectionPanel({ title, desc, children }) {
  return (
    <section style={styles.panel}>
      <div style={styles.panelHeader}>
        <div>
          <h2 style={styles.sectionTitle}>{title}</h2>
          {desc ? <p style={styles.sectionDesc}>{desc}</p> : null}
        </div>
      </div>

      {children}
    </section>
  );
}

export function EmptyState({
  title = "Məlumat tapılmadı",
  desc = "Məlumat aktivləşdirildikdən sonra bu bölmədə görünəcək.",
}) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>i</div>
      <div>
        <div style={styles.emptyTitle}>{title}</div>
        <div style={styles.emptyDesc}>{desc}</div>
      </div>
    </div>
  );
}

export function PlaceholderTable({ columns = [], rows = 4 }) {
  return (
    <div style={styles.tableWrap}>
      <div
        style={{
          ...styles.tableGrid,
          gridTemplateColumns: `repeat(${columns.length}, minmax(140px, 1fr))`,
        }}
      >
        {columns.map((column) => (
          <div key={column} style={styles.tableHead}>
            {column}
          </div>
        ))}

        {Array.from({ length: rows }).map((_, rowIndex) =>
          columns.map((column, columnIndex) => (
            <div key={`${rowIndex}-${column}`} style={styles.tableCell}>
              <div
                style={{
                  ...styles.skeletonLine,
                  width:
                    columnIndex === columns.length - 1
                      ? "46%"
                      : `${72 - columnIndex * 8}%`,
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function PlaceholderList({ items = mutedRows }) {
  return (
    <div style={styles.list}>
      {items.map((item, index) => (
        <div key={`${item}-${index}`} style={styles.listRow}>
          <div style={styles.listMain}>
            <div style={styles.listTitle}>{item || "Məlumat gözlənilir"}</div>
            <div style={styles.skeletonLine} />
          </div>
          <span style={styles.cardTag}>Gözləyir</span>
        </div>
      ))}
    </div>
  );
}

export const pageStyles = {
  section: {
    marginBottom: "24px",
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
  },
};

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

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
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
    whiteSpace: "nowrap",
  },

  cardValue: {
    fontSize: "30px",
    fontWeight: 800,
    color: "#059669",
  },

  cardDesc: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#475569",
    lineHeight: 1.55,
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
  },

  panelHeader: {
    marginBottom: "16px",
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

  emptyState: {
    minHeight: "90px",
    borderRadius: "14px",
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  emptyIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "#ecfdf5",
    color: "#047857",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    flexShrink: 0,
  },

  emptyTitle: {
    fontSize: "14px",
    fontWeight: 750,
    color: "#0f172a",
  },

  emptyDesc: {
    marginTop: "4px",
    fontSize: "13px",
    lineHeight: 1.45,
    color: "#64748b",
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },

  tableGrid: {
    display: "grid",
    minWidth: "680px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    overflow: "hidden",
  },

  tableHead: {
    minHeight: "42px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    padding: "12px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 750,
    textTransform: "uppercase",
  },

  tableCell: {
    minHeight: "50px",
    borderBottom: "1px solid #edf2f7",
    padding: "14px 12px",
    display: "flex",
    alignItems: "center",
  },

  skeletonLine: {
    width: "70%",
    height: "10px",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
  },

  list: {
    display: "grid",
    gap: "10px",
  },

  listRow: {
    minHeight: "56px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  listMain: {
    minWidth: 0,
    flex: 1,
  },

  listTitle: {
    fontSize: "13px",
    color: "#334155",
    fontWeight: 650,
    marginBottom: "8px",
  },
};

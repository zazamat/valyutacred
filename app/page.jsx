export default function Page() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>
        ValyutaCred
      </h1>

      <p style={{ marginTop: "10px" }}>
        Kredit müqayisə və müraciət platforması
      </p>

      <div style={{ marginTop: "30px" }}>
        <h2>Statistika</h2>
        <ul>
          <li>10+ kredit məhsulu</li>
          <li>5+ bank</li>
          <li>100+ müraciət</li>
          <li>24/7 müraciət imkanı</li>
        </ul>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h2>Kalkulyator (sadə)</h2>
        <input placeholder="Məbləğ" style={{ padding: "10px", marginRight: "10px" }} />
        <input placeholder="Ay" style={{ padding: "10px" }} />
        <br /><br />
        <button style={{ padding: "10px 20px" }}>
          Müraciət et
        </button>
      </div>
    </main>
  );
}

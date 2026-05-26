import {
  EmptyState,
  PageHeader,
  PlaceholderList,
  PlaceholderTable,
  SectionPanel,
  StatCard,
  pageStyles,
} from "./_components/OrganizationPlaceholders";

const dashboardStats = [
  {
    title: "Aktiv müraciətlər",
    value: "-",
    desc: "Real müraciət datası qoşulandan sonra aktiv say görünəcək.",
  },
  {
    title: "Bu ay lead sayı",
    value: "-",
    desc: "Cari ay üzrə lead statistikası placeholder saxlanılıb.",
  },
  {
    title: "Gözləyən nəticələr",
    value: "-",
    desc: "Bank qərarı gözləyən müraciətlər burada göstəriləcək.",
  },
  {
    title: "Balans",
    value: "- AZN",
    desc: "Monetizasiya balansı real query olmadan göstərilmir.",
  },
];

export default function OrganizationDashboardPage() {
  return (
    <div>
      <PageHeader
        kicker="Organization overview"
        title="Dashboard"
        subtitle="Bank və təşkilat istifadəçiləri üçün ayrıca kabinet skeleti. Bu mərhələdə yalnız UI və route strukturu qurulub."
      />

      <section style={pageStyles.section}>
        <div style={pageStyles.cardsGrid}>
          {dashboardStats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section style={pageStyles.bottomGrid}>
        <SectionPanel
          title="Son müraciətlər"
          desc="Real müraciət siyahısı hələ qoşulmayıb."
        >
          <PlaceholderTable
            columns={["Müraciət", "Məhsul", "Status", "Tarix"]}
            rows={4}
          />
        </SectionPanel>

        <SectionPanel
          title="Monetizasiya summary"
          desc="Lead qiyməti, xərclər və balans üçün skeleton görünüş."
        >
          <PlaceholderList
            items={[
              "Aylıq lead xərci",
              "Orta lead qiyməti",
              "Ödəniş gözləyən məbləğ",
            ]}
          />
        </SectionPanel>
      </section>

      <div style={{ marginTop: 18 }}>
        <EmptyState />
      </div>
    </div>
  );
}

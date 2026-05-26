import {
  EmptyState,
  PageHeader,
  PlaceholderList,
  SectionPanel,
  StatCard,
  pageStyles,
} from "../_components/OrganizationPlaceholders";

const statCards = [
  { title: "Konversiya", value: "-", desc: "Qərar və satış statistikası yoxdur." },
  { title: "Lead həcmi", value: "-", desc: "Müraciət sayı real data olmadan göstərilmir." },
  { title: "Orta cavab müddəti", value: "-", desc: "Bank cavab SLA datası qoşulmayıb." },
];

export default function OrganizationStatisticsPage() {
  return (
    <div>
      <PageHeader
        kicker="Hesabatlar"
        title="Statistika"
        subtitle="Təşkilat performansı və müraciət analitikası üçün ilkin kabinet səhifəsi."
      />

      <section style={pageStyles.section}>
        <div style={pageStyles.cardsGrid}>
          {statCards.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <SectionPanel
        title="Hesabat breakdown"
        desc="Qrafiklər və real metrikalar sonrakı mərhələyə saxlanılıb."
      >
        <PlaceholderList
          items={["Məhsula görə nəticələr", "Regiona görə müraciətlər", "Aylıq trend"]}
        />
      </SectionPanel>

      <div style={{ marginTop: 18 }}>
        <EmptyState />
      </div>
    </div>
  );
}

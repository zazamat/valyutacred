import {
  EmptyState,
  PageHeader,
  PlaceholderList,
  SectionPanel,
  pageStyles,
} from "../../_components/OrganizationPlaceholders";

export default function OrganizationApplicationDetailPage({ params }) {
  return (
    <div>
      <PageHeader
        kicker="Müraciət detalı"
        title={`Müraciət ${params.id}`}
        subtitle="Müraciət detalı üçün struktur ekran. Bu səhifədə real müştəri və bank datası göstərilmir."
      />

      <section style={pageStyles.bottomGrid}>
        <SectionPanel
          title="Müraciət xülasəsi"
          desc="Əsas sahələr real query mərhələsində doldurulacaq."
        >
          <PlaceholderList
            items={["Məhsul tipi", "Müraciət statusu", "Göndərilmə tarixi"]}
          />
        </SectionPanel>

        <SectionPanel
          title="Nəticə zonası"
          desc="Bank qərarları və action-lar bu mərhələdə deaktivdir."
        >
          <PlaceholderList
            items={["Gözləyən qərar", "Qeyd sahəsi", "Audit izi"]}
          />
        </SectionPanel>
      </section>

      <div style={{ marginTop: 18 }}>
        <EmptyState />
      </div>
    </div>
  );
}

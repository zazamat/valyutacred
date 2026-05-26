import {
  EmptyState,
  PageHeader,
  PlaceholderTable,
  SectionPanel,
} from "../_components/OrganizationPlaceholders";

export default function OrganizationApplicationsPage() {
  return (
    <div>
      <PageHeader
        kicker="Müraciətlər"
        title="Müraciətlərim"
        subtitle="Təşkilata yönləndirilən müraciətlərin gələcək siyahısı üçün skeleton ekran."
      />

      <SectionPanel
        title="Müraciət siyahısı"
        desc="Filtr, status və nəticə məlumatları real data qoşulanda aktivləşdiriləcək."
      >
        <PlaceholderTable
          columns={["ID", "Məhsul", "Müştəri tipi", "Status", "Yenilənmə"]}
          rows={6}
        />
      </SectionPanel>

      <div style={{ marginTop: 18 }}>
        <EmptyState />
      </div>
    </div>
  );
}

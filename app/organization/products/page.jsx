import {
  EmptyState,
  PageHeader,
  PlaceholderTable,
  SectionPanel,
} from "../_components/OrganizationPlaceholders";

export default function OrganizationProductsPage() {
  return (
    <div>
      <PageHeader
        kicker="İdarəetmə"
        title="Məhsullar"
        subtitle="Bankın kabinetdə görəcəyi məhsul siyahısı üçün skeleton görünüş."
      />

      <SectionPanel
        title="Məhsul siyahısı"
        desc="Admin məhsulları və təşkilat uyğunluğu bu mərhələdə query edilmir."
      >
        <PlaceholderTable
          columns={["Məhsul", "Kateqoriya", "Status", "Lead qaydası"]}
          rows={5}
        />
      </SectionPanel>

      <div style={{ marginTop: 18 }}>
        <EmptyState />
      </div>
    </div>
  );
}

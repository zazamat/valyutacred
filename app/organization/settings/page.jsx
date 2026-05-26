import {
  EmptyState,
  PageHeader,
  PlaceholderList,
  SectionPanel,
  pageStyles,
} from "../_components/OrganizationPlaceholders";

export default function OrganizationSettingsPage() {
  return (
    <div>
      <PageHeader
        kicker="İdarəetmə"
        title="Təşkilat ayarları"
        subtitle="Təşkilat profili, kontaktlar və kabinet parametrləri üçün skeleton."
      />

      <section style={pageStyles.bottomGrid}>
        <SectionPanel
          title="Profil məlumatları"
          desc="Ad, VÖEN, əlaqə və status sahələri sonrakı mərhələdə qoşulacaq."
        >
          <PlaceholderList
            items={["Təşkilat adı", "Əlaqə məlumatları", "Status"]}
          />
        </SectionPanel>

        <SectionPanel
          title="Kabinet ayarları"
          desc="Bildiriş, komanda və görünüş ayarları placeholder olaraq saxlanılıb."
        >
          <PlaceholderList
            items={["Bildirişlər", "İstifadəçi rolları", "Limitlər"]}
          />
        </SectionPanel>
      </section>

      <div style={{ marginTop: 18 }}>
        <EmptyState />
      </div>
    </div>
  );
}

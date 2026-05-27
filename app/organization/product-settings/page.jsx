"use client";

import {
  PermissionDenied,
  useOrganizationPermissions,
} from "../_components/OrganizationPermissionsContext";
import {
  EmptyState,
  PageHeader,
  PlaceholderList,
  SectionPanel,
  pageStyles,
} from "../_components/OrganizationPlaceholders";

export default function OrganizationProductSettingsPage() {
  const { hasPermission } = useOrganizationPermissions();

  if (!hasPermission("can_manage_products")) {
    return <PermissionDenied />;
  }

  return (
    <div>
      <PageHeader
        kicker="İdarəetmə"
        title="Məhsul ayarları"
        subtitle="Təşkilat üzrə məhsul parametrləri və gələcək qayda ekranları üçün skeleton."
      />

      <section style={pageStyles.bottomGrid}>
        <SectionPanel
          title="Lead qəbul qaydaları"
          desc="Məhsul üzrə qəbul parametrləri real model qoşulanda işləyəcək."
        >
          <PlaceholderList
            items={["Aylıq limit", "Region filtri", "Risk parametrləri"]}
          />
        </SectionPanel>

        <SectionPanel
          title="Məhsul görünüşü"
          desc="Aktivlik və kabinet görünüş ayarları placeholderdır."
        >
          <PlaceholderList
            items={["Aktiv məhsullar", "Prioritet", "Qiymət qaydası"]}
          />
        </SectionPanel>
      </section>

      <div style={{ marginTop: 18 }}>
        <EmptyState />
      </div>
    </div>
  );
}

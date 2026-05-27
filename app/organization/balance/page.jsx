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
  StatCard,
  pageStyles,
} from "../_components/OrganizationPlaceholders";

const balanceStats = [
  { title: "Cari balans", value: "- AZN", desc: "Real balans hələ qoşulmayıb." },
  { title: "Bu ay xərclər", value: "- AZN", desc: "Lead xərcləri placeholderdır." },
  { title: "Gözləyən ödəniş", value: "- AZN", desc: "Ödəniş datası göstərilmir." },
];

export default function OrganizationBalancePage() {
  const { hasPermission } = useOrganizationPermissions();

  if (!hasPermission("can_view_balance")) {
    return <PermissionDenied />;
  }

  return (
    <div>
      <PageHeader
        kicker="Maliyyə"
        title="Balans"
        subtitle="Təşkilat balansı və monetizasiya hərəkətləri üçün ilkin UI skeleti."
      />

      <section style={pageStyles.section}>
        <div style={pageStyles.cardsGrid}>
          {balanceStats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <SectionPanel
        title="Balans hərəkətləri"
        desc="Tranzaksiya siyahısı real billing datası gələndə qoşulacaq."
      >
        <PlaceholderList
          items={["Lead tutulması", "Balans artırılması", "Hesabat bağlanışı"]}
        />
      </SectionPanel>

      <div style={{ marginTop: 18 }}>
        <EmptyState />
      </div>
    </div>
  );
}

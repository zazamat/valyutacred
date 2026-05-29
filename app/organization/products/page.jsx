"use client";

import {
  PermissionDenied,
  useOrganizationPermissions,
} from "../_components/OrganizationPermissionsContext";
import {
  EmptyState,
  PageHeader,
  SectionPanel,
} from "../_components/OrganizationPlaceholders";

export default function OrganizationProductsPage() {
  const { organization, hasPermission } = useOrganizationPermissions();

  if (!hasPermission("can_manage_products")) {
    return <PermissionDenied />;
  }

  return (
    <div>
      <PageHeader
        kicker="İdarəetmə"
        title="Məhsullar"
        subtitle="Bank məhsulları və komissiya qaydaları üzrə baxış."
      />

      <SectionPanel
        title="Məhsul ayarları"
        desc="Məhsul səviyyəli qaydalar aktiv olduqda bank məhsulları burada idarə olunacaq."
      >
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Təşkilat</div>
            <div style={styles.infoValue}>{organization?.name || "-"}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Kabinet statusu</div>
            <div style={styles.infoValue}>Aktiv</div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <EmptyState
            title="Məhsul siyahısı aktivləşdirilməyib"
            desc="Məhsul əsaslı komissiya qaydaları qoşulduqdan sonra bank məhsulları və şərtləri burada görünəcək."
          />
        </div>
      </SectionPanel>
    </div>
  );
}

const styles = {
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  infoItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px",
  },
  infoLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 700,
    marginBottom: "7px",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: 750,
    color: "#0f172a",
  },
};

"use client";

import { createContext, useContext } from "react";

export const defaultPermissions = {
  can_view_applications: false,
  can_view_application_detail: false,
  can_view_customer_contact: false,
  can_update_application_status: false,
  can_update_credit_result: false,
  can_view_monetization: false,
  can_buy_leads: false,
  can_view_balance: false,
  can_manage_products: false,
  can_export_data: false,
};

const OrganizationPermissionsContext = createContext({
  organization: null,
  permissions: defaultPermissions,
  hasPermission: () => false,
});

export function OrganizationPermissionsProvider({
  organization,
  permissions,
  children,
}) {
  const safePermissions = { ...defaultPermissions, ...(permissions || {}) };

  return (
    <OrganizationPermissionsContext.Provider
      value={{
        organization,
        permissions: safePermissions,
        hasPermission: (key) => !!safePermissions[key],
      }}
    >
      {children}
    </OrganizationPermissionsContext.Provider>
  );
}

export function useOrganizationPermissions() {
  return useContext(OrganizationPermissionsContext);
}

export function PermissionDenied({
  title = "Bu bölmə üçün icazəniz yoxdur",
  desc = "Bu funksiyanı aktiv etmək üçün administratorla əlaqə saxlayın.",
}) {
  return (
    <div style={styles.box}>
      <div style={styles.icon}>!</div>
      <div>
        <div style={styles.title}>{title}</div>
        <div style={styles.desc}>{desc}</div>
      </div>
    </div>
  );
}

const styles = {
  box: {
    minHeight: "92px",
    borderRadius: "16px",
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  icon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "#ffedd5",
    color: "#9a3412",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    flexShrink: 0,
  },
  title: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#0f172a",
  },
  desc: {
    marginTop: "4px",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
  },
};

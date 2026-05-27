"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  OrganizationPermissionsProvider,
  PermissionDenied,
  defaultPermissions,
} from "./OrganizationPermissionsContext";

const menuGroups = [
  {
    title: "Əsas",
    items: [{ href: "/organization", label: "Dashboard", short: "D" }],
  },
  {
    title: "Maliyyə",
    items: [
      {
        href: "/organization/balance",
        label: "Balans",
        short: "B",
        permission: "can_view_balance",
      },
    ],
  },
  {
    title: "Müraciətlər",
    items: [
      {
        href: "/organization/applications",
        label: "Müraciətlərim",
        short: "M",
        permission: "can_view_applications",
      },
    ],
  },
  {
    title: "İdarəetmə",
    items: [
      {
        href: "/organization/settings",
        label: "Təşkilat ayarları",
        short: "A",
      },
      {
        href: "/organization/products",
        label: "Məhsullar",
        short: "M",
        permission: "can_manage_products",
      },
      {
        href: "/organization/product-settings",
        label: "Məhsul ayarları",
        short: "S",
        permission: "can_manage_products",
      },
    ],
  },
  {
    title: "Hesabatlar",
    items: [
      { href: "/organization/statistics", label: "Statistika", short: "S" },
    ],
  },
];

function isRouteActive(pathname, href) {
  if (href === "/organization") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function readOrganizationAuthSnapshot() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("valyutacred_auth");
    const auth = raw ? JSON.parse(raw) : null;

    if (!auth?.authenticated) return null;
    if (auth.role !== "organization_user") return null;
    if (auth.status !== "active") return null;
    if (!auth.organization_id) return null;

    return {
      id: auth.user_id,
      email: auth.email || "",
      full_name: auth.full_name || "",
      role: auth.role,
      status: auth.status,
      organization_id: auth.organization_id,
    };
  } catch {
    return null;
  }
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

export default function OrganizationShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [organizationUser, setOrganizationUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [accessMessage, setAccessMessage] = useState("");
  const [authMessage, setAuthMessage] = useState("Organization kabineti yoxlanılır...");

  useEffect(() => {
    let active = true;
    const authTimeout = window.setTimeout(() => {
      if (!active) return;
      setAccessMessage("Kabinet yoxlaması tamamlanmadı.");
      setAuthMessage("");
      setIsCheckingAuth(false);
    }, 6000);

    setMounted(true);

    const snapshot = readOrganizationAuthSnapshot();

    if (!snapshot) {
      setOrganizationUser(null);
      setAuthMessage("Giriş səhifəsinə yönləndirilir...");
      setIsCheckingAuth(false);
      window.clearTimeout(authTimeout);
      router.replace("/login");
      return;
    }

    async function loadAccess() {
      setIsCheckingAuth(true);
      setAccessMessage("");

      let organizationRes;
      let permissionsRes;

      try {
        [organizationRes, permissionsRes] = await withTimeout(
          Promise.all([
            supabase
              .from("organizations")
              .select("id, name, status, approval_status, cabinet_enabled")
              .eq("id", snapshot.organization_id)
              .maybeSingle(),
            supabase
              .from("organization_permissions")
              .select(
                "organization_id, can_view_applications, can_view_application_detail, can_view_customer_contact, can_update_application_status, can_update_credit_result, can_view_monetization, can_buy_leads, can_view_balance, can_manage_products, can_export_data"
              )
              .eq("organization_id", snapshot.organization_id)
              .maybeSingle(),
          ]),
          5000,
          "Organization access query timed out"
        );
      } catch {
        if (!active) return;
        setOrganization(null);
        setPermissions(defaultPermissions);
        setOrganizationUser(snapshot);
        setAccessMessage("Kabinet yoxlaması tamamlanmadı.");
        setAuthMessage("");
        setIsCheckingAuth(false);
        window.clearTimeout(authTimeout);
        return;
      }

      if (!active) return;

      if (organizationRes.error || !organizationRes.data) {
        setAccessMessage("Təşkilat məlumatları yüklənmədi.");
      } else if (organizationRes.data.status !== "active") {
        setAccessMessage("Təşkilat aktiv deyil.");
      } else if (!organizationRes.data.cabinet_enabled) {
        setAccessMessage("Bu təşkilat üçün kabinet aktiv deyil.");
      } else if (permissionsRes.error || !permissionsRes.data) {
        setAccessMessage("Təşkilat icazələri yüklənmədi.");
      }

      setOrganization(organizationRes.data || null);
      setPermissions({ ...defaultPermissions, ...(permissionsRes.data || {}) });
      setOrganizationUser(snapshot);
      setAuthMessage("");
      setIsCheckingAuth(false);
      window.clearTimeout(authTimeout);
    }

    loadAccess();

    return () => {
      active = false;
      window.clearTimeout(authTimeout);
    };
  }, [router]);

  useEffect(() => {
    const syncScreen = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(false);
    };

    syncScreen();
    window.addEventListener("resize", syncScreen);
    return () => window.removeEventListener("resize", syncScreen);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const visibleMenuGroups = useMemo(() => {
    return menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => !item.permission || !!permissions[item.permission]
        ),
      }))
      .filter((group) => group.items.length);
  }, [permissions]);

  const currentPageLabel = useMemo(() => {
    const currentItem = visibleMenuGroups
      .flatMap((group) => group.items)
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isRouteActive(pathname, item.href));

    return currentItem?.label || "Organization kabineti";
  }, [pathname, visibleMenuGroups]);

  const sidebarWidth = sidebarCollapsed ? 76 : 248;
  const organizationLabel =
    organization?.name ||
    organizationUser?.full_name ||
    organizationUser?.email ||
    "Organization user";

  if (!mounted || isCheckingAuth) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>{authMessage}</div>
      </div>
    );
  }

  if (!organizationUser) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          {authMessage || "Giriş səhifəsinə yönləndirilir..."}
        </div>
      </div>
    );
  }

  return (
    <OrganizationPermissionsProvider
      organization={organization}
      permissions={permissions}
    >
      <div style={styles.page}>
        {isMobile && mobileMenuOpen ? (
          <button
            type="button"
            aria-label="Menyunu bağla"
            style={styles.mobileOverlay}
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}

        <aside
          style={{
            ...styles.sidebar,
            width: isMobile ? 248 : sidebarWidth,
            transform: isMobile
              ? mobileMenuOpen
                ? "translateX(0)"
                : "translateX(-105%)"
              : "translateX(0)",
          }}
        >
          <div style={styles.sidebarTop}>
            <Link href="/organization" style={styles.brandWrap}>
              <div style={styles.brandMark}>V</div>

              {!sidebarCollapsed || isMobile ? (
                <div style={styles.brandText}>
                  <div style={styles.brandTitle}>VaBank Cabinet</div>
                  <div style={styles.brandSub}>organization paneli</div>
                </div>
              ) : null}
            </Link>

            {!isMobile ? (
              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                style={styles.collapseBtn}
                title={sidebarCollapsed ? "Menyunu aç" : "Menyunu bağla"}
                aria-label={sidebarCollapsed ? "Menyunu aç" : "Menyunu bağla"}
              >
                {sidebarCollapsed ? "›" : "‹"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={styles.collapseBtn}
                title="Menyunu bağla"
                aria-label="Menyunu bağla"
              >
                x
              </button>
            )}
          </div>

          <div style={styles.menuScroll}>
            {visibleMenuGroups.map((group) => (
              <div key={group.title} style={styles.menuGroup}>
                {!sidebarCollapsed || isMobile ? (
                  <div style={styles.menuGroupTitle}>{group.title}</div>
                ) : (
                  <div style={styles.menuGroupDivider} />
                )}

                <div style={styles.menuItems}>
                  {group.items.map((item) => {
                    const activeRoute = isRouteActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          ...styles.menuLink,
                          ...(activeRoute ? styles.menuLinkActive : {}),
                          justifyContent:
                            sidebarCollapsed && !isMobile
                              ? "center"
                              : "flex-start",
                        }}
                        title={item.label}
                      >
                        {!sidebarCollapsed || isMobile ? (
                          <span style={styles.menuLabel}>{item.label}</span>
                        ) : (
                          <span style={styles.menuShort}>{item.short}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={styles.sidebarBottom}>
            <div
              style={{
                ...styles.orgCard,
                justifyContent:
                  sidebarCollapsed && !isMobile ? "center" : "flex-start",
              }}
            >
              {!sidebarCollapsed || isMobile ? (
                <div style={styles.orgText}>
                  <div style={styles.orgName}>{organizationLabel}</div>
                  <div style={styles.orgMeta}>
                    Organization #{organizationUser.organization_id}
                  </div>
                </div>
              ) : (
                <div style={styles.orgShort}>O</div>
              )}
            </div>

            {!sidebarCollapsed || isMobile ? (
              <div style={styles.safetyBadge}>RLS protected read-only</div>
            ) : null}
          </div>
        </aside>

        <div
          style={{
            ...styles.appArea,
            marginLeft: isMobile ? 0 : sidebarWidth,
          }}
        >
          <header style={styles.topbar}>
            <div style={styles.topbarLeft}>
              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  style={styles.mobileMenuBtn}
                  aria-label="Menyunu aç"
                >
                  ☰
                </button>
              ) : null}

              <div>
                <div style={styles.topbarTitle}>{currentPageLabel}</div>
                <div style={styles.topbarSub}>VaBank organization kabineti</div>
              </div>
            </div>

            <div style={styles.topbarRight}>
              <div style={styles.roleBadge}>Bank cabinet</div>
            </div>
          </header>

          <main style={styles.main}>
            <div style={styles.content}>
              {accessMessage ? (
                <PermissionDenied
                  title={accessMessage}
                  desc="Kabinetə giriş üçün təşkilat statusu və icazələr admin panelindən aktiv edilməlidir."
                />
              ) : (
                children
              )}
            </div>
          </main>
        </div>
      </div>
    </OrganizationPermissionsProvider>
  );
}

const appFont =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const styles = {
  loadingPage: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: appFont,
  },
  loadingCard: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "16px",
    padding: "16px 20px",
    color: "#475569",
    fontSize: "14px",
  },
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily: appFont,
  },
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 50,
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    transition: "width 180ms ease, transform 180ms ease",
  },
  sidebarTop: {
    minHeight: "64px",
    borderBottom: "1px solid #e2e8f0",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    minWidth: 0,
  },
  brandMark: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "#059669",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    fontWeight: 700,
    flexShrink: 0,
  },
  brandText: { minWidth: 0 },
  brandTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  },
  brandSub: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
    lineHeight: 1.3,
    whiteSpace: "nowrap",
  },
  collapseBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#334155",
    fontSize: "20px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  menuScroll: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
  },
  menuGroup: { marginBottom: "16px" },
  menuGroupTitle: {
    padding: "0 8px",
    marginBottom: "8px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  menuGroupDivider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "10px 6px",
  },
  menuItems: { display: "grid", gap: "4px" },
  menuLink: {
    minHeight: "40px",
    borderRadius: "10px",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 500,
    border: "1px solid transparent",
  },
  menuLinkActive: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },
  menuLabel: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  menuShort: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#475569",
  },
  sidebarBottom: {
    borderTop: "1px solid #e2e8f0",
    padding: "12px",
    display: "grid",
    gap: "8px",
  },
  orgCard: {
    minHeight: "58px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    minWidth: 0,
  },
  orgText: { minWidth: 0 },
  orgName: {
    fontSize: "13px",
    fontWeight: 650,
    color: "#0f172a",
    lineHeight: 1.25,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  orgMeta: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "3px",
    lineHeight: 1.25,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  orgShort: {
    width: "26px",
    height: "26px",
    borderRadius: "8px",
    background: "#e2e8f0",
    color: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
  },
  safetyBadge: {
    minHeight: "34px",
    borderRadius: "999px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    color: "#475569",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    textAlign: "center",
  },
  appArea: {
    minHeight: "100vh",
    transition: "margin-left 180ms ease",
  },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    minHeight: "64px",
    background: "rgba(255,255,255,0.94)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #e2e8f0",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  topbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },
  mobileMenuBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  topbarTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.25,
  },
  topbarSub: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
    lineHeight: 1.3,
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  roleBadge: {
    minHeight: "34px",
    borderRadius: "999px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#334155",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    fontSize: "13px",
    fontWeight: 650,
    whiteSpace: "nowrap",
  },
  main: { width: "100%" },
  content: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "24px 28px 40px",
  },
  mobileOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 45,
    background: "rgba(15, 23, 42, 0.36)",
    border: 0,
    padding: 0,
    cursor: "pointer",
  },
};

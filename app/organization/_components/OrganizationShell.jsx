"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const menuGroups = [
  {
    title: "ƏSAS",
    items: [{ href: "/organization", label: "Dashboard", short: "D" }],
  },
  {
    title: "MALİYYƏ",
    items: [{ href: "/organization/balance", label: "Balans", short: "B" }],
  },
  {
    title: "MÜRACİƏTLƏR",
    items: [
      {
        href: "/organization/applications",
        label: "Müraciətlərim",
        short: "M",
      },
    ],
  },
  {
    title: "İDARƏETMƏ",
    items: [
      {
        href: "/organization/settings",
        label: "Təşkilat ayarları",
        short: "A",
      },
      { href: "/organization/products", label: "Məhsullar", short: "M" },
      {
        href: "/organization/product-settings",
        label: "Məhsul ayarları",
        short: "S",
      },
    ],
  },
  {
    title: "HESABATLAR",
    items: [
      { href: "/organization/statistics", label: "Statistika", short: "S" },
    ],
  },
];

function isRouteActive(pathname, href) {
  if (href === "/organization") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function OrganizationShell({ children }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncScreen = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarCollapsed(false);
      }
    };

    syncScreen();
    window.addEventListener("resize", syncScreen);

    return () => window.removeEventListener("resize", syncScreen);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const currentPageLabel = useMemo(() => {
    const currentItem = menuGroups
      .flatMap((group) => group.items)
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isRouteActive(pathname, item.href));

    return currentItem?.label || "Organization kabinet";
  }, [pathname]);

  const sidebarWidth = sidebarCollapsed ? 76 : 248;

  return (
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
              ×
            </button>
          )}
        </div>

        <div style={styles.menuScroll}>
          {menuGroups.map((group) => (
            <div key={group.title} style={styles.menuGroup}>
              {!sidebarCollapsed || isMobile ? (
                <div style={styles.menuGroupTitle}>{group.title}</div>
              ) : (
                <div style={styles.menuGroupDivider} />
              )}

              <div style={styles.menuItems}>
                {group.items.map((item) => {
                  const active = isRouteActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        ...styles.menuLink,
                        ...(active ? styles.menuLinkActive : {}),
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
                <div style={styles.orgName}>Organization workspace</div>
                <div style={styles.orgMeta}>Skeleton mode</div>
              </div>
            ) : (
              <div style={styles.orgShort}>O</div>
            )}
          </div>

          {!sidebarCollapsed || isMobile ? (
            <div style={styles.safetyBadge}>Real data qoşulmayıb</div>
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
          <div style={styles.content}>{children}</div>
        </main>
      </div>
    </div>
  );
}

const appFont =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const styles = {
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

  brandText: {
    minWidth: 0,
  },

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

  menuGroup: {
    marginBottom: "16px",
  },

  menuGroupTitle: {
    padding: "0 8px",
    marginBottom: "8px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.03em",
    color: "#94a3b8",
    textTransform: "uppercase",
  },

  menuGroupDivider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "10px 6px",
  },

  menuItems: {
    display: "grid",
    gap: "4px",
  },

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
    transition: "background 150ms ease, color 150ms ease, border 150ms ease",
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

  orgText: {
    minWidth: 0,
  },

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

  main: {
    width: "100%",
  },

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

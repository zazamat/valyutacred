"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const ADMIN_ROLES = ["super_admin", "admin"];

function saveAuthSnapshot(profile) {
  try {
    localStorage.setItem(
      "valyutacred_auth",
      JSON.stringify({
        authenticated: true,
        user_id: profile.id,
        email: profile.email,
        full_name: profile.full_name || "",
        role: profile.role,
        status: profile.status,
        organization_id: profile.organization_id || null,
        updated_at: new Date().toISOString(),
      })
    );
  } catch {}
}

function clearAuthSnapshot() {
  try {
    localStorage.removeItem("valyutacred_auth");
  } catch {}
}

function readAuthSnapshot() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("valyutacred_auth");
    const auth = raw ? JSON.parse(raw) : null;

    if (!auth?.authenticated) return null;
    if (!ADMIN_ROLES.includes(auth.role)) return null;
    if (auth.status !== "active") return null;

    return {
      id: auth.user_id,
      email: auth.email,
      full_name: auth.full_name || "",
      role: auth.role,
      status: auth.status,
      organization_id: auth.organization_id || null,
    };
  } catch {
    return null;
  }
}

const menuGroups = [
  {
    title: "Əsas",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/applications", label: "Müraciətlər" },
    ],
  },
  {
    title: "İdarəetmə",
    items: [
      { href: "/admin/organizations", label: "Təşkilatlar" },
      { href: "/admin/organizations/settings", label: "Təşkilat ayarları" },
      { href: "/admin/products", label: "Məhsullar" },
      { href: "/admin/products/settings", label: "Məhsul ayarları" },
      { href: "/admin/requirements", label: "Şərtlər" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/users", label: "İstifadəçilər" },
      { href: "/admin/roles", label: "Rollar" },
      { href: "/admin/texts", label: "Tərcümələr / Mətnlər" },
      { href: "/admin/languages", label: "Dillər" },
    ],
  },
  {
    title: "Ayarlar",
    items: [
      { href: "/admin/settings", label: "Ümumi ayarlar" },
      { href: "/admin/settings/branding", label: "Logo və ikon" },
      { href: "/admin/settings/rules", label: "Sistem qaydaları" },
      { href: "/admin/settings/applications", label: "Müraciət qaydaları" },
    ],
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [authMessage, setAuthMessage] = useState("Admin panel yoxlanılır...");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let authResolved = false;

    setMounted(true);

    const authorizeFromSnapshot = (snapshot) => {
      authResolved = true;
      setAdminUser(snapshot);
      setIsAuthorized(true);
      setAuthMessage("");
      setIsCheckingAuth(false);
    };

    const redirectAway = (path, message = "Giriş səhifəsinə yönləndirilir...") => {
      authResolved = true;
      if (isMounted) {
        setIsAuthorized(false);
        setAdminUser(null);
        setAuthMessage(message);
        setIsCheckingAuth(false);
      }
      router.replace(path);
    };

    const authSnapshot = readAuthSnapshot();

    if (authSnapshot) {
      authorizeFromSnapshot(authSnapshot);
    } else {
      clearAuthSnapshot();
      redirectAway("/login");
    }

    const authTimeout = window.setTimeout(() => {
      if (authResolved || !isMounted) return;
      const latestSnapshot = readAuthSnapshot();

      if (latestSnapshot) {
        authorizeFromSnapshot(latestSnapshot);
        return;
      }

      clearAuthSnapshot();
      redirectAway("/login", "Yoxlama tamamlanmadı. Giriş səhifəsinə yönləndirilir...");
    }, 3000);

    async function checkAdminAccess() {
      if (!authSnapshot) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;

        const { data: userData, error: userError } = sessionUser
          ? { data: { user: sessionUser }, error: null }
          : await supabase.auth.getUser();

        if (userError || !userData?.user) {
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, status, organization_id")
          .eq("id", userData.user.id)
          .single();

        if (profileError || !profile) {
          return;
        }

        if (profile.status !== "active") {
          await supabase.auth.signOut();
          clearAuthSnapshot();
          redirectAway("/login");
          return;
        }

        if (!ADMIN_ROLES.includes(profile.role)) {
          await supabase.auth.signOut();
          clearAuthSnapshot();
          redirectAway("/login", "Admin paneline giris icazesi yoxdur. Login sehifesine yonlendirilir...");
          return;
        }

        if (!isMounted || authResolved) return;

        saveAuthSnapshot(profile);
        authorizeFromSnapshot(profile);
      } catch (error) {
        if (!readAuthSnapshot()) {
          redirectAway("/login");
        }
      }
    }

    checkAdminAccess();

    return () => {
      isMounted = false;
      window.clearTimeout(authTimeout);
    };
  }, [router]);

  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarCollapsed(false);
      }
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => {
      window.removeEventListener("resize", checkScreen);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const currentPageLabel = useMemo(() => {
    const allItems = menuGroups
      .flatMap((group) => group.items)
      .sort((a, b) => b.href.length - a.href.length);
    const currentItem = allItems.find((item) => {
      if (item.href === "/admin") return pathname === "/admin";
      return pathname.startsWith(item.href);
    });

    return currentItem?.label || "Admin panel";
  }, [pathname]);

  const isActive = (href) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/organizations") return pathname === href;
    if (href === "/admin/products") return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuthSnapshot();
    setIsAuthorized(false);
    setAdminUser(null);
    setAuthMessage("Giriş səhifəsinə yönləndirilir...");
    setIsCheckingAuth(false);
    router.replace("/login");
  };

  if (!mounted || isCheckingAuth) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>{authMessage}</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          {authMessage || "Giriş səhifəsinə yönləndirilir..."}
        </div>
      </div>
    );
  }

  const sidebarWidth = sidebarCollapsed ? 76 : 248;
  const adminName = adminUser?.full_name || "Admin";
  const adminEmail = adminUser?.email || "-";
  const adminRole = adminUser?.role || "admin";

  return (
    <div style={styles.page}>
      {isMobile && mobileMenuOpen ? (
        <div
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
          <Link href="/admin" style={styles.brandWrap}>
            <div style={styles.brandMark}>V</div>

            {!sidebarCollapsed || isMobile ? (
              <div style={styles.brandText}>
                <div style={styles.brandTitle}>VaBank Admin</div>
                <div style={styles.brandSub}>idarəetmə paneli</div>
              </div>
            ) : null}
          </Link>

          {!isMobile ? (
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              style={styles.collapseBtn}
              title={sidebarCollapsed ? "Menyunu aç" : "Menyunu bağla"}
            >
              {sidebarCollapsed ? "›" : "‹"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              style={styles.collapseBtn}
              title="Menyunu bağla"
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
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        ...styles.menuLink,
                        ...(active ? styles.menuLinkActive : {}),
                        justifyContent:
                          sidebarCollapsed && !isMobile ? "center" : "flex-start",
                      }}
                      title={item.label}
                    >
                      {!sidebarCollapsed || isMobile ? (
                        <span style={styles.menuLabel}>{item.label}</span>
                      ) : (
                        <span style={styles.menuShort}>
                          {item.label.slice(0, 1)}
                        </span>
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
              ...styles.userInfo,
              justifyContent:
                sidebarCollapsed && !isMobile ? "center" : "flex-start",
            }}
          >
            {!sidebarCollapsed || isMobile ? (
              <div style={styles.userText}>
                <div style={styles.userName}>{adminName}</div>
                <div style={styles.userEmail}>{adminEmail}</div>
                <div style={styles.userRole}>{adminRole}</div>
              </div>
            ) : (
              <div style={styles.userShort}>{adminName.slice(0, 1)}</div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              ...styles.logoutBtn,
              justifyContent:
                sidebarCollapsed && !isMobile ? "center" : "center",
            }}
          >
            {!sidebarCollapsed || isMobile ? "Çıxış" : "×"}
          </button>
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
              >
                ☰
              </button>
            ) : null}

            <div>
              <div style={styles.topbarTitle}>{currentPageLabel}</div>
              <div style={styles.topbarSub}>VaBank idarəetmə sistemi</div>
            </div>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.roleBadge}>{adminRole}</div>
          </div>
        </header>

        <main style={styles.main}>
          <div style={styles.content}>{children}</div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
    fontWeight: 600,
    color: "#475569",
  },

  sidebarBottom: {
    borderTop: "1px solid #e2e8f0",
    padding: "12px",
    display: "grid",
    gap: "8px",
  },

  userInfo: {
    minHeight: "58px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    minWidth: 0,
  },

  userText: {
    minWidth: 0,
  },

  userName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#0f172a",
    lineHeight: 1.25,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  userEmail: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px",
    lineHeight: 1.25,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  userRole: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
    lineHeight: 1.25,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  userShort: {
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

  logoutBtn: {
    minHeight: "40px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    background: "#fff7f7",
    color: "#b91c1c",
    padding: "0 12px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
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
    fontWeight: 600,
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
  },
};

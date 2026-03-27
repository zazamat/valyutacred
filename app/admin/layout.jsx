"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/organizations", label: "Təşkilatlar" },
  { href: "/admin/products", label: "Məhsullar" },
  { href: "/admin/requirements", label: "Şərtlər" },
  { href: "/admin/applications", label: "Müraciətlər" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div style={styles.page}>
      <header style={styles.topbar}>
        <div style={styles.brandWrap}>
          <div style={styles.brandIcon}>◔</div>
          <div>
            <div style={styles.brandTitle}>ValyutaCred Admin</div>
            <div style={styles.brandSub}>Lead və kredit idarəetmə paneli</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.navLink,
                ...(isActive(item.href) ? styles.navLinkActive : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main style={styles.main}>
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #dbe4ee",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },
  brandIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#059669",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 800,
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#047857",
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "2px",
    lineHeight: 1.4,
  },
  nav: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  navLink: {
    textDecoration: "none",
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  navLinkActive: {
    background: "#059669",
    color: "#ffffff",
    border: "1px solid #059669",
  },
  main: {
    width: "100%",
  },
  content: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "28px 24px 40px",
  },
};
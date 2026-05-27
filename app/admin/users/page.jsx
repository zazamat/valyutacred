"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

const emptyForm = {
  full_name: "",
  email: "",
  password: "",
  role: "organization_user",
  status: "active",
  organization_id: "",
};

const ROLE_LABELS = {
  super_admin: "Super admin",
  admin: "Admin",
  organization_user: "Organization user",
  customer: "Customer",
};

const STATUS_LABELS = {
  active: "Aktiv",
  pending: "Gozleyir",
  inactive: "Deaktiv",
  blocked: "Bloklanib",
};

function getMappedLabel(value, labels) {
  if (!value) return "-";
  return labels[value] || value;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("az-AZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusStyle(status) {
  if (status === "active") return styles.badgeSuccess;
  if (status === "pending") return styles.badgeWarning;
  return styles.badgeNeutral;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const organizationOptions = useMemo(() => {
    return organizations.map((item) => ({
      id: item.id,
      label: `${item.name || `Organization #${item.id}`} (${item.status || "-"} / ${
        item.approval_status || "-"
      })`,
    }));
  }, [organizations]);

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || "";
  }

  async function requestUsers(options = {}) {
    const token = await getAccessToken();

    if (!token) {
      throw new Error(
        "Supabase admin sessiyasi tapilmadi. Zehmet olmasa /login ile admin kimi daxil olun."
      );
    }

    const response = await fetch("/api/admin/users", {
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Istifadeci emeliyyati alinmadi.");
    }

    return payload;
  }

  async function loadUsers() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const payload = await requestUsers();
      setUsers(payload.users || []);
      setOrganizations(payload.organizations || []);
    } catch (err) {
      setUsers([]);
      setOrganizations([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createUser(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.organization_id) {
      setError("Organization secilmelidir.");
      return;
    }

    setSaving(true);

    try {
      const payload = await requestUsers({
        method: "POST",
        body: form,
      });

      setUsers(payload.users || []);
      setOrganizations(payload.organizations || []);
      setForm(emptyForm);
      setMessage(
        `${payload.message} Organization: ${payload.organization_name || "-"}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Istifadeciler</h1>
        <p style={styles.subtitle}>
          Organization user yarat, movcud teskilata bagla ve login test flow-u
          ucun aktivlesdir.
        </p>
      </div>

      {message ? <div style={styles.messageBox}>{message}</div> : null}
      {error ? <div style={styles.errorBox}>{error}</div> : null}

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Organization user yarat</h2>
          <p style={styles.panelDesc}>
            Bu MVP yalniz organization_user yaratmaq ucundur. User Supabase
            Auth-da yaranir ve profiles setrinde organization-a baglanir.
          </p>
        </div>

        <form onSubmit={createUser}>
          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Full name</label>
              <input
                value={form.full_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, full_name: e.target.value }))
                }
                disabled={saving}
                style={styles.input}
                placeholder="Organization test user"
              />
            </div>

            <div>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                disabled={saving}
                style={styles.input}
                placeholder="org-user@example.com"
              />
            </div>

            <div>
              <label style={styles.label}>Temporary password</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                disabled={saving}
                style={styles.input}
                placeholder="Minimum 6 simvol"
              />
            </div>

            <div>
              <label style={styles.label}>Role</label>
              <select value={form.role} disabled style={styles.select}>
                <option value="organization_user">Organization user</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
                disabled={saving}
                style={styles.select}
              >
                <option value="active">Aktiv</option>
                <option value="pending">Gozleyir</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Organization</label>
              <select
                value={form.organization_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    organization_id: e.target.value,
                  }))
                }
                disabled={saving || !organizationOptions.length}
                style={styles.select}
              >
                <option value="">Organization secin</option>
                {organizationOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.actionRow}>
            <button type="submit" disabled={saving} style={styles.primaryButton}>
              {saving ? "Yaradilir..." : "Organization user yarat"}
            </button>
          </div>
        </form>
      </section>

      <section style={styles.panel}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.panelTitle}>Movcud users/profiles</h2>
            <p style={styles.panelDesc}>
              Profiles cedvelindeki user-ler ve organization baglantisi.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            style={styles.secondaryButton}
          >
            {loading ? "Yuklenir..." : "Yenile"}
          </button>
        </div>

        {loading ? <div style={styles.stateBox}>Istifadeciler yuklenir...</div> : null}

        {!loading && !users.length && !error ? (
          <div style={styles.stateBox}>Istifadeci tapilmadi.</div>
        ) : null}

        {!loading && users.length ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Full name</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Organization</th>
                  <th style={styles.th}>Created at</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={styles.tdStrong}>{user.email || "-"}</td>
                    <td style={styles.td}>{user.full_name || "-"}</td>
                    <td style={styles.td}>
                      {getMappedLabel(user.role, ROLE_LABELS)}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...getStatusStyle(user.status),
                        }}
                      >
                        {getMappedLabel(user.status, STATUS_LABELS)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {user.organization_name || "-"}
                      {user.organization_id ? (
                        <div style={styles.cellMeta}>
                          Organization #{user.organization_id}
                        </div>
                      ) : null}
                    </td>
                    <td style={styles.td}>{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "56px",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    fontSize: "16px",
    color: "#475569",
    maxWidth: "780px",
    lineHeight: 1.6,
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    marginBottom: "18px",
  },

  panelHeader: {
    marginBottom: "16px",
  },

  tableHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },

  panelTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 850,
    color: "#0f172a",
  },

  panelDesc: {
    margin: "7px 0 0",
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "14px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    fontWeight: 750,
    color: "#0f172a",
  },

  input: {
    width: "100%",
    height: "46px",
    boxSizing: "border-box",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "0 13px",
    fontSize: "14px",
    color: "#0f172a",
    outline: "none",
    fontFamily: "inherit",
  },

  select: {
    width: "100%",
    height: "46px",
    boxSizing: "border-box",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "0 13px",
    fontSize: "14px",
    color: "#0f172a",
    outline: "none",
    fontFamily: "inherit",
  },

  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "16px",
  },

  primaryButton: {
    minHeight: "42px",
    borderRadius: "13px",
    border: "1px solid #059669",
    background: "#059669",
    color: "#ffffff",
    padding: "0 16px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  secondaryButton: {
    minHeight: "40px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 14px",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  messageBox: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
    borderRadius: "16px",
    padding: "13px 15px",
    marginBottom: "16px",
    fontSize: "14px",
    fontWeight: 650,
    lineHeight: 1.55,
  },

  errorBox: {
    background: "#fff7f7",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "16px",
    padding: "13px 15px",
    marginBottom: "16px",
    fontSize: "14px",
    fontWeight: 650,
    lineHeight: 1.55,
  },

  stateBox: {
    minHeight: "74px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "16px",
    color: "#475569",
    fontSize: "14px",
    fontWeight: 650,
    display: "flex",
    alignItems: "center",
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    background: "#ffffff",
  },

  table: {
    width: "100%",
    minWidth: "920px",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },

  th: {
    textAlign: "left",
    padding: "13px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "13px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    color: "#334155",
    fontSize: "14px",
    verticalAlign: "top",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  tdStrong: {
    padding: "13px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 800,
    verticalAlign: "top",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  cellMeta: {
    marginTop: "5px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 500,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "30px",
    borderRadius: "999px",
    padding: "0 10px",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  badgeSuccess: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },

  badgeWarning: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
  },

  badgeNeutral: {
    background: "#f8fafc",
    color: "#475569",
    border: "1px solid #e2e8f0",
  },
};

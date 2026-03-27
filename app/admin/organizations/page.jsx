"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  ORGANIZATION_TYPE_STATUSES,
  ORGANIZATION_STATUSES,
  APPROVAL_STATUSES,
} from "../../../lib/admin-options";

const slugify = (text = "") =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ə/g, "e")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const getLabel = (list, value) =>
  list.find((item) => item.value === value)?.label || value || "-";

const getNextValue = (list, current) => {
  const index = list.findIndex((item) => item.value === current);
  if (index === -1) return list[0]?.value;
  return list[(index + 1) % list.length]?.value;
};

const getBadgeStyle = (value) => {
  const map = {
    active: {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    },
    inactive: {
      background: "#f3f4f6",
      color: "#4b5563",
      border: "1px solid #e5e7eb",
    },
    draft: {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
    },
    archived: {
      background: "#e5e7eb",
      color: "#374151",
      border: "1px solid #d1d5db",
    },
    pending: {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    },
    approved: {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    },
    rejected: {
      background: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    },
    incomplete: {
      background: "#ffedd5",
      color: "#9a3412",
      border: "1px solid #fed7aa",
    },
  };

  return {
    ...styles.badge,
    ...(map[value] || map.inactive),
  };
};

const emptyTypeForm = {
  name: "",
  slug: "",
  status: "active",
};

const emptyOrgForm = {
  name: "",
  organization_type_id: "",
  website: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  region: "",
  balance: 0,
  lead_price: 0,
  status: "draft",
  approval_status: "pending",
  note: "",
};

export default function OrganizationsPage() {
  const [organizationTypes, setOrganizationTypes] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [typeForm, setTypeForm] = useState(emptyTypeForm);
  const [orgForm, setOrgForm] = useState(emptyOrgForm);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editingOrgId, setEditingOrgId] = useState(null);
  const [typeSlugTouched, setTypeSlugTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [message, setMessage] = useState("");

  const typeMap = useMemo(() => {
    const map = {};
    organizationTypes.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [organizationTypes]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const [typesRes, orgsRes] = await Promise.all([
      supabase.from("organization_types").select("*").order("id", { ascending: true }),
      supabase.from("organizations").select("*").order("id", { ascending: false }),
    ]);

    if (typesRes.error) {
      setMessage("Təşkilat növləri yüklənmədi: " + typesRes.error.message);
    } else {
      setOrganizationTypes(typesRes.data || []);
    }

    if (orgsRes.error) {
      setMessage((prev) =>
        prev
          ? `${prev} | Təşkilatlar yüklənmədi: ${orgsRes.error.message}`
          : "Təşkilatlar yüklənmədi: " + orgsRes.error.message
      );
    } else {
      setOrganizations(orgsRes.data || []);
    }

    setLoading(false);
  };

  const resetTypeForm = () => {
    setTypeForm(emptyTypeForm);
    setEditingTypeId(null);
    setTypeSlugTouched(false);
  };

  const resetOrgForm = () => {
    setOrgForm(emptyOrgForm);
    setEditingOrgId(null);
  };

  const handleTypeNameChange = (value) => {
    setTypeForm((prev) => ({
      ...prev,
      name: value,
      slug: typeSlugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleTypeSlugChange = (value) => {
    setTypeSlugTouched(true);
    setTypeForm((prev) => ({
      ...prev,
      slug: slugify(value),
    }));
  };

  const saveType = async (e) => {
    e.preventDefault();

    if (!typeForm.name.trim()) {
      setMessage("Təşkilat növü adı boş ola bilməz.");
      return;
    }

    if (!typeForm.slug.trim()) {
      setMessage("Slug / sistem açarı boş ola bilməz.");
      return;
    }

    setSavingType(true);
    setMessage("");

    const payload = {
      name: typeForm.name.trim(),
      slug: slugify(typeForm.slug),
      status: typeForm.status,
    };

    const response = editingTypeId
      ? await supabase.from("organization_types").update(payload).eq("id", editingTypeId)
      : await supabase.from("organization_types").insert([payload]);

    setSavingType(false);

    if (response.error) {
      setMessage("Təşkilat növü yadda saxlanmadı: " + response.error.message);
      return;
    }

    setMessage(editingTypeId ? "Təşkilat növü yeniləndi." : "Təşkilat növü əlavə olundu.");
    resetTypeForm();
    loadData();
  };

  const startEditType = (item) => {
    setEditingTypeId(item.id);
    setTypeForm({
      name: item.name || "",
      slug: item.slug || "",
      status: item.status || "active",
    });
    setTypeSlugTouched(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleTypeStatus = async (item) => {
    const nextStatus = item.status === "active" ? "inactive" : "active";

    const { error } = await supabase
      .from("organization_types")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (error) {
      setMessage("Təşkilat növü statusu dəyişmədi: " + error.message);
      return;
    }

    setMessage("Təşkilat növü statusu yeniləndi.");
    loadData();
  };

  const deleteType = async (item) => {
    const confirmed = window.confirm(
      `"${item.name}" təşkilat növünü silmək istədiyinizə əminsiniz?`
    );
    if (!confirmed) return;

    const { error } = await supabase.from("organization_types").delete().eq("id", item.id);

    if (error) {
      setMessage("Təşkilat növü silinmədi: " + error.message);
      return;
    }

    if (editingTypeId === item.id) resetTypeForm();

    setMessage("Təşkilat növü silindi.");
    loadData();
  };

  const saveOrganization = async (e) => {
    e.preventDefault();

    if (!orgForm.name.trim()) {
      setMessage("Təşkilat adı boş ola bilməz.");
      return;
    }

    if (!orgForm.organization_type_id) {
      setMessage("Təşkilat növü seçilməlidir.");
      return;
    }

    setSavingOrg(true);
    setMessage("");

    const payload = {
      name: orgForm.name.trim(),
      organization_type_id: Number(orgForm.organization_type_id),
      website: orgForm.website.trim() || null,
      contact_person: orgForm.contact_person.trim() || null,
      phone: orgForm.phone.trim() || null,
      email: orgForm.email.trim() || null,
      address: orgForm.address.trim() || null,
      region: orgForm.region.trim() || null,
      balance: Number(orgForm.balance || 0),
      lead_price: Number(orgForm.lead_price || 0),
      status: orgForm.status,
      approval_status: orgForm.approval_status,
      note: orgForm.note.trim() || null,
    };

    const response = editingOrgId
      ? await supabase.from("organizations").update(payload).eq("id", editingOrgId)
      : await supabase.from("organizations").insert([payload]);

    setSavingOrg(false);

    if (response.error) {
      setMessage("Təşkilat yadda saxlanmadı: " + response.error.message);
      return;
    }

    setMessage(editingOrgId ? "Təşkilat yeniləndi." : "Təşkilat əlavə olundu.");
    resetOrgForm();
    loadData();
  };

  const startEditOrganization = (item) => {
    setEditingOrgId(item.id);
    setOrgForm({
      name: item.name || "",
      organization_type_id: item.organization_type_id ? String(item.organization_type_id) : "",
      website: item.website || "",
      contact_person: item.contact_person || "",
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
      region: item.region || "",
      balance: item.balance ?? 0,
      lead_price: item.lead_price ?? 0,
      status: item.status || "draft",
      approval_status: item.approval_status || "pending",
      note: item.note || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleOrgStatus = async (item) => {
    const nextStatus = getNextValue(ORGANIZATION_STATUSES, item.status);

    const { error } = await supabase
      .from("organizations")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (error) {
      setMessage("Təşkilat statusu dəyişmədi: " + error.message);
      return;
    }

    setMessage("Təşkilat statusu yeniləndi.");
    loadData();
  };

  const toggleApprovalStatus = async (item) => {
    const nextStatus = getNextValue(APPROVAL_STATUSES, item.approval_status);

    const { error } = await supabase
      .from("organizations")
      .update({ approval_status: nextStatus })
      .eq("id", item.id);

    if (error) {
      setMessage("Approval status dəyişmədi: " + error.message);
      return;
    }

    setMessage("Approval status yeniləndi.");
    loadData();
  };

  const deleteOrganization = async (item) => {
    const confirmed = window.confirm(
      `"${item.name}" təşkilatını silmək istədiyinizə əminsiniz?`
    );
    if (!confirmed) return;

    const { error } = await supabase.from("organizations").delete().eq("id", item.id);

    if (error) {
      setMessage("Təşkilat silinmədi: " + error.message);
      return;
    }

    if (editingOrgId === item.id) resetOrgForm();

    setMessage("Təşkilat silindi.");
    loadData();
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Təşkilatlar</h1>
          <p style={styles.subtitle}>
            Təşkilat növlərini, təşkilat profillərini və statusları idarə et.
          </p>
        </div>
      </div>

      {message ? <div style={styles.messageBox}>{message}</div> : null}

      <div style={styles.topGrid}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>
              {editingTypeId ? "Təşkilat növünü redaktə et" : "Təşkilat növü əlavə et"}
            </h2>
            <p style={styles.panelDesc}>
              Növ adı, slug və aktivlik statusunu buradan idarə et.
            </p>
          </div>

          <form onSubmit={saveType}>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Növ adı</label>
                <input
                  style={styles.input}
                  placeholder="Məsələn: Kredit ittifaqı"
                  value={typeForm.name}
                  onChange={(e) => handleTypeNameChange(e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Slug / sistem açarı</label>
                <input
                  style={styles.input}
                  placeholder="Məsələn: kredit-ittifaqi"
                  value={typeForm.slug}
                  onChange={(e) => handleTypeSlugChange(e.target.value)}
                />
              </div>
            </div>

            <div style={styles.singleField}>
              <label style={styles.label}>Status</label>
              <select
                style={styles.select}
                value={typeForm.status}
                onChange={(e) =>
                  setTypeForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                {ORGANIZATION_TYPE_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.actionRow}>
              <button type="submit" style={styles.primaryButton} disabled={savingType}>
                {savingType
                  ? "Yadda saxlanır..."
                  : editingTypeId
                  ? "Təşkilat növünü yenilə"
                  : "Təşkilat növü əlavə et"}
              </button>

              {editingTypeId ? (
                <button type="button" style={styles.secondaryButton} onClick={resetTypeForm}>
                  Ləğv et
                </button>
              ) : null}
            </div>
          </form>

          <div style={styles.sectionTitle}>Mövcud növlər</div>

          <div style={styles.stack}>
            {organizationTypes.map((item) => (
              <div key={item.id} style={styles.typeCard}>
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.cardTitle}>{item.name}</div>
                    <div style={styles.cardSub}>Slug: {item.slug || "-"}</div>
                  </div>

                  <span style={getBadgeStyle(item.status)}>
                    {getLabel(ORGANIZATION_TYPE_STATUSES, item.status)}
                  </span>
                </div>

                <div style={styles.inlineActions}>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => startEditType(item)}
                  >
                    Edit et
                  </button>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => toggleTypeStatus(item)}
                  >
                    Status dəyiş
                  </button>
                  <button
                    type="button"
                    style={styles.deleteButton}
                    onClick={() => deleteType(item)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}

            {!organizationTypes.length && !loading ? (
              <div style={styles.emptyBox}>Hələ təşkilat növü yoxdur.</div>
            ) : null}
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>
              {editingOrgId ? "Təşkilatı redaktə et" : "Təşkilat əlavə et"}
            </h2>
            <p style={styles.panelDesc}>
              Təşkilat məlumatları, qiymətlər və statusları buradan yenilə.
            </p>
          </div>

          <form onSubmit={saveOrganization}>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Təşkilat adı</label>
                <input
                  style={styles.input}
                  placeholder="Məsələn: Kapital Bank"
                  value={orgForm.name}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Təşkilat növü</label>
                <select
                  style={styles.select}
                  value={orgForm.organization_type_id}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      organization_type_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Seçin</option>
                  {organizationTypes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Rəsmi sayt</label>
                <input
                  style={styles.input}
                  placeholder="https://..."
                  value={orgForm.website}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, website: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Əlaqədar şəxs</label>
                <input
                  style={styles.input}
                  placeholder="Ad Soyad"
                  value={orgForm.contact_person}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      contact_person: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Telefon</label>
                <input
                  style={styles.input}
                  placeholder="+994..."
                  value={orgForm.phone}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  placeholder="mail@bank.az"
                  value={orgForm.email}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Ünvan</label>
                <input
                  style={styles.input}
                  placeholder="Ünvan"
                  value={orgForm.address}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Region</label>
                <input
                  style={styles.input}
                  placeholder="Bakı, Gəncə və s."
                  value={orgForm.region}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, region: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Balans (AZN)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={orgForm.balance}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, balance: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Lead qiyməti (AZN)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={orgForm.lead_price}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, lead_price: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.select}
                  value={orgForm.status}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  {ORGANIZATION_STATUSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Approval status</label>
                <select
                  style={styles.select}
                  value={orgForm.approval_status}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      approval_status: e.target.value,
                    }))
                  }
                >
                  {APPROVAL_STATUSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.singleField}>
              <label style={styles.label}>Qısa qeyd / təsvir</label>
              <textarea
                style={styles.textarea}
                placeholder="Təşkilat haqqında qısa qeyd"
                value={orgForm.note}
                onChange={(e) =>
                  setOrgForm((prev) => ({ ...prev, note: e.target.value }))
                }
              />
            </div>

            <div style={styles.actionRow}>
              <button type="submit" style={styles.primaryButton} disabled={savingOrg}>
                {savingOrg
                  ? "Yadda saxlanır..."
                  : editingOrgId
                  ? "Təşkilatı yenilə"
                  : "Təşkilat əlavə et"}
              </button>

              {editingOrgId ? (
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={resetOrgForm}
                >
                  Ləğv et
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>

      <section style={styles.bottomPanel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Mövcud təşkilatlar</h2>
          <p style={styles.panelDesc}>
            Əlavə olunmuş təşkilatları buradan redaktə et, statusunu və approval vəziyyətini dəyiş.
          </p>
        </div>

        {loading ? <div style={styles.emptyBox}>Yüklənir...</div> : null}

        <div style={styles.orgList}>
          {organizations.map((org) => (
            <div key={org.id} style={styles.orgCard}>
              <div style={styles.cardTop}>
                <div>
                  <div style={styles.orgTitle}>{org.name}</div>
                  <div style={styles.cardSub}>
                    {typeMap[org.organization_type_id]?.name || "-"}
                    {org.website ? ` • ${org.website}` : ""}
                  </div>
                </div>

                <div style={styles.badgeRow}>
                  <span style={getBadgeStyle(org.status)}>
                    {getLabel(ORGANIZATION_STATUSES, org.status)}
                  </span>
                  <span style={getBadgeStyle(org.approval_status)}>
                    {getLabel(APPROVAL_STATUSES, org.approval_status)}
                  </span>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <div><strong>Əlaqədar şəxs:</strong> {org.contact_person || "-"}</div>
                <div><strong>Telefon:</strong> {org.phone || "-"}</div>
                <div><strong>Email:</strong> {org.email || "-"}</div>
                <div><strong>Ünvan:</strong> {org.address || "-"}</div>
                <div><strong>Region:</strong> {org.region || "-"}</div>
                <div><strong>Qeyd:</strong> {org.note || "-"}</div>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Balans</div>
                  <div style={styles.statValue}>{org.balance || 0} AZN</div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Lead qiyməti</div>
                  <div style={styles.statValue}>{org.lead_price || 0} AZN</div>
                </div>
              </div>

              <div style={styles.inlineActions}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => startEditOrganization(org)}
                >
                  Edit et
                </button>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => toggleOrgStatus(org)}
                >
                  Status dəyiş
                </button>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => toggleApprovalStatus(org)}
                >
                  Approval dəyiş
                </button>
                <button
                  type="button"
                  style={styles.deleteButton}
                  onClick={() => deleteOrganization(org)}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}

          {!organizations.length && !loading ? (
            <div style={styles.emptyBox}>Hələ təşkilat əlavə olunmayıb.</div>
          ) : null}
        </div>
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
    maxWidth: "760px",
    lineHeight: 1.6,
  },
  messageBox: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #dbe4ee",
    borderRadius: "18px",
    padding: "14px 16px",
    marginBottom: "18px",
    fontSize: "14px",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    alignItems: "start",
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "28px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  bottomPanel: {
    marginTop: "20px",
    background: "#ffffff",
    border: "1px solid #dbe4ee",
    borderRadius: "28px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  panelHeader: {
    marginBottom: "16px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.15,
    fontWeight: 850,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  panelDesc: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
  },
  sectionTitle: {
    marginTop: "22px",
    marginBottom: "12px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#047857",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  singleField: {
    marginTop: "14px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    height: "48px",
    boxSizing: "border-box",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "0 14px",
    fontSize: "15px",
    color: "#0f172a",
    outline: "none",
  },
  select: {
    width: "100%",
    height: "48px",
    boxSizing: "border-box",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "0 14px",
    fontSize: "15px",
    color: "#0f172a",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    boxSizing: "border-box",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "14px",
    fontSize: "15px",
    color: "#0f172a",
    outline: "none",
    resize: "vertical",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "16px",
  },
  primaryButton: {
    background: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteButton: {
    background: "#ffffff",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  typeCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "18px",
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "6px",
  },
  cardSub: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "32px",
    padding: "0 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  inlineActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  orgList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  orgCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "18px",
  },
  orgTitle: {
    fontSize: "22px",
    fontWeight: 850,
    color: "#0f172a",
    marginBottom: "6px",
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px 20px",
    marginBottom: "16px",
    color: "#334155",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "14px",
  },
  statCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "14px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "6px",
  },
  statValue: {
    fontSize: "22px",
    fontWeight: 850,
    color: "#0f172a",
  },
  emptyBox: {
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "18px",
    padding: "18px",
    color: "#64748b",
    textAlign: "center",
    fontSize: "14px",
  },
};
"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import {
  ORGANIZATION_TYPE_STATUSES,
  ORGANIZATION_STATUSES,
  APPROVAL_STATUSES,
} from "../../../../lib/admin-options";
import OrganizationPermissionsPanel from "../_components/OrganizationPermissionsPanel";

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

const MONETIZATION_MODEL_OPTIONS = [
  { value: "lead_fee_only", label: "Yalnız lead haqqı" },
  { value: "success_fee_only", label: "Yalnız uğurlu kredit komissiyası" },
  { value: "hybrid", label: "Lead haqqı + uğurlu kredit komissiyası" },
  { value: "free_test", label: "Pulsuz/test rejimi" },
  { value: "disabled", label: "Deaktiv" },
];

const SUCCESS_FEE_TYPE_OPTIONS = [
  { value: "percent", label: "Faizlə" },
  { value: "fixed", label: "Sabit məbləğ" },
];

const MONETIZATION_STATUS_OPTIONS = [
  { value: "active", label: "Aktiv" },
  { value: "paused", label: "Dayandırılıb" },
  { value: "disabled", label: "Deaktiv" },
];

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
  can_receive_leads: false,
  can_buy_open_market_leads: false,
  cabinet_enabled: false,
  monetization_model: "lead_fee_only",
  lead_fee_enabled: true,
  lead_fee_amount: 0,
  success_fee_enabled: false,
  success_fee_type: "percent",
  success_fee_percent: 0,
  success_fee_fixed_amount: 0,
  attribution_window_days: 90,
  monetization_status: "active",
  status: "draft",
  approval_status: "pending",
  note: "",
};

export default function OrganizationSettingsPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

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

  const latestOrganizations = useMemo(
    () => organizations.slice(0, 3),
    [organizations]
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!editId || loading) return;

    const organizationId = Number(editId);
    if (!organizationId || editingOrgId === organizationId) return;

    const organizationToEdit = organizations.find(
      (item) => Number(item.id) === organizationId
    );

    if (organizationToEdit) startEditOrganization(organizationToEdit);
  }, [editId, loading, organizations, editingOrgId]);

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

  const updateMonetizationModel = (model) => {
    setOrgForm((prev) => {
      const next = { ...prev, monetization_model: model };

      if (model === "disabled") {
        next.lead_fee_enabled = false;
        next.success_fee_enabled = false;
        next.monetization_status = "disabled";
      }

      if (model === "free_test") {
        next.lead_fee_enabled = false;
        next.success_fee_enabled = false;
      }

      if (model === "lead_fee_only") {
        next.lead_fee_enabled = true;
        next.success_fee_enabled = false;
        if (prev.monetization_status === "disabled") next.monetization_status = "active";
      }

      if (model === "success_fee_only") {
        next.lead_fee_enabled = false;
        next.success_fee_enabled = true;
        if (prev.monetization_status === "disabled") next.monetization_status = "active";
      }

      if (model === "hybrid" && prev.monetization_status === "disabled") {
        next.monetization_status = "active";
      }

      return next;
    });
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

  const updateTypeStatus = async (item, nextStatus) => {
    if (!nextStatus || nextStatus === item.status) return;

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

    if (!orgForm.monetization_model) {
      setMessage("Monetizasiya modeli boş ola bilməz.");
      return;
    }

    if (!orgForm.monetization_status) {
      setMessage("Monetizasiya statusu boş ola bilməz.");
      return;
    }

    if (!!orgForm.lead_fee_enabled && Number(orgForm.lead_fee_amount || 0) < 0) {
      setMessage("Lead haqqı məbləği 0-dan kiçik ola bilməz.");
      return;
    }

    if (
      !!orgForm.success_fee_enabled &&
      orgForm.success_fee_type === "percent" &&
      Number(orgForm.success_fee_percent || 0) < 0
    ) {
      setMessage("Success fee faizi 0-dan kiçik ola bilməz.");
      return;
    }

    if (
      !!orgForm.success_fee_enabled &&
      orgForm.success_fee_type === "fixed" &&
      Number(orgForm.success_fee_fixed_amount || 0) < 0
    ) {
      setMessage("Success fee sabit məbləği 0-dan kiçik ola bilməz.");
      return;
    }

    if (Number(orgForm.attribution_window_days || 0) < 0) {
      setMessage("Attribution müddəti 0-dan kiçik ola bilməz.");
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
      can_receive_leads: !!orgForm.can_receive_leads,
      can_buy_open_market_leads: !!orgForm.can_buy_open_market_leads,
      cabinet_enabled: !!orgForm.cabinet_enabled,
      monetization_model: orgForm.monetization_model,
      lead_fee_enabled: !!orgForm.lead_fee_enabled,
      lead_fee_amount: Number(orgForm.lead_fee_amount || 0),
      success_fee_enabled: !!orgForm.success_fee_enabled,
      success_fee_type: orgForm.success_fee_type || "percent",
      success_fee_percent: Number(orgForm.success_fee_percent || 0),
      success_fee_fixed_amount: Number(orgForm.success_fee_fixed_amount || 0),
      attribution_window_days: Number(orgForm.attribution_window_days || 0),
      monetization_status: orgForm.monetization_status,
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
      can_receive_leads: !!item.can_receive_leads,
      can_buy_open_market_leads: !!item.can_buy_open_market_leads,
      cabinet_enabled: !!item.cabinet_enabled,
      monetization_model: item.monetization_model || "lead_fee_only",
      lead_fee_enabled: item.lead_fee_enabled ?? true,
      lead_fee_amount: item.lead_fee_amount ?? 0,
      success_fee_enabled: !!item.success_fee_enabled,
      success_fee_type: item.success_fee_type || "percent",
      success_fee_percent: item.success_fee_percent ?? 0,
      success_fee_fixed_amount: item.success_fee_fixed_amount ?? 0,
      attribution_window_days: item.attribution_window_days ?? 90,
      monetization_status: item.monetization_status || "active",
      status: item.status || "draft",
      approval_status: item.approval_status || "pending",
      note: item.note || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateOrgStatus = async (item, nextStatus) => {
    if (!nextStatus || nextStatus === item.status) return;

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

  const updateApprovalStatus = async (item, nextStatus) => {
    if (!nextStatus || nextStatus === item.approval_status) return;

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

  const isMonetizationDisabled = orgForm.monetization_model === "disabled";
  const isLeadFeeDisabled = isMonetizationDisabled || !orgForm.lead_fee_enabled;
  const isSuccessFeeDisabled = isMonetizationDisabled || !orgForm.success_fee_enabled;
  const isPercentFeeDisabled = isSuccessFeeDisabled || orgForm.success_fee_type !== "percent";
  const isFixedFeeDisabled = isSuccessFeeDisabled || orgForm.success_fee_type !== "fixed";

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Təşkilat ayarları</h1>
          <p style={styles.subtitle}>
            Təşkilat növləri, təşkilat profilləri, balans, lead qiyməti və statusları buradan idarə et.
          </p>
        </div>
      </div>

      {message ? <div style={styles.messageBox}>{message}</div> : null}

      <OrganizationPermissionsPanel organizations={organizations} />

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
                  <select
                    value={item.status || "active"}
                    onChange={(e) => updateTypeStatus(item, e.target.value)}
                    style={styles.statusSelect}
                    aria-label="Organization type status"
                  >
                    {ORGANIZATION_TYPE_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
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

            <div style={styles.groupTitle}>Lead</div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Balans</label>
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
                <label style={styles.label}>Default lead qiyməti</label>
                <input
                  type="number"
                  style={styles.input}
                  value={orgForm.lead_price}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, lead_price: e.target.value }))
                  }
                />
              </div>
            </div>

            <div style={styles.checkboxGrid}>
              <label style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={!!orgForm.can_receive_leads}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      can_receive_leads: e.target.checked,
                    }))
                  }
                />
                <span>Lead ala bilər</span>
              </label>

              <label style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={!!orgForm.can_buy_open_market_leads}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      can_buy_open_market_leads: e.target.checked,
                    }))
                  }
                />
                <span>Open market lead ala bilər</span>
              </label>

              <label style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={!!orgForm.cabinet_enabled}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      cabinet_enabled: e.target.checked,
                    }))
                  }
                />
                <span>Kabinet aktivdir</span>
              </label>
            </div>

            <div style={styles.groupTitle}>Monetizasiya ayarları</div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Monetizasiya modeli</label>
                <select
                  style={styles.select}
                  value={orgForm.monetization_model}
                  onChange={(e) => updateMonetizationModel(e.target.value)}
                >
                  {MONETIZATION_MODEL_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Monetizasiya statusu</label>
                <select
                  style={styles.select}
                  value={orgForm.monetization_status}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      monetization_status: e.target.value,
                    }))
                  }
                >
                  {MONETIZATION_STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.checkboxGrid}>
              <label style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={!!orgForm.lead_fee_enabled}
                  disabled={isMonetizationDisabled}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      lead_fee_enabled: e.target.checked,
                    }))
                  }
                />
                <span>Lead haqqı aktivdir</span>
              </label>

              <label style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={!!orgForm.success_fee_enabled}
                  disabled={isMonetizationDisabled}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      success_fee_enabled: e.target.checked,
                    }))
                  }
                />
                <span>Success fee aktivdir</span>
              </label>
            </div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Lead haqqı məbləği</label>
                <input
                  type="number"
                  style={{
                    ...styles.input,
                    ...(isLeadFeeDisabled ? styles.disabledField : {}),
                  }}
                  value={orgForm.lead_fee_amount}
                  disabled={isLeadFeeDisabled}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      lead_fee_amount: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Success fee tipi</label>
                <select
                  style={{
                    ...styles.select,
                    ...(isSuccessFeeDisabled ? styles.disabledField : {}),
                  }}
                  value={orgForm.success_fee_type}
                  disabled={isSuccessFeeDisabled}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      success_fee_type: e.target.value,
                    }))
                  }
                >
                  {SUCCESS_FEE_TYPE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Success fee faizi</label>
                <input
                  type="number"
                  style={{
                    ...styles.input,
                    ...(isPercentFeeDisabled ? styles.disabledField : {}),
                  }}
                  value={orgForm.success_fee_percent}
                  disabled={isPercentFeeDisabled}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      success_fee_percent: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Success fee sabit məbləği</label>
                <input
                  type="number"
                  style={{
                    ...styles.input,
                    ...(isFixedFeeDisabled ? styles.disabledField : {}),
                  }}
                  value={orgForm.success_fee_fixed_amount}
                  disabled={isFixedFeeDisabled}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      success_fee_fixed_amount: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Attribution müddəti</label>
                <input
                  type="number"
                  style={{
                    ...styles.input,
                    ...(isMonetizationDisabled ? styles.disabledField : {}),
                  }}
                  value={orgForm.attribution_window_days}
                  disabled={isMonetizationDisabled}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      attribution_window_days: e.target.value,
                    }))
                  }
                />
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
          <h2 style={styles.panelTitle}>Son 3 təşkilat</h2>
          <p style={styles.panelDesc}>
            Son əlavə edilən təşkilatları buradan tez redaktə edə bilərsən. Bütün siyahı üçün Təşkilatlar səhifəsinə keç.
          </p>
        </div>

        {loading ? <div style={styles.emptyBox}>Yüklənir...</div> : null}

        <div style={styles.orgList}>
          {latestOrganizations.map((org) => (
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

              <div style={styles.leadStatusGrid}>
                <div style={styles.leadStatusItem}>
                  <span style={styles.leadStatusLabel}>Lead:</span>{" "}
                  {org.can_receive_leads ? "Bəli" : "Xeyr"}
                </div>
                <div style={styles.leadStatusItem}>
                  <span style={styles.leadStatusLabel}>Open market:</span>{" "}
                  {org.can_buy_open_market_leads ? "Bəli" : "Xeyr"}
                </div>
                <div style={styles.leadStatusItem}>
                  <span style={styles.leadStatusLabel}>Kabinet:</span>{" "}
                  {org.cabinet_enabled ? "Aktiv" : "Deaktiv"}
                </div>
              </div>

              <div style={styles.leadStatusGrid}>
                <div style={styles.leadStatusItem}>
                  <span style={styles.leadStatusLabel}>Monetizasiya modeli:</span>{" "}
                  {getLabel(MONETIZATION_MODEL_OPTIONS, org.monetization_model)}
                </div>
                <div style={styles.leadStatusItem}>
                  <span style={styles.leadStatusLabel}>Lead haqqı:</span>{" "}
                  {org.lead_fee_enabled ? `${org.lead_fee_amount || 0} AZN` : "Deaktiv"}
                </div>
                <div style={styles.leadStatusItem}>
                  <span style={styles.leadStatusLabel}>Success fee:</span>{" "}
                  {org.success_fee_enabled
                    ? org.success_fee_type === "fixed"
                      ? `${org.success_fee_fixed_amount || 0} AZN`
                      : `${org.success_fee_percent || 0}%`
                    : "Deaktiv"}
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
                <select
                  value={org.status || "draft"}
                  onChange={(e) => updateOrgStatus(org, e.target.value)}
                  style={styles.statusSelect}
                  aria-label="Organization status"
                >
                  {ORGANIZATION_STATUSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <select
                  value={org.approval_status || "pending"}
                  onChange={(e) => updateApprovalStatus(org, e.target.value)}
                  style={styles.statusSelect}
                  aria-label="Approval status"
                >
                  {APPROVAL_STATUSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
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

        <div style={styles.viewAllRow}>
          <Link href="/admin/organizations" style={styles.viewAllLink}>
            Bütün təşkilatlara bax
          </Link>
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
  groupTitle: {
    marginTop: "20px",
    marginBottom: "12px",
    fontSize: "15px",
    fontWeight: 800,
    color: "#0f172a",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginTop: "14px",
  },
  checkboxCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: 600,
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
  disabledField: {
    background: "#f1f5f9",
    color: "#94a3b8",
    cursor: "not-allowed",
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
  statusSelect: {
    minHeight: "42px",
    minWidth: "150px",
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "0 12px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    outline: "none",
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
  viewAllRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "16px",
  },
  viewAllLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 16px",
    fontSize: "14px",
    fontWeight: 700,
    textDecoration: "none",
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
  leadStatusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "8px",
    marginBottom: "14px",
  },
  leadStatusItem: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "10px 12px",
    color: "#334155",
    fontSize: "13px",
    lineHeight: 1.4,
  },
  leadStatusLabel: {
    color: "#0f172a",
    fontWeight: 800,
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

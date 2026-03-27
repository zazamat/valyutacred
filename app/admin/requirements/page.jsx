export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

const INPUT_TYPE_OPTIONS = [
  { value: "boolean", label: "Checkbox / Bəli-Xeyr" },
  { value: "number", label: "Rəqəm" },
  { value: "text", label: "Mətn" },
  { value: "select", label: "Seçim siyahısı" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Deaktiv" },
];

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
  };

  return {
    ...styles.badge,
    ...(map[value] || map.inactive),
  };
};

const emptyForm = {
  name: "",
  slug: "",
  input_type: "boolean",
  unit: "",
  placeholder: "",
  options_json: "",
  status: "active",
  sort_order: 0,
};

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("requirement_types")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      setMessage("Şərtlər yüklənmədi: " + error.message);
    } else {
      setRequirements(data || []);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setSlugTouched(false);
  };

  const handleNameChange = (value) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleSlugChange = (value) => {
    setSlugTouched(true);
    setForm((prev) => ({
      ...prev,
      slug: slugify(value),
    }));
  };

  const saveRequirement = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setMessage("Şərt adı boş ola bilməz.");
      return;
    }

    if (!form.slug.trim()) {
      setMessage("Slug boş ola bilməz.");
      return;
    }

    if (form.input_type === "select" && form.options_json.trim()) {
      try {
        const parsed = JSON.parse(form.options_json);
        if (!Array.isArray(parsed)) {
          setMessage("Select üçün options_json array formatında olmalıdır.");
          return;
        }
      } catch {
        setMessage("Select üçün options_json düzgün JSON formatında deyil.");
        return;
      }
    }

    setSaving(true);
    setMessage("");

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      input_type: form.input_type,
      unit: form.unit.trim() || null,
      placeholder: form.placeholder.trim() || null,
      options_json: form.options_json.trim() ? JSON.parse(form.options_json) : null,
      status: form.status,
      sort_order: Number(form.sort_order || 0),
    };

    const response = editingId
      ? await supabase.from("requirement_types").update(payload).eq("id", editingId)
      : await supabase.from("requirement_types").insert([payload]);

    setSaving(false);

    if (response.error) {
      setMessage("Şərt yadda saxlanmadı: " + response.error.message);
      return;
    }

    setMessage(editingId ? "Şərt yeniləndi." : "Şərt əlavə olundu.");
    resetForm();
    loadData();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      slug: item.slug || "",
      input_type: item.input_type || "boolean",
      unit: item.unit || "",
      placeholder: item.placeholder || "",
      options_json: item.options_json ? JSON.stringify(item.options_json) : "",
      status: item.status || "active",
      sort_order: item.sort_order ?? 0,
    });
    setSlugTouched(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = async (item) => {
    const nextStatus = item.status === "active" ? "inactive" : "active";

    const { error } = await supabase
      .from("requirement_types")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (error) {
      setMessage("Şərtin statusu dəyişmədi: " + error.message);
      return;
    }

    setMessage("Şərtin statusu yeniləndi.");
    loadData();
  };

  const deleteRequirement = async (item) => {
    const confirmed = window.confirm(
      `"${item.name}" şərtini silmək istədiyinizə əminsiniz?`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("requirement_types")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage("Şərt silinmədi: " + error.message);
      return;
    }

    if (editingId === item.id) resetForm();

    setMessage("Şərt silindi.");
    loadData();
  };

  return (
    <div>
      <div style={styles.header}>
               <h1 style={styles.title}>Şərtlər</h1>
        <p style={styles.subtitle}>
          Məhsullarda istifadə olunacaq dinamik kredit şərtlərini buradan yarat və idarə et.
        </p>
      </div>

      {message ? <div style={styles.messageBox}>{message}</div> : null}

      <div style={styles.topGrid}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>
              {editingId ? "Şərti redaktə et" : "Şərt əlavə et"}
            </h2>
            <p style={styles.panelDesc}>
              Məsələn: Minimum staj, Minimum gəlir, Zamin tələb olunur və s.
            </p>
          </div>

          <form onSubmit={saveRequirement}>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Şərtin adı</label>
                <input
                  style={styles.input}
                  placeholder="Məsələn: Minimum staj"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Slug / sistem açarı</label>
                <input
                  style={styles.input}
                  placeholder="Meselen: minimum-staj"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Input tipi</label>
                <select
                  style={styles.select}
                  value={form.input_type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, input_type: e.target.value }))
                  }
                >
                  {INPUT_TYPE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Vahid</label>
                <input
                  style={styles.input}
                  placeholder="Məsələn: ay, AZN, yaş"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, unit: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Placeholder</label>
                <input
                  style={styles.input}
                  placeholder="Məsələn: 3"
                  value={form.placeholder}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, placeholder: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Sıra nömrəsi</label>
                <input
                  type="number"
                  style={styles.input}
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sort_order: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.select}
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.input_type === "select" ? (
              <div style={styles.singleField}>
                <label style={styles.label}>Seçim variantları (JSON array)</label>
                <textarea
                  style={styles.textarea}
                  placeholder='Məsələn: ["Bəli", "Xeyr"]'
                  value={form.options_json}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, options_json: e.target.value }))
                  }
                />
              </div>
            ) : null}

            <div style={styles.actionRow}>
              <button type="submit" style={styles.primaryButton} disabled={saving}>
                {saving
                  ? "Yadda saxlanır..."
                  : editingId
                  ? "Şərti yenilə"
                  : "Şərt əlavə et"}
              </button>

              {editingId ? (
                <button type="button" style={styles.secondaryButton} onClick={resetForm}>
                  Ləğv et
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Mövcud şərtlər</h2>
            <p style={styles.panelDesc}>
              Yaradılmış şərtləri buradan redaktə et, deaktiv et və ya sil.
            </p>
          </div>

          {loading ? <div style={styles.emptyBox}>Yüklənir...</div> : null}

          <div style={styles.stack}>
            {requirements.map((item) => (
              <div key={item.id} style={styles.typeCard}>
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.cardTitle}>{item.name}</div>
                    <div style={styles.cardSub}>Slug: {item.slug || "-"}</div>
                  </div>

                  <span style={getBadgeStyle(item.status)}>
                    {getLabel(STATUS_OPTIONS, item.status)}
                  </span>
                </div>

                <div style={styles.infoGrid}>
                  <div>
                    <strong>Input tipi:</strong>{" "}
                    {getLabel(INPUT_TYPE_OPTIONS, item.input_type)}
                  </div>
                  <div>
                    <strong>Vahid:</strong> {item.unit || "-"}
                  </div>
                  <div>
                    <strong>Placeholder:</strong> {item.placeholder || "-"}
                  </div>
                  <div>
                    <strong>Sıra:</strong> {item.sort_order ?? 0}
                  </div>
                  <div>
                    <strong>Options:</strong>{" "}
                    {item.options_json ? JSON.stringify(item.options_json) : "-"}
                  </div>
                </div>

                <div style={styles.inlineActions}>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => startEdit(item)}
                  >
                    Edit et
                  </button>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => toggleStatus(item)}
                  >
                    Status dəyiş
                  </button>
                  <button
                    type="button"
                    style={styles.deleteButton}
                    onClick={() => deleteRequirement(item)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}

            {!requirements.length && !loading ? (
              <div style={styles.emptyBox}>Hələ şərt əlavə olunmayıb.</div>
            ) : null}
          </div>
        </section>
      </div>
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
    maxWidth: "900px",
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
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
    marginTop: "18px",
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
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px 20px",
    marginBottom: "16px",
    color: "#334155",
    fontSize: "14px",
    lineHeight: 1.7,
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
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

const PRODUCT_TYPE_STATUSES = [
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Deaktiv" },
];

const PRODUCT_STATUSES = [
  { value: "draft", label: "Qaralama" },
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Deaktiv" },
  { value: "archived", label: "Arxiv" },
];

const APPROVAL_STATUSES = [
  { value: "pending", label: "Gözləyir" },
  { value: "approved", label: "Təsdiqlənib" },
  { value: "rejected", label: "Rədd edilib" },
];

const CURRENCIES = [
  { value: "AZN", label: "AZN" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
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

const getNextValue = (list, current) => {
  const index = list.findIndex((item) => item.value === current);
  if (index === -1) return list[0]?.value;
  return list[(index + 1) % list.length]?.value;
};

const formatNumber = (value) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat("az-AZ").format(num);
};

const safeJsonParse = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

const emptyProductForm = {
  credit_form_id: "",
  organization_type_id: "",
  organization_id: "",
  product_type_id: "",
  product_name: "",
  currency: "AZN",
  min_amount: "",
  max_amount: "",
  min_term_months: "",
  max_term_months: "",
  min_interest: "",
  default_interest: "",
  max_interest: "",
  has_commission: false,
  commission_amount: "",
  status: "draft",
  approval_status: "pending",
  is_active: true,
  note: "",
};

export default function ProductsPage() {
  const [creditForms, setCreditForms] = useState([]);
  const [organizationTypes, setOrganizationTypes] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [requirementTypes, setRequirementTypes] = useState([]);
  const [productRequirements, setProductRequirements] = useState([]);

  const [typeForm, setTypeForm] = useState(emptyTypeForm);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [requirementValues, setRequirementValues] = useState({});

  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [typeSlugTouched, setTypeSlugTouched] = useState(false);
  const [productNameTouched, setProductNameTouched] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [message, setMessage] = useState("");

  const typeMap = useMemo(() => {
    const map = {};
    organizationTypes.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [organizationTypes]);

  const orgMap = useMemo(() => {
    const map = {};
    organizations.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [organizations]);

  const creditFormMap = useMemo(() => {
    const map = {};
    creditForms.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [creditForms]);

  const productTypeMap = useMemo(() => {
    const map = {};
    productTypes.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [productTypes]);

  const requirementsByProductId = useMemo(() => {
    const map = {};
    productRequirements.forEach((item) => {
      if (!map[item.product_id]) {
        map[item.product_id] = [];
      }
      map[item.product_id].push(item);
    });
    return map;
  }, [productRequirements]);

  const filteredOrganizations = useMemo(() => {
    if (!productForm.organization_type_id) return [];
    return organizations.filter(
      (item) => String(item.organization_type_id) === String(productForm.organization_type_id)
    );
  }, [organizations, productForm.organization_type_id]);

  const activeRequirementTypes = useMemo(
    () =>
      requirementTypes
        .filter((item) => item.status === "active")
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [requirementTypes]
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const [
      formsRes,
      orgTypesRes,
      orgsRes,
      productTypesRes,
      productsRes,
      requirementTypesRes,
      productRequirementsRes,
    ] = await Promise.all([
      supabase.from("credit_forms").select("*").order("id", { ascending: true }),
      supabase.from("organization_types").select("*").order("id", { ascending: true }),
      supabase.from("organizations").select("*").order("id", { ascending: true }),
      supabase.from("product_types").select("*").order("id", { ascending: true }),
      supabase.from("products").select("*").order("id", { ascending: false }),
      supabase
        .from("requirement_types")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
      supabase.from("product_requirements").select("*").order("id", { ascending: true }),
    ]);

    const errors = [];

    if (formsRes.error) errors.push("Kredit formaları yüklənmədi: " + formsRes.error.message);
    else setCreditForms(formsRes.data || []);

    if (orgTypesRes.error)
      errors.push("Təşkilat növləri yüklənmədi: " + orgTypesRes.error.message);
    else setOrganizationTypes(orgTypesRes.data || []);

    if (orgsRes.error) errors.push("Təşkilatlar yüklənmədi: " + orgsRes.error.message);
    else setOrganizations(orgsRes.data || []);

    if (productTypesRes.error)
      errors.push("Məhsul növləri yüklənmədi: " + productTypesRes.error.message);
    else setProductTypes(productTypesRes.data || []);

    if (productsRes.error) errors.push("Məhsullar yüklənmədi: " + productsRes.error.message);
    else setProducts(productsRes.data || []);

    if (requirementTypesRes.error)
      errors.push("Şərt növləri yüklənmədi: " + requirementTypesRes.error.message);
    else setRequirementTypes(requirementTypesRes.data || []);

    if (productRequirementsRes.error)
      errors.push("Məhsul şərtləri yüklənmədi: " + productRequirementsRes.error.message);
    else setProductRequirements(productRequirementsRes.data || []);

    if (errors.length) {
      setMessage(errors.join(" | "));
    }

    setLoading(false);
  };

  const resetTypeForm = () => {
    setTypeForm(emptyTypeForm);
    setEditingTypeId(null);
    setTypeSlugTouched(false);
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setRequirementValues({});
    setEditingProductId(null);
    setProductNameTouched(false);
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

  const handleProductTypeSelection = (value) => {
    const selectedType = productTypes.find((item) => String(item.id) === String(value));

    setProductForm((prev) => ({
      ...prev,
      product_type_id: value,
      product_name:
        productNameTouched || editingProductId
          ? prev.product_name
          : selectedType?.name || "",
    }));
  };

  const handleRequirementValueChange = (requirement, value) => {
    setRequirementValues((prev) => ({
      ...prev,
      [String(requirement.id)]: value,
    }));
  };

  const buildRequirementPayloads = (productId) => {
    return activeRequirementTypes
      .map((requirement) => {
        const key = String(requirement.id);
        const rawValue = requirementValues[key];

        if (requirement.input_type === "boolean") {
          if (!rawValue) return null;
          return {
            product_id: productId,
            requirement_type_id: requirement.id,
            value_boolean: true,
            value_text: null,
            value_number: null,
            value_json: null,
            updated_at: new Date().toISOString(),
          };
        }

        if (requirement.input_type === "number") {
          if (rawValue === "" || rawValue === null || rawValue === undefined) return null;
          return {
            product_id: productId,
            requirement_type_id: requirement.id,
            value_boolean: null,
            value_text: null,
            value_number: Number(rawValue),
            value_json: null,
            updated_at: new Date().toISOString(),
          };
        }

        if (requirement.input_type === "select") {
          if (!rawValue) return null;
          return {
            product_id: productId,
            requirement_type_id: requirement.id,
            value_boolean: null,
            value_text: String(rawValue),
            value_number: null,
            value_json: null,
            updated_at: new Date().toISOString(),
          };
        }

        if (!rawValue) return null;
        return {
          product_id: productId,
          requirement_type_id: requirement.id,
          value_boolean: null,
          value_text: String(rawValue),
          value_number: null,
          value_json: null,
          updated_at: new Date().toISOString(),
        };
      })
      .filter(Boolean);
  };

  const saveProductType = async (e) => {
    e.preventDefault();

    if (!typeForm.name.trim()) {
      setMessage("Məhsul növü adı boş ola bilməz.");
      return;
    }

    if (!typeForm.slug.trim()) {
      setMessage("Slug boş ola bilməz.");
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
      ? await supabase.from("product_types").update(payload).eq("id", editingTypeId)
      : await supabase.from("product_types").insert([payload]);

    setSavingType(false);

    if (response.error) {
      setMessage("Məhsul növü yadda saxlanmadı: " + response.error.message);
      return;
    }

    setMessage(editingTypeId ? "Məhsul növü yeniləndi." : "Məhsul növü əlavə olundu.");
    resetTypeForm();
    loadData();
  };

  const startEditProductType = (item) => {
    setEditingTypeId(item.id);
    setTypeForm({
      name: item.name || "",
      slug: item.slug || "",
      status: item.status || "active",
    });
    setTypeSlugTouched(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleProductTypeStatus = async (item) => {
    const nextStatus = item.status === "active" ? "inactive" : "active";

    const { error } = await supabase
      .from("product_types")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (error) {
      setMessage("Məhsul növü statusu dəyişmədi: " + error.message);
      return;
    }

    setMessage("Məhsul növü statusu yeniləndi.");
    loadData();
  };

  const deleteProductType = async (item) => {
    const confirmed = window.confirm(
      `"${item.name}" məhsul növünü silmək istədiyinizə əminsiniz?`
    );
    if (!confirmed) return;

    const { error } = await supabase.from("product_types").delete().eq("id", item.id);

    if (error) {
      setMessage("Məhsul növü silinmədi: " + error.message);
      return;
    }

    if (editingTypeId === item.id) resetTypeForm();

    setMessage("Məhsul növü silindi.");
    loadData();
  };

  const saveProduct = async (e) => {
    e.preventDefault();

    if (!productForm.credit_form_id) {
      setMessage("Kredit forması seçilməlidir.");
      return;
    }

    if (!productForm.organization_type_id) {
      setMessage("Təşkilat növü seçilməlidir.");
      return;
    }

    if (!productForm.organization_id) {
      setMessage("Təşkilat adı seçilməlidir.");
      return;
    }

    if (!productForm.product_type_id) {
      setMessage("Məhsul növü seçilməlidir.");
      return;
    }

    const selectedProductType = productTypes.find(
      (item) => String(item.id) === String(productForm.product_type_id)
    );

    const finalProductName = productForm.product_name.trim() || selectedProductType?.name || "";

    if (!finalProductName) {
      setMessage("Məhsul adı boş ola bilməz.");
      return;
    }

    setSavingProduct(true);
    setMessage("");

    const payload = {
      credit_form_id: Number(productForm.credit_form_id),
      organization_type_id: Number(productForm.organization_type_id),
      organization_id: Number(productForm.organization_id),
      product_type_id: Number(productForm.product_type_id),
      product_name: finalProductName,
      currency: productForm.currency || "AZN",
      min_amount: Number(productForm.min_amount || 0),
      max_amount: Number(productForm.max_amount || 0),
      min_term_months: Number(productForm.min_term_months || 1),
      max_term_months: Number(productForm.max_term_months || 1),
      min_interest:
        productForm.min_interest === "" ? null : Number(productForm.min_interest),
      default_interest:
        productForm.default_interest === "" ? null : Number(productForm.default_interest),
      max_interest:
        productForm.max_interest === "" ? null : Number(productForm.max_interest),
      has_commission: !!productForm.has_commission,
      commission_amount: Number(productForm.commission_amount || 0),
      status: productForm.status,
      approval_status: productForm.approval_status,
      is_active: !!productForm.is_active,
      note: productForm.note.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const response = editingProductId
      ? await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProductId)
          .select()
          .single()
      : await supabase.from("products").insert([payload]).select().single();

    if (response.error) {
      setSavingProduct(false);
      setMessage("Məhsul yadda saxlanmadı: " + response.error.message);
      return;
    }

    const productId = response.data.id;

    const deleteOldRequirements = await supabase
      .from("product_requirements")
      .delete()
      .eq("product_id", productId);

    if (deleteOldRequirements.error) {
      setSavingProduct(false);
      setMessage("Şərtlər yenilənmədi: " + deleteOldRequirements.error.message);
      return;
    }

    const requirementPayloads = buildRequirementPayloads(productId);

    if (requirementPayloads.length) {
      const insertRequirements = await supabase
        .from("product_requirements")
        .insert(requirementPayloads);

      if (insertRequirements.error) {
        setSavingProduct(false);
        setMessage("Şərtlər yadda saxlanmadı: " + insertRequirements.error.message);
        return;
      }
    }

    setSavingProduct(false);
    setMessage(editingProductId ? "Məhsul yeniləndi." : "Məhsul əlavə olundu.");
    resetProductForm();
    loadData();
  };

  const startEditProduct = (item) => {
    const relatedRequirements = requirementsByProductId[item.id] || [];
    const nextRequirementValues = {};

    relatedRequirements.forEach((req) => {
      const key = String(req.requirement_type_id);
      if (req.value_boolean !== null && req.value_boolean !== undefined) {
        nextRequirementValues[key] = req.value_boolean;
      } else if (req.value_number !== null && req.value_number !== undefined) {
        nextRequirementValues[key] = String(req.value_number);
      } else if (req.value_text !== null && req.value_text !== undefined) {
        nextRequirementValues[key] = req.value_text;
      }
    });

    setEditingProductId(item.id);
    setProductForm({
      credit_form_id: item.credit_form_id ? String(item.credit_form_id) : "",
      organization_type_id: item.organization_type_id ? String(item.organization_type_id) : "",
      organization_id: item.organization_id ? String(item.organization_id) : "",
      product_type_id: item.product_type_id ? String(item.product_type_id) : "",
      product_name: item.product_name || "",
      currency: item.currency || "AZN",
      min_amount: item.min_amount ?? "",
      max_amount: item.max_amount ?? "",
      min_term_months: item.min_term_months ?? "",
      max_term_months: item.max_term_months ?? "",
      min_interest: item.min_interest ?? "",
      default_interest: item.default_interest ?? "",
      max_interest: item.max_interest ?? "",
      has_commission: !!item.has_commission,
      commission_amount: item.commission_amount ?? "",
      status: item.status || "draft",
      approval_status: item.approval_status || "pending",
      is_active: item.is_active ?? true,
      note: item.note || "",
    });
    setRequirementValues(nextRequirementValues);
    setProductNameTouched(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleProductStatus = async (item) => {
    const nextStatus = getNextValue(PRODUCT_STATUSES, item.status);

    const { error } = await supabase
      .from("products")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      setMessage("Məhsul statusu dəyişmədi: " + error.message);
      return;
    }

    setMessage("Məhsul statusu yeniləndi.");
    loadData();
  };

  const toggleProductApproval = async (item) => {
    const nextStatus = getNextValue(APPROVAL_STATUSES, item.approval_status);

    const { error } = await supabase
      .from("products")
      .update({
        approval_status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      setMessage("Approval status dəyişmədi: " + error.message);
      return;
    }

    setMessage("Approval status yeniləndi.");
    loadData();
  };

  const deleteProduct = async (item) => {
    const confirmed = window.confirm(
      `"${item.product_name}" məhsulunu silmək istədiyinizə əminsiniz?`
    );
    if (!confirmed) return;

    const { error } = await supabase.from("products").delete().eq("id", item.id);

    if (error) {
      setMessage("Məhsul silinmədi: " + error.message);
      return;
    }

    if (editingProductId === item.id) resetProductForm();

    setMessage("Məhsul silindi.");
    loadData();
  };

  const renderRequirementInput = (requirement) => {
    const key = String(requirement.id);
    const value = requirementValues[key];
    const inputType = requirement.input_type || "boolean";

    if (inputType === "boolean") {
      return (
        <label key={requirement.id} style={styles.checkboxCard}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleRequirementValueChange(requirement, e.target.checked)}
          />
          <span>{requirement.name}</span>
        </label>
      );
    }

    if (inputType === "select") {
      const options = safeJsonParse(requirement.options_json);
      return (
        <div key={requirement.id}>
          <label style={styles.label}>
            {requirement.name}
            {requirement.unit ? ` (${requirement.unit})` : ""}
          </label>
          <select
            style={styles.select}
            value={value || ""}
            onChange={(e) => handleRequirementValueChange(requirement, e.target.value)}
          >
            <option value="">Seçin</option>
            {options.map((option, idx) => {
              const optionValue =
                typeof option === "string"
                  ? option
                  : option?.value || option?.label || `opt-${idx}`;
              const optionLabel =
                typeof option === "string"
                  ? option
                  : option?.label || option?.value || `Variant ${idx + 1}`;
              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

    return (
      <div key={requirement.id}>
        <label style={styles.label}>
          {requirement.name}
          {requirement.unit ? ` (${requirement.unit})` : ""}
        </label>
        <input
          type={inputType === "number" ? "number" : "text"}
          step={inputType === "number" ? "0.01" : undefined}
          style={styles.input}
          placeholder={requirement.placeholder || ""}
          value={value || ""}
          onChange={(e) => handleRequirementValueChange(requirement, e.target.value)}
        />
      </div>
    );
  };

  const renderRequirementSummary = (productId) => {
    const relatedRequirements = requirementsByProductId[productId] || [];
    if (!relatedRequirements.length) return "-";

    const parts = relatedRequirements.map((req) => {
      const definition = requirementTypes.find((item) => item.id === req.requirement_type_id);
      if (!definition) return null;

      let valueLabel = "-";

      if (req.value_boolean !== null && req.value_boolean !== undefined) {
        valueLabel = req.value_boolean ? "Bəli" : "Xeyr";
      } else if (req.value_number !== null && req.value_number !== undefined) {
        valueLabel = `${req.value_number}${definition.unit ? ` ${definition.unit}` : ""}`;
      } else if (req.value_text) {
        valueLabel = `${req.value_text}${definition.unit ? ` ${definition.unit}` : ""}`;
      }

      return `${definition.name}: ${valueLabel}`;
    });

    return parts.filter(Boolean).join(" • ");
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Məhsullar</h1>
          <p style={styles.subtitle}>
            Kredit forması, təşkilat bağlılığı, məhsul növləri və dinamik kredit şərtlərini buradan idarə et.
          </p>
        </div>
      </div>

      {message ? <div style={styles.messageBox}>{message}</div> : null}

      <div style={styles.topGrid}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>
              {editingTypeId ? "Məhsul növünü redaktə et" : "Məhsul növü əlavə et"}
            </h2>
            <p style={styles.panelDesc}>
              “Nağd kredit”, “Kart krediti”, “İpoteka” kimi ümumi məhsul növlərini bir dəfə yarat.
            </p>
          </div>

          <form onSubmit={saveProductType}>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Məhsul növü adı</label>
                <input
                  style={styles.input}
                  placeholder="Məsələn: Nağd kredit"
                  value={typeForm.name}
                  onChange={(e) => handleTypeNameChange(e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Slug / sistem açarı</label>
                <input
                  style={styles.input}
                  placeholder="Meselen: nagd-kredit"
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
                {PRODUCT_TYPE_STATUSES.map((item) => (
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
                  ? "Məhsul növünü yenilə"
                  : "Məhsul növü əlavə et"}
              </button>

              {editingTypeId ? (
                <button type="button" style={styles.secondaryButton} onClick={resetTypeForm}>
                  Ləğv et
                </button>
              ) : null}
            </div>
          </form>

          <div style={styles.sectionTitle}>Mövcud məhsul növləri</div>

          <div style={styles.stack}>
            {productTypes.map((item) => (
              <div key={item.id} style={styles.typeCard}>
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.cardTitle}>{item.name}</div>
                    <div style={styles.cardSub}>Slug: {item.slug || "-"}</div>
                  </div>

                  <span style={getBadgeStyle(item.status)}>
                    {getLabel(PRODUCT_TYPE_STATUSES, item.status)}
                  </span>
                </div>

                <div style={styles.inlineActions}>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => startEditProductType(item)}
                  >
                    Edit et
                  </button>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => toggleProductTypeStatus(item)}
                  >
                    Status dəyiş
                  </button>
                  <button
                    type="button"
                    style={styles.deleteButton}
                    onClick={() => deleteProductType(item)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}

            {!productTypes.length && !loading ? (
              <div style={styles.emptyBox}>Hələ məhsul növü yoxdur.</div>
            ) : null}
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>
              {editingProductId ? "Məhsulu redaktə et" : "Məhsul əlavə et"}
            </h2>
            <p style={styles.panelDesc}>
              Kredit forması → təşkilat növü → təşkilat → məhsul növü zəncirinə uyğun məhsul yarat.
            </p>
          </div>

          <form onSubmit={saveProduct}>
            <div style={styles.groupTitle}>Əsas bağlılıq məlumatları</div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Kredit forması</label>
                <select
                  style={styles.select}
                  value={productForm.credit_form_id}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      credit_form_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Seçin</option>
                  {creditForms.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Təşkilat növü</label>
                <select
                  style={styles.select}
                  value={productForm.organization_type_id}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      organization_type_id: e.target.value,
                      organization_id: "",
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
                <label style={styles.label}>Təşkilat adı</label>
                <select
                  style={styles.select}
                  value={productForm.organization_id}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      organization_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Seçin</option>
                  {filteredOrganizations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Məhsul növü</label>
                <select
                  style={styles.select}
                  value={productForm.product_type_id}
                  onChange={(e) => handleProductTypeSelection(e.target.value)}
                >
                  <option value="">Seçin</option>
                  {productTypes
                    .filter((item) => item.status === "active")
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>

              <div style={styles.fullWidth}>
                <label style={styles.label}>Məhsul adı</label>
                <input
                  style={styles.input}
                  placeholder="Boş qoysan, seçilən məhsul növünün adı götürüləcək"
                  value={productForm.product_name}
                  onChange={(e) => {
                    setProductNameTouched(true);
                    setProductForm((prev) => ({
                      ...prev,
                      product_name: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>

            <div style={styles.groupTitle}>Kredit detalları</div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Valyuta</label>
                <select
                  style={styles.select}
                  value={productForm.currency}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                >
                  {CURRENCIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Minimum məbləğ</label>
                <input
                  type="number"
                  style={styles.input}
                  value={productForm.min_amount}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      min_amount: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Maksimum məbləğ</label>
                <input
                  type="number"
                  style={styles.input}
                  value={productForm.max_amount}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      max_amount: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Minimum müddət (ay)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={productForm.min_term_months}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      min_term_months: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Maksimum müddət (ay)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={productForm.max_term_months}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      max_term_months: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div style={styles.groupTitle}>Faiz və komissiya</div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Minimum faiz (%)</label>
                <input
                  type="number"
                  step="0.01"
                  style={styles.input}
                  value={productForm.min_interest}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      min_interest: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Default faiz (%)</label>
                <input
                  type="number"
                  step="0.01"
                  style={styles.input}
                  value={productForm.default_interest}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      default_interest: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Maksimum faiz (%)</label>
                <input
                  type="number"
                  step="0.01"
                  style={styles.input}
                  value={productForm.max_interest}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      max_interest: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Komissiya məbləği</label>
                <input
                  type="number"
                  step="0.01"
                  style={styles.input}
                  value={productForm.commission_amount}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      commission_amount: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div style={styles.checkboxGrid}>
              <label style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={productForm.has_commission}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      has_commission: e.target.checked,
                    }))
                  }
                />
                <span>Komissiya var</span>
              </label>
            </div>

            <div style={styles.groupTitle}>Dinamik şərtlər / ilkin tələblər</div>

            <div style={styles.checkboxGrid}>
              {activeRequirementTypes
                .filter((item) => item.input_type === "boolean")
                .map((item) => renderRequirementInput(item))}
            </div>

            <div style={styles.formGrid}>
              {activeRequirementTypes
                .filter((item) => item.input_type !== "boolean")
                .map((item) => renderRequirementInput(item))}
            </div>

            <div style={styles.groupTitle}>Status və qeyd</div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.select}
                  value={productForm.status}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  {PRODUCT_STATUSES.map((item) => (
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
                  value={productForm.approval_status}
                  onChange={(e) =>
                    setProductForm((prev) => ({
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

            <div style={styles.checkboxGrid}>
              <label style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={productForm.is_active}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                />
                <span>Aktivdir</span>
              </label>
            </div>

            <div style={styles.singleField}>
              <label style={styles.label}>Qeyd</label>
              <textarea
                style={styles.textarea}
                placeholder="Məhsul haqqında əlavə qeyd"
                value={productForm.note}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    note: e.target.value,
                  }))
                }
              />
            </div>

            <div style={styles.actionRow}>
              <button type="submit" style={styles.primaryButton} disabled={savingProduct}>
                {savingProduct
                  ? "Yadda saxlanır..."
                  : editingProductId
                  ? "Məhsulu yenilə"
                  : "Məhsul əlavə et"}
              </button>

              {editingProductId ? (
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={resetProductForm}
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
          <h2 style={styles.panelTitle}>Mövcud məhsullar</h2>
          <p style={styles.panelDesc}>
            Əlavə olunmuş məhsulları redaktə et, statusunu və approval vəziyyətini dəyiş.
          </p>
        </div>

        {loading ? <div style={styles.emptyBox}>Yüklənir...</div> : null}

        <div style={styles.orgList}>
          {products.map((item) => (
            <div key={item.id} style={styles.orgCard}>
              <div style={styles.cardTop}>
                <div>
                  <div style={styles.orgTitle}>{item.product_name}</div>
                  <div style={styles.cardSub}>
                    {creditFormMap[item.credit_form_id]?.name || "-"} •{" "}
                    {typeMap[item.organization_type_id]?.name || "-"} •{" "}
                    {orgMap[item.organization_id]?.name || "-"} •{" "}
                    {productTypeMap[item.product_type_id]?.name || "-"}
                  </div>
                </div>

                <div style={styles.badgeRow}>
                  <span style={getBadgeStyle(item.status)}>
                    {getLabel(PRODUCT_STATUSES, item.status)}
                  </span>
                  <span style={getBadgeStyle(item.approval_status)}>
                    {getLabel(APPROVAL_STATUSES, item.approval_status)}
                  </span>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <div>
                  <strong>Valyuta:</strong> {item.currency || "-"}
                </div>
                <div>
                  <strong>Faiz:</strong> {item.min_interest ?? "-"} / {item.default_interest ?? "-"} /{" "}
                  {item.max_interest ?? "-"} %
                </div>
                <div>
                  <strong>Məbləğ:</strong> {formatNumber(item.min_amount)} -{" "}
                  {formatNumber(item.max_amount)} {item.currency || "AZN"}
                </div>
                <div>
                  <strong>Müddət:</strong> {item.min_term_months} - {item.max_term_months} ay
                </div>
                <div>
                  <strong>Komissiya:</strong>{" "}
                  {item.has_commission
                    ? `${formatNumber(item.commission_amount)} ${item.currency || "AZN"}`
                    : "Yoxdur"}
                </div>
                <div>
                  <strong>Aktivlik:</strong> {item.is_active ? "Aktiv" : "Deaktiv"}
                </div>
                <div>
                  <strong>Şərtlər:</strong> {renderRequirementSummary(item.id)}
                </div>
                <div>
                  <strong>Qeyd:</strong> {item.note || "-"}
                </div>
              </div>

              <div style={styles.inlineActions}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => startEditProduct(item)}
                >
                  Edit et
                </button>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => toggleProductStatus(item)}
                >
                  Status dəyiş
                </button>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => toggleProductApproval(item)}
                >
                  Approval dəyiş
                </button>
                <button
                  type="button"
                  style={styles.deleteButton}
                  onClick={() => deleteProduct(item)}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}

          {!products.length && !loading ? (
            <div style={styles.emptyBox}>Hələ məhsul əlavə olunmayıb.</div>
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
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  fullWidth: {
    gridColumn: "1 / -1",
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
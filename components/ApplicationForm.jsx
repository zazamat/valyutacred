"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ApplicationForm() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    amount: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.full_name.trim() || !form.phone.trim() || !form.amount) {
      alert("Zəhmət olmasa bütün sahələri doldurun.");
      return;
    }

    const amountNumber = Number(form.amount);

    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      alert("Məbləği düzgün daxil edin.");
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase.from("applications").insert([
        {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          amount: amountNumber,
          status: "new",
        },
      ]);

      if (error) {
        alert("Xəta baş verdi: " + error.message);
        return;
      }

      alert("Müraciət göndərildi.");

      setForm({
        full_name: "",
        phone: "",
        amount: "",
      });
    } catch (error) {
      alert("Xəta baş verdi.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "24px",
        padding: "24px",
        display: "grid",
        gap: "14px",
        boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
      }}
    >
      <div>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: "28px",
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Müraciət formu
        </h3>

        <p
          style={{
            margin: 0,
            fontSize: "14px",
            lineHeight: 1.7,
            color: "#64748b",
          }}
        >
          Məlumatları daxil edin, müraciət sistemə düşsün.
        </p>
      </div>

      <input
        type="text"
        placeholder="Ad soyad"
        value={form.full_name}
        onChange={(e) => handleChange("full_name", e.target.value)}
        style={{
          width: "100%",
          padding: "14px 16px",
          border: "1px solid #cbd5e1",
          borderRadius: "14px",
          fontSize: "15px",
          boxSizing: "border-box",
          outline: "none",
        }}
      />

      <input
        type="text"
        placeholder="Telefon"
        value={form.phone}
        onChange={(e) => handleChange("phone", e.target.value)}
        style={{
          width: "100%",
          padding: "14px 16px",
          border: "1px solid #cbd5e1",
          borderRadius: "14px",
          fontSize: "15px",
          boxSizing: "border-box",
          outline: "none",
        }}
      />

      <input
        type="number"
        placeholder="Məbləğ"
        value={form.amount}
        onChange={(e) => handleChange("amount", e.target.value)}
        style={{
          width: "100%",
          padding: "14px 16px",
          border: "1px solid #cbd5e1",
          borderRadius: "14px",
          fontSize: "15px",
          boxSizing: "border-box",
          outline: "none",
        }}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          border: "none",
          borderRadius: "14px",
          padding: "14px 18px",
          background: "#059669",
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: 800,
          cursor: isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? "Göndərilir..." : "Göndər"}
      </button>
    </form>
  );
}
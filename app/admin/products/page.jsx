"use client";

import { useState } from "react";

const organizations = [
  { id: 1, name: "Kapital Bank", type: "Bank" },
  { id: 2, name: "Unibank", type: "Bank" },
  { id: 3, name: "Finoko", type: "BOKT" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    organizationId: "",
    name: "",
    interest: "",
    minAmount: "",
    maxAmount: "",
    minTerm: "",
    maxTerm: "",
  });

  function handleSubmit(e) {
    e.preventDefault();

    const org = organizations.find(
      (o) => String(o.id) === form.organizationId
    );

    const newProduct = {
      id: Date.now(),
      organization: org?.name,
      organizationType: org?.type,
      name: form.name,
      interest: form.interest,
      minAmount: form.minAmount,
      maxAmount: form.maxAmount,
      minTerm: form.minTerm,
      maxTerm: form.maxTerm,
      status: "pending",
    };

    setProducts([newProduct, ...products]);

    setForm({
      organizationId: "",
      name: "",
      interest: "",
      minAmount: "",
      maxAmount: "",
      minTerm: "",
      maxTerm: "",
    });
  }

  function approve(id) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "approved" } : p
      )
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Məhsullar</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
        <select
          value={form.organizationId}
          onChange={(e) =>
            setForm({ ...form, organizationId: e.target.value })
          }
          required
        >
          <option value="">Təşkilat seç</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.type})
            </option>
          ))}
        </select>

        <input
          placeholder="Məhsul adı"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          required
        />

        <input
          placeholder="Faiz (%)"
          value={form.interest}
          onChange={(e) =>
            setForm({ ...form, interest: e.target.value })
          }
        />

        <input
          placeholder="Min məbləğ"
          value={form.minAmount}
          onChange={(e) =>
            setForm({ ...form, minAmount: e.target.value })
          }
        />

        <input
          placeholder="Max məbləğ"
          value={form.maxAmount}
          onChange={(e) =>
            setForm({ ...form, maxAmount: e.target.value })
          }
        />

        <input
          placeholder="Min müddət (ay)"
          value={form.minTerm}
          onChange={(e) =>
            setForm({ ...form, minTerm: e.target.value })
          }
        />

        <input
          placeholder="Max müddət (ay)"
          value={form.maxTerm}
          onChange={(e) =>
            setForm({ ...form, maxTerm: e.target.value })
          }
        />

        <button type="submit">Əlavə et</button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Təşkilat</th>
            <th>Məhsul</th>
            <th>Faiz</th>
            <th>Məbləğ</th>
            <th>Müddət</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                {p.organization} ({p.organizationType})
              </td>
              <td>{p.name}</td>
              <td>{p.interest}%</td>
              <td>
                {p.minAmount} - {p.maxAmount}
              </td>
              <td>
                {p.minTerm} - {p.maxTerm} ay
              </td>
              <td>{p.status}</td>
              <td>
                {p.status === "pending" && (
                  <button onClick={() => approve(p.id)}>
                    Təsdiq et
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

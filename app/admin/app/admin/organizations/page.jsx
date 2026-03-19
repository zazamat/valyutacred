"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const defaultOrganizations = [
  {
    id: 1,
    name: "Kapital Bank",
    type: "bank",
    status: "active",
    acceptsLeads: true,
  },
  {
    id: 2,
    name: "ABB",
    type: "bank",
    status: "active",
    acceptsLeads: true,
  },
  {
    id: 3,
    name: "Finoko",
    type: "bokt",
    status: "active",
    acceptsLeads: true,
  },
];

function loadOrganizations() {
  try {
    const stored = localStorage.getItem("valyutacred_organizations");

    if (!stored) {
      localStorage.setItem(
        "valyutacred_organizations",
        JSON.stringify(defaultOrganizations)
      );
      return defaultOrganizations;
    }

    return JSON.parse(stored);
  } catch {
    return defaultOrganizations;
  }
}

function saveOrganizations(data) {
  localStorage.setItem("valyutacred_organizations", JSON.stringify(data));
}

export default function OrganizationsPage() {
  const router = useRouter();

  const [organizations, setOrganizations] = useState([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [form, setForm] = useState({
    name: "",
    type: "bank",
  });

  useEffect(() => {
    const auth = localStorage.getItem("valyutacred_auth");

    if (!auth) {
      router.push("/login");
      return;
    }

    setOrganizations(loadOrganizations());
    setIsCheckingAuth(false);
  }, [router]);

  function addOrganization(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Ad daxil edin");
      return;
    }

    const maxId = organizations.reduce((max, item) => {
      return item.id > max ? item.id : max;
    }, 0);

    const newOrg = {
      id: maxId + 1,
      name: form.name.trim(),
      type: form.type,
      status: "active",
      acceptsLeads: true,
    };

    const updated = [newOrg, ...organizations];
    setOrganizations(updated);
    saveOrganizations(updated);

    setForm({ name: "", type: "bank" });
  }

  function toggleStatus(id) {
    const updated = organizations.map((org) =>
      org.id === id
        ? {
            ...org,
            status: org.status === "active" ? "inactive" : "active",
          }
        : org
    );

    setOrganizations(updated);
    saveOrganizations(updated);
  }

  if (isCheckingAuth) return null;

  return (
    <div style={{ padding: 20 }}>
      <h1>Təşkilatlar</h1>

      <Link href="/admin/applications">← Müraciətlərə qayıt</Link>

      <form onSubmit={addOrganization} style={{ marginTop: 20 }}>
        <input
          placeholder="Təşkilat adı"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="bank">Bank</option>
          <option value="bokt">BOKT</option>
          <option value="lombard">Lombard</option>
        </select>

        <button type="submit">Əlavə et</button>
      </form>

      <div style={{ marginTop: 30 }}>
        {organizations.map((org) => (
          <div
            key={org.id}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <b>{org.name}</b> ({org.type})

            <div>Status: {org.status}</div>

            <button onClick={() => toggleStatus(org.id)}>
              Status dəyiş
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

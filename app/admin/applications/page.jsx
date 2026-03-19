"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const defaultApplications = [
  {
    id: 1,
    name: "Elvin Məmmədov",
    phone: "+994 50 111 22 33",
    bank: "Kapital Bank",
    type: "Nağd kredit",
    amount: 12000,
    amountLabel: "12 000 AZN",
    salary: 900,
    salaryLabel: "900 AZN",
    status: "Yeni",
    date: "2026-03-19",
    workplace: "Azersun",
    note: "İlkin yoxlama gözləyir",
  },
  {
    id: 2,
    name: "Aysel Həsənova",
    phone: "+994 55 444 55 66",
    bank: "ABB",
    type: "Biznes krediti",
    amount: 20000,
    amountLabel: "20 000 AZN",
    salary: 1500,
    salaryLabel: "1 500 AZN",
    status: "Baxılır",
    date: "2026-03-18",
    workplace: "Şəxsi biznes",
    note: "Sənədlər dəqiqləşdirilir",
  },
  {
    id: 3,
    name: "Murad Əliyev",
    phone: "+994 70 777 88 99",
    bank: "Unibank",
    type: "İpoteka",
    amount: 85000,
    amountLabel: "85 000 AZN",
    salary: 2500,
    salaryLabel: "2 500 AZN",
    status: "Göndərildi",
    date: "2026-03-17",
    workplace: "SOCAR",
    note: "Banka yönləndirilib",
  },
  {
    id: 4,
    name: "Nigar Qasımova",
    phone: "+994 51 333 22 11",
    bank: "Yelo Bank",
    type: "Kart krediti",
    amount: 3500,
    amountLabel: "3 500 AZN",
    salary: 700,
    salaryLabel: "700 AZN",
    status: "Yeni",
    date: "2026-03-19",
    workplace: "Kontakt Home",
    note: "Əlavə əlaqə tələb olunur",
  },
  {
    id: 5,
    name: "Rəşad Səfərli",
    phone: "+994 12 555 44 33",
    bank: "Kapital Bank",
    type: "Nağd kredit",
    amount: 7000,
    amountLabel: "7 000 AZN",
    salary: 1100,
    salaryLabel: "1 100 AZN",
    status: "Baxılır",
    date: "2026-03-16",
    workplace: "Bravo",
    note: "Operator baxışındadır",
  },
  {
    id: 6,
    name: "Sevinc Məmmədli",
    phone: "+994 77 888 99 00",
    bank: "ABB",
    type: "İpoteka",
    amount: 60000,
    amountLabel: "60 000 AZN",
    salary: 3200,
    salaryLabel: "3 200 AZN",
    status: "Yeni",
    date: "2026-03-15",
    workplace: "PAŞA Holding",
    note: "Yüksək prioritet lead",
  },
];

function loadApplicationsFromStorage() {
  try {
    const stored = localStorage.getItem("valyutacred_applications");

    if (!stored) {
      localStorage.setItem(
        "valyutacred_applications",
        JSON.stringify(defaultApplications)
      );
      return defaultApplications;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(
        "valyutacred_applications",
        JSON.stringify(defaultApplications)
      );
      return defaultApplications;
    }

    return parsed;
  } catch (error) {
    localStorage.setItem(
      "valyutacred_applications",
      JSON.stringify(defaultApplications)
    );
    return defaultApplications;
  }
}

function getStatusStyles(status) {
  if (status === "Yeni") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
    };
  }

  if (status === "Baxılır") {
    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  if (status === "Göndərildi") {
    return {
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (status === "Rədd edildi") {
    return {
      background: "#fee2e2",
      color: "#991b1b",
    };
  }

  return {
    background: "#e2e8f0",
    color: "#334155",
  };
}

function matchesSalaryRange(salary, range) {
  if (!range) return true;
  if (range === "0-500") return salary >= 0 && salary <= 500;
  if (range === "500-1000") return salary > 500 && salary <= 1000;
  if (range === "1000-2000") return salary > 1000 && salary <= 2000;
  if (range === "2000+") return salary > 2000;
  return true;
}

function matchesAmountRange(amount, range) {
  if (!range) return true;
  if (range === "0-5000") return amount >= 0 && amount <= 5000;
  if (range === "5000-10000") return amount > 5000 && amount <= 10000;
  if (range === "10000-50000") return amount > 10000 && amount <= 50000;
  if (range === "50000+") return amount > 50000;
  return true;
}

function matchesDateFilter(itemDate, filter) {
  if (!filter) return true;

  const today = new Date("2026-03-19");
  const createdAt = new Date(itemDate);

  if (filter === "today") {
    return itemDate === "2026-03-19";
  }

  if (filter === "yesterday") {
    return itemDate === "2026-03-18";
  }

  if (filter === "7days") {
    const diffMs = today - createdAt;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }

  if (filter === "30days") {
    const diffMs = today - createdAt;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }

  return true;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [applications, setApplications] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [bank, setBank] = useState("");
  const [creditType, setCreditType] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [amountRange, setAmountRange] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    try {
      const auth = localStorage.getItem("valyutacred_auth");

      if (!auth) {
        router.push("/login");
        return;
      }

      const parsed = JSON.parse(auth);

      if (parsed.role !== "super_admin" && parsed.role !== "admin") {
        router.push("/login");
        return;
      }

      setApplications(loadApplicationsFromStorage());
      setIsCheckingAuth(false);
    } catch (error) {
      localStorage.removeItem("valyutacred_auth");
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    function refreshApplications() {
      setApplications(loadApplicationsFromStorage());
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshApplications();
      }
    }

    window.addEventListener("focus", refreshApplications);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshApplications);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      const normalizedSearch = search.trim().toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.phone.toLowerCase().includes(normalizedSearch);

      const matchesStatus = !status || item.status === status;
      const matchesBank = !bank || item.bank === bank;
      const matchesType = !creditType || item.type === creditType;
      const matchesSalary = matchesSalaryRange(item.salary, salaryRange);
      const matchesAmount = matchesAmountRange(item.amount, amountRange);
      const matchesDate = matchesDateFilter(item.date, dateFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesBank &&
        matchesType &&
        matchesSalary &&
        matchesAmount &&
        matchesDate
      );
    });
  }, [applications, search, status, bank, creditType, salaryRange, amountRange, dateFilter]);

  function resetFilters() {
    setSearch("");
    setStatus("");
    setBank("");
    setCreditType("");
    setSalaryRange("");
    setAmountRange("");
    setDateFilter("");
  }

  if (isCheckingAuth) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "18px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#047857" }}>
              Müraciətlər
            </div>
            <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
              Bütün kredit müraciətlərinin siyahısı
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/admin"
              style={{
                background: "#fff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                padding: "10px 16px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Admin panelə qayıt
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 20px" }}>
        <div
          style={{
            display: "grid",
            gap: "16px",
            marginBottom: "20px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "24px",
            padding: "20px",
            boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
          }}
        >
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>Filtrlər</div>
            <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
              Müraciətləri filtr et və uyğun lead-ləri tap
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Ad və ya telefon axtar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "12px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                fontSize: "14px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: "12px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                fontSize: "14px",
                background: "#fff",
                outline: "none",
                width: "100%",
              }}
            >
              <option value="">Bütün statuslar</option>
              <option value="Yeni">Yeni</option>
              <option value="Baxılır">Baxılır</option>
              <option value="Göndərildi">Göndərildi</option>
              <option value="Rədd edildi">Rədd edildi</option>
            </select>

            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              style={{
                padding: "12px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                fontSize: "14px",
                background: "#fff",
                outline: "none",
                width: "100%",
              }}
            >
              <option value="">Bütün banklar</option>
              <option value="Kapital Bank">Kapital Bank</option>
              <option value="ABB">ABB</option>
              <option value="Unibank">Unibank</option>
              <option value="Yelo Bank">Yelo Bank</option>
            </select>

            <select
              value={creditType}
              onChange={(e) => setCreditType(e.target.value)}
              style={{
                padding: "12px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                fontSize: "14px",
                background: "#fff",
                outline: "none",
                width: "100%",
              }}
            >
              <option value="">Bütün kredit növləri</option>
              <option value="Nağd kredit">Nağd kredit</option>
              <option value="Biznes krediti">Biznes krediti</option>
              <option value="İpoteka">İpoteka</option>
              <option value="Kart krediti">Kart krediti</option>
            </select>

            <select
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              style={{
                padding: "12px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                fontSize: "14px",
                background: "#fff",
                outline: "none",
                width: "100%",
              }}
            >
              <option value="">Bütün maaşlar</option>
              <option value="0-500">0 - 500 AZN</option>
              <option value="500-1000">500 - 1000 AZN</option>
              <option value="1000-2000">1000 - 2000 AZN</option>
              <option value="2000+">2000+ AZN</option>
            </select>

            <select
              value={amountRange}
              onChange={(e) => setAmountRange(e.target.value)}
              style={{
                padding: "12px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                fontSize: "14px",
                background: "#fff",
                outline: "none",
                width: "100%",
              }}
            >
              <option value="">Bütün məbləğlər</option>
              <option value="0-5000">0 - 5 000 AZN</option>
              <option value="5000-10000">5 000 - 10 000 AZN</option>
              <option value="10000-50000">10 000 - 50 000 AZN</option>
              <option value="50000+">50 000+ AZN</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: "12px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                fontSize: "14px",
                background: "#fff",
                outline: "none",
                width: "100%",
              }}
            >
              <option value="">Bütün tarixlər</option>
              <option value="today">Bu gün</option>
              <option value="yesterday">Dünən</option>
              <option value="7days">Son 7 gün</option>
              <option value="30days">Son 30 gün</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "14px", color: "#475569" }}>
              Tapılan müraciət sayı: <strong>{filteredApplications.length}</strong>
            </div>

            <button
              onClick={resetFilters}
              style={{
                background: "#fff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                padding: "10px 16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: "22px", fontWeight: 800 }}>Müraciət siyahısı</div>
            <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
              Filtrlənmiş nəticələr
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1100px",
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>ID</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Ad</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Telefon</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Bank</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Kredit növü</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Maaş</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Məbləğ</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Tarix</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Status</th>
                  <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((item) => {
                    const statusStyles = getStatusStyles(item.status);

                    return (
                      <tr key={item.id}>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                          #{item.id}
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                          {item.name}
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                          {item.phone}
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                          {item.bank}
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                          {item.type}
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                          {item.salaryLabel}
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                          {item.amountLabel}
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                          {item.date}
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "6px 10px",
                              borderRadius: "999px",
                              background: statusStyles.background,
                              color: statusStyles.color,
                              fontWeight: 700,
                              fontSize: "12px",
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                          <Link
                            href={`/admin/applications/${item.id}`}
                            style={{
                              display: "inline-block",
                              background: "#fff",
                              color: "#0f172a",
                              border: "1px solid #cbd5e1",
                              borderRadius: "10px",
                              padding: "8px 12px",
                              textDecoration: "none",
                              fontWeight: 700,
                            }}
                          >
                            Bax
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        padding: "24px 16px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      Heç bir nəticə tapılmadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

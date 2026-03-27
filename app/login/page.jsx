"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_USERS = [
  {
    email: "admin@valyutacred.az",
    password: "Admin123!",
    role: "super_admin",
    fullName: "Sistem Admini",
  },
  {
    email: "bank@valyutacred.az",
    password: "Bank123!",
    role: "bank_manager",
    fullName: "Bank Meneceri",
  },
  {
    email: "insurance@valyutacred.az",
    password: "Insure123!",
    role: "insurance_manager",
    fullName: "Sığorta Meneceri",
  },
  {
    email: "user@valyutacred.az",
    password: "User123!",
    role: "end_user",
    fullName: "Adi İstifadəçi",
  },
];

function getRedirectByRole(role) {
  if (role === "super_admin" || role === "admin") return "/admin";
  if (role === "bank_manager") return "/cabinet/bank";
  if (role === "insurance_manager") return "/cabinet/insurance";
  return "/profile";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    const user = DEMO_USERS.find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.password === password
    );

    if (!user) {
      setError("Email və ya şifrə yanlışdır.");
      return;
    }

    localStorage.setItem(
      "valyutacred_auth",
      JSON.stringify({
        isLoggedIn: true,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      })
    );

    router.push(getRedirectByRole(user.role));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
        color: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "24px",
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
          padding: "28px",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-block",
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
              borderRadius: "999px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "14px",
            }}
          >
            Giriş
          </div>

          <h1 style={{ margin: 0, fontSize: "34px", fontWeight: 800 }}>
            Hesaba daxil olun
          </h1>
          <p style={{ color: "#475569", lineHeight: 1.7, marginTop: "10px" }}>
            Rolunuza uyğun kabinetə keçmək üçün email və şifrə ilə daxil olun.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mail@example.com"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid #cbd5e1",
                borderRadius: "14px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Şifrə
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrənizi daxil edin"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid #cbd5e1",
                borderRadius: "14px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: "16px" }}>
            <Link
              href="/forgot-password"
              style={{
                color: "#047857",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Parolu unutdum
            </Link>
          </div>

          {error && (
            <div
              style={{
                marginBottom: "16px",
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: "14px",
                padding: "12px 14px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              background: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: "14px",
              padding: "14px 16px",
              fontWeight: 700,
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Daxil ol
          </button>
        </form>

        <div
          style={{
            marginTop: "18px",
            padding: "14px",
            borderRadius: "14px",
            background: "#f8fafc",
            color: "#475569",
            fontSize: "14px",
            lineHeight: 1.7,
          }}
        >
          <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
            Demo girişlər:
          </div>
          <div>Admin: admin@valyutacred.az / Admin123!</div>
          <div>Bank: bank@valyutacred.az / Bank123!</div>
          <div>Sığorta: insurance@valyutacred.az / Insure123!</div>
          <div>User: user@valyutacred.az / User123!</div>
        </div>

        <div style={{ marginTop: "18px", textAlign: "center", fontSize: "14px" }}>
          Hesabınız yoxdur?{" "}
          <Link
            href="/register"
            style={{ color: "#047857", textDecoration: "none", fontWeight: 700 }}
          >
            Qeydiyyatdan keçin
          </Link>
        </div>
      </div>
    </div>
  );
}

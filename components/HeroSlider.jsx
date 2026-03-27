"use client";

import { useState } from "react";

const slides = [
  {
    title: "Sürətli müraciət",
    text: "1 dəqiqədə kredit müraciəti göndər.",
  },
  {
    title: "Uyğun seçim",
    text: "Sistem ən uyğun variantları tapır.",
  },
  {
    title: "Admin yoxlayır",
    text: "Müraciət yoxlanır və yönləndirilir.",
  },
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  function next() {
    setIndex((prev) => (prev + 1) % slides.length);
  }

  function prev() {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(255,255,255,0.55)",
        borderRadius: "28px",
        padding: "24px",
        minHeight: "172px",
        boxShadow: "0 18px 40px rgba(15,23,42,0.16)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "7px 12px",
          borderRadius: "999px",
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          color: "#047857",
          fontSize: "12px",
          fontWeight: 800,
          marginBottom: "14px",
        }}
      >
        Qısa baxış
      </div>

      <div
        style={{
          fontSize: "26px",
          fontWeight: 900,
          color: "#0f172a",
          lineHeight: 1.15,
        }}
      >
        {slides[index].title}
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "15px",
          color: "#475569",
          lineHeight: 1.75,
        }}
      >
        {slides[index].text}
      </div>

      <div
        style={{
          marginTop: "18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          {slides.map((_, i) => (
            <div
              key={i}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background: i === index ? "#059669" : "#cbd5e1",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={prev}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ←
          </button>

          <button
            type="button"
            onClick={next}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
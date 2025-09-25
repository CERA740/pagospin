import React, { useEffect, useMemo, useState } from "react";

const norm = (s) => s?.toString() ?? "";
const strip = (s) => norm(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const onlyDigits = (s) => norm(s).replace(/\D/g, "");
const matchNombre = (a, b) => strip(a).includes(strip(b));

export default function ClienteSelector2({ onSelect }) {
  const [clientes, setClientes] = useState([]);
  const [qCuit, setQCuit] = useState("");
  const [qNombre, setQNombre] = useState("");

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data/clientes.json`)
      .then((r) => r.json())
      .then(setClientes)
      .catch(console.error);
  }, []);

  const sugeridos = useMemo(() => {
    const cuit = onlyDigits(qCuit);
    const nom = qNombre.trim();
    return clientes
      .filter(
        (c) =>
          (!cuit || onlyDigits(c.cuit).startsWith(cuit)) &&
          (!nom || matchNombre(c.razonSocial, nom))
      )
      .slice(0, 10);
  }, [clientes, qCuit, qNombre]);

  const elegir = (c) => {
    onSelect?.(c);
    setQCuit(c.cuit);
    setQNombre(c.razonSocial);
  };

  return (
    <div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 2fr" }}>
        <div>
          <label>CUIT</label>
          <input value={qCuit} onChange={(e) => setQCuit(e.target.value)} />
        </div>
        <div>
          <label>Razón Social</label>
          <input
            placeholder="Buscar…"
            value={qNombre}
            onChange={(e) => setQNombre(e.target.value)}
          />
          {(qCuit || qNombre) && sugeridos.length > 0 && (
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 6,
                marginTop: 6,
                maxHeight: 200,
                overflow: "auto",
                background: "#fff",
              }}
            >
              {sugeridos.map((c) => (
                <button
                  key={c.cuit}
                  type="button"
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 8px",
                  }}
                  onClick={() => elegir(c)}
                >
                  <div style={{ fontWeight: 600 }}>{c.razonSocial}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {c.cuit} · {c.condicion}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
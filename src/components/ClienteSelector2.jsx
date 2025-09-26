import { useEffect, useMemo, useState } from "react";

async function tryFetch(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status} al pedir ${url}`);
  return r.json();
}

export default function ClienteSelector2({ onSelect }) {
  const [clientes, setClientes] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // ✅ Ruta robusta, sirve en dev y en GitHub Pages
        const url = `${process.env.PUBLIC_URL}/data/clientes.json?v=${Date.now()}`;
        const data = await tryFetch(url);
        if (!Array.isArray(data)) throw new Error("El JSON debe ser un array []");
        if (!abort) setClientes(data);
        console.log(`[fetch] OK, registros: ${data.length}`);
      } catch (e) {
        if (!abort) setError(String(e.message || e));
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  const filtrados = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clientes.slice(0, 50);
    return clientes
      .filter((c) => {
        const rs = c.RazonSocial ? String(c.RazonSocial).toLowerCase() : "";
        const cuit = String(c.CUIT ?? "").toLowerCase();
        return rs.includes(needle) || cuit.includes(needle);
      })
      .slice(0, 200);
  }, [clientes, q]);

  return (
    <div className="p-3 space-y-2">
      <div className="text-sm opacity-70">
        Estado: {loading ? "Cargando…" : error ? `Error: ${error}` : `OK (${clientes.length})`}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por Razón Social o CUIT"
        className="border rounded px-2 py-1 w-full"
      />

      {!loading && !error && clientes.length === 0 && (
        <div className="text-sm text-red-600">
          No se cargaron clientes (0). Revisa la ruta y el JSON.
        </div>
      )}

      <ul className="space-y-1 max-h-80 overflow-auto">
        {filtrados.map((c) => {
          // ✅ Socio = verde; cualquier otro (incluye "No Socio") = rojo
          const cond = String(c.CondicionCliente || "").trim().toLowerCase();
          const esSocio = cond === "socio";
          return (
            <li
              key={String(c.CUIT)}
              className={`p-2 border rounded cursor-pointer ${
                c.Estado === "Bloqueado"
                  ? "opacity-50 pointer-events-none"
                  : "hover:bg-gray-100"
              } ${esSocio ? "text-green-700" : "text-red-600"}`}
              onClick={() => c.Estado !== "Bloqueado" && onSelect?.(c)}
              title={c.Estado === "Bloqueado" ? "Cliente bloqueado" : "Seleccionar cliente"}
            >
              <div className="font-medium">{c.RazonSocial}</div>
              <div className="text-sm opacity-70">
                CUIT: {c.CUIT} · {c.CondicionCliente} · {c.Estado}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

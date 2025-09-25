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
        // Ruta única desde /public
        const data = await tryFetch("/data/clientes.json");
        if (!Array.isArray(data))
          throw new Error("El JSON debe ser un array []");
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
    if (!needle) return clientes.slice(0, 50); // muestra algunos por defecto
    return clientes
      .filter((c) => {
        const rs = c.RazonSocial ? String(c.RazonSocial).toLowerCase() : "";
        const cuit = String(c.CUIT ?? "").toLowerCase();
        return rs.includes(needle) || cuit.includes(needle);
      })
      .slice(0, 200); // límite para no congelar el render
  }, [clientes, q]);

  return (
    <div className="p-3 space-y-2">
      <div className="text-sm opacity-70">
        Estado:{" "}
        {loading
          ? "Cargando…"
          : error
          ? `Error: ${error}`
          : `OK (${clientes.length})`}
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
        {filtrados.map((c) => (
          <li
            key={String(c.CUIT)}
            className={`p-2 border rounded cursor-pointer ${
              c.Estado === "Bloqueado"
                ? "opacity-50 pointer-events-none"
                : "hover:bg-gray-100"
            }`}
            onClick={() => c.Estado !== "Bloqueado" && onSelect?.(c)}
            title={
              c.Estado === "Bloqueado"
                ? "Cliente bloqueado"
                : "Seleccionar cliente"
            }
          >
            <div className="font-medium">{c.RazonSocial}</div>
            <div className="text-sm opacity-70">
              CUIT: {c.CUIT} · {c.CondicionCliente} · {c.Estado}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

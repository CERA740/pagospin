import React, { useState, useEffect, useMemo } from "react";
import ClienteSelector from "./components/ClienteSelector2";
import { v4 as uuidv4 } from "uuid";
import emailjs from "@emailjs/browser";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import "./styles.css";

pdfMake.vfs = pdfFonts.vfs;

const productos = [
  { id: 1, descripcion: "CNP SOCIO", precio: 12000 },
  { id: 2, descripcion: "CNP NO SOCIO", precio: 18000 },
  { id: 3, descripcion: "COD SOCIO", precio: 14000 },
  { id: 4, descripcion: "COD NO SOCIO", precio: 21000 },
];

export default function App() {
  const [cantidades, setCantidades] = useState(
    productos.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
  );

  const [extras, setExtras] = useState(
    productos.reduce(
      (acc, p) => ({ ...acc, [p.id]: { cantidad: 0, precio: "" } }),
      {}
    )
  );

  const [cliente, setCliente] = useState({ cuit: "", razonSocial: "", email: "", condicion: "" });
  const [transferencia, setTransferencia] = useState({ numero: "", monto: "" });
  const [pins, setPins] = useState([]);
  const [errorMonto, setErrorMonto] = useState("");

  // Calcular totales con subtotales fijo y extra
  const calcularTotales = () =>
    productos
      .map((p) => {
        const fija = cantidades[p.id] || 0;
        const ext = extras[p.id];
        const extraCant = ext.cantidad || 0;
        const extPrecio = parseFloat(ext.precio) || 0;
        const subtotalFijo = fija * p.precio;
        const subtotalExtra = extraCant * extPrecio;
        return {
          ...p,
          cantidad: fija + extraCant,
          subtotalFijo,
          subtotalExtra,
          total: subtotalFijo + subtotalExtra,
        };
      })
      .filter((p) => p.cantidad > 0);

  // Total general sumando todos los productos
  const totalGeneral = calcularTotales().reduce((acc, p) => acc + p.total, 0);

  // Validar que importe recibido coincida con total general
  useEffect(() => {
    if (!transferencia.monto) {
      setErrorMonto("");
      return;
    }
    const montoNum = parseFloat(transferencia.monto);
    if (isNaN(montoNum)) {
      setErrorMonto("El importe debe ser un número válido.");
    } else if (montoNum !== totalGeneral) {
      setErrorMonto(
        `El importe recibido ($${montoNum.toFixed(
          2
        )}) no coincide con el total ($${totalGeneral.toFixed(2)}).`
      );
    } else {
      setErrorMonto("");
    }
  }, [transferencia.monto, totalGeneral]);

  // Generar PIN
  const generarPIN = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let pin = '';
  for (let i = 0; i < 16; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin.match(/.{1,4}/g).join('-');
};

  // Generar factura: PDF y enviar email
  const generarFactura = () => {
    if (errorMonto) {
      alert("Corrige el importe recibido para continuar.");
      return;
    }
    const detalle = calcularTotales().map((p) => ({
      ...p,
      pin: generarPIN(),
    }));
    setPins(detalle);

    // Generar PDF
    const doc = {
      content: [
        { text: "Factura por Compra de PINes", style: "header" },
        {
          text: `Cliente: ${cliente.razonSocial} | CUIT: ${cliente.cuit}\nTransferencia Nº: ${transferencia.numero} | Monto: $${transferencia.monto}`,
          margin: [0, 10],
        },
        {
          table: {
            widths: ["*", "auto", "auto", "auto"],
            body: [
              ["Producto", "Cantidad", "Total", "PIN"],
              ...detalle.map((d) => [d.descripcion, d.cantidad, d.total, d.pin]),
            ],
          },
        },
      ],
      styles: { header: { fontSize: 16, bold: true } },
    };
    pdfMake.createPdf(doc).download("factura.pdf");

    // Enviar email
    enviarEmail(detalle);
  };

  // Función para enviar email con EmailJS
  const enviarEmail = (pins) => {
  // Armar lista HTML con los pins
  const mensaje_pines_html = pins
    .map(
      (p) =>
        `<li><strong>${p.descripcion}:</strong> <code style="background:#f0f0f0; padding:2px 5px; border-radius:3px;">${p.pin}</code></li>`
    )
    .join("");

  const templateParams = {
    cliente_cuit: cliente.cuit,
    cliente_razon_social: cliente.razonSocial,
    transferencia_numero: transferencia.numero,
    transferencia_monto: transferencia.monto,
    mensaje_pines_html,  // aquí metemos el HTML
    email: cliente.email,
    subject: "Entrega de PINes y Factura - CERA",
  };

  emailjs
    .send("service_xled59w", "template_aa8945a", templateParams, "M88IV6dUU6NMq6Ood")
    .then(() => alert("Email enviado correctamente"))
    .catch((err) => {
      alert("Error al enviar");
      console.error(err);
    });
};

  // Estilos inline usados
  const estilos = {
    contenedor: {
      maxWidth: "600px",
      margin: "2rem auto",
      fontFamily: "Arial, sans-serif",
      color: "#a80000",
    },
    seccion: {
      marginBottom: "1.5rem",
      padding: "1rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      background: "#fff5f5",
    },
    label: { display: "block", marginBottom: "0.5rem", fontWeight: "600" },
    input: {
      width: "100%",
      padding: "0.5rem",
      margin: "0.25rem 0 1rem 0",
      borderRadius: "4px",
      border: "1px solid #a80000",
    },
    boton: {
      width: "100%",
      padding: "0.75rem",
      fontSize: "1.1rem",
      color: "#fff",
      background: "#a80000",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
    },
  };

  return (
    <div style={estilos.contenedor}>
      <h2 style={{ textAlign: "center" }}>CERA ‑ Generador de PINes y Factura</h2>

      <div style={estilos.seccion}>
        <h3>Productos</h3>
        {productos.map((p) => {
          const fija = cantidades[p.id] || 0;
          const ext = extras[p.id];
          const extraCant = ext.cantidad || 0;
          const extPrecio = parseFloat(ext.precio) || 0;
          const subtotalFijo = fija * p.precio;
          const subtotalExtra = extraCant * extPrecio;
          const totalProducto = subtotalFijo + subtotalExtra;

          return (
            <div
              key={p.id}
              style={{
                marginBottom: "1rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid #ccc",
              }}
            >
              <strong>{p.descripcion}</strong> (${p.precio} c/u)
              <br />
              Cantidad fija:{" "}
              <input
                type="number"
                min="0"
                value={fija}
                onChange={(e) =>
                  setCantidades({ ...cantidades, [p.id]: Number(e.target.value) })
                }
                style={estilos.input}
              />
              <span style={{ marginLeft: "1rem", fontWeight: "600" }}>
                Subtotal fijo: ${subtotalFijo.toFixed(2)}
              </span>
              <br />
              Extra - Cantidad:{" "}
              <input
                type="number"
                min="0"
                value={extraCant}
                onChange={(e) =>
                  setExtras({
                    ...extras,
                    [p.id]: { ...extras[p.id], cantidad: Number(e.target.value) },
                  })
                }
                style={estilos.input}
              />{" "}
              Precio extra:{" "}
              <input
                type="number"
                min="0"
                value={ext.precio}
                onChange={(e) =>
                  setExtras({
                    ...extras,
                    [p.id]: { ...extras[p.id], precio: e.target.value },
                  })
                }
                style={estilos.input}
              />
              <span style={{ marginLeft: "1rem", fontWeight: "600" }}>
                Subtotal extra: ${subtotalExtra.toFixed(2)}
              </span>
              <br />
              <span style={{ fontWeight: "700" }}>
                Total producto: ${totalProducto.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total general */}
      <div
        style={{
          ...estilos.seccion,
          background: "#ffe6e6",
          fontWeight: "700",
          fontSize: "1.1rem",
        }}
      >
        Total general: ${totalGeneral.toFixed(2)}
      </div>

      {/* Datos del cliente */}
      <div style={estilos.seccion}>
        <h3>Datos del Cliente</h3>
        <label style={estilos.label}>CUIT</label>
        <input
          style={estilos.input}
          type="text"
          value={cliente.cuit}
          onChange={(e) => setCliente({ ...cliente, cuit: e.target.value })}
        />
        <label style={estilos.label}>Razón Social</label>
        <input
          style={estilos.input}
          type="text"
          value={cliente.razonSocial}
          onChange={(e) => setCliente({ ...cliente, razonSocial: e.target.value })}
        />
        <label style={estilos.label}>Email</label>
        <input
          style={estilos.input}
          type="email"
          value={cliente.email}
          onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
        />
      </div>

      {/* Datos transferencia */}
      <div style={estilos.seccion}>
        <h3>Datos de Transferencia</h3>
        <input
          style={estilos.input}
          type="text"
          placeholder="Número de transferencia"
          value={transferencia.numero}
          onChange={(e) => setTransferencia({ ...transferencia, numero: e.target.value })}
        />
        <input
          style={estilos.input}
          type="number"
          placeholder="Importe recibido"
          value={transferencia.monto}
          onChange={(e) => setTransferencia({ ...transferencia, monto: e.target.value })}
        />
        {errorMonto && (
          <p style={{ color: "red", fontWeight: "700" }}>{errorMonto}</p>
        )}
      </div>

      {/* Botón generar */}
      <button
        disabled={
          !cliente.email ||
          !cliente.cuit ||
          !transferencia.numero ||
          !calcularTotales().length ||
          !!errorMonto
        }
        style={estilos.boton}
        onClick={generarFactura}
      >
        Generar PIN y Factura
      </button>

      {/* Mostrar PINs generados */}
      {pins.length > 0 && (
        <div
          style={{
            marginTop: "2rem",
            background: "#fdf3f3",
            padding: "1rem",
            borderRadius: "6px",
          }}
        >
          <h3 style={{ textAlign: "center" }}>PINes Generados</h3>
          <ul>
            {pins.map((p) => (
              <li key={p.id}>
                {p.descripcion}: {p.pin}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


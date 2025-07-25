import React, { useState } from "react";
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
    productos.reduce((acc, p) => ({ ...acc, [p.id]: { cantidad: 0, precio: "" } }), {})
  );
  const [cliente, setCliente] = useState({ cuit: "", razonSocial: "", email: "" });
  const [transferencia, setTransferencia] = useState({ numero: "", monto: "" });
  const [pins, setPins] = useState([]);

  const calcularTotales = () => productos.map(p => {
    const fija = cantidades[p.id] || 0;
    const ext = extras[p.id];
    const extraCant = ext.cantidad || 0;
    const extPrecio = parseFloat(ext.precio) || 0;
    return {
      ...p,
      cantidad: fija + extraCant,
      total: fija * p.precio + extraCant * extPrecio,
    };
  }).filter(p => p.cantidad > 0);

  const generarPIN = () => uuidv4().toUpperCase().slice(0, 19);

  const generarFactura = () => {
    const detalle = calcularTotales().map(p => ({
      ...p, pin: generarPIN()
    }));
    setPins(detalle);

    const doc = {
      content: [
        { text: "Factura por Compra de PINes", style: "header" },
        {
          text: `Cliente: ${cliente.razonSocial} | CUIT: ${cliente.cuit}\nTransferencia Nº: ${transferencia.numero} | Monto: $${transferencia.monto}`,
          margin: [0, 10]
        },
        {
          table: {
            widths: ["*", "auto", "auto", "auto"],
            body: [
              ["Producto", "Cantidad", "Total", "PIN"],
              ...detalle.map(d => [d.descripcion, d.cantidad, d.total, d.pin])
            ]
          }
        }
      ],
      styles: { header: { fontSize: 16, bold: true } }
    };
    pdfMake.createPdf(doc).download("factura.pdf");
    enviarEmail(detalle);
  };

  const enviarEmail = datos => {
    const mensaje = datos.map(d => `${d.descripcion}: ${d.pin}`).join("\n");
    const params = {
      cliente_cuit: cliente.cuit,
      cliente_razon_social: cliente.razonSocial,
      transferencia_numero: transferencia.numero,
      transferencia_monto: transferencia.monto,
      mensaje_pines: mensaje,
      email: cliente.email,
      subject: "Entrega de PINes y Factura - CERA"
    };
    emailjs.send("service_xled59w", "template_aa8945a", params, "M88IV6dUU6NMq6Ood")
      .then(() => alert("Email enviado correctamente"))
      .catch(err => { alert("Error al enviar"); console.error(err); });
  };

  const estilos = {
    contenedor: { maxWidth: "600px", margin: "2rem auto", fontFamily: "Arial, sans-serif", color: "#a80000" },
    seccion: { marginBottom: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "8px", background: "#fff5f5" },
    label: { display: "block", marginBottom: "0.5rem", fontWeight: "600" },
    input: { width: "100%", padding: "0.5rem", margin: "0.25rem 0 1rem 0", borderRadius: "4px", border: "1px solid #a80000" },
    boton: { width: "100%", padding: "0.75rem", fontSize: "1.1rem", color: "#fff", background: "#a80000", border: "none", borderRadius: "6px", cursor: "pointer" }
  };

  return (
    <div style={estilos.contenedor}>
      <h2 style={{ textAlign: "center" }}>CERA ‑ Generador de PINes y Factura</h2>

      <div style={estilos.seccion}>
        <h3>Productos</h3>
        {productos.map(p => (
          <div key={p.id}>
            <strong>{p.descripcion}</strong> (${p.precio} c/u)
            <input type="number" min="0" placeholder="Cantidad fija"
              style={estilos.input}
              value={cantidades[p.id]}
              onChange={e => setCantidades({ ...cantidades, [p.id]: Number(e.target.value) })}
            />
            <input type="number" min="0" placeholder="Cantidad extra"
              style={estilos.input}
              value={extras[p.id].cantidad}
              onChange={e => setExtras({ ...extras, [p.id]: { ...extras[p.id], cantidad: Number(e.target.value) } })}
            />
            <input type="number" min="0" placeholder="Precio extra"
              style={estilos.input}
              value={extras[p.id].precio}
              onChange={e => setExtras({ ...extras, [p.id]: { ...extras[p.id], precio: e.target.value } })}
            />
            <hr/>
          </div>
        ))}
      </div>

      <div style={estilos.seccion}>
        <h3>Datos del Cliente</h3>
        <label style={estilos.label}>CUIT</label>
        <input style={estilos.input} type="text" value={cliente.cuit}
          onChange={e => setCliente({...cliente, cuit: e.target.value})}
        />
        <label style={estilos.label}>Razón Social</label>
        <input style={estilos.input} type="text" value={cliente.razonSocial}
          onChange={e => setCliente({...cliente, razonSocial: e.target.value})}
        />
        <label style={estilos.label}>Email</label>
        <input style={estilos.input} type="email" value={cliente.email}
          onChange={e => setCliente({...cliente, email: e.target.value})}
        />
      </div>

      <div style={estilos.seccion}>
        <h3>Datos de Transferencia</h3>
        <input style={estilos.input} type="text" placeholder="Número de transferencia"
          value={transferencia.numero}
          onChange={e => setTransferencia({...transferencia, numero:e.target.value})}
        />
        <input style={estilos.input} type="number" placeholder="Importe"
          value={transferencia.monto}
          onChange={e => setTransferencia({...transferencia, monto: e.target.value})}
        />
      </div>

      <button
        disabled={!cliente.email || !cliente.cuit || !transferencia.numero || !calcularTotales().length}
        style={estilos.boton}
        onClick={generarFactura}
      >
        Generar PIN y Factura
      </button>

      {pins.length > 0 && (
        <div style={{ marginTop: "2rem", background: "#fdf3f3", padding: "1rem", borderRadius: "6px" }}>
          <h3 style={{ textAlign: "center" }}>PINes Generados</h3>
          <ul>
            {pins.map(p => <li key={p.id}>{p.descripcion}: {p.pin}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

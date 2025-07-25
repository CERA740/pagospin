import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import emailjs from "@emailjs/browser";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

const productos = [
  { id: 1, descripcion: "CNP SOCIO", precio: 12000 },
  { id: 2, descripcion: "CNP NO SOCIO", precio: 18000 },
  { id: 3, descripcion: "COD SOCIO", precio: 14000 },
  { id: 4, descripcion: "COD NO SOCIO", precio: 21000 },
];

const App = () => {
  const [cantidades, setCantidades] = useState(
    productos.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
  );
  const [extras, setExtras] = useState(
    productos.reduce(
      (acc, p) => ({ ...acc, [p.id]: { cantidad: 0, precio: "" } }),
      {}
    )
  );
  const [cliente, setCliente] = useState({
    cuit: "",
    razonSocial: "",
    email: "",
  });
  const [transferencia, setTransferencia] = useState({ numero: "", monto: "" });
  const [pinsGenerados, setPinsGenerados] = useState([]);

  const handleCantidadChange = (id, valor) => {
    setCantidades({ ...cantidades, [id]: parseInt(valor) || 0 });
  };

  const handleExtraChange = (id, campo, valor) => {
    setExtras({
      ...extras,
      [id]: {
        ...extras[id],
        [campo]: campo === "cantidad" ? parseInt(valor) || 0 : valor,
      },
    });
  };

  const calcularTotales = () => {
    return productos
      .map((p) => {
        const cantidadFija = cantidades[p.id] || 0;
        const extra = extras[p.id];
        const cantidadExtra = extra.cantidad || 0;
        const precioExtra = parseFloat(extra.precio) || 0;

        const totalCantidad = cantidadFija + cantidadExtra;
        const totalPrecio =
          cantidadFija * p.precio + cantidadExtra * precioExtra;

        return {
          ...p,
          cantidad: totalCantidad,
          total: totalPrecio,
        };
      })
      .filter((p) => p.cantidad > 0);
  };

  const generarPIN = () =>
    uuidv4().split("-").join("-").toUpperCase().slice(0, 19);

  const generarPDF = (pins) => {
    const docDefinition = {
      content: [
        { text: "Factura por Compra de PINes", style: "header" },
        {
          text: `Cliente: ${cliente.razonSocial} | CUIT: ${cliente.cuit}\nTransferencia Nº: ${transferencia.numero} | Monto: $${transferencia.monto}`,
          margin: [0, 10, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto"],
            body: [
              ["Producto", "Cantidad", "Total ($)", "PIN"],
              ...pins.map((p) => [p.descripcion, p.cantidad, p.total, p.pin]),
            ],
          },
        },
      ],
      styles: {
        header: {
          fontSize: 16,
          bold: true,
        },
      },
    };
    pdfMake.createPdf(docDefinition).download("factura.pdf");
  };

  const enviarEmail = (pins) => {
    const mensaje_pines = pins.map((p) => `${p.descripcion}: ${p.pin}`).join("\n");
    const templateParams = {
      cliente_cuit: cliente.cuit,
      cliente_razon_social: cliente.razonSocial,
      transferencia_numero: transferencia.numero,
      transferencia_monto: transferencia.monto,
      mensaje_pines,
      to_email: cliente.email,
      subject: "Entrega de PINes y Factura - CERA",
    };

    emailjs
      .send(
        "service_xled59w",
        "template_aa8945a",
        templateParams,
        "RH1me9Ql_pWDTGpXg"
      )
      .then(
        (result) => {
          alert("Email enviado correctamente");
        },
        (error) => {
          alert("Error al enviar el email");
          console.error(error);
        }
      );
  };

  const puedeGenerar = () => {
    return (
      cliente.cuit.trim() &&
      cliente.razonSocial.trim() &&
      cliente.email.trim() &&
      transferencia.numero.trim() &&
      transferencia.monto.trim() &&
      calcularTotales().length > 0
    );
  };

  const handleGenerar = () => {
    const detalle = calcularTotales();
    const pins = detalle.map((p) => ({
      ...p,
      pin: generarPIN(),
    }));

    setPinsGenerados(pins);
    generarPDF(pins);
    enviarEmail(pins);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2>CERA Generador de PINes y Factura </h2>
      <h3>Productos</h3>
      {productos.map((p) => (
        <div
          key={p.id}
          style={{ marginBottom: "1rem", borderBottom: "1px solid #ccc" }}
        >
          <strong>{p.descripcion}</strong> (${p.precio} c/u)
          <br />
          Cantidad fija:{" "}
          <input
            type="number"
            min="0"
            value={cantidades[p.id]}
            onChange={(e) => handleCantidadChange(p.id, e.target.value)}
          />
          <br />
          Extra - Cantidad:{" "}
          <input
            type="number"
            min="0"
            value={extras[p.id].cantidad}
            onChange={(e) => handleExtraChange(p.id, "cantidad", e.target.value)}
          />{" "}
          Precio unitario:{" "}
          <input
            type="number"
            min="0"
            value={extras[p.id].precio}
            onChange={(e) => handleExtraChange(p.id, "precio", e.target.value)}
          />
        </div>
      ))}
      <h3>Datos del Cliente</h3>
      CUIT:{" "}
      <input
        type="text"
        value={cliente.cuit}
        onChange={(e) => setCliente({ ...cliente, cuit: e.target.value })}
      />
      <br />
      Razón Social:{" "}
      <input
        type="text"
        value={cliente.razonSocial}
        onChange={(e) => setCliente({ ...cliente, razonSocial: e.target.value })}
      />
      <br />
      Email:{" "}
      <input
        type="email"
        value={cliente.email}
        onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
      />
      <h3>Datos de Transferencia</h3>
      Nº de Transferencia:{" "}
      <input
        type="text"
        value={transferencia.numero}
        onChange={(e) => setTransferencia({ ...transferencia, numero: e.target.value })}
      />
      <br />
      Importe recibido:{" "}
      <input
        type="number"
        value={transferencia.monto}
        onChange={(e) => setTransferencia({ ...transferencia, monto: e.target.value })}
      />
      <br />
      <br />
      <button disabled={!puedeGenerar()} onClick={handleGenerar}>
        Generar PIN y Factura
      </button>
      {pinsGenerados.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3>PINes Generados</h3>
          <ul>
            {pinsGenerados.map((p) => (
              <li key={p.id}>
                {p.descripcion}: {p.pin}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;

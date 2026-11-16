import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fileStamp, formatCurrency, formatDate, formatQuantity, slugify } from "./format";

const EMERALD = [4, 120, 87];
const INK = [41, 37, 36];
const MUTED = [120, 113, 108];
const DANGER = [185, 28, 28];

function money(value) {
  return formatCurrency(value).replace(/\u00a0/g, " ");
}

function detailForItem(item) {
  if (item.type === "PAGO") {
    return "Pago a cuenta del saldo";
  }

  const saleItems = item.Sale?.SaleItems || [];

  if (saleItems.length === 0) {
    return "Sin detalle";
  }

  return saleItems
    .map((saleItem) => {
      const name = saleItem.Product?.name || saleItem.customName || "Producto";
      const unit = saleItem.Product?.saleType === "kilo" ? "kg" : "u";
      return `${name} (${formatQuantity(saleItem.quantity)} ${unit})`;
    })
    .join(", ");
}

function typeForItem(item) {
  if (item.type === "PAGO") return "Pago parcial";
  return item.saleId ? `Venta #${item.saleId}` : "Cargo";
}

export function downloadClosurePdf(closure, { paid = false } = {}) {
  if (!closure) return;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const items = closure.items || [];
  const totalCharges =
    closure.totalCharges ??
    items
      .filter((item) => item.type !== "PAGO")
      .reduce((sum, item) => sum + Number.parseFloat(item.amount), 0);
  const totalPayments =
    closure.totalPayments ??
    items
      .filter((item) => item.type === "PAGO")
      .reduce((sum, item) => sum + Math.abs(Number.parseFloat(item.amount)), 0);

  const rows = items.map((item) => {
    const isPayment = item.type === "PAGO";
    return [
      formatDate(item.date),
      typeForItem(item),
      detailForItem(item),
      isPayment
        ? `- ${money(Math.abs(Number.parseFloat(item.amount)))}`
        : money(item.amount),
    ];
  });

  doc.setFillColor(...EMERALD);
  doc.rect(0, 0, 210, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BARBARA ALMACEN", 14, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Cierre de cuenta corriente", 14, 22);

  doc.setFontSize(8);
  doc.text("Documento no fiscal", 196, 11, { align: "right" });
  doc.text(formatDate(new Date()), 196, 16, { align: "right" });

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(String(closure.name || "Cuenta corriente").slice(0, 45), 14, 47);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(paid ? "Saldo abonado" : "Saldo pendiente", 14, 53);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...(paid ? EMERALD : DANGER));
  doc.text(money(closure.balance), 14, 61);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Cargos: ${money(totalCharges)}`, 196, 47, { align: "right" });
  doc.text(`Pagos parciales: ${money(totalPayments)}`, 196, 53, { align: "right" });
  doc.text(
    paid ? "Estado: PAGADA" : `Estado: PENDIENTE · ${items.length} movimiento(s)`,
    196,
    59,
    { align: "right" }
  );

  autoTable(doc, {
    startY: 68,
    head: [["Fecha", "Tipo", "Detalle", "Monto"]],
    body: rows.length > 0 ? rows : [["-", "-", "Sin movimientos pendientes", money(0)]],
    theme: "grid",
    headStyles: {
      fillColor: EMERALD,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: INK,
      overflow: "linebreak",
    },
    alternateRowStyles: { fillColor: [250, 250, 249] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 30 },
      3: { cellWidth: 28, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const tableEnd = doc.lastAutoTable?.finalY || 78;
  const totalY = Math.min(tableEnd + 12, 262);

  doc.setDrawColor(231, 229, 228);
  doc.line(14, totalY, 196, totalY);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(paid ? "Total abonado" : "Total pendiente", 14, totalY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(money(closure.balance), 196, totalY + 8, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Generado por Barbara Almacen", 14, 287);
  doc.text(formatDate(new Date()), 196, 287, { align: "right" });

  doc.save(`cierre-${slugify(closure.name)}-${fileStamp()}.pdf`);
}

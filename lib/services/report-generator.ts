import type { Expediente } from "@/lib/types";
import { estadoExpedienteConfig } from "@/lib/risk";
import { formatDate } from "@/lib/utils";

const BRAND = { r: 109, g: 94, b: 248 };
const BRAND2 = { r: 79, g: 140, b: 255 };
const INK = { r: 17, g: 19, b: 30 };
const MUTED = { r: 110, g: 114, b: 132 };

// jsPDF's standard fonts only support WinAnsi encoding — characters like "≤"
// render as mojibake, so swap them for ASCII-safe equivalents before drawing.
function pdfSafe(text: string) {
  return text.replace(/≤/g, "<=").replace(/≥/g, ">=");
}

function money(value: number | undefined) {
  return value !== undefined ? `S/ ${value.toLocaleString("es-PE")}` : "No identificado";
}

export async function generateExpedienteReport(expediente: Expediente) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = 0;

  function lastTableY() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (doc as any).lastAutoTable.finalY as number;
  }

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - 50) {
      doc.addPage();
      y = 50;
    }
  }

  function sectionTitle(title: string) {
    ensureSpace(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text(title, margin, y);
    y += 20;
  }

  function keyValueTable(rows: [string, string][]) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      body: rows.map(([k, v]) => [k, pdfSafe(v)]),
      styles: { fontSize: 8.5, cellPadding: 6, textColor: [40, 42, 54] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 160, textColor: [90, 92, 105] } },
      theme: "grid",
      tableLineColor: [230, 231, 238],
      tableLineWidth: 0.5,
      didParseCell: (data) => {
        if (data.column.index === 0) data.cell.styles.fillColor = [246, 247, 250];
      },
    });
    y = lastTableY() + 24;
  }

  // Header band
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, pageWidth, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AVLA NEXUS", margin, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Reporte Ejecutivo · Commercial Intelligence Workspace", margin, 58);
  doc.setFontSize(9);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}`, margin, 76);

  y = 130;
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(pdfSafe(expediente.nombreProyecto), margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(
    `Broker: ${expediente.broker}   ·   Ejecutivo: ${expediente.ejecutivo}   ·   Estado: ${estadoExpedienteConfig[expediente.estado].label}`,
    margin,
    y
  );

  // Score badges
  y += 28;
  const badges = [
    { label: "Ready Score", value: `${expediente.readyScore.valor}%` },
    { label: "Confianza IA", value: `${expediente.confianzaIA.valor}%` },
    { label: "Estado Documental", value: `${expediente.executiveBrief.estadoDocumentalPct}%` },
  ];
  const badgeWidth = (pageWidth - margin * 2 - 20) / 3;
  badges.forEach((b, i) => {
    const x = margin + i * (badgeWidth + 10);
    doc.setFillColor(245, 246, 250);
    doc.roundedRect(x, y, badgeWidth, 52, 6, 6, "F");
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.setFontSize(8);
    doc.text(b.label, x + 12, y + 18);
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(b.value, x + 12, y + 38);
    doc.setFont("helvetica", "normal");
  });

  y += 76;

  // Ficha del cliente — everything AMARU needs to register the record.
  sectionTitle("Ficha del Cliente (registro AMARU)");
  const info = expediente.informacionExtraida;
  const representantes = info.representantesLegales?.length ? info.representantesLegales.join(", ") : info.representanteLegal || "No identificado";
  const clienteRows: [string, string][] = [
    ["Razón Social", info.razonSocial || "No identificado"],
    ["RUC", info.ruc || "No identificado"],
    ["Representante(s) Legal(es)", representantes],
    ["Dirección Fiscal", info.direccion || "No identificado"],
    ["Correo", info.correo || "No identificado"],
    ["Actividad Económica", info.actividadEconomica ? `${info.actividadEconomica}${info.ciiu ? ` (CIIU ${info.ciiu})` : ""}` : "No identificado"],
    ["Patrimonio Declarado", money(info.patrimonio)],
  ];
  if (info.participacionConsorcio !== undefined) {
    clienteRows.push(["Participación en Consorcio", `${info.participacionConsorcio}%`]);
  }
  keyValueTable(clienteRows);

  // Requerimiento — extracted from Bases Integradas / cross-checked with Buena Pro.
  if (expediente.requerimiento) {
    const req = expediente.requerimiento;
    sectionTitle("Requerimiento del Proyecto");
    const reqRows: [string, string][] = [];
    if (req.beneficiario) reqRows.push(["Entidad / Beneficiario", req.beneficiario]);
    if (req.montoAdjudicado !== undefined) {
      reqRows.push(["Monto Adjudicado", `${money(req.montoAdjudicado)}${req.montoAdjudicadoFuente ? ` (${req.montoAdjudicadoFuente})` : ""}`]);
    }
    if (req.lugarEjecucion) reqRows.push(["Lugar de Ejecución", req.lugarEjecucion]);
    if (req.plazoValor !== undefined) reqRows.push(["Plazo", `${req.plazoValor} ${req.plazoUnidad}`]);
    if (reqRows.length > 0) keyValueTable(reqRows);
  }

  ensureSpace(60);
  sectionTitle("Resumen Ejecutivo");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(50, 52, 64);
  expediente.executiveBrief.parrafos.forEach((p) => {
    const lines = doc.splitTextToSize(pdfSafe(p), pageWidth - margin * 2);
    ensureSpace(lines.length * 13 + 6);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 6;
  });
  y += 6;

  sectionTitle("Riesgos identificados");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Factor", "Nivel", "Descripción"]],
    body: expediente.riesgos.map((r) => [r.titulo, r.nivel.toUpperCase(), pdfSafe(r.descripcion)]),
    styles: { fontSize: 8.5, cellPadding: 6, textColor: [40, 42, 54] },
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255 },
    theme: "grid",
  });
  y = lastTableY() + 24;

  sectionTitle("Checklist del expediente");
  const checklistRows = expediente.checklist.flatMap((b) =>
    b.items.map((i) => [
      b.titulo,
      pdfSafe(i.label),
      i.estado === "completo" ? "Completo" : i.estado === "pendiente" ? "Faltante" : "Advertencia",
    ])
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Bloque", "Documento", "Estado"]],
    body: checklistRows,
    styles: { fontSize: 8.5, cellPadding: 6, textColor: [40, 42, 54] },
    headStyles: { fillColor: [BRAND2.r, BRAND2.g, BRAND2.b], textColor: 255 },
    theme: "grid",
  });
  y = lastTableY() + 24;

  if (expediente.evidencias.length > 0) {
    sectionTitle("Validaciones externas (evidencias)");
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Validación", "Resultado", "Fecha"]],
      body: expediente.evidencias.map((e) => [
        pdfSafe(e.tituloVisible),
        pdfSafe(e.resultados.map((r) => `${r.etiqueta}: ${r.valor}`).join(" · ") || e.resumenIA),
        formatDate(e.subidoEn),
      ]),
      styles: { fontSize: 8.5, cellPadding: 6, textColor: [40, 42, 54] },
      headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255 },
      theme: "grid",
    });
    y = lastTableY() + 24;
  }

  if (expediente.equifax) {
    sectionTitle("Equifax");
    keyValueTable([
      ["Score", `${expediente.equifax.score} / 900`],
      ["Clasificación", expediente.equifax.clasificacion],
      ["Alertas", expediente.equifax.alertas.length > 0 ? expediente.equifax.alertas.join("; ") : "Sin alertas críticas"],
    ]);
  }

  if (expediente.sustentosPago.length > 0) {
    sectionTitle("Sustentos de pago");
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Monto", "Entidad Bancaria", "Fecha", "Beneficiario"]],
      body: expediente.sustentosPago.map((s) => [money(s.monto), pdfSafe(s.entidadBancaria), formatDate(s.fecha), pdfSafe(s.beneficiario)]),
      styles: { fontSize: 8.5, cellPadding: 6, textColor: [40, 42, 54] },
      headStyles: { fillColor: [BRAND2.r, BRAND2.g, BRAND2.b], textColor: 255 },
      theme: "grid",
    });
    y = lastTableY() + 24;
  }

  if (expediente.experienceMatch) {
    ensureSpace(50);
    sectionTitle("Experience Match");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(50, 52, 64);
    doc.text(`Project Fit Score: ${expediente.experienceMatch.projectFitScore}%`, margin, y);
    y += 14;
    const lines = doc.splitTextToSize(pdfSafe(expediente.experienceMatch.explicacion), pageWidth - margin * 2);
    ensureSpace(lines.length * 13 + 10);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 16;

    if (expediente.experienceMatch.contratos.length > 0) {
      ensureSpace(40);
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Entidad", "Objeto", "Monto", "Compatible"]],
        body: expediente.experienceMatch.contratos.map((c) => [pdfSafe(c.entidad), pdfSafe(c.objeto), money(c.monto), c.compatible ? "Sí" : "No"]),
        styles: { fontSize: 8, cellPadding: 5, textColor: [40, 42, 54] },
        headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255 },
        theme: "grid",
      });
      y = lastTableY() + 20;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text(
      `AVLA NEXUS · Reporte confidencial de uso interno · Página ${i} de ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 20
    );
  }

  doc.save(`Reporte_${expediente.nombreProyecto.replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`);
}

import type { Expediente } from "@/lib/types";

const BRAND = { r: 109, g: 94, b: 248 };
const BRAND2 = { r: 79, g: 140, b: 255 };
const INK = { r: 17, g: 19, b: 30 };
const MUTED = { r: 110, g: 114, b: 132 };

export async function generateExpedienteReport(expediente: Expediente) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 0;

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
  doc.text(expediente.nombreProyecto, margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(`Broker: ${expediente.broker}   ·   Ejecutivo: ${expediente.ejecutivo}   ·   Estado: ${expediente.estado}`, margin, y);

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
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Resumen Ejecutivo", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(50, 52, 64);
  expediente.executiveBrief.parrafos.forEach((p) => {
    const lines = doc.splitTextToSize(p, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 6;
  });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text("Riesgos identificados", margin, y);
  y += 8;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Factor", "Nivel", "Descripción"]],
    body: expediente.riesgos.map((r) => [r.titulo, r.nivel.toUpperCase(), r.descripcion]),
    styles: { fontSize: 8.5, cellPadding: 6, textColor: [40, 42, 54] },
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255 },
    theme: "grid",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  if (y > 680) {
    doc.addPage();
    y = 50;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Checklist del expediente", margin, y);
  y += 8;
  const checklistRows = expediente.checklist.flatMap((b) =>
    b.items.map((i) => [b.titulo, i.label, i.estado === "completo" ? "Completo" : i.estado === "pendiente" ? "Faltante" : "Advertencia"])
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  if (expediente.experienceMatch) {
    if (y > 650) {
      doc.addPage();
      y = 50;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Experience Match", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Project Fit Score: ${expediente.experienceMatch.projectFitScore}%`, margin, y);
    y += 14;
    const lines = doc.splitTextToSize(expediente.experienceMatch.explicacion, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 10;
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

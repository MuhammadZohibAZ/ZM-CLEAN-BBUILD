import type { MatrixPane, MatrixSectionDef } from "../ui/compare-matrix";
import { matrixCellKey } from "../ui/compare-matrix";

/**
 * Builds the comparison report PDF from the same boards shown on screen.
 * Loaded on demand (jsPDF is only fetched when the user downloads).
 *
 * - Boards whose panes show the same items (one product across locations) become
 *   one table per price type: byproducts as rows, a column group per location.
 * - Boards of different products become one table per product and price type.
 * - Mandi breakdown tables (as currently picked on screen) follow.
 */

/** A printed block: panes with the same syncKey become one combined table. */
export interface PdfBoard {
  id: string;
  title: string;
  context?: string;
  panes: MatrixPane[];
}

/** One mandi breakdown table, already formatted. */
export interface PdfMandiTable {
  title: string;
  subtitle: string;
  head: string[];
  rows: string[][];
}

export interface ReportMeta {
  title: string;
  locations: string;
  date: string;
  priceTypes: string;
  generatedAt: string;
}

const GREEN: [number, number, number] = [14, 100, 92];
const DEEP: [number, number, number] = [7, 51, 47];
const INK: [number, number, number] = [24, 59, 52];
const MUTED: [number, number, number] = [82, 99, 95];

const hex = (color: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(color);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : GREEN;
};

export async function downloadComparisonPdf(boards: PdfBoard[], sections: MatrixSectionDef[], mandiTables: PdfMandiTable[], meta: ReportMeta, fileName: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 12;

  // Cover band
  doc.setFillColor(...DEEP);
  doc.rect(0, 0, W, 34, "F");
  doc.setFillColor(...GREEN);
  doc.rect(0, 30, W, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ZARAI MANDI  ·  COMPARISON REPORT", M, 10);
  doc.setFontSize(18);
  doc.text(meta.title, M, 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`${meta.locations}   ·   ${meta.date} (PKT)   ·   Price types: ${meta.priceTypes}`, M, 26);
  doc.setFontSize(8);
  doc.text(`Generated ${meta.generatedAt}`, W - M, 10, { align: "right" });

  let y = 44;
  const cell = (text: string | undefined) => text ?? "—";
  const has = (t: string | undefined) => t !== undefined && t !== "—";

  const heading = (text: string, sub?: string) => {
    if (y > H - 40) {
      doc.addPage();
      y = 16;
    }
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(text, M, y);
    if (sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(sub, M, y + 5);
      y += 5;
    }
    y += 4;
  };

  const table = (head: string[][], body: string[][], accent: [number, number, number], caption: string) => {
    if (!body.length) return;
    if (y > H - 30) {
      doc.addPage();
      y = 16;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...accent);
    doc.text(caption.toUpperCase(), M, y + 3);
    autoTable(doc, {
      startY: y + 5,
      head,
      body,
      margin: { left: M, right: M },
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7.5, cellPadding: 1.6, textColor: INK, lineColor: [213, 226, 221], lineWidth: 0.2 },
      headStyles: { fillColor: accent, textColor: 255, fontStyle: "bold", halign: "center", valign: "middle" },
      columnStyles: { 0: { fontStyle: "bold", halign: "left", cellWidth: 38 }, 1: { halign: "left", cellWidth: 28, textColor: MUTED } },
      bodyStyles: { halign: "right" },
      alternateRowStyles: { fillColor: [244, 250, 247] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
  };

  for (const board of boards) {
    // On-screen hints ("swipe…") don't belong in print.
    heading(board.title, board.context && !/swipe/i.test(board.context) ? board.context : undefined);
    const linked = board.panes.length > 1 && new Set(board.panes.map((p) => p.syncKey ?? p.id)).size === 1;

    for (const section of sections) {
      const text = (col: (typeof board.panes)[number]["columns"][number] | undefined, row: string) =>
        col?.cells[matrixCellKey(section.id, row)]?.text;

      if (linked) {
        // Same byproducts in every pane: one table, a column group per location.
        const first = board.panes[0];
        const body = first.columns
          .map((c) => {
            const key = c.matchKey ?? c.id;
            const per = board.panes.map((p) => p.columns.find((x) => (x.matchKey ?? x.id) === key));
            const values = per.flatMap((col) => [cell(text(col, "min")), cell(text(col, "max")), cell(text(col, "mandis"))]);
            return values.some(has) ? [c.title, c.special ? c.special.value : "—", ...values] : null;
          })
          .filter((r): r is string[] => !!r);
        table(
          [
            ["Byproduct", "Attribute", ...board.panes.flatMap((p) => [`${p.title} · Avg min`, "Avg max", "Mandis"])],
          ],
          body,
          GREEN,
          section.label,
        );
      } else {
        for (const pane of board.panes) {
          const body = pane.columns
            .map((c) => {
              const values = ["min", "max", "arrivals", "mandis", "change"].map((r) => cell(text(c, r)));
              return values.some(has) ? [c.title, c.special ? c.special.value : "—", ...values] : null;
            })
            .filter((r): r is string[] => !!r);
          table(
            [["Byproduct", "Attribute", "Avg min (Rs/40 kg)", "Avg max (Rs/40 kg)", "Arrivals (MT/report)", "Mandis", "Change"]],
            body,
            hex(pane.color),
            `${pane.title} · ${section.label}`,
          );
        }
      }
    }
  }

  if (mandiTables.length) {
    doc.addPage();
    y = 16;
    heading("Mandi breakdown", "Every reporting mandi for the byproduct and price type picked on screen.");
    for (const t of mandiTables) {
      if (y > H - 40) {
        doc.addPage();
        y = 16;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      doc.text(t.title, M, y + 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(t.subtitle, M, y + 7.5);
      y += 6;
      autoTable(doc, {
        startY: y + 3,
        head: [t.head],
        body: t.rows,
        margin: { left: M, right: M },
        theme: "grid",
        styles: { font: "helvetica", fontSize: 7.5, cellPadding: 1.4, textColor: INK, lineColor: [213, 226, 221], lineWidth: 0.2 },
        headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" },
        columnStyles: { 0: { fontStyle: "bold" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
        alternateRowStyles: { fillColor: [244, 250, 247] },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(213, 226, 221);
    doc.line(M, H - 10, W - M, H - 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(
      "Prices are means of every valid report on the selected day (PKT), Rs per 40 kg. — means not reported. Differences are not recommendations.",
      M,
      H - 6,
    );
    doc.text(`Page ${i} of ${pages}`, W - M, H - 6, { align: "right" });
  }

  doc.save(fileName);
}

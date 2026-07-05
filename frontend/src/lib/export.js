import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportCSV(filename, rows, columns) {
  const data = rows.map(r => {
    const o = {};
    columns.forEach(c => { o[c.label] = r[c.key]; });
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : filename.replace(/\.csv$/, ".xlsx"));
}

export function exportPDF(filename, title, rows, columns) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title, 14, 14);
  autoTable(doc, {
    startY: 20,
    head: [columns.map(c => c.label)],
    body: rows.map(r => columns.map(c => r[c.key] ?? "")),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 47, 167] },
  });
  doc.save(filename);
}

export function printTable(title, rows, columns) {
  const html = `<html><head><title>${title}</title>
    <style>
    body{font-family: 'IBM Plex Sans', Arial, sans-serif; padding: 24px;}
    h1{font-size:20px;margin:0 0 12px;}
    table{width:100%;border-collapse:collapse;font-size:12px;}
    th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
    th{background:#002FA7;color:white;}
    </style></head><body>
    <h1>${title}</h1>
    <table>
      <thead><tr>${columns.map(c=>`<th>${c.label}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r=>`<tr>${columns.map(c=>`<td>${r[c.key] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    <script>window.onload=()=>window.print()</script>
    </body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}

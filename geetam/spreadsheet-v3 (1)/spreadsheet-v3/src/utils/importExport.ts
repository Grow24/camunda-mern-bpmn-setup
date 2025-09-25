import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CellData, SheetData } from '../stores/spreadsheetStore';

export const exportToExcel = (sheets: SheetData, activeSheet: string, filename: string) => {
  const data = sheets[activeSheet];
  if (!data) return;

  const worksheetData: any[][] = [];
  let maxRow = 0;
  let maxCol = 0;

  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c]?.value?.toString().trim()) {
        maxRow = Math.max(maxRow, r);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  for (let r = 0; r <= maxRow; r++) {
    worksheetData[r] = [];
    for (let c = 0; c <= maxCol; c++) {
      worksheetData[r][c] = data[r][c]?.value ?? "";
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, activeSheet);

  const wbout = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,
  });

  const blob = new Blob([wbout], {
    type: "application/octet-stream",
  });
  saveAs(blob, `${filename}.xlsx`);
};

export const importFromExcel = (file: File): Promise<SheetData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const importedSheets: SheetData = {};

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonSheet: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
          const newSheetData: CellData[][] = Array.from({ length: 1000 }, () =>
            Array.from({ length: 100 }, () => ({ value: "" }))
          );

          jsonSheet.forEach((row, rowIndex) => {
            row.forEach((cellValue, colIndex) => {
              if (newSheetData[rowIndex] && newSheetData[rowIndex][colIndex]) {
                newSheetData[rowIndex][colIndex] = { value: String(cellValue) };
              }
            });
          });
          importedSheets[sheetName] = newSheetData;
        });

        resolve(importedSheets);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const exportToCSV = (sheets: SheetData, activeSheet: string, filename: string) => {
  const activeSheetData = sheets[activeSheet];
  if (!activeSheetData || activeSheetData.length === 0) return;

  const csvContent = activeSheetData.map(row =>
    row.map(cell => {
      const value = cell.value;
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${filename}.csv`);
};

export const exportToPDF = (sheets: SheetData, activeSheet: string, filename: string) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const data = sheets[activeSheet];

  if (!data || data.length === 0) return;

  let maxRow = 0;
  let maxCol = 0;

  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (!row) continue;

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const val = cell?.value;
      if (val && val.toString().trim() !== "") {
        maxRow = Math.max(maxRow, r);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  const trimmedData = data.slice(0, maxRow + 1).map(row =>
    Array.from({ length: maxCol + 1 }, (_, i) => row[i]?.value ?? "")
  );

  const headers = Array.from({ length: maxCol + 1 }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  const tableBody = trimmedData.map((row, i) => [`${i + 1}`, ...row]);
  const tableHead = [["", ...headers]];

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 20,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10 },
      ...Object.fromEntries(Array.from({ length: maxCol + 1 }, (_, i) => [i + 1, { cellWidth: 30 }]))
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: 0,
      fontStyle: "bold"
    }
  });

  doc.save(`${filename}.pdf`);
};
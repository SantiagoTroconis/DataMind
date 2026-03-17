import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import DataGrid from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

interface ExcelPreviewProps {
  file?: File | null;
  gridData?: { columns: string[]; rows: Record<string, unknown>[] } | null;
  className?: string;
}

export function ExcelPreview({ file, gridData, className }: ExcelPreviewProps) {
  const [parsedData, setParsedData] = useState<{
    columns: string[];
    rows: Record<string, unknown>[];
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (!file || gridData != null) return;

    setIsParsing(true);
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
          header: 1,
          blankrows: false,
          defval: null,
        });

        if (rawRows.length < 1) {
          setParsedData(null);
        } else {
          const headers = (rawRows[0] as unknown[]).map((h) => String(h ?? ''));
          const dataRows = (rawRows.slice(1) as unknown[][]).map((row) => {
            const obj: Record<string, unknown> = {};
            headers.forEach((col, i) => { obj[col] = row[i] ?? null; });
            return obj;
          });
          setParsedData({ columns: headers, rows: dataRows });
        }
      } catch (err) {
        console.error('ExcelPreview: failed to parse file', err);
        setParsedData(null);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => setIsParsing(false);
  }, [file, gridData]);

  const activeData = gridData ?? parsedData;

  if (activeData && activeData.columns.length > 0) {
    return (
      // dark-grid wrapper — CSS variables override happens via index.css (.dark-grid .rdg-light)
      <div
        className={`flex flex-col h-full dark-grid ${className ?? ''}`}
      >
        <DataGrid
          columns={activeData.columns.map((col) => ({
            key: col,
            name: col,
            resizable: true,
            width: activeData.columns.length > 8 ? 180 : `${100 / activeData.columns.length}%`,
            // headerCellClass: only font/weight — colors come from CSS variable overrides
            headerCellClass: 'font-semibold text-xs tracking-wide',
          }))}
          rows={activeData.rows}
          className="rdg-light h-full border-0 text-sm"
          defaultColumnOptions={{ sortable: true, resizable: true }}
          style={{ height: '100%' }}
        />
      </div>
    );
  }

  if (isParsing) {
    return (
      <div className={`flex flex-col h-full items-center justify-center ${className ?? ''}`}>
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(167,139,250,0.2)', borderTopColor: '#a78bfa' }}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full items-center justify-center ${className ?? ''}`}>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No data to display</p>
    </div>
  );
}

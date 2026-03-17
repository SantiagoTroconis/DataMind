import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import DataGrid from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

interface CellPoint {
  row: number;
  col: number;
}

export interface SelectedRangePayload {
  rangeLabel: string;
  startCell: string;
  endCell: string;
  rowCount: number;
  columnCount: number;
  cellCount: number;
  columns: string[];
  rows: Record<string, unknown>[];
}

interface ExcelPreviewProps {
  file?: File | null;
  gridData?: { columns: string[]; rows: Record<string, unknown>[] } | null;
  className?: string;
  onSelectionChange?: (selection: SelectedRangePayload | null) => void;
}

export function ExcelPreview({ file, gridData, className, onSelectionChange }: ExcelPreviewProps) {
  const [parsedData, setParsedData] = useState<{
    columns: string[];
    rows: Record<string, unknown>[];
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [selectionStart, setSelectionStart] = useState<CellPoint | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<CellPoint | null>(null);
  const [isSelectingWithMouse, setIsSelectingWithMouse] = useState(false);

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

  const toColumnLabel = (columnIndex: number) => {
    let index = columnIndex;
    let label = '';
    while (index >= 0) {
      label = String.fromCharCode((index % 26) + 65) + label;
      index = Math.floor(index / 26) - 1;
    }
    return label;
  };

  const toCellAddress = (point: CellPoint) => `${toColumnLabel(point.col)}${point.row + 2}`;

  const getSelectionBounds = () => {
    if (!selectionStart || !selectionEnd) return null;
    return {
      minRow: Math.min(selectionStart.row, selectionEnd.row),
      maxRow: Math.max(selectionStart.row, selectionEnd.row),
      minCol: Math.min(selectionStart.col, selectionEnd.col),
      maxCol: Math.max(selectionStart.col, selectionEnd.col),
    };
  };

  const selectionBounds = getSelectionBounds();

  useEffect(() => {
    if (!activeData || !selectionBounds) {
      onSelectionChange?.(null);
      return;
    }

    const selectedColumns = activeData.columns.slice(selectionBounds.minCol, selectionBounds.maxCol + 1);
    const selectedRows = activeData.rows
      .slice(selectionBounds.minRow, selectionBounds.maxRow + 1)
      .map((row) => {
        const scopedRow: Record<string, unknown> = {};
        selectedColumns.forEach((col) => {
          scopedRow[col] = row[col] ?? null;
        });
        return scopedRow;
      });

    const startPoint = {
      row: selectionBounds.minRow,
      col: selectionBounds.minCol,
    };
    const endPoint = {
      row: selectionBounds.maxRow,
      col: selectionBounds.maxCol,
    };

    const startCell = toCellAddress(startPoint);
    const endCell = toCellAddress(endPoint);

    onSelectionChange?.({
      rangeLabel: `${startCell}:${endCell}`,
      startCell,
      endCell,
      rowCount: selectionBounds.maxRow - selectionBounds.minRow + 1,
      columnCount: selectionBounds.maxCol - selectionBounds.minCol + 1,
      cellCount: (selectionBounds.maxRow - selectionBounds.minRow + 1) * (selectionBounds.maxCol - selectionBounds.minCol + 1),
      columns: selectedColumns,
      rows: selectedRows,
    });
  }, [activeData, onSelectionChange, selectionBounds]);

  useEffect(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
    onSelectionChange?.(null);
  }, [gridData, parsedData, onSelectionChange]);

  useEffect(() => {
    const stopSelection = () => setIsSelectingWithMouse(false);
    window.addEventListener('mouseup', stopSelection);
    return () => window.removeEventListener('mouseup', stopSelection);
  }, []);

  const isCellSelected = (rowIndex: number, colIndex: number) => {
    if (!selectionBounds) return false;
    return rowIndex >= selectionBounds.minRow && rowIndex <= selectionBounds.maxRow
      && colIndex >= selectionBounds.minCol && colIndex <= selectionBounds.maxCol;
  };

  const handleMouseSelectionStart = (point: CellPoint) => {
    setSelectionStart(point);
    setSelectionEnd(point);
    setIsSelectingWithMouse(true);
  };

  const handleMouseSelectionMove = (point: CellPoint) => {
    if (!isSelectingWithMouse || !selectionStart) return;
    setSelectionEnd(point);
  };

  if (activeData && activeData.columns.length > 0) {
    const rowsWithIds = activeData.rows.map((row, idx) => ({ ...row, __rowId: idx }));

    return (
      // dark-grid wrapper — CSS variables override happens via index.css (.dark-grid .rdg-light)
      <div
        className={`flex flex-col h-full dark-grid ${className ?? ''}`}
      >
        <DataGrid
          columns={activeData.columns.map((col, colIndex) => ({
            key: col,
            name: col,
            resizable: true,
            width: activeData.columns.length > 8 ? 180 : `${100 / activeData.columns.length}%`,
            // headerCellClass: only font/weight — colors come from CSS variable overrides
            headerCellClass: 'font-semibold text-xs tracking-wide',
            renderCell: (props: { row: Record<string, unknown>; rowIdx: number }) => {
              const selected = isCellSelected(props.rowIdx, colIndex);
              return (
                <div
                  className={`h-full w-full px-2.5 py-2 flex items-center select-none cursor-cell ${selected ? 'rdg-range-selected' : ''}`}
                  onMouseDown={(event) => {
                    if (event.button !== 0) return;
                    event.preventDefault();
                    handleMouseSelectionStart({ row: props.rowIdx, col: colIndex });
                  }}
                  onMouseEnter={() => handleMouseSelectionMove({ row: props.rowIdx, col: colIndex })}
                >
                  {String(props.row[col] ?? '')}
                </div>
              );
            },
          }))}
          rows={rowsWithIds}
          rowKeyGetter={(row) => String(row.__rowId)}
          className="rdg-dark dark-grid-table h-full border-0 text-sm"
          defaultColumnOptions={{ sortable: true, resizable: true }}
          style={{
            height: '100%',
            ['--rdg-color' as string]: '#dbe2ef',
            ['--rdg-border-color' as string]: 'rgba(255,255,255,0.08)',
            ['--rdg-background-color' as string]: 'rgba(10,10,16,0.72)',
            ['--rdg-header-background-color' as string]: 'rgba(18,18,26,0.95)',
            ['--rdg-row-hover-background-color' as string]: 'rgba(124,58,237,0.1)',
            ['--rdg-row-selected-background-color' as string]: 'rgba(124,58,237,0.22)',
            ['--rdg-row-selected-hover-background-color' as string]: 'rgba(124,58,237,0.28)',
          }}
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

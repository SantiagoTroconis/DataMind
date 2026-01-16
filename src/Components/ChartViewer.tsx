import React, { useState, useEffect } from 'react';
import { type Data } from 'plotly.js';
import Plot from 'react-plotly.js';
import { RefreshCcw } from 'lucide-react';

interface ChartViewerProps {
    chartData: { data: Data[]; layout: Record<string, unknown> };
    gridData: { columns: string[], rows: Record<string, unknown>[] } | null;
    onClose: () => void;
    className?: string;
}

export const ChartViewer: React.FC<ChartViewerProps> = ({ chartData, gridData, onClose, className = "" }) => {
   const [currentChartData, setCurrentChartData] = useState(chartData);
   
   useEffect(() => {
       setCurrentChartData(chartData);
   }, [chartData]);

   const findColumnByValues = (arr: unknown[] | undefined, grid: { columns: string[]; rows: Record<string, unknown>[] } ) => {
       if (!arr || !grid) return null;
       for (const col of grid.columns) {
           const colValues = grid.rows.map(r => r[col]);
           if (colValues.length !== arr.length) continue;
           let match = true;
           for (let i = 0; i < colValues.length; i++) {
               if (String(colValues[i]) !== String((arr as any)[i])) { match = false; break; }
           }
           if (match) return col;
       }
       return null;
   }
   
   const refreshChart = () => {
       if (!gridData) {
           alert('No data available to refresh the chart');
           return;
       }

       try {
           const missingMeta: number[] = [];
           const missingCols: Array<{ idx: number; x?: string | null; y?: string | null }> = [];

           const updatedData = currentChartData.data.map((trace: Data, idx: number) => {
               let xColumn: string | null = (trace as any).customdata?.xColumn ?? null;
               let yColumn: string | null = (trace as any).customdata?.yColumn ?? null;

               // If metadata missing, attempt to infer from existing trace.x / trace.y
               if ((!xColumn || !yColumn)) {
                   const traceX = (trace as any).x as unknown[] | undefined;
                   const traceY = (trace as any).y as unknown[] | undefined;
                   const inferredX = xColumn ? xColumn : findColumnByValues(traceX, gridData);
                   const inferredY = yColumn ? yColumn : findColumnByValues(traceY, gridData);

                   if (inferredX && inferredY) {
                       xColumn = inferredX;
                       yColumn = inferredY;
                       (trace as any).customdata = { ...(trace as any).customdata, xColumn, yColumn };
                   } else {
                       missingMeta.push(idx);
                       return trace;
                   }
               }

               // Validate columns exist in gridData
               if (!gridData.columns.includes(xColumn) || !gridData.columns.includes(yColumn)) {
                   missingCols.push({ idx, x: xColumn, y: yColumn });
                   return trace;
               }

               // Extract fresh data from gridData
               const newX = gridData.rows.map(row => row[xColumn as string]);
               const newY = gridData.rows.map(row => row[yColumn as string]);

               return {
                   ...trace,
                   x: newX,
                   y: newY,
                   customdata: { ...(trace as any).customdata, xColumn, yColumn }
               };
           });

           // Aggregate alerts into a single message if needed
           if (missingMeta.length > 0 || missingCols.length > 0) {
               let msg = '';
               if (missingMeta.length > 0) msg += 'Some traces lack column metadata and could not be inferred. Regenerate the chart to enable full refresh. ';
               if (missingCols.length > 0) msg += 'Some chart columns no longer exist in the grid data.';
               alert(msg.trim());
           }

           setCurrentChartData({ data: updatedData, layout: currentChartData.layout });

       } catch (error) {
           console.error('Error refreshing chart:', error);
           alert('Unable to refresh chart. Please regenerate the chart.');
       }
   }
   
   
   
   
    if (!chartData) return null;

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-full ${className}`}>
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-900">Visualization</h2>
                        <p className="text-xs text-zinc-500">Generated by DataMind AI</p>
                    </div>
                </div>
                <div className='flex gap-5'>
                    <button 
                        className="w-8 h-8 rounded-lg hover:bg-zinc-100 border border-transparent hover:border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-all cursor-pointer" 
                        title="Refresh Chart"
                        onClick={refreshChart}
                    >
                        <RefreshCcw />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-zinc-100 border border-transparent hover:border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-all cursor-pointer"
                        title="Close Chart"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

            </div>

            <div className="flex-1 overflow-hidden p-2 bg-white relative">
                <Plot
                    data={currentChartData.data}
                    layout={{
                        ...currentChartData.layout,
                        autosize: true,
                        width: undefined,
                        height: undefined,
                        margin: { l: 50, r: 20, b: 50, t: 20 },
                        font: { family: 'Inter, sans-serif' },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                    }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    config={{ responsive: true, displayModeBar: true, displaylogo: false }}
                />
            </div>
        </div>
    );
};

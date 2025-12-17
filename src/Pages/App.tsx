import { useState } from 'react'
import { Upload, FileSpreadsheet, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Auth } from './Auth';
import { ChatBox } from '../Components/ChatBox';
import DataGrid from 'react-data-grid';

import 'react-data-grid/lib/styles.css';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  executed_code?: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appState, setAppState] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  const [fileName, setFileName] = useState('');
  const [gridData, setGridData] = useState<{ columns: string[], rows: any[] } | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola, ¿en qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;

    if (!file) return;

    setFileName(file.name);
    setCurrentFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/excel/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const textText = await response.text();
      // Sanitize NaN values which are invalid in JSON
      const sanitizedText = textText.replace(/:\s*NaN/g, ': null');
      const data = JSON.parse(sanitizedText);

      if (data.status === 'success' && data.data) {
        setGridData(data.data);
        setAppState('view');
      }
    } catch (error) {
      console.error('Error al subir el archivo:', error);
    }
  };


  if (!isAuthenticated) {
    return <Auth setIsAuthenticated={setIsAuthenticated} />
  }

  const handleExport = () => {
    if (!currentFile) return;

    // Create a URL for the file
    const url = URL.createObjectURL(currentFile);

    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="h-screen flex bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">

      <div className={`bg-white border-r border-zinc-100 transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-80' : 'w-0'} overflow-hidden flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-20`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-900/20">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 text-base tracking-tight">DataMind</h2>
              <p className="text-xs text-zinc-400 font-medium">Workspace</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 p-2 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Your files</h3>
          <div className="space-y-1 relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-zinc-100 -z-10"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50/50">
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="text-zinc-400 hover:text-zinc-600 hover:bg-white p-2 rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              {fileName || 'New Analysis'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-lg transition font-medium text-sm" onClick={handleExport}  >
              Export
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600 ml-2">
              SA
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-8 pb-8">
          {appState === 'landing' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl w-full">
                <label htmlFor="file-upload" className="group cursor-pointer block">
                  <div className="relative overflow-hidden bg-white border border-dashed border-zinc-300 rounded-3xl p-20 transition-all duration-300 group-hover:border-zinc-400 group-hover:shadow-xl group-hover:shadow-zinc-200/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                        <Upload className="w-8 h-8 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                      </div>
                      <h3 className="text-3xl font-bold text-zinc-900 mb-4 tracking-tight">
                        Upload Data
                      </h3>
                      <p className="text-zinc-500 mb-8 text-lg max-w-md mx-auto leading-relaxed">
                        Drag and drop your spreadsheet here to start analyzing with AI.
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-xs font-medium text-zinc-500">
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>.xlsx, .csv supported</span>
                      </div>
                    </div>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          )}


          {appState === 'view' && gridData && (
            <>
              <div className="h-full flex flex-col animate-in fade-in duration-500 pb-24">
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-full">
                  <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">Data Preview</h3>
                        <p className="text-xs text-zinc-500">{gridData.rows.length} rows • {gridData.columns.length} columns</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}> {/* Explicit height container */}
                    <DataGrid
                      columns={gridData.columns.map(col => {
                        const isLargeDataset = gridData.columns.length > 8;
                        return { 
                          key: col, 
                          name: col, 
                          resizable: true,
                          width: isLargeDataset ? 180 : `${100 / gridData.columns.length}%`
                        };
                      })}
                      rows={gridData.rows}
                      className="rdg-light h-full border-0 text-sm"
                      defaultColumnOptions={{
                        sortable: true,
                        resizable: true
                      }}
                      style={{ height: '100%' }}
                    />

                  </div>
                </div>
              </div>
              <ChatBox
                isOpen={chatOpen}
                onOpenChange={setChatOpen}
                appState={appState}
                setAppState={setAppState}
                file={currentFile}
                onUpdateFile={setCurrentFile}
                onUpdateGrid={setGridData}
                messages={messages}
                setMessages={setMessages}
              />
            </>
          )}
        </div>
      </div>


      {/* Loading Overlay */}
      {appState === 'result' && (
        <div className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-6 shadow-2xl border border-white/50 max-w-sm w-full mx-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-zinc-900" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-900 mb-1">Processing Data</h3>
              <p className="text-sm text-zinc-500">Applying transformations and generating charts...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App

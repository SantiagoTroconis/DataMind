import { useEffect, useState } from 'react'
import { Upload, FileSpreadsheet, Sparkles, ChevronLeft, ChevronRight, Undo, LogOut, Trash, Search, RefreshCcw } from 'lucide-react';
import { type Data } from 'plotly.js';
import { ChatBox } from '../Components/ChatBox';
import DataGrid from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { ChartViewer } from '../Components/ChartViewer';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  executed_code?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface Conversation {
  id: string;
  filename: string;
  messages: Message[];
}

function Dashboard() {
  const [appState, setAppState] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [fileName, setFileName] = useState('');
  const [gridData, setGridData] = useState<{ columns: string[], rows: Record<string, unknown>[] } | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{ data: Data[]; layout: Record<string, unknown> } | null>(null);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola, ¿en qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem('current_session_id'));
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const findColumnByValues = (arr: unknown[] | undefined, grid: { columns: string[]; rows: Record<string, unknown>[] } | null) => {
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
  };

  // Filter rows based on search term
  const filteredRows = gridData && searchTerm
    ? gridData.rows.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    : gridData ? gridData.rows : [];

  const generateCsvFile = (columns: string[], rows: Record<string, unknown>[], filename: string): File => {
    const processValue = (val: unknown) => {
      if (val === null || val === undefined) return '';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const header = columns.map(c => processValue(c)).join(',');
    const body = rows.map(row =>
      columns.map(col => processValue(row[col])).join(',')
    ).join('\n');

    const BOM = '\uFEFF';
    const content = `${BOM}${header}\n${body}`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    return new File([blob], filename || 'export.csv', { type: 'text/csv' });
  };

  useEffect(() => {
    const fetchConversations = async (authToken: string | null) => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/excel/conversations', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        const data = await response.json();

        if (Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        } else {
          setConversations([]);
        }

        if (data.msg === 'Token has expired') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          navigate('/auth');
        }

      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    if (!user || !user.id || !token) {
      navigate('/auth');
    }


    setUser(user);
    setToken(token);
    fetchConversations(token);
  }, [navigate]);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;

    if (!file) return;

    setFileName(file.name);
    setCurrentFile(file);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/excel/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const textText = await response.text();
      const sanitizedText = textText.replace(/:\s*NaN/g, ': null');
      const data = JSON.parse(sanitizedText);

      if (data.status === 'success' && data.data) {
        setGridData(data.data);
        setAppState('view');

        if (data.session_id) {
          setSessionId(data.session_id);
          sessionStorage.setItem('current_session_id', data.session_id);
        }

        setConversations([
          ...(Array.isArray(conversations) ? conversations : []),
          {
            id: data.session_id,
            filename: file.name,
            messages: []
          }
        ]);

      }
    } catch (error) {
      console.error('Error al subir el archivo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (conversation: Conversation) => {
    try {
      setSessionId(conversation.id);
      sessionStorage.setItem('current_session_id', conversation.id);

      setFileName(conversation.filename);
      setCurrentFile(null);


      setAppState('result');
      const response = await fetch(`http://localhost:5000/excel/conversation/${conversation.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }

      const data = await response.json();

      if (data.status === 'success' && data.data) {
        if (data.data.grid) {
          setGridData(data.data.grid);
          // Regenerate file for export
          const reconstructedFile = generateCsvFile(data.data.grid.columns, data.data.grid.rows, conversation.filename);
          setCurrentFile(reconstructedFile);
        }

        if (data.data.chart_data) {
          // Attach column metadata to traces when possible so ChartViewer can refresh client-side
          const incomingChart = data.data.chart_data as any;
          if (incomingChart?.data && data.data.grid) {
            incomingChart.data = incomingChart.data.map((trace: any) => {
              const existingX = trace?.customdata?.xColumn ?? null;
              const existingY = trace?.customdata?.yColumn ?? null;
              const inferredX = existingX ? existingX : findColumnByValues(trace?.x, data.data.grid);
              const inferredY = existingY ? existingY : findColumnByValues(trace?.y, data.data.grid);
              if (inferredX || inferredY) {
                trace.customdata = { ...(trace.customdata || {}), ...(inferredX ? { xColumn: inferredX } : {}), ...(inferredY ? { yColumn: inferredY } : {}) };
              }
              return trace;
            });
          }
          setChartData(incomingChart);
        } else {
          setChartData(null);
        }

        if (Array.isArray(data.data.messages)) {
          setMessages(data.data.messages);
        } else {
          setMessages([]);
        }

        setAppState('view');
      }

    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Could not load conversation history');
    }
  };

  const handleExport = () => {
    if (!currentFile) return;

    const url = URL.createObjectURL(currentFile);

    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleUndo = async () => {
    if (!sessionId) return;

    setAppState('result');
    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);

      const response = await fetch(`http://localhost:5000/excel/undo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to undo');
      }

      const data = await response.json();
      if (data.status === 'success' && data.data) {
        setGridData(data.data);
      }
    } catch (error) {
      console.error('Error undoing:', error);
      toast.error('Could not undo');
    } finally {
      setAppState('view');
    }
  };

  const handleReset = async () => {
    if (!sessionId) return;

    toast("Reset file?", {
      description: "This will revert all changes made to your data. This action cannot be undone.",
      action: {
        label: "Confirm Reset",
        onClick: async () => {
          setAppState('result');
          try {
            const formData = new FormData();
            formData.append('session_id', sessionId);

            const response = await fetch(`http://localhost:5000/excel/reset`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Failed to reset');
            }

            const data = await response.json();
            if (data.status === 'success' && data.data) {
              setGridData(data.data);
              setChartData(null);
              toast.success("File reset successfully");
            }
          } catch (error) {
            console.error('Error resetting:', error);
            toast.error('Could not reset file');
          } finally {
            setAppState('view');
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => { },
      },
    });
  };

  const handleDelete = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!sessionId) return;

    toast("Delete file?", {
      description: "This will delete the file. This action cannot be undone.",
      action: {
        label: "Confirm Delete",
        onClick: async () => {
          setAppState('result');
          try {
            const response = await fetch(`http://localhost:5000/excel/conversation/${conversationId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            });

            if (!response.ok) {
              throw new Error('Failed to delete');
            }

            const data = await response.json();
            if (data.status === 'success' && data.conversations) {
              setConversations(data.conversations);
              toast.success("File deleted successfully");
            }
          } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Could not delete file');
          } finally {
            setAppState('view');
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => { },
      },
    });
  };

  return (
    <div className="h-screen flex bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <Toaster position="top-center" />
      <aside className={`bg-white border-r border-zinc-100 transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-20`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-900/20">
              <img src="./DataMind_Logo.svg" alt="" className="bg-white h-full w-full rounded-full" />
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
          <label htmlFor="sidebar-file-upload" className="flex items-center gap-3 w-full p-3 mb-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl cursor-pointer transition-all  group">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Upload className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">New Conversation</p>
            </div>
            <input
              id="sidebar-file-upload"
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
            />
          </label>

          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Your files</h3>
          <div className="space-y-1 relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-full bg-zinc-100 -z-10">
              {
                conversations.length > 0 ? conversations.map((conversation) => (
                  <div key={conversation.id} className="flex items-center gap-4 p-2 cursor-pointer hover:bg-zinc-50 rounded-lg border-zinc-100" onClick={() => handleFileSelect(conversation)}>
                    <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-900/20 p-2">
                      <FileSpreadsheet className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-4">
                        <h2 className="font-medium text-zinc-900 tracking-tight">{conversation.filename}</h2>
                        <button onClick={(e) => handleDelete(conversation.id, e)} className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 p-2 rounded-lg transition-colors cursor-pointer"><Trash className="w-4 h-4" /></button>
                      </div>
                      <p className="text-xs text-zinc-400 font-medium">Workspace</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-zinc-400 font-medium w-full">No files uploaded</p>
                )
              }
            </div>
          </div>
        </div>
      </aside>

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
            <div className="flex items-center gap-1 mr-2 bg-white/50 p-1 rounded-lg border border-zinc-200/50">
              <button
                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white rounded-md transition-all hover:shadow-sm disabled:opacity-30 cursor-pointer"
                title="Undo"
                onClick={handleUndo}
                disabled={currentFile === null}
              >
                <Undo className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-zinc-200"></div>
              <button
                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white rounded-md transition-all hover:shadow-sm disabled:opacity-30 cursor-pointer"
                title="Redo"
                onClick={handleReset}
                disabled={currentFile === null}
              >
                <p>Reset</p>
              </button>
            </div>

            <button className="px-4 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-white cursor-pointer rounded-lg transition font-medium text-sm" onClick={handleExport}  >
              Export
            </button>
            <button onClick={handleLogout} className="px-4 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-white cursor-pointer rounded-lg transition font-medium text-sm">
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-900 ml-2">
              {user?.email.slice(0, 2).toUpperCase()}
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
                        {isUploading ? 'Uploading...' : 'Upload Data'}
                      </h3>
                      <p className="text-zinc-500 mb-8 text-lg max-w-md mx-auto leading-relaxed">
                        {isUploading ? 'Please wait while we process your file.' : 'Drag and drop your spreadsheet here to start analyzing with AI.'}
                      </p>
                      {isUploading ? (
                        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-xs font-medium text-zinc-500">
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>.xlsx, .csv supported</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          )}


          {appState === 'view' && gridData && (
            <div className="h-full flex flex-col p-6 animate-in fade-in duration-500">
              <div className="flex flex-col lg:flex-row gap-6 h-full">

                {/* Data Grid Panel */}
                <div className={`flex flex-col transition-all duration-500 ease-in-out ${chartData ? 'lg:w-[55%] h-[50%] lg:h-full' : 'w-full h-full'}`}>
                  <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-full ring-1 ring-zinc-900/5">
                    <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100/50 flex items-center justify-center text-emerald-700 ring-1 ring-emerald-900/10">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-900">Data Preview</h3>
                          <p className="text-xs text-zinc-500">{filteredRows.length} rows • {gridData.columns.length} columns</p>
                        </div>
                      </div>

                      <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                        <input
                          type="text"
                          placeholder="Search data..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 pr-4 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 w-64 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                      <DataGrid
                        columns={gridData.columns.map(col => {
                          const isLargeDataset = gridData.columns.length > 8;
                          return {
                            key: col,
                            name: col,
                            resizable: true,
                            width: isLargeDataset ? 180 : `${100 / gridData.columns.length}%`,
                            headerCellClass: 'bg-zinc-50/50 text-zinc-700 font-medium'
                          };
                        })}
                        rows={filteredRows}
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

                {/* Chart Panel */}
                {chartData && (
                  <div className="flex flex-col items-end transition-all duration-500 ease-in-out lg:w-[45%] h-[50%] lg:h-full gap-4 w-full">
                    <div className="lg:w-full h-[50%] lg:h-full animate-in slide-in-from-right-10 fade-in duration-500">
                      <ChartViewer
                        chartData={chartData}
                        gridData={gridData}
                        onClose={() => setChartData(null)}
                        className="h-full ring-1 ring-zinc-900/5 shadow-sm"
                      />
                    </div>  
                  </div>
                )}
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
                onChartGenerated={setChartData}
                sessionId={sessionId}
              />
            </div>
          )}


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
                </div>
              </div>
            </div>
          )}

          {/* Initial Loading State */}
          {
            isLoading && (
              <div className="fixed inset-0 bg-zinc-50 flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                  <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-xl shadow-zinc-900/20">
                    <img src="./DataMind_Logo.svg" alt="Logo" className='w-10 h-10 bg-white rounded' />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-zinc-900 tracking-tight">DataMind</h2>
                  </div>
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

export default Dashboard

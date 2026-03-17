import { useEffect, useState } from 'react'
import {
  Upload, FileSpreadsheet, Sparkles, ChevronLeft, ChevronRight,
  Undo, LogOut, Trash, Search,
} from 'lucide-react';
import { type Data } from 'plotly.js';
import { ChatBox } from '../Components/ChatBox';
import { ChartViewer } from '../Components/ChartViewer';
import { ExcelPreview } from '../Components/ExcelPreview';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { apiFetch } from '../utils/api';

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

// ─── tiny hover helper (avoids repetitive onMouseEnter/Leave pairs) ──────────
function useHover(
  normalStyle: React.CSSProperties,
  hoverStyle: React.CSSProperties,
) {
  return {
    style: normalStyle,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) =>
      Object.assign((e.currentTarget as HTMLElement).style, hoverStyle),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) =>
      Object.assign((e.currentTarget as HTMLElement).style, normalStyle),
  };
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
  const [chartData, setChartData] = useState<{ data: Data[]; layout: Record<string, unknown> } | null>(null);
  const [hasModifications, setHasModifications] = useState(false);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hi! Upload a file and ask me anything about your data.', timestamp: new Date() }
  ]);
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem('current_session_id'));
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');

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

  const filteredRows = gridData && searchTerm
    ? gridData.rows.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    : gridData ? gridData.rows : [];

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch('/excel/conversations');
        const data = await response.json();
        setConversations(Array.isArray(data.conversations) ? data.conversations : []);
      } catch {
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    if (!user || !user.id || !token) navigate('/auth');
    setUser(user);
    fetchConversations();
  }, [navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    setFileName(file.name);
    setCurrentFile(file);
    setIsUploading(true);
    setHasModifications(false);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await apiFetch('/excel/upload', { method: 'POST', body: formData });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error((data as { error?: string }).error || 'Upload failed');
        return;
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
          { id: data.session_id, filename: file.name, messages: [] }
        ]);
      }
    } catch {
      // handled by toast
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (conversation: Conversation) => {
    try {
      setSessionId(conversation.id);
      sessionStorage.setItem('current_session_id', conversation.id);
      setActiveConversationId(conversation.id);
      setFileName(conversation.filename);
      setCurrentFile(null);
      setAppState('result');
      const response = await apiFetch(`/excel/conversation/${conversation.id}`);
      if (!response.ok) throw new Error('Failed to load conversation');
      const data = await response.json();
      if (data.status === 'success' && data.data) {
        if (data.data.grid) {
          setGridData(data.data.grid);
          const hasCommands = Array.isArray(data.data.messages) && data.data.messages.length > 0;
          setHasModifications(hasCommands);
        }
        if (data.data.chart_data) {
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
        setMessages(Array.isArray(data.data.messages) ? data.data.messages : []);
        setAppState('view');
      }
    } catch {
      toast.error('Could not load conversation history');
    }
  };

  const handleDownload = async () => {
    if (!sessionId) return;
    try {
      const response = await apiFetch(`/excel/download/${sessionId}`);
      if (!response.ok) { toast.error('Download failed'); return; }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace(/\.[^.]+$/, '.xlsx');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
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
      const response = await apiFetch('/excel/undo', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Failed to undo');
      const data = await response.json();
      if (data.status === 'success' && data.data) {
        setGridData(data.data);
        if (!data.has_chart) setChartData(null);
        else if (data.chart_data) setChartData(data.chart_data);
        if (data.undone === false) setHasModifications(false);
      }
    } catch {
      toast.error('Could not undo');
    } finally {
      setAppState('view');
    }
  };

  const handleReset = async () => {
    if (!sessionId) return;
    toast("Reset file?", {
      description: "This will revert all changes. This action cannot be undone.",
      action: {
        label: "Confirm Reset",
        onClick: async () => {
          setAppState('result');
          try {
            const formData = new FormData();
            formData.append('session_id', sessionId);
            const response = await apiFetch('/excel/reset', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Failed to reset');
            const data = await response.json();
            if (data.status === 'success' && data.data) {
              setGridData(data.data);
              setChartData(null);
              setHasModifications(false);
              toast.success("File reset successfully");
            }
          } catch {
            toast.error('Could not reset file');
          } finally {
            setAppState('view');
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
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
            const response = await apiFetch(`/excel/conversation/${conversationId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete');
            const data = await response.json();
            if (data.status === 'success' && data.conversations) {
              setConversations(data.conversations);
              if (conversationId === sessionId) {
                setGridData(null);
                setChartData(null);
                setSessionId(null);
                sessionStorage.removeItem('current_session_id');
                setActiveConversationId(null);
                setHasModifications(false);
                setAppState('landing');
              }
              toast.success("File deleted successfully");
            }
          } catch {
            toast.error('Could not delete file');
          } finally {
            setAppState('view');
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const handleCloseChart = () => {
    toast("Close chart?", {
      description: "This will close the current chart view.",
      action: { label: "Confirm", onClick: () => setChartData(null) },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const handleGridUpdate = (data: { columns: string[], rows: Record<string, unknown>[] }) => {
    setGridData(data);
    setHasModifications(true);
  };

  // ── hover helpers ────────────────────────────────────────────────────────
  const sidebarToggleHover = useHover(
    { color: 'rgba(255,255,255,0.35)' },
    { background: 'rgba(255,255,255,0.06)', color: '#f8fafc' },
  );
  const iconBtnHover = useHover(
    { border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
    { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#f8fafc' },
  );
  const logoutHover = useHover(
    { border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' },
    { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' },
  );

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#0a0a10', color: '#f1f5f9' }}>
      <Toaster position="top-center" theme="dark" />

      {/* ══════════════════════ SIDEBAR ══════════════════════════════════ */}
      <aside
        className={`flex flex-col flex-shrink-0 transition-all duration-500 ease-in-out overflow-hidden z-20 ${sidebarOpen ? 'w-64' : 'w-0'}`}
        style={{ background: '#0d0d14', borderRight: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Logo row */}
        <div
          className="flex items-center justify-between px-5 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.28)' }}
            >
              <img src="./DataMind_Logo.svg" alt="MyCuery" className="w-5 h-5 object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm tracking-tight truncate" style={{ color: '#f8fafc' }}>MyCuery</h2>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Workspace</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg transition-all flex-shrink-0"
            {...sidebarToggleHover}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New conversation */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <label
            htmlFor="sidebar-file-upload"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl cursor-pointer transition-all duration-200"
            style={{ background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.22)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.22)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.14)'; }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.22)' }}
            >
              <Upload className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#c4b5fd' }}>New Conversation</span>
            <input
              id="sidebar-file-upload"
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* File list */}
        <div className="px-4 flex-1 overflow-y-auto min-h-0">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Your Files
          </p>

          <div className="space-y-0.5">
            {conversations.length === 0 ? (
              <p className="text-xs py-3 px-1" style={{ color: 'rgba(255,255,255,0.22)' }}>
                No files yet. Upload one above.
              </p>
            ) : (
              conversations.map(conv => {
                const isActive = activeConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group"
                    style={{
                      background: isActive ? 'rgba(139,92,246,0.14)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(139,92,246,0.22)' : 'transparent'}`,
                    }}
                    onClick={() => handleFileSelect(conv)}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: isActive ? 'rgba(139,92,246,0.22)' : 'rgba(255,255,255,0.05)' }}
                    >
                      <FileSpreadsheet
                        className="w-3.5 h-3.5"
                        style={{ color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}
                      />
                    </div>
                    <span
                      className="flex-1 text-xs font-medium truncate"
                      style={{ color: isActive ? '#f8fafc' : 'rgba(255,255,255,0.55)' }}
                    >
                      {conv.filename}
                    </span>
                    <button
                      onClick={e => handleDelete(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all flex-shrink-0"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {/* ══════════════════════ MAIN ═════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <div
          className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(10,10,16,0.9)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl transition-all flex-shrink-0"
                {...iconBtnHover}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2 min-w-0">
              {fileName && (
                <FileSpreadsheet className="w-4 h-4 flex-shrink-0" style={{ color: '#a78bfa' }} />
              )}
              <h1
                className="text-sm font-semibold tracking-tight truncate"
                style={{ color: '#f8fafc' }}
              >
                {fileName || 'MyCuery Workspace'}
              </h1>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Undo + Reset group */}
            <div
              className="flex items-center gap-0.5 rounded-xl p-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {[
                { label: 'Undo', icon: <Undo className="w-3.5 h-3.5" />, onClick: handleUndo },
                { label: 'Reset', icon: null, onClick: handleReset },
              ].map(({ label, icon, onClick }) => (
                <button
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                  onClick={onClick}
                  disabled={!sessionId}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f8fafc'; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                >
                  {icon}{label}
                </button>
              ))}
            </div>

            {/* Download */}
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed"
              style={hasModifications ? {
                background: 'rgba(124,58,237,0.18)',
                border: '1px solid rgba(124,58,237,0.35)',
                color: '#c4b5fd',
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.25)',
              }}
              onClick={hasModifications ? handleDownload : undefined}
              disabled={!hasModifications}
              onMouseEnter={e => { if (hasModifications) e.currentTarget.style.background = 'rgba(124,58,237,0.28)'; }}
              onMouseLeave={e => { if (hasModifications) e.currentTarget.style.background = 'rgba(124,58,237,0.18)'; }}
            >
              Download .xlsx
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl transition-all"
              title="Sign out"
              {...logoutHover}
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: 'rgba(139,92,246,0.2)',
                border: '1px solid rgba(139,92,246,0.38)',
                color: '#c4b5fd',
              }}
            >
              {user?.email.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 min-h-0">

          {/* Processing indicator */}
          {appState === 'result' && (
            <div
              className="flex items-center gap-4 px-5 py-3.5 rounded-2xl mb-4"
              style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.14)' }}
            >
              <Sparkles
                className="w-4 h-4 flex-shrink-0 animate-pulse"
                style={{ color: '#a78bfa' }}
              />
              <div className="flex-1 min-w-0">
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full animate-pulse"
                    style={{ width: '48%', background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }}
                  />
                </div>
              </div>
              <p className="text-xs font-medium flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {loadingStep || 'Processing…'}
              </p>
            </div>
          )}

          {/* ── Upload / empty state ─────────────────────────────────── */}
          {appState === 'landing' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-lg w-full">
                <label htmlFor="file-upload" className="group cursor-pointer block">
                  <div
                    className="relative rounded-3xl p-16 upload-pulse transition-all duration-500"
                    style={{ background: 'rgba(255,255,255,0.015)', border: '2px dashed rgba(139,92,246,0.22)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.04)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.5)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.015)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.22)';
                    }}
                  >
                    {/* Ambient glow */}
                    <div
                      className="absolute inset-0 rounded-3xl pointer-events-none"
                      style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.06), transparent)' }}
                    />

                    <div className="relative z-10 flex flex-col items-center">
                      {/* Icon with ping ring */}
                      <div className="relative w-20 h-20 mx-auto mb-8">
                        <div
                          className="absolute inset-0 rounded-2xl opacity-30 animate-ping"
                          style={{ background: 'rgba(139,92,246,0.4)', animationDuration: '2.5s' }}
                        />
                        <div
                          className="relative w-full h-full rounded-2xl flex items-center justify-center"
                          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}
                        >
                          {isUploading ? (
                            <div
                              className="w-8 h-8 border-2 rounded-full animate-spin"
                              style={{ borderColor: 'rgba(167,139,250,0.25)', borderTopColor: '#a78bfa' }}
                            />
                          ) : (
                            <Upload className="w-8 h-8" style={{ color: '#a78bfa' }} />
                          )}
                        </div>
                      </div>

                      <h3
                        className="text-2xl font-bold mb-3 tracking-tight"
                        style={{ color: '#f8fafc' }}
                      >
                        {isUploading ? 'Uploading your file…' : 'Drop your spreadsheet here'}
                      </h3>
                      <p
                        className="text-base mb-8 max-w-sm leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.38)' }}
                      >
                        {isUploading
                          ? 'Please wait while we read your data.'
                          : 'Upload an Excel or CSV file and start asking questions about your data in plain English.'}
                      </p>

                      {!isUploading && (
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                          {['.xlsx', '.xls', '.csv'].map(ext => (
                            <span
                              key={ext}
                              className="px-3 py-1 rounded-full text-xs font-mono font-medium"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.09)',
                                color: 'rgba(255,255,255,0.4)',
                              }}
                            >
                              {ext}
                            </span>
                          ))}
                          <span className="text-xs mx-1" style={{ color: 'rgba(255,255,255,0.18)' }}>·</span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>max 10 MB</span>
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

          {/* ── View / result state ──────────────────────────────────── */}
          {(appState === 'view' || appState === 'result') && gridData && (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
              <div className={`flex flex-col lg:flex-row gap-5 flex-1 min-h-0`}>

                {/* Data grid panel */}
                <div
                  className={`flex flex-col transition-all duration-500 min-h-0 ${chartData ? 'lg:w-[55%] h-[50%] lg:h-full' : 'w-full h-full'}`}
                >
                  <div
                    className="flex flex-col h-full rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    {/* Panel header */}
                    <div
                      className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)' }}
                        >
                          <FileSpreadsheet className="w-4 h-4" style={{ color: '#a78bfa' }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold" style={{ color: '#f8fafc' }}>Data Preview</h3>
                          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.32)' }}>
                            {filteredRows.length} rows · {gridData.columns.length} columns
                          </p>
                        </div>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                          style={{ color: 'rgba(255,255,255,0.3)' }}
                        />
                        <input
                          type="text"
                          placeholder="Search…"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="pl-9 pr-4 py-2 text-xs rounded-xl outline-none transition-all w-48 dark-placeholder"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            color: '#f8fafc',
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                        />
                      </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-hidden min-h-0">
                      <ExcelPreview
                        gridData={searchTerm ? { columns: gridData.columns, rows: filteredRows } : gridData}
                        className="h-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Chart panel */}
                {chartData && (
                  <div className="flex flex-col transition-all duration-500 lg:w-[45%] h-[50%] lg:h-full min-h-0">
                    <div className="h-full animate-in slide-in-from-right-10 fade-in duration-500">
                      <ChartViewer
                        chartData={chartData}
                        gridData={gridData}
                        onClose={handleCloseChart}
                        className="h-full"
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
                onLoadingStep={setLoadingStep}
                file={currentFile}
                onUpdateFile={setCurrentFile}
                onUpdateGrid={handleGridUpdate}
                messages={messages}
                setMessages={setMessages}
                onChartGenerated={setChartData}
                sessionId={sessionId}
              />
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════ LOADING SPLASH ═══════════════════════════ */}
      {isLoading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: '#0a0a10' }}
        >
          <div className="flex flex-col items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              <img src="./DataMind_Logo.svg" alt="MyCuery" className="w-9 h-9 object-contain" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold tracking-tight shimmer-text">MyCuery</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
                Loading your workspace…
              </p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: '#7c3aed', animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

import { useState, useRef, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { type Data } from 'plotly.js';
import { Sparkles, X, Send, Bot, User, Code, BarChart, Type } from 'lucide-react';
import type { Message } from '../Pages/Dashboard';
import { toast } from 'sonner';
import { API_BASE_URL } from '../utils/api';

interface ChatBoxProps {
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    appState?: string;
    setAppState?: (state: string) => void;
    onLoadingStep?: (step: string) => void;
    file?: File | null;
    onUpdateGrid?: (data: { columns: string[], rows: Record<string, unknown>[] }) => void;
    onUpdateFile?: (file: File) => void;
    onChartGenerated?: (chartData: { data: Data[]; layout: Record<string, unknown> }) => void;
    messages: Message[];
    setMessages: Dispatch<SetStateAction<Message[]>>;
    sessionId?: string | null;
}

const QUICK_ACTIONS = [
    {
        icon: Sparkles,
        label: 'Auto-Clean',
        prompt: "Identify and remove duplicate rows and handle missing values by filling them with the mean or 'Unknown'.",
        description: "Remove duplicates and fill missing values.",
    },
    {
        icon: BarChart,
        label: 'Quick Stats',
        prompt: "Provide a summary of the numerical columns and tell me the most frequent value in categorical columns.",
        description: "Summarize numerical columns and frequent values.",
    },
    {
        icon: Type,
        label: 'Standardize',
        prompt: "Make all column names lowercase and replace spaces with underscores.",
        description: "Standardize column names.",
    },
];

const generateCsvFile = (columns: string[], rows: Record<string, unknown>[]): File => {
    const processValue = (val: unknown) => {
        if (val === null || val === undefined) return '';
        return `"${String(val).replace(/"/g, '""')}"`;
    };
    const header = columns.map(c => processValue(c)).join(',');
    const body = rows.map(row => columns.map(col => processValue(row[col])).join(',')).join('\n');
    const BOM = '\uFEFF';
    const content = `${BOM}${header}\n${body}`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    return new File([blob], 'modified_data.csv', { type: 'text/csv' });
};

export function ChatBox({
    isOpen = false, onOpenChange, setAppState, onLoadingStep,
    file: _file, onUpdateFile, onUpdateGrid, onChartGenerated,
    messages, setMessages, sessionId,
}: ChatBoxProps) {
    const [prompt, setPrompt] = useState('');
    const [viewingCode, setViewingCode] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [token] = useState(() => localStorage.getItem('token'));

    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    };

    const handleSend = async (contentOverride?: string) => {
        const contentToSend = contentOverride || prompt;
        if (contentToSend.trim().length <= 3) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: contentToSend,
            timestamp: new Date(),
        };

        setMessages([...messages, userMsg]);
        onOpenChange?.(false);
        onLoadingStep?.('Interpreting…');
        setAppState?.('result');

        try {
            const response = await fetch(`${API_BASE_URL}/excel/transform`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    ...(sessionId ? { session_id: sessionId } : {}),
                    prompt: contentToSend,
                }),
            });

            if (!response.ok) {
                toast.error('Error connecting to server');
                setAppState?.('view');
                return;
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const frames = buffer.split('\n\n');
                buffer = frames.pop() || '';

                for (const frame of frames) {
                    const lines = frame.split('\n');
                    const dataLine = lines.find(l => l.startsWith('data:'));
                    const eventLine = lines.find(l => l.startsWith('event:'));
                    if (!dataLine) continue;

                    const payload = JSON.parse(dataLine.slice(5).trim());
                    const eventType = eventLine ? eventLine.slice(6).trim() : 'message';

                    if (eventType === 'progress') {
                        if (payload.step) onLoadingStep?.(payload.step);
                        setAppState?.('result');
                    } else if (eventType === 'done') {
                        onLoadingStep?.('Done');
                        if ((payload.type === 'update' || payload.type === 'formula') && onUpdateGrid && payload.data) {
                            onUpdateGrid(payload.data);
                            if (onUpdateFile) {
                                const newFile = generateCsvFile(payload.data.columns, payload.data.rows);
                                onUpdateFile(newFile);
                            }
                        }
                        if (payload.has_chart && payload.chart_data && onChartGenerated) {
                            onChartGenerated(payload.chart_data);
                        }
                        if (payload.explanation) {
                            const assistantMsg: Message = {
                                id: (Date.now() + 1).toString(),
                                role: 'assistant',
                                content: payload.explanation,
                                timestamp: new Date(),
                            };
                            setMessages(prev => [...prev, assistantMsg]);
                        }
                    } else if (eventType === 'error') {
                        toast.error(payload.error || 'Error processing the change');
                    }
                }
            }

            setAppState?.('view');
            onOpenChange?.(true);
            setPrompt('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, there was an error processing your request.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
            setAppState?.('view');
            setPrompt('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
                onClick={() => onOpenChange?.(false)}
            />

            {/* Chat container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end w-full max-w-[480px] pointer-events-none">

                {/* ── Chat panel ─────────────────────────────────────── */}
                <div
                    className={`w-full rounded-2xl overflow-hidden pointer-events-auto origin-bottom mb-4 transition-all duration-500 ${isOpen
                        ? 'h-[580px] opacity-100 scale-100 translate-y-0'
                        : 'h-0 opacity-0 scale-95 translate-y-4 pointer-events-none'
                    }`}
                    style={{
                        background: 'rgba(13,13,20,0.97)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(24px)',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                >
                    {/* Header */}
                    <div
                        className="px-5 py-4 flex items-center justify-between flex-shrink-0"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(109,40,217,0.3))',
                                    border: '1px solid rgba(139,92,246,0.35)',
                                }}
                            >
                                <Sparkles className="w-4 h-4" style={{ color: '#a78bfa' }} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm" style={{ color: '#f8fafc' }}>MyCuery</h3>
                                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>AI Data Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onOpenChange?.(false)}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: 'rgba(255,255,255,0.35)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#f8fafc'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="p-5 overflow-y-auto space-y-4"
                        style={{ height: 'calc(100% - 186px)' }}
                    >
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{
                                        background: msg.role === 'assistant' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.07)',
                                        border: `1px solid ${msg.role === 'assistant' ? 'rgba(139,92,246,0.28)' : 'rgba(255,255,255,0.1)'}`,
                                    }}
                                >
                                    {msg.role === 'assistant'
                                        ? <Bot className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                                        : <User className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                                    }
                                </div>

                                {/* Bubble */}
                                <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                                    <div
                                        className="px-4 py-3 text-sm leading-relaxed"
                                        style={msg.role === 'assistant' ? {
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                            color: 'rgba(255,255,255,0.75)',
                                            borderRadius: '4px 16px 16px 16px',
                                        } : {
                                            background: 'rgba(139,92,246,0.2)',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            color: '#c4b5fd',
                                            borderRadius: '16px 4px 16px 16px',
                                        }}
                                    >
                                        {msg.content}
                                        {msg.executed_code && (
                                            <button
                                                onClick={() => setViewingCode(msg.executed_code!)}
                                                className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all w-fit"
                                                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.25)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')}
                                            >
                                                <Code className="w-3 h-3" /> View code
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick actions */}
                    <div
                        className="px-4 py-2 flex-shrink-0"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div className="flex gap-2 overflow-x-auto py-1">
                            {QUICK_ACTIONS.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(action.prompt)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.48)',
                                    }}
                                    title={action.description}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(139,92,246,0.14)';
                                        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.28)';
                                        e.currentTarget.style.color = '#c4b5fd';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.48)';
                                    }}
                                >
                                    <action.icon className="w-3 h-3" />
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <div
                        className="px-4 pb-4 pt-3 flex-shrink-0"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={e => { setPrompt(e.target.value); adjustTextareaHeight(); }}
                                onKeyDown={handleKeyDown}
                                name="prompt"
                                placeholder="Ask about your data…"
                                rows={1}
                                className="flex-1 px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all dark-placeholder"
                                style={{
                                    minHeight: '46px',
                                    maxHeight: '120px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#f8fafc',
                                }}
                                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.55)')}
                                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                            <button
                                className="p-3 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                                style={{ background: '#7c3aed', color: '#fff' }}
                                onClick={() => handleSend()}
                                disabled={prompt.trim().length <= 3}
                                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = '#6d28d9'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.45)'; } }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── FAB trigger ────────────────────────────────────── */}
                <button
                    onClick={() => onOpenChange?.(!isOpen)}
                    className={`pointer-events-auto flex items-center gap-2.5 px-5 py-3 rounded-full font-semibold text-sm transition-all duration-300 cursor-pointer fab-glow ${isOpen
                        ? 'opacity-0 scale-90 pointer-events-none translate-y-2'
                        : 'opacity-100 scale-100 translate-y-0'
                    }`}
                    style={{
                        background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                        color: '#fff',
                    }}
                >
                    <Sparkles className="w-4 h-4" />
                    Ask MyCuery
                </button>
            </div>

            {/* ── Code modal ─────────────────────────────────────────── */}
            {viewingCode && (
                <div
                    className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${viewingCode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    <div
                        className="absolute inset-0"
                        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setViewingCode(null)}
                    />
                    <div
                        className="relative w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] rounded-2xl"
                        style={{
                            background: '#0d0d14',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                        }}
                    >
                        <div
                            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="p-2 rounded-xl"
                                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)' }}
                                >
                                    <Code className="w-4 h-4" style={{ color: '#a78bfa' }} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm" style={{ color: '#f8fafc' }}>Transformation Code</h3>
                                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Python Logic</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingCode(null)}
                                className="p-1.5 rounded-lg transition-all"
                                style={{ color: 'rgba(255,255,255,0.35)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#f8fafc'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6" style={{ background: '#09090f' }}>
                            <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap" style={{ color: '#e2e8f0' }}>
                                <code>{viewingCode}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

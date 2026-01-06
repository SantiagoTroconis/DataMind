import { useState, useRef, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { type Data } from 'plotly.js';
import { Sparkles, X, Send, Bot, User, Code, BarChart, Type } from 'lucide-react';
import type { Message } from '../Pages/Dashboard';

interface ChatBoxProps {
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    appState?: string;
    setAppState?: (state: string) => void;
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
        description: "Identify and remove duplicate rows and handle missing values."
    },
    {
        icon: BarChart,
        label: 'Quick Stats',
        prompt: "Provide a summary of the numerical columns and tell me the most frequent value in categorical columns.",
        description: "Get a summary of numerical columns and frequent values."
    },
    {
        icon: Type,
        label: 'Standardize',
        prompt: "Make all column names lowercase and replace spaces with underscores.",
        description: "Standardize column names to lowercase with underscores."
    }
];

const generateCsvFile = (columns: string[], rows: Record<string, unknown>[]): File => {
    const processValue = (val: unknown) => {
        if (val === null || val === undefined) return '';
        return `"${String(val).replace(/"/g, '""')}"`;
    };

    const header = columns.map(c => processValue(c)).join(',');
    const body = rows.map(row =>
        columns.map(col => processValue(row[col])).join(',')
    ).join('\n');

    // Add BOM for better Excel compatibility just in case, though usually optional
    const BOM = '\uFEFF';
    const content = `${BOM}${header}\n${body}`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    return new File([blob], 'modified_data.csv', { type: 'text/csv' });
};

export function ChatBox({ isOpen = false, onOpenChange, setAppState, file, onUpdateFile, onUpdateGrid, onChartGenerated, messages, setMessages, sessionId }: ChatBoxProps) {
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
            timestamp: new Date()
        };

        setMessages([...messages, userMsg]);

        // Close chat and show loading
        onOpenChange?.(false);
        setAppState?.('result');

        try {
            const formData = new FormData();

            formData.append('prompt', contentToSend);
            if (file) {
                formData.append('file', file);
            }

            if (sessionId) {
                formData.append('session_id', sessionId);
            }

            const response = await fetch('http://localhost:5000/excel/transform', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const textResponse = await response.text();
            const sanitizedResponse = textResponse.replace(/:\s*NaN/g, ': null');
            const data = JSON.parse(sanitizedResponse);



            if (data.status === 'success') {
                if (data.type === 'chart' && onChartGenerated) {
                    onChartGenerated(data.chart_data);
                } else if (data.data && onUpdateGrid) {
                    onUpdateGrid(data.data);

                    if (onUpdateFile) {
                        const newFile = generateCsvFile(data.data.columns, data.data.rows);
                        onUpdateFile(newFile);
                    }
                }

                // Add success message
                const assistantMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.explanation,
                    timestamp: new Date(),
                    executed_code: data.executed_code
                };
                setMessages(prev => [...prev, assistantMsg]);
            }
            // Restore view state
            setAppState?.('view');
            onOpenChange?.(true);
            setPrompt('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch (error) {
            console.error('Error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Lo siento, hubo un error al procesar tu solicitud.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
            setAppState?.('view');
            setPrompt('')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => onOpenChange?.(false)}
            />

            {/* Chat Container - Aligned Bottom Right */}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end w-full max-w-[500px] pointer-events-none">
                <div
                    className={`w-full bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) pointer-events-auto origin-bottom mb-4 ${isOpen
                        ? 'h-[600px] opacity-100 scale-100 translate-y-0'
                        : 'h-0 opacity-0 scale-95 translate-y-4'
                        }`}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-900 text-sm">DataMind Assistant</h3>
                                <p className="text-xs text-zinc-500">AI Data Analyst</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onOpenChange?.(false)}
                            className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="p-6 h-[calc(100%-190px)] overflow-y-auto space-y-6 bg-zinc-50/50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'assistant' ? 'bg-indigo-100' : 'bg-zinc-200'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <Bot className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                        <User className="w-4 h-4 text-zinc-500" />
                                    )}
                                </div>
                                <div className={`space-y-1 max-w-[85%] ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                                    <div className={`p-4 rounded-2xl shadow-sm border text-sm leading-relaxed ${msg.role === 'assistant'
                                        ? 'bg-white rounded-tl-none border-zinc-100 text-zinc-600'
                                        : 'bg-zinc-900 rounded-tr-none border-transparent text-white'
                                        }`}>
                                        {msg.content}
                                        {msg.executed_code && (
                                            <button
                                                onClick={() => setViewingCode(msg.executed_code!)}
                                                className="mt-3 flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors w-fit group"
                                            >
                                                <Code className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    {/* <span className={`text-[10px] text-zinc-400 ${msg.role === 'user' ? 'pr-1' : 'pl-1'}`}>
                                        {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span> */}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Config */}
                    <div className="px-4 pb-2 bg-white">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
                            {QUICK_ACTIONS.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(action.prompt)}
                                    className="group flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 hover:border-indigo-200 hover:bg-indigo-50 rounded-full text-xs font-medium text-zinc-600 hover:text-indigo-700 transition-all whitespace-nowrap flex-shrink-0"
                                    title={action.description}
                                >
                                    <action.icon className="w-3 h-3 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-100">
                        <div className="relative flex items-center gap-2">
                            <textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => {
                                    setPrompt(e.target.value);
                                    adjustTextareaHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                name="prompt"
                                placeholder="Ask about your data..."
                                rows={1}
                                className="w-full pl-4 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all text-sm resize-none scrollbar-hide"
                                style={{ minHeight: '46px', maxHeight: '120px' }}
                            />
                            <button
                                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleSend()}
                                disabled={prompt.trim().length <= 3}
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Trigger */}

                <button
                    onClick={() => onOpenChange?.(!isOpen)}
                    className={`pointer-events-auto group flex items-center justify-center w-10 h-10 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-400 hover:text-zinc-900 rounded-full shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${isOpen ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
                        }`}
                >
                    <Code className="w-5 h-5" />
                </button>
            </div>

            {/* Code Modal */}
            {viewingCode && (
                <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${viewingCode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setViewingCode(null)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Code className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 text-sm">Transformation Code</h3>
                                    <p className="text-xs text-zinc-500">Python Logic</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingCode(null)}
                                className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-6">
                            <pre className="text-sm font-mono text-zinc-100 leading-relaxed whitespace-pre-wrap font-ligatures-none">
                                <code>{viewingCode}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

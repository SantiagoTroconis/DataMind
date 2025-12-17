import { useState, useRef, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Sparkles, X, Send, Paperclip, Bot, User, Code } from 'lucide-react';
import type { Message } from '../Pages/App';

interface ChatBoxProps {
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    appState?: string;
    setAppState?: (state: string) => void;
    file?: File | null;
    onUpdateGrid?: (data: { columns: string[], rows: any[] }) => void;
    onUpdateFile?: (file: File) => void;
    messages: Message[];
    setMessages: Dispatch<SetStateAction<Message[]>>;
}

const generateCsvFile = (columns: string[], rows: any[]): File => {
    const processValue = (val: any) => {
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

export function ChatBox({ isOpen = false, onOpenChange, appState, setAppState, file, onUpdateFile, onUpdateGrid, messages, setMessages }: ChatBoxProps) {
    const [prompt, setPrompt] = useState('');
    const [viewingCode, setViewingCode] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

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

    const handleSend = async () => {
        if (prompt.trim().length <= 3) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: prompt,
            timestamp: new Date()
        };

        setMessages([...messages, userMsg]);
        
        // Close chat and show loading
        onOpenChange?.(false);
        setAppState?.('result');

        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            if (file) {
                formData.append('file', file);
            }

            const response = await fetch('http://localhost:5000/excel/transform', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const textResponse = await response.text();
            const sanitizedResponse = textResponse.replace(/:\s*NaN/g, ': null');
            const data = JSON.parse(sanitizedResponse);

            if (data.status === 'success' && data.data && onUpdateGrid) {
                onUpdateGrid(data.data);
                
                if (onUpdateFile) {
                    const newFile = generateCsvFile(data.data.columns, data.data.rows);
                    onUpdateFile(newFile);
                }

                // Add success message
                const assistantMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'He actualizado la tabla de datos.',
                    timestamp: new Date(),
                    executed_code: data.executed_code
                };
                setMessages(prev => [...prev, assistantMsg]);
            }
            // Restore view state
            setAppState?.('view');
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

            {/* Chat Container - Centered Bottom */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center w-full max-w-2xl px-4 pointer-events-none">
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
                    <div ref={scrollRef} className="p-6 h-[calc(100%-140px)] overflow-y-auto space-y-6 bg-zinc-50/50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                                    msg.role === 'assistant' ? 'bg-indigo-100' : 'bg-zinc-200'
                                }`}>
                                    {msg.role === 'assistant' ? (
                                        <Bot className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                        <User className="w-4 h-4 text-zinc-500" />
                                    )}
                                </div>
                                <div className={`space-y-1 max-w-[85%] ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                                    <div className={`p-4 rounded-2xl shadow-sm border text-sm leading-relaxed ${
                                        msg.role === 'assistant' 
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
                                                View Python Code
                                            </button>
                                        )}
                                    </div>
                                    <span className={`text-[10px] text-zinc-400 ${msg.role === 'user' ? 'pr-1' : 'pl-1'}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
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
                                onClick={handleSend}
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
                    className={`pointer-events-auto group flex items-center gap-3 px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full shadow-lg shadow-zinc-900/20 hover:shadow-xl hover:shadow-zinc-900/30 hover:-translate-y-0.5 transition-all duration-300 ${isOpen ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
                        }`}
                >
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium text-sm">Ask DataMind</span>
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

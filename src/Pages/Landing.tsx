import { Link } from 'react-router-dom';
import {
    ArrowRight, Upload, MessageSquare, Download,
    Zap, Shield, Database, BarChart3, Brain, CheckCircle,
} from 'lucide-react';
import { Navbar } from '../Components/Navbar';
import { Footer } from '../Components/Footer';
import { ParticleCanvas } from '../Components/ParticleCanvas';
import { useState, useEffect, useRef } from 'react';

// ─── Typewriter hook ─────────────────────────────────────────────────────────
const PHRASES = ['business analysts', 'finance managers', 'marketing teams', 'operations leads', 'everyone'];

function useTypewriter(phrases: string[], speed = 72, deleteSpeed = 38, pauseMs = 2200) {
    const [text, setText] = useState('');
    const [phraseIdx, setPhraseIdx] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        const phrase = phrases[phraseIdx];
        if (!deleting) {
            if (text.length < phrase.length) {
                timerRef.current = setTimeout(() => setText(phrase.slice(0, text.length + 1)), speed);
            } else {
                timerRef.current = setTimeout(() => setDeleting(true), pauseMs);
            }
        } else {
            if (text.length > 0) {
                timerRef.current = setTimeout(() => setText(phrase.slice(0, text.length - 1)), deleteSpeed);
            } else {
                setDeleting(false);
                setPhraseIdx(i => (i + 1) % phrases.length);
            }
        }
        return () => clearTimeout(timerRef.current);
    }, [text, deleting, phraseIdx, phrases, speed, deleteSpeed, pauseMs]);

    return text;
}

// ─── Scroll-reveal component ─────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.12 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0px)' : 'translateY(28px)',
            }}
        >
            {children}
        </div>
    );
}

// ─── Live demo data ───────────────────────────────────────────────────────────
const DEMO_QUERY = 'Sum all values in column B';
const DEMO_REPLY = 'Done! Added =SUM(B2:B8) to B9. Total: $48,250.';

const SHEET_ROWS = [
    ['Product', 'Revenue'],
    ['Alpha',   '$8,200' ],
    ['Beta',    '$11,400'],
    ['Gamma',   '$6,750' ],
    ['Delta',   '$9,100' ],
    ['Epsilon', '$7,800' ],
    ['Zeta',    '$5,000' ],
];

// ─── Animated in-hero demo window ────────────────────────────────────────────
function LiveDemo() {
    // phase: 0=idle  1=user-typing  2=user-sent  3=ai-thinking  4=ai-done
    const [phase, setPhase] = useState(0);
    const [typed, setTyped] = useState('');

    useEffect(() => {
        let timers: ReturnType<typeof setTimeout>[] = [];
        let interval: ReturnType<typeof setInterval> | null = null;

        const t = (fn: () => void, ms: number) => {
            const id = setTimeout(fn, ms);
            timers.push(id);
        };

        const cleanup = () => {
            timers.forEach(clearTimeout);
            timers = [];
            if (interval) { clearInterval(interval); interval = null; }
        };

        function cycle() {
            cleanup();
            setPhase(0);
            setTyped('');

            t(() => {
                setPhase(1);
                let i = 0;
                interval = setInterval(() => {
                    i++;
                    setTyped(DEMO_QUERY.slice(0, i));
                    if (i >= DEMO_QUERY.length) {
                        clearInterval(interval!); interval = null;
                        t(() => setPhase(2), 480);
                        t(() => setPhase(3), 860);
                        t(() => setPhase(4), 2100);
                        t(cycle, 5800);
                    }
                }, 54);
            }, 1300);
        }

        cycle();
        return cleanup;
    }, []);

    const done = phase === 4;
    const thinking = phase === 3;

    return (
        <div
            className="rounded-2xl overflow-hidden border border-white/10"
            style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(8px)' }}
        >
            {/* Chrome bar */}
            <div
                className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08]"
                style={{ background: 'rgba(255,255,255,0.03)' }}
            >
                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="w-3 h-3 rounded-full bg-yellow-400/50" />
                <span className="w-3 h-3 rounded-full bg-green-500/50" />
                <span className="ml-3 font-mono text-xs text-white/30">MyCuery — sales_report.xlsx</span>
            </div>

            <div className="flex" style={{ height: '290px' }}>
                {/* Spreadsheet panel */}
                <div className="flex-1 p-4 border-r border-white/[0.08] overflow-hidden">
                    <table className="w-full text-xs border-collapse">
                        <tbody>
                            {SHEET_ROWS.map((row, ri) => (
                                <tr key={ri}>
                                    {row.map((cell, ci) => (
                                        <td
                                            key={ci}
                                            className="px-2.5 py-1.5 border border-white/[0.06]"
                                            style={{
                                                color: ri === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.65)',
                                                background: ri === 0 ? 'rgba(255,255,255,0.025)' : 'transparent',
                                                fontWeight: ri === 0 ? 600 : 400,
                                            }}
                                        >
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {/* Sum row — lights up on phase 4 */}
                            <tr>
                                <td className="px-2.5 py-1.5 border border-white/[0.06] text-xs"
                                    style={{ color: 'rgba(255,255,255,0.45)' }}>
                                    Total
                                </td>
                                <td
                                    className="px-2.5 py-1.5 border text-xs font-bold"
                                    style={{
                                        transition: 'all 0.6s ease',
                                        borderColor: done ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.06)',
                                        background: done ? 'rgba(251,191,36,0.08)' : 'transparent',
                                        color: done ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                                    }}
                                >
                                    {done ? '$48,250' : '—'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Chat panel */}
                <div className="w-56 p-3 flex flex-col gap-2 justify-end overflow-hidden">
                    {/* AI greeting */}
                    <div
                        className="self-start max-w-[92%] rounded-2xl rounded-tl-sm px-3 py-2 text-xs leading-relaxed"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}
                    >
                        Hi! What would you like to do with your data?
                    </div>

                    {/* User message */}
                    {phase >= 1 && (
                        <div
                            className="self-end max-w-[92%] rounded-2xl rounded-tr-sm px-3 py-2 text-xs leading-relaxed"
                            style={{
                                background: 'rgba(139,92,246,0.18)',
                                border: '1px solid rgba(139,92,246,0.25)',
                                color: '#c4b5fd',
                            }}
                        >
                            {typed}{phase === 1 && <span className="animate-pulse">|</span>}
                        </div>
                    )}

                    {/* AI response */}
                    {(thinking || done) && (
                        <div
                            className="self-start max-w-[92%] rounded-2xl rounded-tl-sm px-3 py-2 text-xs leading-relaxed"
                            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}
                        >
                            {thinking ? (
                                <span className="flex items-center gap-1">
                                    {[0, 150, 300].map(d => (
                                        <span
                                            key={d}
                                            className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                                            style={{ animationDelay: `${d}ms` }}
                                        />
                                    ))}
                                </span>
                            ) : DEMO_REPLY}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Landing() {
    const currentPhrase = useTypewriter(PHRASES);

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#0a0a10', color: '#f1f5f9' }}>
            <Navbar dark />

            <main className="flex-grow">

                {/* ══════════════════════════════ HERO ══════════════════════════════ */}
                <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
                    <ParticleCanvas />

                    {/* Ambient orbs — deep violet + indigo, very diffuse */}
                    <div
                        className="orb-drift absolute pointer-events-none"
                        style={{
                            top: '18%', left: '12%',
                            width: '520px', height: '520px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(109,40,217,0.18), transparent 70%)',
                            filter: 'blur(48px)',
                        }}
                    />
                    <div
                        className="orb-drift-2 absolute pointer-events-none"
                        style={{
                            bottom: '20%', right: '10%',
                            width: '420px', height: '420px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(37,99,235,0.14), transparent 70%)',
                            filter: 'blur(60px)',
                        }}
                    />
                    <div
                        className="orb-drift-3 absolute pointer-events-none"
                        style={{
                            top: '55%', left: '50%',
                            width: '300px', height: '300px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 70%)',
                            filter: 'blur(50px)',
                        }}
                    />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                            {/* LEFT: Copy */}
                            <div>
                                {/* Badge */}
                                <div
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8"
                                    style={{
                                        border: '1px solid rgba(139,92,246,0.35)',
                                        background: 'rgba(139,92,246,0.1)',
                                        color: '#c4b5fd',
                                    }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                                    AI-powered Excel intelligence
                                </div>

                                {/* Headline */}
                                <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] font-bold tracking-tight leading-[1.05] mb-5">
                                    <span style={{ color: '#f8fafc' }}>Talk to your</span>
                                    <br />
                                    <span className="shimmer-text">spreadsheets.</span>
                                </h1>

                                <p className="text-lg mb-4 leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                    MyCuery turns natural language into precise Excel edits.
                                    No formulas, no frustration — just results.
                                </p>

                                {/* Typewriter line */}
                                <div className="flex items-center gap-2 mb-10 text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                    <span>Built for</span>
                                    <span className="font-semibold text-violet-400 min-w-[200px]">
                                        {currentPhrase}
                                        <span className="animate-pulse">|</span>
                                    </span>
                                </div>

                                {/* CTAs */}
                                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                                    <Link
                                        to="/auth"
                                        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all duration-200 active:scale-95"
                                        style={{
                                            background: '#7c3aed',
                                            color: '#fff',
                                            boxShadow: '0 0 0 0 rgba(124,58,237,0)',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,58,237,0.35)')}
                                        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 0 rgba(124,58,237,0)')}
                                    >
                                        Start for Free <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <a
                                        href="#how-it-works"
                                        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all duration-200"
                                        style={{
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'rgba(255,255,255,0.65)',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        See how it works
                                    </a>
                                </div>

                                {/* Trust badges */}
                                <div className="flex flex-wrap gap-5 text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
                                    {['No credit card', 'Free tier available', 'Up to 10 MB'].map(item => (
                                        <span key={item} className="flex items-center gap-1.5">
                                            <CheckCircle className="w-3.5 h-3.5 text-violet-500" />
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT: App demo */}
                            <div className="relative">
                                {/* Glow behind the window */}
                                <div
                                    className="absolute -inset-8 pointer-events-none"
                                    style={{
                                        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(109,40,217,0.15), transparent)',
                                        borderRadius: '50%',
                                    }}
                                />
                                <LiveDemo />
                            </div>
                        </div>
                    </div>

                    {/* Scroll hint */}
                    <div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
                        style={{ color: 'rgba(255,255,255,0.18)', fontSize: '10px', letterSpacing: '0.1em' }}
                    >
                        <span>SCROLL</span>
                        <div
                            className="w-px h-8"
                            style={{
                                background: 'linear-gradient(to bottom, rgba(139,92,246,0.5), transparent)',
                                animation: 'scroll-hint 2s ease-in-out infinite',
                            }}
                        />
                    </div>
                </section>

                {/* ═══════════════════════════ STATS STRIP ══════════════════════════ */}
                <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {[
                                { value: '10K+',  label: 'Files Analyzed' },
                                { value: '< 2s',  label: 'Avg Response Time' },
                                { value: '99.9%', label: 'Uptime' },
                                { value: 'Free',  label: 'To Get Started' },
                            ].map((stat, i) => (
                                <Reveal key={i} delay={i * 90}>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-3xl font-bold" style={{ color: '#f8fafc' }}>{stat.value}</span>
                                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>{stat.label}</span>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════ HOW IT WORKS ══════════════════════════ */}
                <section id="how-it-works" className="py-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <Reveal className="text-center mb-20">
                            <span
                                className="text-sm font-semibold uppercase tracking-widest"
                                style={{ color: '#a78bfa' }}
                            >
                                How it works
                            </span>
                            <h2
                                className="text-4xl sm:text-5xl font-bold mt-3 mb-4 tracking-tight"
                                style={{ color: '#f8fafc' }}
                            >
                                Three steps. That's it.
                            </h2>
                            <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.38)' }}>
                                From raw spreadsheet to clean result in seconds. No training needed.
                            </p>
                        </Reveal>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                            {/* Connecting line between cards */}
                            <div
                                className="hidden md:block absolute"
                                style={{
                                    top: '52px',
                                    left: 'calc(16.67% + 24px)',
                                    right: 'calc(16.67% + 24px)',
                                    height: '1px',
                                    background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent)',
                                }}
                            />

                            {[
                                {
                                    Icon: Upload,
                                    num: '01',
                                    title: 'Upload your file',
                                    desc: 'Drop any .xlsx or .xls file. MyCuery reads every sheet instantly — no config required.',
                                },
                                {
                                    Icon: MessageSquare,
                                    num: '02',
                                    title: 'Chat naturally',
                                    desc: '"Fix column C," "Add a SUM to row 10," "Highlight negatives." Just describe the change.',
                                },
                                {
                                    Icon: Download,
                                    num: '03',
                                    title: 'Download & done',
                                    desc: 'Changes apply to your actual file. Download the updated .xlsx with a single click.',
                                },
                            ].map(({ Icon, num, title, desc }, i) => (
                                <Reveal key={i} delay={i * 130}>
                                    <div className="glass-card rounded-2xl p-8 text-center h-full">
                                        <div className="relative mx-auto mb-6" style={{ width: 56, height: 56 }}>
                                            <div
                                                className="absolute inset-0 rounded-full"
                                                style={{
                                                    background: 'rgba(139,92,246,0.08)',
                                                    border: '1px solid rgba(139,92,246,0.22)',
                                                }}
                                            />
                                            <Icon
                                                className="absolute inset-0 m-auto"
                                                style={{ width: 22, height: 22, color: '#a78bfa' }}
                                            />
                                            <span
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                                style={{ background: '#7c3aed', color: '#fff' }}
                                            >
                                                {i + 1}
                                            </span>
                                        </div>
                                        <div
                                            className="font-mono text-[11px] mb-2"
                                            style={{ color: 'rgba(167,139,250,0.6)' }}
                                        >
                                            {num}
                                        </div>
                                        <h3
                                            className="text-base font-bold mb-3"
                                            style={{ color: '#f8fafc' }}
                                        >
                                            {title}
                                        </h3>
                                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                                            {desc}
                                        </p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════ FEATURES ═══════════════════════════ */}
                <section className="py-32 grid-overlay">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <Reveal className="text-center mb-20">
                            <span
                                className="text-sm font-semibold uppercase tracking-widest"
                                style={{ color: '#a78bfa' }}
                            >
                                Features
                            </span>
                            <h2
                                className="text-4xl sm:text-5xl font-bold mt-3 tracking-tight"
                                style={{ color: '#f8fafc' }}
                            >
                                Built for real work.
                            </h2>
                        </Reveal>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[
                                {
                                    Icon: Brain,
                                    title: 'Natural Language Edits',
                                    desc: 'Describe changes the way you think. MyCuery figures out cells, formulas, and ranges automatically.',
                                },
                                {
                                    Icon: Zap,
                                    title: 'Instant Execution',
                                    desc: 'Changes apply directly to your file on the server. No copy-paste, no re-upload necessary.',
                                },
                                {
                                    Icon: BarChart3,
                                    title: 'Live Grid Preview',
                                    desc: 'Watch your spreadsheet update in real time inside the browser. Review before you download.',
                                },
                                {
                                    Icon: Shield,
                                    title: 'Secure by Design',
                                    desc: 'Your files run inside a sandboxed environment. AI-generated code has zero filesystem access.',
                                },
                                {
                                    Icon: Database,
                                    title: 'Persistent Sessions',
                                    desc: 'Every conversation is saved. Resume where you left off, or undo any change instantly.',
                                },
                                {
                                    Icon: MessageSquare,
                                    title: 'Multi-model AI',
                                    desc: 'Powered by state-of-the-art LLMs routed through LiteLLM. Accurate context every time.',
                                },
                            ].map(({ Icon, title, desc }, i) => (
                                <Reveal key={i} delay={i * 70}>
                                    <div className="glass-card rounded-2xl p-6 h-full">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                            style={{
                                                background: 'rgba(139,92,246,0.08)',
                                                border: '1px solid rgba(139,92,246,0.18)',
                                            }}
                                        >
                                            <Icon style={{ width: 18, height: 18, color: '#a78bfa' }} />
                                        </div>
                                        <h3
                                            className="text-base font-bold mb-2"
                                            style={{ color: '#f8fafc' }}
                                        >
                                            {title}
                                        </h3>
                                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                                            {desc}
                                        </p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════ CTA ════════════════════════════════ */}
                <section className="py-36 relative overflow-hidden">
                    {/* Background glow */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse 75% 55% at 50% 50%, rgba(109,40,217,0.16), transparent)',
                        }}
                    />
                    {/* Faint grid */}
                    <div className="absolute inset-0 grid-overlay pointer-events-none opacity-60" />

                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <Reveal>
                            <h2
                                className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight"
                                style={{ color: '#f8fafc' }}
                            >
                                Your data is trying<br />to tell you something.
                            </h2>
                            <p className="text-lg mb-10 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.38)' }}>
                                Start a conversation with it. MyCuery makes every spreadsheet a two-way exchange.
                            </p>
                            <Link
                                to="/auth"
                                className="inline-flex items-center gap-2 px-9 py-4 rounded-xl font-bold text-lg transition-all duration-200 active:scale-95"
                                style={{ background: '#7c3aed', color: '#fff' }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 16px 50px rgba(124,58,237,0.4)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                Get Started Free <ArrowRight className="w-5 h-5" />
                            </Link>
                            <p className="mt-5 text-sm" style={{ color: 'rgba(255,255,255,0.22)' }}>
                                No credit card required · Cancel anytime
                            </p>
                        </Reveal>
                    </div>
                </section>
            </main>

            <Footer dark />
        </div>
    );
}

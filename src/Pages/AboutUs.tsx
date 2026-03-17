import { Navbar } from '../Components/Navbar';
import { Footer } from '../Components/Footer';
import { Users, Heart, Lightbulb, ArrowRight } from 'lucide-react';
import { ParticleCanvas } from '../Components/ParticleCanvas';
import { useRef, useState, useEffect } from 'react';

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} className={className} style={{ transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)' }}>
            {children}
        </div>
    );
}

export default function AboutUs() {
    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#0a0a10', color: '#f1f5f9' }}>
            <Navbar dark />
            <main className="flex-grow">
                {/* Hero */}
                <section className="relative py-32 pt-40 overflow-hidden">
                    <ParticleCanvas count={50} connectDist={110} />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(109,40,217,0.12), transparent)' }} />
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <Reveal>
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8" style={{ border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.1)', color: '#c4b5fd' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                                Our Story
                            </div>
                            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight" style={{ color: '#f8fafc' }}>
                                Democratizing data<br />
                                <span className="shimmer-text">for everyone.</span>
                            </h1>
                            <p className="text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                We believe that understanding your data shouldn't require a PhD. It should be as simple as having a conversation.
                            </p>
                        </Reveal>
                    </div>
                </section>

                {/* Story */}
                <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-28">
                            {/* Visual left */}
                            <Reveal className="relative order-2 lg:order-1">
                                <div className="aspect-square rounded-3xl overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="grid grid-cols-2 gap-4 opacity-40">
                                            {[
                                                'rgba(139,92,246,0.3)',
                                                'rgba(255,255,255,0.08)',
                                                'rgba(255,255,255,0.04)',
                                                'rgba(124,58,237,0.25)',
                                            ].map((bg, i) => (
                                                <div key={i} className="w-20 h-20 rounded-2xl" style={{ background: bg, border: '1px solid rgba(255,255,255,0.08)' }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* Floating card */}
                                <div
                                    className="absolute -bottom-10 -right-6 p-5 rounded-2xl max-w-xs hidden md:block"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                                            <Users className="w-4 h-4" style={{ color: '#a78bfa' }} />
                                        </div>
                                        <span className="font-bold text-sm" style={{ color: '#f8fafc' }}>Community Driven</span>
                                    </div>
                                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>Built with input from thousands of real data users.</p>
                                </div>
                            </Reveal>

                            {/* Text right */}
                            <Reveal className="space-y-8 order-1 lg:order-2" delay={100}>
                                <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#f8fafc' }}>Our Story</h2>
                                <div className="space-y-5 text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    <p>It started with a simple observation: data tools are broken. Either too simple to be useful, or too complex for normal people to use.</p>
                                    <p>We watched friends, business owners, and students struggle with complex formulas and confusing interfaces just to answer basic questions.</p>
                                    <p>So we built MyCuery. A tool that listens, understands your questions, and helps you find the answers you need — simply and beautifully.</p>
                                </div>
                                <button
                                    className="flex items-center gap-2 font-semibold transition-all hover:gap-3 duration-200"
                                    style={{ color: '#a78bfa' }}
                                >
                                    Join our journey <ArrowRight className="w-4 h-4" />
                                </button>
                            </Reveal>
                        </div>

                        {/* Values */}
                        <Reveal className="text-center mb-14">
                            <h2 className="text-2xl font-bold" style={{ color: '#f8fafc' }}>Core Values</h2>
                        </Reveal>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {[
                                { Icon: Heart, title: 'Simplicity', desc: "We work hard to make things easy. If it needs a manual, it's too complicated." },
                                { Icon: Lightbulb, title: 'Innovation', desc: 'We constantly push the boundaries of what AI can do for personal analytics.' },
                                { Icon: Users, title: 'Community', desc: 'We build for you. Your feedback shapes everything we do, every single day.' },
                            ].map(({ Icon, title, desc }, i) => (
                                <Reveal key={i} delay={i * 100}>
                                    <div className="glass-card rounded-2xl p-8 h-full">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                            <Icon className="w-5 h-5" style={{ color: '#a78bfa' }} />
                                        </div>
                                        <h3 className="text-lg font-bold mb-3" style={{ color: '#f8fafc' }}>{title}</h3>
                                        <p className="leading-relaxed text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer dark />
        </div>
    );
}

import { useNavigate } from "react-router-dom";
import { MoveLeft, Terminal } from "lucide-react";
import { ParticleCanvas } from "../Components/ParticleCanvas";
import { useState, useEffect } from "react";

export const NotFound = () => {
    const navigate = useNavigate();
    const [blink, setBlink] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => setBlink(b => !b), 530);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a0a10', color: '#f8fafc' }}>
            <ParticleCanvas count={45} connectDist={100} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(109,40,217,0.1), transparent)' }} />

            <div className="relative z-10 text-center max-w-lg w-full px-4">
                {/* Terminal icon */}
                <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <Terminal className="w-9 h-9" style={{ color: '#a78bfa' }} />
                    </div>
                </div>

                {/* Terminal-style error lines */}
                <div
                    className="rounded-2xl p-6 mb-8 text-left font-mono text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="w-3 h-3 rounded-full bg-red-500/50" />
                        <span className="w-3 h-3 rounded-full bg-yellow-400/50" />
                        <span className="w-3 h-3 rounded-full bg-green-500/50" />
                        <span className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>MyCuery — shell</span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.35)' }}>$ <span style={{ color: '#a78bfa' }}>query</span> <span style={{ color: 'rgba(255,255,255,0.5)' }}>--path /this/route</span></div>
                    <div className="mt-2" style={{ color: '#f87171' }}>✗ ERROR 404: No data node found at this path</div>
                    <div className="mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>  Route may have been removed or never existed.</div>
                    <div className="mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>  Try navigating to a known endpoint.</div>
                    <div className="mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        $ <span style={{ opacity: blink ? 1 : 0 }}>█</span>
                    </div>
                </div>

                <h1 className="text-7xl font-bold mb-2 tracking-tighter" style={{ color: '#f8fafc' }}>404</h1>
                <p className="text-base mb-10" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    This page doesn't exist in our data universe.
                </p>

                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200"
                        style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >
                        <MoveLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 rounded-xl font-medium transition-all duration-200"
                        style={{ background: '#7c3aed', color: '#fff' }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,58,237,0.4)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
};

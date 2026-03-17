import { useEffect, useState } from "react";
import { Register } from "./Register";
import { toast, Toaster } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ParticleCanvas } from "../Components/ParticleCanvas";
import { CheckCircle } from 'lucide-react';

export const Auth = () => {
    const [view, setView] = useState<'login' | 'register'>('login');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionExpired = searchParams.get('expired') === '1';
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('user');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error((err as { error?: string }).error || 'Login failed');
            }

            const data = await response.json();
            console.log(data);

            toast.success('Login successful');

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            }

        } catch (e) {
            console.error(e);
            toast.error(e instanceof Error ? e.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    if (view === 'register') {
        return <Register onSwitchToLogin={() => setView('login')} />;
    }

    return (
        <>
            <Toaster position="top-center" richColors />
            <div className="min-h-screen flex overflow-hidden" style={{ background: '#0a0a10' }}>
                {/* Left – branding */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12" style={{ background: '#0d0d14' }}>
                    <ParticleCanvas count={55} connectDist={120} />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 30% 50%, rgba(109,40,217,0.14), transparent)' }} />
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                                <img src="DataMind_Logo.svg" alt="MyCuery" className="w-6 h-6 object-contain" />
                            </div>
                            <span className="text-xl font-bold" style={{ color: '#f8fafc' }}>MyCuery</span>
                        </div>
                        {/* Main copy */}
                        <div>
                            <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: '#f8fafc' }}>Your data,<br />finally talking back.</h1>
                            <p className="text-base mb-10" style={{ color: 'rgba(255,255,255,0.4)' }}>Ask anything. Get answers. No formulas needed.</p>
                            <div className="space-y-4">
                                {[
                                    'Edit cells in plain English',
                                    'Live spreadsheet preview',
                                    'Secure sandboxed execution',
                                ].map(item => (
                                    <div key={item} className="flex items-center gap-3">
                                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#a78bfa' }} />
                                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 MyCuery Inc. All rights reserved.</p>
                    </div>
                </div>

                {/* Right – form */}
                <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#0a0a10' }}>
                    <div className="w-full max-w-md">
                        {/* Mobile logo */}
                        <div className="lg:hidden flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                                <img src="DataMind_Logo.svg" alt="MyCuery" className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-bold" style={{ color: '#f8fafc' }}>MyCuery</span>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Welcome back</h2>
                            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>Sign in to your MyCuery workspace</p>
                        </div>

                        {sessionExpired && (
                            <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                                Your session expired. Please sign in again.
                            </div>
                        )}

                        <form onSubmit={handleSignIn} className="space-y-5" autoComplete="off">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl outline-none transition"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc' }}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>Password</label>
                                    <a href="#" className="text-sm" style={{ color: '#a78bfa' }}>Forgot password?</a>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl outline-none transition"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc' }}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full font-semibold py-3.5 rounded-xl transition-all duration-200"
                                style={{ background: loading ? 'rgba(124,58,237,0.5)' : '#7c3aed', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,58,237,0.4)'; }}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                            <div className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
                                Don't have an account?{' '}
                                <button type="button" onClick={() => setView('register')} className="font-semibold cursor-pointer" style={{ color: '#a78bfa' }}>Sign up</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

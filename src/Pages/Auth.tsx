import { useEffect, useState } from "react";
import { Register } from "./Register";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";


export const Auth = () => {
    const [view, setView] = useState<'login' | 'register'>('login');
    const navigate = useNavigate();
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
                throw new Error('Network response was not ok');
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
            toast.error('Login failed');
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
            <div className="min-h-screen flex overflow-hidden">
                <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full translate-x-1/3 translate-y-1/3"></div>
                        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-blue-400/20 rounded-full animate-ping"></div>
                        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-blue-400/20 rounded-full animate-ping animation-delay-2000"></div>
                        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-blue-400/20 rounded-full animate-ping animation-delay-4000"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                        <div>
                            <div className="flex items-center gap-3 mb-16">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                    <img src="DataMind_Logo.svg" alt="DataMind" className="w-10 h-10" />
                                </div>
                                <span className="text-xl font-bold">DataMind</span>
                            </div>
                            
                            <div className="space-y-8 max-w-md">
                                <div>
                                    <h1 className="text-4xl font-bold mb-4 leading-tight">Transform your data into insights</h1>
                                    <p className="text-slate-400 text-lg">Enterprise-grade analytics platform trusted by leading companies worldwide.</p>
                                </div>
                                
                                <div className="space-y-6 pt-8">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">Real-time Analytics</h3>
                                            <p className="text-sm text-slate-400">Process and visualize data instantly with our AI-powered engine</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">Enterprise Security</h3>
                                            <p className="text-sm text-slate-400">Bank-level encryption and compliance with global standards</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">Seamless Integration</h3>
                                            <p className="text-sm text-slate-400">Connect with 100+ data sources and tools effortlessly</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-sm text-slate-500">
                            © 2026 DataMind. All rights reserved.
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex-1 flex items-center justify-center p-8 bg-white">
                    <div className="w-full max-w-md">
                        <div className="lg:hidden flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                                <img src="DataMind_Logo.svg" alt="DataMind" className="w-10 h-10 bg-white rounded-lg" />
                            </div>
                            <span className="text-xl font-bold text-slate-900">DataMind</span>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
                        </div>

                        <form onSubmit={handleSignIn} className="space-y-5" autoComplete="off">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-slate-700">Password</label>
                                    <a href="#" className="text-sm text-blue-600 hover:text-blue-700">Forgot password?</a>
                                </div>
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                {loading ? "Signing In..." : "Sign In"}
                            </button>
                            <div className="text-center text-sm text-slate-600">
                                Don't have an account? <button type="button" onClick={() => setView('register')} className="text-blue-600 font-semibold hover:text-blue-700 cursor-pointer">Sign up</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
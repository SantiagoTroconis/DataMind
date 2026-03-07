import { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";

interface RegisterProps {
    onSwitchToLogin: () => void;
}

export const Register = ({ onSwitchToLogin }: RegisterProps) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password') {
            setPasswordError(value.length < 8 && value.length > 0
                ? 'La contraseña debe tener al menos 8 caracteres'
                : null);
        }
        if (name === 'confirmPassword' || name === 'password') {
            const pwd = name === 'password' ? value : formData.password;
            const confirm = name === 'confirmPassword' ? value : formData.confirmPassword;
            setConfirmError(confirm.length > 0 && pwd !== confirm
                ? 'Las contraseñas no coinciden'
                : null);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError(null);
        if (formData.password !== formData.confirmPassword) {
            setConfirmError('Las contraseñas no coinciden');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password }),
            });
            const data = await response.json();
            if (!response.ok) {
                const msg: string = data.error || 'Registration failed';
                if (msg.toLowerCase().includes('registrado') || msg.toLowerCase().includes('email')) {
                    setEmailError(msg);
                } else {
                    toast.error(msg);
                }
                return;
            }
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/dashboard');
        } catch (e) {
            console.error('Register error', e);
            toast.error('Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isDisabled = !formData.email || formData.password.length < 8 || formData.password !== formData.confirmPassword || isLoading;

    return (
        <>
            <Toaster position="top-center" richColors />
            <div className="min-h-screen flex overflow-hidden">
                {/* Left Side - Branding */}
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

                            <div className="space-y-6 max-w-md">
                                <div>
                                    <h1 className="text-4xl font-bold mb-4 leading-tight">Join thousands of data professionals</h1>
                                    <p className="text-slate-400 text-lg">Start your journey with the most powerful data analytics platform.</p>
                                </div>

                                <div className="pt-8 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl font-bold text-blue-400">10M+</div>
                                        <div className="text-sm text-slate-400">Data points<br />processed daily</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl font-bold text-blue-400">500+</div>
                                        <div className="text-sm text-slate-400">Enterprise<br />customers</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl font-bold text-blue-400">99.9%</div>
                                        <div className="text-sm text-slate-400">Uptime<br />guarantee</div>
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
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create your account</h2>
                            <p className="text-slate-600">Start your data journey with DataMind</p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-5" autoComplete="off">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                                />
                                {emailError && (
                                    <p className="text-sm text-red-600 mt-1">{emailError}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                                />
                                {passwordError && (
                                    <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                                )}
                                {!passwordError && (
                                    <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                                />
                                {confirmError && (
                                    <p className="text-sm text-red-600 mt-1">{confirmError}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isDisabled}
                                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md mt-6"
                            >
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </button>

                            <div className="text-center text-sm text-slate-600 mt-8 pt-8 border-t border-slate-200">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={onSwitchToLogin}
                                    className="text-blue-600 font-semibold hover:text-blue-700 cursor-pointer"
                                >
                                    Sign in
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

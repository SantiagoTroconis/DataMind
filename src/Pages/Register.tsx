import { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
import { ParticleCanvas } from "../Components/ParticleCanvas";

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
            <div className="min-h-screen flex overflow-hidden" style={{ background: '#0a0a10' }}>
                {/* Left Side – Branding */}
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
                            <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: '#f8fafc' }}>Join the conversation<br />with your data.</h1>
                            <p className="text-base mb-10" style={{ color: 'rgba(255,255,255,0.4)' }}>Create your workspace and start in minutes.</p>
                            <div className="space-y-6">
                                {[
                                    { value: '10K+', label: 'Files analyzed' },
                                    { value: '< 2s', label: 'Avg response time' },
                                    { value: '99.9%', label: 'Uptime' },
                                ].map(({ value, label }) => (
                                    <div key={label} className="flex items-center gap-4">
                                        <span className="text-3xl font-bold" style={{ color: '#a78bfa' }}>{value}</span>
                                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 MyCuery Inc. All rights reserved.</p>
                    </div>
                </div>

                {/* Right Side – Form */}
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
                            <h2 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Create your account</h2>
                            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>Start your journey with MyCuery</p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-5" autoComplete="off">
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
                                {emailError && (
                                    <p className="text-sm mt-1" style={{ color: '#f87171' }}>{emailError}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>Password</label>
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
                                {passwordError ? (
                                    <p className="text-sm mt-1" style={{ color: '#f87171' }}>{passwordError}</p>
                                ) : (
                                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Must be at least 8 characters</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl outline-none transition"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc' }}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                                />
                                {confirmError && (
                                    <p className="text-sm mt-1" style={{ color: '#f87171' }}>{confirmError}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isDisabled}
                                className="w-full font-semibold py-3.5 rounded-xl transition-all duration-200 mt-6"
                                style={{ background: isDisabled ? 'rgba(124,58,237,0.4)' : '#7c3aed', color: '#fff', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                                onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,58,237,0.4)'; }}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </button>

                            <div className="text-center text-sm mt-8 pt-8" style={{ color: 'rgba(255,255,255,0.38)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={onSwitchToLogin}
                                    className="font-semibold cursor-pointer"
                                    style={{ color: '#a78bfa' }}
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

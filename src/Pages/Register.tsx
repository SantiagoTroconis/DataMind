import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Briefcase, GraduationCap, User, Building2 } from 'lucide-react';
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";

interface RegisterProps {
    onSwitchToLogin: () => void;
}

export const Register = ({ onSwitchToLogin }: RegisterProps) => {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();
    const [passwordError, setPasswordError] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        purpose: ''
    });

    const handleRegister = async () => {

        try {
            const response = await fetch('http://localhost:5000/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    purpose: formData.purpose
                }),
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            toast("Registration successful");

            setTimeout(() => {
                navigate('/auth');
            }, 1000);
        } catch (error) {
            toast("Error during registration:" + error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'password') {

            // 🔹 Si está vacío, no hay error
            if (value.length === 0) {
                setPasswordError(false);
            } else {
                const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
                const isValidLength = value.length >= 7;

                setPasswordError(!(hasSpecialChar && isValidLength));
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePurposeSelect = (purpose: string) => {
        setFormData(prev => ({ ...prev, purpose }));
    };

    const purposes = [
        { id: 'work', label: 'Work', icon: Briefcase, description: 'For my company or business' },
        { id: 'personal', label: 'Personal Project', icon: User, description: 'Building something for myself' },
        { id: 'education', label: 'Education', icon: GraduationCap, description: 'For learning or teaching' },
        { id: 'enterprise', label: 'Enterprise', icon: Building2, description: 'Large scale data operations' },
    ];

    return (
        <>
            <Toaster position="top-center" />
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
                            <p className="text-slate-600">
                                {step === 1 ? "Start your data journey with DataMind" : "Tell us a bit about yourself"}
                            </p>
                        </div>

                        <div className="flex gap-2 mb-8">
                            <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-slate-900' : 'bg-slate-200'}`} />
                            <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-slate-900' : 'bg-slate-200'}`} />
                        </div>

                        <div className="space-y-5">

                            {step === 1 && (
                                <div className="space-y-5">
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
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                        <p className="text-xs text-slate-500 mt-2">Must be at least 8 characters</p>
                                    </div>
                                    {
                                        passwordError && (
                                            <p className="text-sm text-red-600 mt-2">Password must be at least 8 characters long with a special character.</p>
                                        )

                                    }
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={!formData.email || !formData.password || passwordError}
                                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 mt-6"
                                    >
                                        Continue <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5">
                                    <label className="block text-sm font-medium text-slate-700 mb-3">What will you use DataMind for?</label>

                                    <div className="grid grid-cols-1 gap-3">
                                        {purposes.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => handlePurposeSelect(p.id)}
                                                className={`group flex items-center p-4 rounded-lg border text-left transition-all duration-200 ${formData.purpose === p.id
                                                    ? 'border-slate-900 bg-slate-50 shadow-sm'
                                                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-lg mr-4 transition-colors ${formData.purpose === p.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                                    }`}>
                                                    <p.icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-slate-900 text-sm">{p.label}</div>
                                                    <div className="text-xs text-slate-600">{p.description}</div>
                                                </div>
                                                {formData.purpose === p.id && (
                                                    <Check className="w-5 h-5 text-slate-900" />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="px-4 py-3.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleRegister}
                                            disabled={!formData.purpose}
                                            className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            Create Account
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="text-center text-sm text-slate-600 mt-8 pt-8 border-t border-slate-200">
                                Already have an account? <button onClick={onSwitchToLogin} className="text-blue-600 font-semibold hover:text-blue-700 cursor-pointer">Sign in</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

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
                navigate('/');
            }, 1000);
        } catch (error) {
            toast("Error during registration:" + error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-2xl p-10 w-full max-w-md border border-slate-200 transition-all duration-300">

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-lg mb-4">
                            <img src="DataMind_Logo.svg" alt="Logo" className="w-12 h-12 bg-white rounded-lg" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {step === 1 ? "Start your data journey with DataMind" : "Tell us a bit about yourself"}
                        </p>
                    </div>

                    <div className="flex gap-2 mb-8 justify-center">
                        <div className={`h-1.5 w-16 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-slate-900' : 'bg-slate-200'}`} />
                        <div className={`h-1.5 w-16 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-slate-900' : 'bg-slate-200'}`} />
                    </div>

                    <div className="space-y-5">

                        {step === 1 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!formData.email || !formData.password}
                                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2 mt-4"
                                >
                                    Continue <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">What will you use DataMind for?</label>

                                <div className="grid grid-cols-1 gap-3">
                                    {purposes.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => handlePurposeSelect(p.id)}
                                            className={`group flex items-center p-3 rounded-xl border text-left transition-all duration-200 ${formData.purpose === p.id
                                                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-sm'
                                                : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg mr-4 transition-colors ${formData.purpose === p.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700'
                                                }`}>
                                                <p.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-900 text-sm">{p.label}</div>
                                                <div className="text-xs text-slate-500">{p.description}</div>
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
                                        className="px-4 py-3.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleRegister}
                                        disabled={!formData.purpose}
                                        className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition shadow-sm"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="text-center text-sm text-slate-600 mt-6 border-t border-slate-100 pt-6">
                            Already have an account? <button onClick={onSwitchToLogin} className="text-slate-900 font-semibold hover:underline cursor-pointer">Sign in</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

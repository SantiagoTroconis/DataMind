import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Zap, Smile, CheckCircle2, BarChart3, MessageSquare } from 'lucide-react';
import { Navbar } from '../Components/Navbar';
import { Footer } from '../Components/Footer';

export default function Landing() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />

            <main className="flex-grow pt-20">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
                    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 ml-10" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="max-w-2xl">
                                <h1 className="text-5xl sm:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                                    Your data, <br />
                                    <span className="text-slate-500">conversational.</span>
                                </h1>

                                <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                                    Stop wrestling with spreadsheets. Just chat with your data and uncover insights instantly. Built for everyone.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300">
                                    <Link to="/auth" className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 text-white font-semibold text-base hover:bg-slate-800 transition-all hover:shadow-xl hover:shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2">
                                        Start for Free <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <Link to="/about" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-600 font-semibold text-base border border-slate-200 hover:bg-slate-50 transition-all hover:border-slate-300 active:scale-95 text-center">
                                        How it works
                                    </Link>
                                </div>
                                <div className="mt-8 flex items-center gap-4 text-xs text-slate-500 font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
                                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-blue-500" /> No credit card required</span>
                                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Free tier available</span>
                                </div>
                            </div>
                    
                        </div>
                    </div>
                </section>

                {/* Social Proof / Trust */}
                <section className="py-12 border-y border-slate-100 bg-slate-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-m font-semibold text-slate-600 uppercase tracking-widest mb-8">Trusted by data lovers everywhere</p>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-32 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-20">
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 tracking-tight">Powerful simplicity.</h2>
                            <p className="text-lg text-slate-500 leading-relaxed">
                                We've stripped away the complexity of traditional data tools to give you a pure, intuitive experience.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Smile,
                                    title: "No Code Needed",
                                    desc: "Designed to be intuitive enough for anyone to use. No coding or data science degree required."
                                },
                                {
                                    icon: Zap,
                                    title: "Lightning Fast",
                                    desc: "Get answers instantly. Just ask questions in plain language and watch the magic happen."
                                },
                                {
                                    icon: Shield,
                                    title: "Safe & Secure",
                                    desc: "Your data is your own. We prioritize privacy and security so you can analyze with peace of mind."
                                }
                            ].map((feature, idx) => (
                                <div key={idx} className="group p-8 56 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300">
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                                    <p className="text-slate-500 leading-relaxed text-sm">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
                    <div className="max-w-4xl mx-auto px-4 relative text-center">
                        <h2 className="text-4xl sm:text-5xl font-bold mb-8 tracking-tight">Ready to see your data differently?</h2>
                        <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                            Join thousands of users who have switched from complex spreadsheets to simple conversations.
                        </p>
                        <Link to="/auth" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-100 hover:scale-105 transition-all shadow-xl shadow-white/5">
                            Get Started Now <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

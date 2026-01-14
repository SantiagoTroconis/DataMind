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
                    <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-40 ml-10" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <Sparkles className="w-3 h-3" />
                                    <span>AI-Powered Analysis</span>
                                </div>

                                <h1 className="text-5xl sm:text-7xl font-bold text-zinc-900 tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                                    Your data, <br />
                                    <span className="text-zinc-500">conversational.</span>
                                </h1>

                                <p className="text-xl text-zinc-600 mb-10 leading-relaxed max-w-lg animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                                    Stop wrestling with spreadsheets. Just chat with your data and uncover insights instantly. Built for everyone.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300">
                                    <Link to="/auth" className="w-full sm:w-auto px-8 py-4 rounded-full bg-zinc-900 text-white font-semibold text-base hover:bg-zinc-800 transition-all hover:shadow-xl hover:shadow-zinc-900/10 active:scale-95 flex items-center justify-center gap-2">
                                        Start for Free <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <Link to="/about" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-zinc-600 font-semibold text-base border border-zinc-200 hover:bg-zinc-50 transition-all hover:border-zinc-300 active:scale-95 text-center">
                                        How it works
                                    </Link>
                                </div>
                                <div className="mt-8 flex items-center gap-4 text-xs text-zinc-500 font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
                                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> No credit card required</span>
                                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Free tier available</span>
                                </div>
                            </div>

                            {/* Hero Visual - Abstract Chat Interface */}
                            <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-200">
                                <div className="relative bg-white rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-200/50 p-6 max-h-[600px] overflow-hidden">
                                    {/* Fake Header */}
                                    <div className="flex items-center justify-between mb-8 border-b border-zinc-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                                <BarChart3 className="w-4 h-4 text-zinc-600" />
                                            </div>
                                            <div>
                                                <div className="h-4 w-24 bg-zinc-100 rounded mb-1"></div>
                                                <div className="h-3 w-16 bg-zinc-50 rounded"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fake Chat */}
                                    <div className="space-y-6">
                                        {/* User Message */}
                                        <div className="flex justify-end">
                                            <div className="bg-zinc-900 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[80%]">
                                                <p className="text-sm font-medium">Show me the sales trend for the last quarter.</p>
                                            </div>
                                        </div>

                                        {/* AI Response */}
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div className="space-y-3 w-full">
                                                <div className="bg-zinc-50 border border-zinc-100 px-5 py-4 rounded-2xl rounded-tl-sm w-full">
                                                    <p className="text-sm text-zinc-600 mb-4">Here's the sales trend. We saw a <span className="font-semibold text-emerald-600">15% increase</span> in March!</p>
                                                    {/* Fake Chart Bars */}
                                                    <div className="flex items-end gap-2 h-24 w-full px-2">
                                                        <div className="w-full bg-zinc-200 rounded-sm h-[40%]"></div>
                                                        <div className="w-full bg-zinc-200 rounded-sm h-[60%]"></div>
                                                        <div className="w-full bg-zinc-200 rounded-sm h-[50%]"></div>
                                                        <div className="w-full bg-zinc-200 rounded-sm h-[70%]"></div>
                                                        <div className="w-full bg-zinc-900 rounded-sm h-[85%] shadow-lg shadow-zinc-900/20"></div>
                                                        <div className="w-full bg-zinc-200 rounded-sm h-[65%]"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input Area */}
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="bg-white border border-zinc-200 rounded-xl p-2 flex items-center gap-2 shadow-lg shadow-zinc-100">
                                            <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center">
                                                <MessageSquare className="w-4 h-4 text-zinc-400" />
                                            </div>
                                            <div className="h-4 w-32 bg-zinc-50 rounded"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorational Elements */}
                                <div className="absolute -z-10 -top-10 -right-10 w-64 h-64 bg-zinc-100 rounded-full blur-3xl opacity-50"></div>
                                <div className="absolute -z-10 -bottom-10 -left-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Social Proof / Trust */}
                <section className="py-12 border-y border-zinc-100 bg-zinc-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-8">Trusted by data lovers everywhere</p>
                        <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Placeholders for logos, using text for now but styled */}
                            <div className="text-xl font-bold text-zinc-900 flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-full"></div> Acme Corp</div>
                            <div className="text-xl font-bold text-zinc-900 flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-sm"></div> GlobalTech</div>
                            <div className="text-xl font-bold text-zinc-900 flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-tr-xl"></div> Nebulon</div>
                            <div className="text-xl font-bold text-zinc-900 flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-lg"></div> Vertex</div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-32 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-20">
                            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-6 tracking-tight">Powerful simplicity.</h2>
                            <p className="text-lg text-zinc-500 leading-relaxed">
                                We've stripped away the complexity of traditional data tools to give you a pure, intuitive experience.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Smile,
                                    title: "Family Friendly",
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
                                <div key={idx} className="group p-8 rounded-3xl border border-zinc-100 bg-zinc-50/30 hover:bg-white hover:border-zinc-200 hover:shadow-xl hover:shadow-zinc-200/40 transition-all duration-300">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-zinc-100 text-zinc-900 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 mb-3">{feature.title}</h3>
                                    <p className="text-zinc-500 leading-relaxed text-sm">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 bg-zinc-900 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
                    <div className="max-w-4xl mx-auto px-4 relative text-center">
                        <h2 className="text-4xl sm:text-5xl font-bold mb-8 tracking-tight">Ready to see your data differently?</h2>
                        <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
                            Join thousands of users who have switched from complex spreadsheets to simple conversations.
                        </p>
                        <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-900 rounded-full font-bold text-lg hover:bg-zinc-100 hover:scale-105 transition-all shadow-xl shadow-white/5">
                            Get Started Now <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

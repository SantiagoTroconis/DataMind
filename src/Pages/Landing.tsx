import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Zap, Smile } from 'lucide-react';
import { Navbar } from '../Components/Navbar';
import { Footer } from '../Components/Footer';

export default function Landing() {
    return (
        <div className="min-h-screen flex flex-col bg-zinc-50">
            <Navbar />

            <main className="flex-grow pt-20">
                {/* Hero Section */}
                <section className="relative overflow-hidden py-24 sm:py-32">
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Sparkles className="w-4 h-4" />
                                <span>AI-Powered Analysis</span>
                            </div>
                            
                            <h1 className="text-5xl sm:text-7xl font-bold text-zinc-900 tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                                Data analysis made <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">delightful</span>.
                            </h1>
                            
                            <p className="text-xl text-zinc-500 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                                Say goodbye to complex spreadsheets. Chat with your data like a friend and uncover insights in seconds. Perfect for students, families, and pros.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300">
                                <Link to="/auth" className="w-full sm:w-auto px-8 py-4 rounded-full bg-zinc-900 text-white font-bold text-lg hover:bg-zinc-800 transition-all hover:shadow-xl hover:shadow-zinc-900/20 active:scale-95 flex items-center justify-center gap-2">
                                    Start for Free <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link to="/about" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-zinc-700 font-bold text-lg border border-zinc-200 hover:bg-zinc-50 transition-all hover:border-zinc-300 active:scale-95 text-center">
                                    Learn More
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-white/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 group">
                                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Smile className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-3">Family Friendly</h3>
                                <p className="text-zinc-500 leading-relaxed">
                                    Designed to be intuitive enough for anyone to use. No coding or data science degree required.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 group">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Zap className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-3">Lightning Fast</h3>
                                <p className="text-zinc-500 leading-relaxed">
                                    Get answers instantly. Just ask questions in plain language and watch the magic happen.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 group">
                                <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-3">Safe & Secure</h3>
                                <p className="text-zinc-500 leading-relaxed">
                                    Your data is your own. We prioritize privacy and security so you can analyze with peace of mind.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

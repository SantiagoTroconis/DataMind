import { Navbar } from '../Components/Navbar';
import { Footer } from '../Components/Footer';
import { Users, Heart, Lightbulb, ArrowRight } from 'lucide-react';

export default function AboutUs() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />

            <main className="flex-grow pt-20">
                {/* Hero Section */}
                <section className="py-24 sm:py-32 border-b border-zinc-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto">
                            <h1 className="text-4xl sm:text-6xl font-bold text-zinc-900 mb-8 tracking-tight animate-in fade-in slide-in-from-bottom-5 duration-700">
                                Democratizing data for <span className="text-zinc-500">everyone.</span>
                            </h1>
                            <p className="text-xl text-zinc-600 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                                We believe that understanding your data shouldn't require a PhD in Computer Science. It should be as simple as having a conversation.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                            <div className="relative order-2 lg:order-1">
                                <div className="aspect-square bg-zinc-100 rounded-3xl overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200 to-zinc-50 flex items-center justify-center">
                                        {/* Abstract representation of "Team" or "Users" */}
                                        <div className="grid grid-cols-2 gap-4 opacity-50">
                                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm"></div>
                                            <div className="w-16 h-16 bg-zinc-900 rounded-2xl shadow-sm"></div>
                                            <div className="w-16 h-16 bg-zinc-300 rounded-2xl shadow-sm"></div>
                                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm"></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Floating Card */}
                                <div className="absolute -bottom-10 -right-10 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xl shadow-zinc-200/50 max-w-xs hidden md:block">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <Users className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="font-bold text-zinc-900">Community Driven</span>
                                    </div>
                                    <p className="text-sm text-zinc-500">Built with functionality requested by over 10,000 real users.</p>
                                </div>
                            </div>

                            <div className="space-y-8 order-1 lg:order-2">
                                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Our Story</h2>
                                <div className="space-y-6 text-lg text-zinc-600 font-light leading-relaxed">
                                    <p>
                                        It started with a simple observation: data tools are broken. They are either too simple to be useful, or too complex for normal people to use.
                                    </p>
                                    <p>
                                        We watched friends, small business owners, and students struggle with complex formulas and confusing interfaces just to answer basic questions.
                                    </p>
                                    <p>
                                        So we built DataMind. A tool that listens to you, understands your questions, and helps you find the answers you need, simply and beautifully.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <button className="text-zinc-900 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                                        Join our journey <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Values Grid */}
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-12 text-center">Core Values</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-white text-zinc-900 flex items-center justify-center mb-6 shadow-sm border border-zinc-100">
                                        <Heart className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 mb-3">Simplicity</h3>
                                    <p className="text-zinc-500 leading-relaxed font-light">
                                        We work hard to make things easy. If it needs a manual, it's too complicated.
                                    </p>
                                </div>

                                <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-white text-zinc-900 flex items-center justify-center mb-6 shadow-sm border border-zinc-100">
                                        <Lightbulb className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 mb-3">Innovation</h3>
                                    <p className="text-zinc-500 leading-relaxed font-light">
                                        We're constantly pushing the boundaries of what AI can do for personal analytics.
                                    </p>
                                </div>

                                <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-white text-zinc-900 flex items-center justify-center mb-6 shadow-sm border border-zinc-100">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 mb-3">Community</h3>
                                    <p className="text-zinc-500 leading-relaxed font-light">
                                        We build for you. Your feedback shapes everything we do, every single day.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

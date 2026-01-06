import { Navbar } from '../Components/Navbar';
import { Footer } from '../Components/Footer';
import { Users, Heart, Lightbulb } from 'lucide-react';

export default function AboutUs() {
    return (
        <div className="min-h-screen flex flex-col bg-zinc-50">
            <Navbar />

            <main className="flex-grow pt-20">
                <section className="py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-6">About DataMind</h1>
                            <p className="text-xl text-zinc-500 leading-relaxed">
                                We're on a mission to democratize data analysis. We believe that understanding your data shouldn't require a PhD in Computer Science.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-32">
                            <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-lg shadow-zinc-200/50">
                                <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-0">
                                     {/* Placeholder for team image or illustration */}
                                    <Users className="w-32 h-32 text-indigo-300/50" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-zinc-900">Our Story</h2>
                                <p className="text-zinc-500 leading-relaxed text-lg">
                                    It started with a simple question: "Why is data analysis so hard?" We watched friends and colleagues struggle with complex tools and confusing formulas.
                                </p>
                                <p className="text-zinc-500 leading-relaxed text-lg">
                                    So we built DataMind. A tool that listens to you, understands your questions, and helps you find the answers you need, simply and beautifully.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex flex-col items-center text-center p-6">
                                <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
                                    <Heart className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-2">Passion for Simplicity</h3>
                                <p className="text-zinc-500">We work hard to make things easy. Complexity is our enemy.</p>
                            </div>
                             <div className="flex flex-col items-center text-center p-6">
                                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mb-4">
                                    <Lightbulb className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-2">Constant Innovation</h3>
                                <p className="text-zinc-500">We're always looking for new ways to help you see your data clearly.</p>
                            </div>
                             <div className="flex flex-col items-center text-center p-6">
                                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-2">Community First</h3>
                                <p className="text-zinc-500">We build for you. Your feedback shapes everything we do.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

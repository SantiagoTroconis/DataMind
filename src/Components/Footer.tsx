import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-white border-t border-zinc-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">D</span>
                            </div>
                            <span className="font-bold text-xl text-zinc-900 tracking-tight">DataMind</span>
                        </div>
                        <p className="text-zinc-500 leading-relaxed max-w-sm">
                            Making data analysis accessible, friendly, and powerful for everyone. Built with care for families, students, and professionals.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-zinc-900 mb-6">Navigation</h4>
                        <ul className="space-y-4">
                            <li><Link to="/" className="text-zinc-500 hover:text-indigo-600 transition-colors">Home</Link></li>
                            <li><Link to="/about" className="text-zinc-500 hover:text-indigo-600 transition-colors">About Us</Link></li>
                            <li><Link to="/auth" className="text-zinc-500 hover:text-indigo-600 transition-colors">Login</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-zinc-900 mb-6">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link to="#" className="text-zinc-500 hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="#" className="text-zinc-500 hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-zinc-100 text-center flex flex-col items-center gap-3">
                    <p className="text-zinc-400 text-sm flex items-center gap-2">
                        Made with <Heart className="w-4 h-4 text-red-400 fill-red-400" /> by DataMind Team
                    </p>
                    <p className="text-zinc-300 text-xs">
                        &copy; {new Date().getFullYear()} DataMind. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

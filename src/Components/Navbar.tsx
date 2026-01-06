import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    return (
        <nav className="fixed w-full bg-white/80 backdrop-blur-md border-b border-zinc-100 z-50 top-0 left-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                            <span className="text-white font-bold text-xl">D</span>
                        </div>
                        <span className="font-bold text-2xl text-zinc-900 tracking-tight">DataMind</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className={`text-sm font-medium transition-colors hover:text-indigo-600 ${location.pathname === '/' ? 'text-indigo-600' : 'text-zinc-500'}`}>
                            Home
                        </Link>
                        <Link to="/about" className={`text-sm font-medium transition-colors hover:text-indigo-600 ${location.pathname === '/about' ? 'text-indigo-600' : 'text-zinc-500'}`}>
                            About Us
                        </Link>
                        <div className="h-6 w-px bg-zinc-200 mx-2"></div>
                        <Link to="/auth" className="px-6 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-all hover:shadow-lg hover:shadow-zinc-900/20 active:scale-95">
                            Sign In
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-600 hover:text-zinc-900 p-2">
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-b border-zinc-100 animate-in slide-in-from-top-5 duration-200">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <Link to="/" onClick={() => setIsOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium ${location.pathname === '/' ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-600 hover:bg-zinc-50'}`}>
                            Home
                        </Link>
                        <Link to="/about" onClick={() => setIsOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium ${location.pathname === '/about' ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-600 hover:bg-zinc-50'}`}>
                            About Us
                        </Link>
                        <div className="pt-4 mt-2 border-t border-zinc-100">
                            <Link to="/auth" onClick={() => setIsOpen(false)} className="block w-full text-center px-6 py-3 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

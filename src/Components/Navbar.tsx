import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed w-full z-50 top-0 left-0 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-zinc-100 shadow-sm' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                            <img src="/DataMind_Logo.svg" alt="DataMind Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold text-xl text-zinc-900 tracking-tight">DataMind</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className={`text-sm font-medium transition-colors hover:text-zinc-900 ${location.pathname === '/' ? 'text-zinc-900' : 'text-zinc-500'}`}>
                            Home
                        </Link>
                        <Link to="/about" className={`text-sm font-medium transition-colors hover:text-zinc-900 ${location.pathname === '/about' ? 'text-zinc-900' : 'text-zinc-500'}`}>
                            About Us
                        </Link>
                        <div className="h-4 w-px bg-zinc-200 mx-2"></div>
                        <Link to="/auth" className="px-5 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-all hover:shadow-lg hover:shadow-zinc-900/10 active:scale-95">
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
                <div className="md:hidden bg-white border-b border-zinc-100 animate-in slide-in-from-top-5 duration-200 absolute w-full left-0">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <Link to="/" onClick={() => setIsOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium ${location.pathname === '/' ? 'bg-zinc-50 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'}`}>
                            Home
                        </Link>
                        <Link to="/about" onClick={() => setIsOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium ${location.pathname === '/about' ? 'bg-zinc-50 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'}`}>
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

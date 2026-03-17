import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavbarProps {
    dark?: boolean;
}

export const Navbar = ({ dark = false }: NavbarProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrolledBg = dark
        ? 'bg-zinc-950/90 backdrop-blur-md border-b border-white/[0.07] shadow-sm'
        : 'bg-white/90 backdrop-blur-md border-b border-zinc-100 shadow-sm';

    const textBase = dark ? 'text-white/50' : 'text-zinc-500';
    const textActive = dark ? 'text-white' : 'text-zinc-900';
    const logoText = dark ? 'text-white' : 'text-zinc-900';

    return (
        <nav className={`fixed w-full z-50 top-0 left-0 transition-all duration-300 ${scrolled ? scrolledBg : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                            <img src="/DataMind_Logo.svg" alt="MyCuery Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className={`font-bold text-xl tracking-tight ${logoText}`}>MyCuery</span>
                    </Link>

                    {/* Desktop menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link
                            to="/"
                            className={`text-sm font-medium transition-colors hover:${textActive} ${location.pathname === '/' ? textActive : textBase}`}
                        >
                            Home
                        </Link>
                        <Link
                            to="/about"
                            className={`text-sm font-medium transition-colors hover:${textActive} ${location.pathname === '/about' ? textActive : textBase}`}
                        >
                            About Us
                        </Link>
                        <div className={`h-4 w-px mx-2 ${dark ? 'bg-white/10' : 'bg-zinc-200'}`} />
                        <Link
                            to="/auth"
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                                dark
                                    ? 'bg-violet-600 text-white hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25'
                                    : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/10'
                            }`}
                        >
                            Sign In
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`p-2 ${dark ? 'text-white/60 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div
                    className={`md:hidden border-b animate-in slide-in-from-top-5 duration-200 absolute w-full left-0 ${
                        dark
                            ? 'bg-zinc-950/95 border-white/[0.07] backdrop-blur-md'
                            : 'bg-white border-zinc-100'
                    }`}
                >
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <Link
                            to="/"
                            onClick={() => setIsOpen(false)}
                            className={`block px-4 py-3 rounded-xl text-base font-medium ${
                                dark
                                    ? location.pathname === '/' ? 'bg-white/[0.06] text-white' : 'text-white/60 hover:bg-white/[0.04]'
                                    : location.pathname === '/' ? 'bg-zinc-50 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
                            }`}
                        >
                            Home
                        </Link>
                        <Link
                            to="/about"
                            onClick={() => setIsOpen(false)}
                            className={`block px-4 py-3 rounded-xl text-base font-medium ${
                                dark
                                    ? location.pathname === '/about' ? 'bg-white/[0.06] text-white' : 'text-white/60 hover:bg-white/[0.04]'
                                    : location.pathname === '/about' ? 'bg-zinc-50 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
                            }`}
                        >
                            About Us
                        </Link>
                        <div className={`pt-4 mt-2 border-t ${dark ? 'border-white/[0.07]' : 'border-zinc-100'}`}>
                            <Link
                                to="/auth"
                                onClick={() => setIsOpen(false)}
                                className={`block w-full text-center px-6 py-3 rounded-xl font-semibold transition-colors ${
                                    dark
                                        ? 'bg-violet-600 text-white hover:bg-violet-500'
                                        : 'bg-zinc-900 text-white hover:bg-zinc-800'
                                }`}
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

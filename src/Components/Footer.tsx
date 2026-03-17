import { Link } from 'react-router-dom';

interface FooterProps {
    dark?: boolean;
}

export const Footer = ({ dark = false }: FooterProps) => {
    const bg = dark ? 'bg-transparent border-t border-white/[0.07]' : 'bg-white border-t border-zinc-100';
    const brandText = dark ? 'text-white' : 'text-zinc-900';
    const bodyText = dark ? 'text-white/35' : 'text-zinc-500';
    const headText = dark ? 'text-white/70' : 'text-zinc-900';
    const linkText = dark ? 'text-white/35 hover:text-white/70' : 'text-zinc-500 hover:text-zinc-900';
    const divider = dark ? 'border-white/[0.07]' : 'border-zinc-100';
    const copy = dark ? 'text-white/20' : 'text-zinc-400';

    return (
        <footer className={`${bg} pt-16 pb-8`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 mb-12">
                    <div className="max-w-xs">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 flex items-center justify-center">
                                <img src="/DataMind_Logo.svg" alt="MyCuery" className="w-full h-full object-contain" />
                            </div>
                            <span className={`font-bold text-xl tracking-tight ${brandText}`}>MyCuery</span>
                        </div>
                        <p className={`text-sm leading-relaxed ${bodyText}`}>
                            Empowering everyone to understand their data through simple, conversational AI.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-12 sm:gap-24">
                        <div>
                            <h4 className={`font-semibold mb-4 text-sm ${headText}`}>Product</h4>
                            <ul className="space-y-3">
                                <li><Link to="/" className={`text-sm transition-colors ${linkText}`}>Home</Link></li>
                                <li><Link to="/about" className={`text-sm transition-colors ${linkText}`}>About</Link></li>
                                <li><Link to="/auth" className={`text-sm transition-colors ${linkText}`}>Login</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className={`font-semibold mb-4 text-sm ${headText}`}>Legal</h4>
                            <ul className="space-y-3">
                                <li><Link to="#" className={`text-sm transition-colors ${linkText}`}>Privacy</Link></li>
                                <li><Link to="#" className={`text-sm transition-colors ${linkText}`}>Terms</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className={`pt-8 border-t ${divider} flex flex-col md:flex-row items-center justify-between gap-4`}>
                    <p className={`text-xs ${copy}`}>
                        &copy; {new Date().getFullYear()} MyCuery Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

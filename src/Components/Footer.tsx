import { Link } from 'react-router-dom';

export const Footer = () => {
    return (
        <footer className="bg-white border-t border-zinc-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 mb-12">
                    <div className="max-w-xs">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 flex items-center justify-center">
                                <img src="/DataMind_Logo.svg" alt="DataMind" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-bold text-xl text-zinc-900 tracking-tight">DataMind</span>
                        </div>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            Empowering everyone to understand their data through simple, conversational AI.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-12 sm:gap-24">
                        <div>
                            <h4 className="font-semibold text-zinc-900 mb-4 text-sm">Product</h4>
                            <ul className="space-y-3">
                                <li><Link to="/" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Home</Link></li>
                                <li><Link to="/about" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">About</Link></li>
                                <li><Link to="/auth" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Login</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-zinc-900 mb-4 text-sm">Legal</h4>
                            <ul className="space-y-3">
                                <li><Link to="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Privacy</Link></li>
                                <li><Link to="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors">Terms</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-zinc-400 text-xs">
                        &copy; {new Date().getFullYear()} DataMind Inc. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        {/* Social icons placeholders if needed, for now just text or empty */}
                    </div>
                </div>
            </div>
        </footer>
    );
};

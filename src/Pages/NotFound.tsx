import { useNavigate } from "react-router-dom";
import { MoveLeft, Ghost } from "lucide-react";

export const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="text-center max-w-lg w-full">
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center animate-bounce">
                        <Ghost className="w-12 h-12 text-slate-400" />
                    </div>
                </div>

                <h1 className="text-8xl font-bold text-slate-900 mb-4 tracking-tighter">404</h1>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">Page not found</h2>
                <p className="text-slate-500 mb-10 text-lg">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white hover:border-slate-300 transition-all flex items-center gap-2"
                    >
                        <MoveLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className="px-6 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 transition-all"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
};

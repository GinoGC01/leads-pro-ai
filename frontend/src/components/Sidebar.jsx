import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, Search, Settings, LayoutDashboard, BrainCircuit } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[80px] bg-[#1a1a1c] border-r border-[#2a2a2d] flex flex-col items-center py-6 z-50">
            {/* Brand Icon or Logo */}
            <div className="mb-12 flex flex-col items-center gap-2 cursor-pointer transition-transform hover:scale-105 group" title="Nano Banana OS">
                <div className="w-12 h-12 flex items-center justify-center">
                    <img src="/logo.png" alt="Nano Banana" className="w-8 h-8 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                </div>
            </div>

            {/* Navigation Icons */}
            <nav className="flex-1 flex flex-col gap-8 w-full items-center">
                {/* Search Hub Tab */}
                <Link
                    to="/search"
                    className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all group ${currentPath === '/search' || currentPath === '/'
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                    title="Búsquedas (Acquisition Hub)"
                >
                    <Search className="w-5 h-5" />
                </Link>

                {/* Dashboard Tab */}
                <Link
                    to="/dashboard"
                    className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all group ${currentPath === '/dashboard'
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                    title="Dashboard (CRM)"
                >
                    <LayoutDashboard className="w-5 h-5" />
                </Link>

                {/* Data Intelligence Tab */}
                <Link
                    to="/intelligence"
                    className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all group ${currentPath === '/intelligence'
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                    title="Data Intelligence"
                >
                    <BrainCircuit className="w-5 h-5" />
                </Link>
            </nav>

            {/* Bottom Icons */}
            <div className="flex flex-col gap-6 mt-auto w-full items-center">
                {/* Settings Tab */}
                <Link
                    to="/settings"
                    className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all group ${currentPath === '/settings'
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;

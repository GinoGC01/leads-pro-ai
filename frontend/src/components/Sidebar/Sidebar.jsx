import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Settings, LayoutDashboard, BrainCircuit } from 'lucide-react';
import NavItem from './components/NavItem';

const Sidebar = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[80px] bg-[#1a1a1c] border-r border-[#2a2a2d] flex flex-col items-center py-6 z-50">
            {/* Brand Icon or Logo */}
            <div className="mb-12 flex flex-col items-center gap-2 cursor-pointer transition-transform hover:scale-105 group" title="Nano Banana OS">
                <div className="w-12 h-12 flex items-center justify-center">
                    <img 
                        src="/logo.png" 
                        alt="Nano Banana" 
                        className="w-8 h-8 object-contain" 
                        onError={(e) => { 
                            e.target.style.display = 'none'; 
                            e.target.nextSibling.style.display = 'block'; 
                        }} 
                    />
                </div>
            </div>

            {/* Navigation Icons */}
            <nav className="flex-1 flex flex-col gap-8 w-full items-center">
                <NavItem 
                    to="/search" 
                    currentPath={currentPath} 
                    icon={Search} 
                    title="Búsquedas (Acquisition Hub)" 
                    isHome={true} 
                />
                <NavItem 
                    to="/dashboard" 
                    currentPath={currentPath} 
                    icon={LayoutDashboard} 
                    title="Dashboard (CRM)" 
                />
                <NavItem 
                    to="/intelligence" 
                    currentPath={currentPath} 
                    icon={BrainCircuit} 
                    title="Data Intelligence" 
                />
            </nav>

            {/* Bottom Icons */}
            <div className="flex flex-col gap-6 mt-auto w-full items-center">
                <NavItem 
                    to="/settings" 
                    currentPath={currentPath} 
                    icon={Settings} 
                    title="Settings" 
                />
            </div>
        </aside>
    );
};

export default Sidebar;

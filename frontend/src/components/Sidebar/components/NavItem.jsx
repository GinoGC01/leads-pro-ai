import React from 'react';
import { Link } from 'react-router-dom';

/**
 * NavItem — Reusable navigation link for the Sidebar.
 * Encapsulates the active state logic and Tailwind styling.
 */
const NavItem = ({ to, currentPath, icon: Icon, title, isHome = false }) => {
    // If it's the home route (/search), it's active for both '/' and '/search'
    const isActive = isHome 
        ? currentPath === to || currentPath === '/'
        : currentPath === to;

    return (
        <Link
            to={to}
            className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all group ${
                isActive
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
            title={title}
        >
            <Icon className="w-5 h-5" />
        </Link>
    );
};

export default NavItem;

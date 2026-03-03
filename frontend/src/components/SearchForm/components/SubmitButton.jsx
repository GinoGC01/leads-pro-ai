import React from 'react';
import { Search } from 'lucide-react';

/**
 * SubmitButton — "Compile List" action button.
 * Shows spinner when isLoading, otherwise shows search icon + text.
 * Pure presentational.
 */
const SubmitButton = ({ isLoading }) => (
    <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold h-[46px] rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(13,108,242,0.3)] hover:shadow-[0_0_25px_rgba(13,108,242,0.5)] active:scale-95"
    >
        {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
            <>
                <Search className="w-4 h-4" />
                <span>Compile List</span>
            </>
        )}
    </button>
);

export default SubmitButton;

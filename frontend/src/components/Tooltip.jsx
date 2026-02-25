import React, { useState, useRef } from 'react';

const Tooltip = ({ text, children, position = 'left' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef(null);

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, 200);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    const positionClasses = {
        left: 'right-full mr-2 top-1/2 -translate-y-1/2',
        top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
        bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
        right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    };

    return (
        <div className="relative flex items-center group/tooltip" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {children}
            {isVisible && (
                <div className={`absolute z-[100] px-3 py-2 bg-slate-950 text-white text-[10px] font-bold rounded-xl shadow-2xl border border-white/10 w-max max-w-[180px] break-words leading-relaxed animate-in fade-in zoom-in duration-200 ${positionClasses[position]}`}>
                    {text}
                    {/* Arrow (Hidden on very small tooltips to avoid misalignment) */}
                    <div className="absolute w-1.5 h-1.5 bg-slate-950 border-r border-b border-white/10 rotate-45 hidden group-hover/tooltip:block"
                        style={{
                            left: position === 'top' || position === 'bottom' ? '50%' : (position === 'left' ? '100%' : '-3px'),
                            top: position === 'left' || position === 'right' ? '50%' : (position === 'top' ? '100%' : '-3px'),
                            transform: `translate(${position === 'top' || position === 'bottom' ? '-50%' : '0'}, ${position === 'left' || position === 'right' ? '-50%' : '0'}) rotate(45deg)`,
                            marginLeft: position === 'left' ? '-4px' : (position === 'right' ? '1px' : '0'),
                            marginTop: position === 'top' ? '-4px' : (position === 'bottom' ? '1px' : '0')
                        }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default Tooltip;

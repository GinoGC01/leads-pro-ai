import { useEffect, useRef } from 'react';

/**
 * Hook: useAutoScroll
 * Returns a ref to attach to the bottom of a message list.
 * Scrolls into view whenever dependencies change.
 */
const useAutoScroll = (dependencies = []) => {
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, dependencies);

    return endRef;
};

export default useAutoScroll;

import { useState, useEffect, useCallback, useRef } from 'react';

const useInfiniteScroll = (callback, hasMore, isLoading) => {
    const observer = useRef();
    const lastPostElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                callback();
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, callback]);

    return { lastPostElementRef };
};

export default useInfiniteScroll;
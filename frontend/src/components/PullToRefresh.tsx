import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PullToRefresh.css';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 80;
const REFRESH_TIMEOUT = 10000;

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setPullDistance(0);
    setIsRefreshing(false);
    setCanPull(false);
  }, []);

  const handleTouchStart = (e: TouchEvent) => {
    // Only allow pull to start if we are at the very top of the scroll
    // and not starting from an input/textarea
    const target = e.target as HTMLElement;
    if (
      window.scrollY === 0 &&
      target.tagName !== 'TEXTAREA' &&
      target.tagName !== 'INPUT' &&
      !target.isContentEditable
    ) {
      setStartY(e.touches[0].pageY);
      setCanPull(true);
    } else {
      setCanPull(false);
    }
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!canPull || isRefreshing) return;

      // Don't interfere if a user is scrolling inside a textarea or input
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) {
        return;
      }

      const currentY = e.touches[0].pageY;
      const diff = currentY - startY;

      if (diff > 0 && window.scrollY <= 0) {
        // We are pulling down at the top
        // Resistance factor
        const distance = Math.min(diff * 0.4, PULL_THRESHOLD + 20);
        setPullDistance(distance);

        // Crucial: only prevent default if we've pulled enough to indicate intent
        // and we are actually pulling down. This avoids breaking horizontal or
        // slight vertical scrolls that should be handled by the browser.
        if (distance > 10 && e.cancelable) {
          e.preventDefault();
        }
      } else if (diff < 0) {
        // If user pulls up, stop tracking
        setCanPull(false);
        setPullDistance(0);
      }
    },
    [canPull, isRefreshing, startY],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!canPull || isRefreshing) return;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);

      const timeoutId = setTimeout(() => {
        reset();
      }, REFRESH_TIMEOUT);

      try {
        await onRefresh();
      } catch (e) {
        console.error('Refresh failed', e);
      } finally {
        clearTimeout(timeoutId);
        reset();
      }
    } else {
      setPullDistance(0);
      setCanPull(false);
    }
  }, [canPull, isRefreshing, pullDistance, onRefresh, reset]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Use non-passive touchmove to allow preventDefault
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className="ptr-container">
      <div
        className="ptr-indicator"
        style={{
          transform: `translateY(${pullDistance - 40}px)`,
          opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
          transition: canPull ? 'none' : 'transform 0.2s, opacity 0.2s',
        }}
      >
        {isRefreshing ? (
          <div className="ptr-spinner" />
        ) : (
          <div
            className="ptr-arrow"
            style={{
              transform: `rotate(${Math.min((pullDistance / PULL_THRESHOLD) * 360, 360)}deg)`,
            }}
          >
            <i className="bi bi-arrow-clockwise" />
          </div>
        )}
      </div>
      <div
        className="ptr-content"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: canPull ? 'none' : 'transform 0.2s',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;

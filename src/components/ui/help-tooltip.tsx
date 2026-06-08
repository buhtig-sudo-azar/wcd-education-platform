'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  children: ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({ children, content, side = 'bottom' }: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => {
      show();
    }, 3000);
  }, [show]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    hoverTimerRef.current = setTimeout(() => {
      hide();
    }, 300);
  }, [hide]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    show();
  }, [show]);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        hide();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, hide]);

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowBorderClasses: Record<string, string> = {
    top: '-top-1 left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-black/60',
    bottom: '-bottom-1 left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-black/60',
    left: '-left-1 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-black/60',
    right: '-right-1 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-black/60',
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
    >
      {children}

      {visible && (
        <div
          className={cn(
            'absolute z-[100] max-w-[280px] whitespace-normal',
            'px-3 py-2 rounded-lg',
            'bg-black/60 dark:bg-white/15 backdrop-blur-md',
            'text-white dark:text-white text-xs leading-relaxed',
            'border border-white/10',
            'shadow-lg shadow-black/20',
            'animate-in fade-in zoom-in-95 duration-200',
            positionClasses[side]
          )}
          onMouseEnter={() => {
            if (hoverTimerRef.current) {
              clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = null;
            }
          }}
          onMouseLeave={hide}
        >
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowBorderClasses[side]
            )}
          />
        </div>
      )}
    </div>
  );
}

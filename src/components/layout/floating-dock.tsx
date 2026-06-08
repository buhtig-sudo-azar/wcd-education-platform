'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowUp, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/navigation-store';
import { useChatStore } from '@/store/chat-store';
import { wcdAgent } from '@/data/agent-data';
import Image from 'next/image';

export function FloatingDock() {
  const currentView = useNavigationStore(s => s.currentView);
  const chatOpen = useNavigationStore(s => s.chatOpen);
  const { setActiveCategory } = useChatStore();

  // ScrollToTop state
  const [scrollVisible, setScrollVisible] = useState(false);

  // Agent state
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const agentVisible = currentView !== 'home' && !chatOpen;
  const agent = wcdAgent;

  // Listen for scroll
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const handleScroll = () => setScrollVisible(main.scrollTop > 300);
    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => main.removeEventListener('scroll', handleScroll);
  }, []);

  // Agent appear with delay
  useEffect(() => {
    if (agentVisible) {
      const timer = setTimeout(() => setHasAppeared(true), 300);
      return () => clearTimeout(timer);
    } else {
      setHasAppeared(false);
    }
  }, [agentVisible]);

  // Tooltip on first appear
  useEffect(() => {
    if (hasAppeared && !chatOpen) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 3000);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [hasAppeared, chatOpen]);

  const showAgent = agent && hasAppeared && agentVisible;

  if (!scrollVisible && !showAgent) return null;

  const scrollToTop = () => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAgentClick = () => {
    setActiveCategory('wcd-expert');
    useNavigationStore.getState().setChatOpen(true);
  };

  return (
    <div
      className="fixed z-50 flex flex-col items-center gap-3 pointer-events-none"
      style={{
        right: 'clamp(16px, 3vw, 40px)',
        top: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      {/* ScrollToTop button — ABOVE the agent */}
      {scrollVisible && (
        <button
          onClick={scrollToTop}
          aria-label="Наверх"
          className="pointer-events-auto group flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full 
                     bg-white/70 dark:bg-white/10 backdrop-blur-xl 
                     border border-white/30 dark:border-white/10
                     shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]
                     hover:bg-white/90 dark:hover:bg-white/20
                     hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]
                     hover:scale-110 active:scale-95 
                     transition-all duration-300 ease-out
                     focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-transparent
                     animate-in fade-in zoom-in-95 duration-200"
        >
          <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300" />
        </button>
      )}

      {/* Agent button — BELOW the scroll button */}
      {showAgent && (
        <div
          className="pointer-events-auto relative animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Tooltip */}
          {showTooltip && !isHovered && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 
                            hidden sm:block bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
                            border border-white/40 dark:border-white/10
                            rounded-xl px-3 py-2 shadow-lg max-w-[180px] 
                            animate-in fade-in slide-in-from-right-2 duration-200">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{agent.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Нажми, чтобы спросить!</p>
            </div>
          )}

          {/* Expanded tooltip on hover */}
          {isHovered && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 
                            hidden sm:block bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
                            border border-white/40 dark:border-white/10
                            rounded-xl px-3 py-2.5 shadow-lg max-w-[200px] 
                            animate-in fade-in slide-in-from-right-1 duration-150">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{agent.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{agent.role}</p>
            </div>
          )}

          <button
            onClick={handleAgentClick}
            className="group relative focus:outline-none"
            aria-label={`Открыть чат с ${agent.name}`}
          >
            {/* Outer rotating ring */}
            <span className="absolute -inset-2 rounded-full animate-[spin_8s_linear_infinite]">
              <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400/0 via-cyan-400/30 to-emerald-400/0" />
            </span>

            {/* Pulsing glow ring */}
            <span className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-emerald-400/20 via-cyan-400/20 to-teal-400/20 animate-pulse opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Outer decorative ring */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-400/30 to-cyan-500/30 opacity-50 group-hover:opacity-80 transition-opacity duration-300" />

            {/* Main avatar container — frosted glass style */}
            <span className="relative flex items-center justify-center w-13 h-13 sm:w-16 sm:h-16 rounded-full overflow-hidden 
                             bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl
                             border border-white/40 dark:border-white/15
                             shadow-[0_0_20px_rgba(16,185,129,0.15),0_4px_15px_rgba(0,0,0,0.1)]
                             group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3),0_8px_25px_rgba(0,0,0,0.15)]
                             group-hover:scale-105 active:scale-95
                             transition-all duration-300 ease-out">
              <Image src={agent.avatar} alt={agent.name} width={64} height={64} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />

              {/* Scan-line overlay effect */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 via-transparent to-transparent" />
              <span className="absolute inset-0 rounded-full opacity-20 group-hover:opacity-10 transition-opacity"
                    style={{
                      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,180,0.03) 2px, rgba(0,255,180,0.03) 4px)'
                    }} />
            </span>

            {/* Online indicator */}
            <span className="absolute bottom-0.5 right-0.5 flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4">
              <span className="absolute w-full h-full rounded-full bg-emerald-400/40 animate-ping" />
              <span className="relative w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-white/80 dark:border-slate-800/80" />
            </span>

            {/* Small shield badge */}
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-md">
              <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

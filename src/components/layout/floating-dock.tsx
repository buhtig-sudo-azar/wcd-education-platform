'use client';

import { useState, useEffect } from 'react';
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
  const [hasAppeared, setHasAppeared] = useState(false);

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
      className="fixed z-50 flex flex-col items-center gap-2.5 pointer-events-none"
      style={{
        right: 'clamp(12px, 2.5vw, 32px)',
        bottom: 'clamp(16px, 3vh, 32px)',
      }}
    >
      {/* ScrollToTop button — ABOVE the agent */}
      {scrollVisible && (
        <button
          onClick={scrollToTop}
          aria-label="Наверх"
          className="pointer-events-auto group flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full 
                     bg-white/60 dark:bg-white/10 backdrop-blur-xl 
                     border border-white/30 dark:border-white/10
                     shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]
                     hover:bg-white/80 dark:hover:bg-white/20
                     hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_6px_24px_rgba(0,0,0,0.5)]
                     hover:scale-110 active:scale-95 
                     transition-all duration-300 ease-out
                     focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-1
                     animate-in fade-in zoom-in-95 duration-200"
        >
          <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300" />
        </button>
      )}

      {/* Agent button — BELOW the scroll button */}
      {showAgent && (
        <button
          onClick={handleAgentClick}
          className="pointer-events-auto group relative focus:outline-none animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500"
          aria-label={`Открыть чат с ${agent.name}`}
        >
          {/* Rotating glow ring */}
          <span className="absolute -inset-2 rounded-full animate-[spin_10s_linear_infinite]">
            <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400/0 via-cyan-400/20 to-emerald-400/0" />
          </span>

          {/* Pulsing glow */}
          <span className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-emerald-400/15 via-cyan-400/15 to-teal-400/15 animate-pulse opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Main avatar — frosted glass */}
          <span className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden 
                           bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl
                           border border-white/40 dark:border-white/15
                           shadow-[0_0_16px_rgba(16,185,129,0.12),0_2px_10px_rgba(0,0,0,0.08)]
                           group-hover:shadow-[0_0_24px_rgba(16,185,129,0.25),0_4px_16px_rgba(0,0,0,0.12)]
                           group-hover:scale-105 active:scale-95
                           transition-all duration-300 ease-out">
            <Image src={agent.avatar} alt={agent.name} width={64} height={64} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" />

            {/* Glass overlay */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 via-transparent to-transparent" />
          </span>

          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4">
            <span className="absolute w-full h-full rounded-full bg-emerald-400/40 animate-ping" />
            <span className="relative w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-white/70 dark:border-slate-800/70" />
          </span>

          {/* Shield badge */}
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-sm">
            <Shield className="w-2.5 h-2.5 text-white" />
          </span>
        </button>
      )}
    </div>
  );
}

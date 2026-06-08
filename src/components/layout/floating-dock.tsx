'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
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
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col-reverse items-center gap-2.5 sm:gap-3 pointer-events-none">
      {/* Agent button */}
      {showAgent && (
        <div className="pointer-events-auto flex items-end gap-1.5 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300">
          {showTooltip && (
            <div className="hidden sm:block mb-2.5 bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-lg max-w-[160px] animate-in fade-in slide-in-from-right-1 duration-150">
              <p className="text-[11px] font-semibold text-foreground">{agent.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Нажми, чтобы спросить!</p>
            </div>
          )}

          <button
            onClick={handleAgentClick}
            className="group relative focus:outline-none"
            aria-label={`Открыть чат с ${agent.name}`}
          >
            <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${agent.gradient} opacity-30 animate-pulse`} />
            <span className={`absolute -inset-1 rounded-full bg-gradient-to-br ${agent.gradient} opacity-40 group-hover:opacity-70 transition-opacity`} />
            <span className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-background shadow-lg">
              <Image src={agent.avatar} alt={agent.name} width={64} height={64} className="w-full h-full object-cover" />
            </span>
            <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background" />
          </button>
        </div>
      )}

      {/* ScrollToTop button */}
      <button
        onClick={scrollToTop}
        aria-label="Наверх"
        className={cn(
          'pointer-events-auto flex items-center justify-center',
          'h-9 w-9 sm:h-11 sm:w-11 rounded-full',
          'bg-primary text-primary-foreground shadow-lg',
          'hover:shadow-xl hover:scale-110',
          'active:scale-95',
          'transition-all duration-300 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
          scrollVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 pointer-events-none h-0 w-0 overflow-hidden'
        )}
      >
        <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </div>
  );
}

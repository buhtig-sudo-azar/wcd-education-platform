'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/navigation-store';
import { useChatStore } from '@/store/chat-store';
import { wcdAgent } from '@/data/agent-data';
import Image from 'next/image';

/**
 * FloatingDock — контейнер для кнопки «Наверх» и плавающего агента.
 * Агент появляется только на страницах theory и lab.
 *
 * ВАЖНО: все хуки (useState, useEffect, useCallback) ДОЛЖНЫ вызываться
 * при КАЖДОМ рендере, без ранних return'ов. Иначе React error #310.
 */
export function FloatingDock() {
  const currentView = useNavigationStore(s => s.currentView);
  const chatOpen = useNavigationStore(s => s.chatOpen);
  const { setActiveCategory } = useChatStore();

  // --- ScrollToTop state ---
  const [scrollVisible, setScrollVisible] = useState(false);

  // --- Agent state ---
  const [hasAppeared, setHasAppeared] = useState(false);

  // Agent visible on theory and lab pages only, and when chat is closed
  const agentVisible = (currentView === 'theory' || currentView === 'lab') && !chatOpen;
  const agent = wcdAgent;

  // Слушаем скролл для ScrollToTop — throttled через rAF
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollVisible(main.scrollTop > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => main.removeEventListener('scroll', handleScroll);
  }, []);

  // Появление агента с короткой задержкой
  useEffect(() => {
    if (agentVisible) {
      const timer = setTimeout(() => setHasAppeared(true), 300);
      return () => clearTimeout(timer);
    } else {
      setHasAppeared(false);
    }
  }, [agentVisible]);

  // Плавная прокрутка наверх с ease-out
  const scrollToTop = useCallback(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const start = main.scrollTop;
    const duration = 800;
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      main.scrollTo(0, start * (1 - eased));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }, []);

  const handleAgentClick = useCallback(() => {
    setActiveCategory('wcd-expert');
    useNavigationStore.getState().setChatOpen(true);
  }, [setActiveCategory]);

  const showAgent = agent && hasAppeared && agentVisible;

  // ВАЖНО: НЕ делаем ранний return! Все хуки должны вызываться всегда.
  // Ранний return после хуков = React error #310 (Invalid hook call)

  if (!scrollVisible && !showAgent) return null;

  return (
    <div className="fixed z-50 flex flex-col-reverse items-center gap-3 pointer-events-none"
         style={{ bottom: '66px', right: '12px' }}
    >
      {/* Агент — визуально сверху */}
      {showAgent && (
        <div className="pointer-events-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300">
          <button
            onClick={handleAgentClick}
            className="group relative focus:outline-none"
            aria-label={`Открыть чат с ${agent.name}`}
          >
            {/* Пульсирующее свечение */}
            <span className={`absolute -inset-2 rounded-full bg-gradient-to-br ${agent.gradient} opacity-25 group-hover:opacity-50 transition-opacity duration-300 blur-sm`} />
            {/* Кольцо вокруг аватара */}
            <span className="absolute -inset-1 rounded-full border-2 border-emerald-400/40 group-hover:border-emerald-400/70 transition-colors duration-300" />
            {/* Аватар */}
            <span className="relative flex items-center justify-center w-14 h-14 sm:w-[68px] sm:h-[68px] rounded-full overflow-hidden border-2 border-background shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
              <Image src={agent.avatar} alt={agent.name} width={68} height={68} className="w-full h-full object-cover" />
            </span>
            {/* Зелёный индикатор онлайн */}
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background shadow-sm" />
          </button>
        </div>
      )}

      {/* ScrollToTop — всегда в самом низу */}
      <button
        onClick={scrollToTop}
        aria-label="Наверх"
        className={cn(
          'pointer-events-auto flex items-center justify-center',
          'h-11 w-11 rounded-full',
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
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}

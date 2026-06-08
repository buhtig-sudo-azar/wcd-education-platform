'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/navigation-store';
import { useChatStore } from '@/store/chat-store';
import { wcdAgent } from '@/data/agent-data';
import Image from 'next/image';

/**
 * FloatingDock — контейнер для кнопки «Наверх» и плавающего агента.
 * Элементы обтекают друг друга: когда оба видимы, они выстраиваются
 * вертикально с зазором; когда один — он один в углу.
 */
export function FloatingDock() {
  const currentView = useNavigationStore(s => s.currentView);
  const chatOpen = useNavigationStore(s => s.chatOpen);
  const { setActiveCategory } = useChatStore();

  // --- ScrollToTop state ---
  const [scrollVisible, setScrollVisible] = useState(false);

  // --- Agent state ---
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);

  const agentVisible = currentView !== 'home' && !chatOpen;
  const agent = wcdAgent;

  // Слушаем скролл для ScrollToTop
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const handleScroll = () => setScrollVisible(main.scrollTop > 300);
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

  // Подсказка при первом появлении агента
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

  // Если ничего не видно — не рендерим контейнер
  if (!scrollVisible && !showAgent) return null;

  // Плавная прокрутка наверх с ease-out
  const scrollToTop = () => {
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
  };

  const handleAgentClick = () => {
    setActiveCategory('wcd-expert');
    useNavigationStore.getState().setChatOpen(true);
  };

  return (
    <div className="fixed z-50 flex flex-col-reverse items-center gap-3 pointer-events-none"
         style={{ bottom: '38px', right: '38px' }}
    >
      {/* Агент — сверху (в flex-col-reverse рендерится первым, визуально сверху) */}
      {showAgent && (
        <div className="pointer-events-auto flex items-end gap-1.5 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300">
          {/* Тултип — вплотную к аватару */}
          {showTooltip && (
            <div className="hidden sm:block mb-3 bg-popover border border-border rounded-lg px-3 py-2 shadow-lg max-w-[180px] animate-in fade-in slide-in-from-right-1 duration-150">
              <p className="text-xs font-semibold text-foreground">{agent.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Нажми, чтобы спросить!</p>
            </div>
          )}

          {/* Кнопка-аватар — полупрозрачная */}
          <button
            onClick={handleAgentClick}
            className="group relative focus:outline-none"
            aria-label={`Открыть чат с ${agent.name}`}
          >
            <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${agent.gradient} opacity-20 animate-pulse`} />
            <span className={`absolute -inset-1 rounded-full bg-gradient-to-br ${agent.gradient} opacity-30 group-hover:opacity-60 transition-opacity`} />
            <span className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-background/80 shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">
              <Image src={agent.avatar} alt={agent.name} width={64} height={64} className="w-full h-full object-cover" />
            </span>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background/80" />
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

'use client';

import { useState, useRef, useEffect } from 'react';
import { useModelStore } from '@/store/model-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Eye, EyeOff, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { useToast } from '@/hooks/use-toast';

export function ApiTokenInput() {
  const { apiToken, setApiToken, clearApiToken } = useModelStore();
  const [inputValue, setInputValue] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  const handleSave = () => {
    const token = inputValue.trim();
    if (!token) return;
    setApiToken(token);
    setIsValid(null);
    setInputValue('');
    setIsExpanded(false);
    toast({ title: 'Токен сохранён', description: 'Ваш API-токен будет использоваться для всех запросов к моделям.' });
  };

  const handleVerify = async () => {
    const token = apiToken;
    if (!token) return;
    setIsVerifying(true);
    setIsValid(null);
    try {
      const res = await fetch('/api/models/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'google/gemma-4-31b-it:free', apiToken: token }),
      });
      const data = await res.json();
      setIsValid(data.available === true || data.reason === 'rate_limited');
    } catch {
      setIsValid(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemove = () => {
    clearApiToken();
    setIsValid(null);
    toast({ title: 'Токен удалён', description: 'Теперь используется общий токен платформы.' });
  };

  const hasToken = apiToken.length > 0;
  const maskedToken = hasToken ? apiToken.slice(0, 6) + '...' + apiToken.slice(-4) : '';

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {!isExpanded && !hasToken && (
        <div className="space-y-1 sm:space-y-1.5">
          <Button variant="outline" size="sm"
            className={cn('w-full gap-1.5 sm:gap-2 h-7 sm:h-8 text-[10px] sm:text-xs font-medium',
              'border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5')}
            onClick={() => setIsExpanded(true)}>
            <Key className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-primary" />
            Свой токен OpenRouter
          </Button>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center">
            Ключ бесплатно: <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline">openrouter.ai/keys</a>
          </p>
        </div>
      )}

      {!isExpanded && hasToken && (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex-1 flex items-center gap-1.5 sm:gap-2 h-7 sm:h-8 px-2 sm:px-2.5 rounded-md border border-border bg-muted/30 text-[10px] sm:text-xs">
            <Key className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-green-500 shrink-0" />
            <span className="font-mono text-muted-foreground truncate flex-1">
              {showToken ? apiToken : maskedToken}
            </span>
            <button onClick={() => setShowToken(!showToken)} className="p-0.5 hover:text-foreground transition-colors">
              {showToken ? <EyeOff className="h-2.5 sm:h-3 w-2.5 sm:w-3" /> : <Eye className="h-2.5 sm:h-3 w-2.5 sm:w-3" />}
            </button>
          </div>
          <HelpTooltip content="Проверить, работает ли ваш токен" side="top">
            <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-1.5 sm:px-2" onClick={handleVerify} disabled={isVerifying}>
              {isVerifying ? (
                <span className="h-3 w-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              ) : isValid === true ? (
                <CheckCircle2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-green-500" />
              ) : isValid === false ? (
                <AlertCircle className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-red-500" />
              ) : (
                <CheckCircle2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-muted-foreground" />
              )}
            </Button>
          </HelpTooltip>
          <HelpTooltip content="Удалить токен" side="top">
            <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-1.5 sm:px-2 hover:text-destructive" onClick={handleRemove}>
              <Trash2 className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            </Button>
          </HelpTooltip>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex gap-1.5 sm:gap-2">
            <Input ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)}
              placeholder="sk-or-v1-..." type={showToken ? 'text' : 'password'}
              className="text-[10px] sm:text-xs h-7 sm:h-8 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
                if (e.key === 'Escape') { setIsExpanded(false); setInputValue(''); }
              }} />
            <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-1.5 sm:px-2 shrink-0"
              onClick={() => setShowToken(!showToken)}>
              {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs gap-0.5 sm:gap-1" onClick={handleSave} disabled={!inputValue.trim()}>
              <Key className="h-2.5 sm:h-3 w-2.5 sm:w-3" /> Сохранить
            </Button>
            <Button variant="ghost" size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs"
              onClick={() => { setIsExpanded(false); setInputValue(''); }}>
              Отмена
            </Button>
          </div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground">
            Токен хранится только в вашем браузере. Получить бесплатно: <a href="https://openrouter.ai/keys"
              target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/keys</a>
          </p>
        </div>
      )}
    </div>
  );
}

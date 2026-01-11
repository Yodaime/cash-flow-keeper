import { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, ArrowUpRight, ArrowDownRight, CalendarIcon, Send, Bot, User, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClosings } from '@/hooks/useClosings';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CashAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function CashAnalysisDialog({ open, onOpenChange }: CashAnalysisDialogProps) {
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(startOfMonth(today));
  const [endDate, setEndDate] = useState<Date>(today);
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const formattedStart = format(startDate, 'yyyy-MM-dd');
  const formattedEnd = format(endDate, 'yyyy-MM-dd');
  
  const { data: closings, isLoading } = useClosings({ startDate: formattedStart, endDate: formattedEnd });

  const stats = closings?.reduce(
    (acc, closing) => {
      const expected = Number(closing.expected_value);
      const counted = Number(closing.counted_value);
      const diff = Number(closing.difference);

      acc.totalExpected += expected;
      acc.totalCounted += counted;
      acc.totalDifference += diff;
      
      if (diff > 0) {
        acc.surplus += diff;
        acc.surplusCount++;
      } else if (diff < 0) {
        acc.deficit += Math.abs(diff);
        acc.deficitCount++;
      }
      
      if (closing.status === 'ok' || closing.status === 'aprovado') {
        acc.okCount++;
      } else if (closing.status === 'atencao') {
        acc.attentionCount++;
      } else if (closing.status === 'pendente') {
        acc.pendingCount++;
      }
      
      return acc;
    },
    {
      totalExpected: 0,
      totalCounted: 0,
      totalDifference: 0,
      surplus: 0,
      deficit: 0,
      surplusCount: 0,
      deficitCount: 0,
      okCount: 0,
      attentionCount: 0,
      pendingCount: 0,
    }
  ) || {
    totalExpected: 0,
    totalCounted: 0,
    totalDifference: 0,
    surplus: 0,
    deficit: 0,
    surplusCount: 0,
    deficitCount: 0,
    okCount: 0,
    attentionCount: 0,
    pendingCount: 0,
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const totalClosings = closings?.length || 0;
  const accuracyRate = totalClosings > 0 ? ((stats.okCount / totalClosings) * 100).toFixed(1) : '0';

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-cash', {
        body: {
          message: userMessage,
          stats: {
            ...stats,
            totalClosings,
            accuracyRate: parseFloat(accuracyRate),
          },
        },
      });

      if (error) throw error;

      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.' 
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const quickQuestions = [
    'Resuma a situação atual do caixa',
    'Quais pontos de atenção?',
    'Sugestões de melhoria',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Análise do Caixa
          </DialogTitle>
          <DialogDescription>
            Análise detalhada dos fechamentos de caixa
          </DialogDescription>
        </DialogHeader>

        {/* Date Filter */}
        <div className="flex flex-wrap gap-2 items-center py-2 border-b">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(startDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => {
                  if (d) {
                    setStartDate(d);
                    setStartCalendarOpen(false);
                  }
                }}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <span className="text-sm text-muted-foreground">até</span>
          <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(endDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => {
                  if (d) {
                    setEndDate(d);
                    setEndCalendarOpen(false);
                  }
                }}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <ScrollArea className="flex-1 overflow-auto pr-4">
          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Valor Esperado</span>
                  </div>
                  <p className="text-xl font-bold mt-1">{formatCurrency(stats.totalExpected)}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Valor Contado</span>
                  </div>
                  <p className="text-xl font-bold mt-1">{formatCurrency(stats.totalCounted)}</p>
                </div>
              </div>

              {/* Difference Summary */}
              <div className={cn(
                "rounded-lg p-3 border",
                stats.totalDifference >= 0 ? "bg-success/10 border-success/20" : "bg-destructive/10 border-destructive/20"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Diferença Total</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      stats.totalDifference >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {stats.totalDifference >= 0 ? '+' : ''}{formatCurrency(stats.totalDifference)}
                    </p>
                  </div>
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    stats.totalDifference >= 0 ? "bg-success/20" : "bg-destructive/20"
                  )}>
                    {stats.totalDifference >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </div>
              </div>

              {/* Surplus and Deficit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-success">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-xs font-medium">Sobras</span>
                  </div>
                  <p className="text-lg font-bold mt-1">{formatCurrency(stats.surplus)}</p>
                  <p className="text-xs text-muted-foreground">{stats.surplusCount} ocorrências</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-destructive">
                    <ArrowDownRight className="h-4 w-4" />
                    <span className="text-xs font-medium">Faltas</span>
                  </div>
                  <p className="text-lg font-bold mt-1">{formatCurrency(stats.deficit)}</p>
                  <p className="text-xs text-muted-foreground">{stats.deficitCount} ocorrências</p>
                </div>
              </div>

              {/* Status Summary */}
              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Status dos Fechamentos</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xl font-bold">{stats.okCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">OK/Aprovado</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xl font-bold">{stats.attentionCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Atenção</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <span className="text-xl font-bold">{stats.pendingCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Pendente</p>
                  </div>
                </div>
              </div>

              {/* Accuracy Rate */}
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Taxa de Precisão</p>
                    <p className="text-xs text-muted-foreground">Fechamentos OK ou Aprovados</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{accuracyRate}%</p>
                    <p className="text-xs text-muted-foreground">{stats.okCount} de {totalClosings}</p>
                  </div>
                </div>
              </div>

              {/* AI Chat Section */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Assistente de Análise</span>
                </div>
                
                {chatMessages.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Pergunte sobre os dados ou peça sugestões de melhoria:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {quickQuestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setChatInput(q);
                          }}
                          className="text-xs px-2 py-1 rounded-md bg-background border hover:bg-muted transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-2 text-sm",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        )}
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 max-w-[85%]",
                            msg.role === 'user'
                              ? "bg-primary text-primary-foreground"
                              : "bg-background border"
                          )}
                        >
                          <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
                        </div>
                        {msg.role === 'user' && (
                          <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                      </div>
                    ))}
                    {isSending && (
                      <div className="flex gap-2 items-center text-muted-foreground">
                        <Bot className="h-5 w-5 text-primary" />
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Analisando...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Faça uma pergunta sobre os dados..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="text-sm"
                    disabled={isSending}
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isSending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

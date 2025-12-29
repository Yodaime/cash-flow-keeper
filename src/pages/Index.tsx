import { useState } from 'react';
import { Plus, TrendingUp, Store, AlertTriangle, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentClosings } from '@/components/dashboard/RecentClosings';
import { ClosingForm } from '@/components/closings/ClosingForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useClosings } from '@/hooks/useClosings';
import { useStores } from '@/hooks/useStores';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: closings, isLoading: closingsLoading } = useClosings({ startDate: today, endDate: today });
  const { data: stores, isLoading: storesLoading } = useStores();
  
  const todayClosings = closings || [];
  const okCount = todayClosings.filter(c => c.status === 'ok' || c.status === 'aprovado').length;
  const attentionCount = todayClosings.filter(c => c.status === 'atencao').length;
  const totalValue = todayClosings.reduce((acc, c) => acc + Number(c.counted_value), 0);

  const isLoading = closingsLoading || storesLoading;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral dos fechamentos de caixa
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Novo Fechamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Registrar Fechamento</DialogTitle>
                <DialogDescription>
                  Preencha os dados do fechamento de caixa. O processo leva menos de 2 minutos.
                </DialogDescription>
              </DialogHeader>
              <ClosingForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatsCard
                title="Fechamentos Hoje"
                value={todayClosings.length}
                subtitle={`de ${stores?.length || 0} lojas`}
                icon={<TrendingUp className="h-5 w-5" />}
                variant="gold"
              />
              <StatsCard
                title="Lojas Ativas"
                value={stores?.length || 0}
                icon={<Store className="h-5 w-5" />}
              />
              <StatsCard
                title="Status OK"
                value={okCount}
                subtitle="Sem divergências"
                icon={<CheckCircle className="h-5 w-5" />}
                variant="success"
              />
              <StatsCard
                title="Requer Atenção"
                value={attentionCount}
                subtitle="Divergências encontradas"
                icon={<AlertTriangle className="h-5 w-5" />}
                variant="warning"
              />
            </>
          )}
        </div>

        {/* Total do Dia */}
        <div className="rounded-xl border bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Total em Caixa Hoje</p>
              <p className="text-4xl font-bold font-display mt-1">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalValue)}
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Recent Closings */}
        <RecentClosings />
      </div>
    </Layout>
  );
};

export default Index;

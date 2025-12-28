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
import { mockClosings, mockStores } from '@/data/mockData';

const Index = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const todayClosings = mockClosings.filter(c => 
    c.date.toDateString() === new Date().toDateString()
  );
  
  const okCount = todayClosings.filter(c => c.status === 'ok' || c.status === 'aprovado').length;
  const attentionCount = todayClosings.filter(c => c.status === 'atencao').length;
  const totalValue = todayClosings.reduce((acc, c) => acc + c.countedValue, 0);

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
          <StatsCard
            title="Fechamentos Hoje"
            value={todayClosings.length}
            subtitle={`de ${mockStores.length} lojas`}
            icon={<TrendingUp className="h-5 w-5" />}
            variant="gold"
          />
          <StatsCard
            title="Lojas Ativas"
            value={mockStores.length}
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
        <RecentClosings closings={mockClosings} />
      </div>
    </Layout>
  );
};

export default Index;

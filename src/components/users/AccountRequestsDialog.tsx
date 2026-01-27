import { useState } from 'react';
import { Loader2, Check, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAccountRequests, useUpdateAccountRequest, AccountRequest } from '@/hooks/useAccountRequests';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AccountRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountRequestsDialog({ open, onOpenChange }: AccountRequestsDialogProps) {
  const { data: requests, isLoading } = useAccountRequests();
  const updateRequest = useUpdateAccountRequest();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const processedRequests = requests?.filter(r => r.status !== 'pending') || [];

  const handleApprove = async (request: AccountRequest) => {
    setProcessingId(request.id);
    try {
      await updateRequest.mutateAsync({ id: request.id, status: 'approved' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: AccountRequest) => {
    setProcessingId(request.id);
    try {
      await updateRequest.mutateAsync({ id: request.id, status: 'rejected' });
    } finally {
      setProcessingId(null);
    }
  };

  const statusConfig = {
    pending: { label: 'Pendente', variant: 'secondary' as const },
    approved: { label: 'Aprovada', variant: 'default' as const },
    rejected: { label: 'Rejeitada', variant: 'destructive' as const },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Solicitações de Conta
          </DialogTitle>
          <DialogDescription>
            Gerencie as solicitações de criação de conta pendentes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pendingRequests.length === 0 && processedRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação de conta encontrada.
            </div>
          ) : (
            <div className="space-y-6">
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-primary">
                    Pendentes ({pendingRequests.length})
                  </h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="w-24">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.name}</TableCell>
                            <TableCell className="text-muted-foreground">{request.email}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                  onClick={() => handleApprove(request)}
                                  disabled={processingId === request.id}
                                >
                                  {processingId === request.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleReject(request)}
                                  disabled={processingId === request.id}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {processedRequests.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-muted-foreground">
                    Histórico ({processedRequests.length})
                  </h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedRequests.slice(0, 10).map((request) => {
                          const status = statusConfig[request.status as keyof typeof statusConfig];
                          return (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{request.name}</TableCell>
                              <TableCell className="text-muted-foreground">{request.email}</TableCell>
                              <TableCell>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {request.reviewed_at 
                                  ? format(new Date(request.reviewed_at), "dd/MM/yyyy", { locale: ptBR })
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

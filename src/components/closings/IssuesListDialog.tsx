import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    AlertOctagon,
    CheckCircle2,
    Clock,
    Trash2,
    MoreHorizontal,
    Loader2
} from 'lucide-react';
import { useClosingIssues, useUpdateClosingIssue, useDeleteClosingIssue } from '@/hooks/useClosingIssues';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

export function IssuesListDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const { data: issues, isLoading } = useClosingIssues();
    const { mutate: updateIssue } = useUpdateClosingIssue();
    const { mutate: deleteIssue } = useDeleteClosingIssue();
    const [issueToDelete, setIssueToDelete] = useState<string | null>(null);

    const handleDelete = () => {
        if (issueToDelete) {
            deleteIssue(issueToDelete);
            setIssueToDelete(null);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 text-orange-500 border-orange-200 hover:bg-orange-50">
                        <AlertOctagon className="h-4 w-4" />
                        Problemas Reportados
                        {issues && issues.filter(i => i.status === 'pending').length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                                {issues.filter(i => i.status === 'pending').length}
                            </Badge>
                        )}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertOctagon className="h-5 w-5 text-orange-500" />
                            Problemas Reportados
                        </DialogTitle>
                        <DialogDescription>
                            Gerencie os problemas e observações reportados pela equipe.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden mt-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : issues?.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
                                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                                <p>Nenhum problema reportado.</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[500px] border rounded-md">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0">
                                        <TableRow>
                                            <TableHead className="w-[100px]">Data</TableHead>
                                            <TableHead>Usuário</TableHead>
                                            <TableHead>Loja</TableHead>
                                            <TableHead className="w-[300px]">Descrição</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {issues?.map((issue) => (
                                            <TableRow key={issue.id}>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    {format(new Date(issue.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-xs">{issue.profiles?.name || 'Desconhecido'}</span>
                                                        <span className="text-[10px] text-muted-foreground">{issue.profiles?.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {issue.stores ? (
                                                        <Badge variant="outline" className="text-xs font-normal">
                                                            {issue.stores.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs italic">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm line-clamp-2 hover:line-clamp-none transition-all cursor-help" title={issue.description}>
                                                        {issue.description}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={issue.status === 'resolved' ? 'success' : 'secondary'}
                                                        className={cn(
                                                            "gap-1",
                                                            issue.status === 'pending' && "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                                        )}
                                                    >
                                                        {issue.status === 'resolved' ? (
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        ) : (
                                                            <Clock className="h-3 w-3" />
                                                        )}
                                                        {issue.status === 'resolved' ? 'Resolvido' : 'Pendente'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {issue.status === 'pending' ? (
                                                                <DropdownMenuItem onClick={() => updateIssue({ id: issue.id, status: 'resolved' })}>
                                                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                                                    Marcar como Resolvido
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => updateIssue({ id: issue.id, status: 'pending' })}>
                                                                    <Clock className="mr-2 h-4 w-4 text-orange-500" />
                                                                    Reabrir
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() => setIssueToDelete(issue.id)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!issueToDelete} onOpenChange={(open) => !open && setIssueToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir reporte?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o reporte do sistema.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

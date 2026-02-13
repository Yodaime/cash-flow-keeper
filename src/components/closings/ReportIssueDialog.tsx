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
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Loader2, Send } from 'lucide-react';
import { useCreateClosingIssue } from '@/hooks/useClosingIssues';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useStores } from '@/hooks/useStores';

interface ReportIssueDialogProps {
    onSuccess?: () => void;
}

export function ReportIssueDialog({ onSuccess }: ReportIssueDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [selectedStore, setSelectedStore] = useState<string>('');
    const { mutate: createIssue, isPending } = useCreateClosingIssue();
    const { data: stores } = useStores();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        createIssue({
            description,
            store_id: selectedStore || undefined
        }, {
            onSuccess: () => {
                setIsOpen(false);
                setDescription('');
                setSelectedStore('');
                onSuccess?.();
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10">
                    <AlertTriangle className="h-4 w-4" />
                    Reportar Problema
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Reportar Problema</DialogTitle>
                    <DialogDescription>
                        Descreva o problema encontrado ou faça uma observação para a equipe administrativa.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Loja (Opcional)</label>
                        <Select value={selectedStore} onValueChange={setSelectedStore}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma loja se aplicável" />
                            </SelectTrigger>
                            <SelectContent>
                                {stores?.map((store) => (
                                    <SelectItem key={store.id} value={store.id}>
                                        {store.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descrição do Problema</label>
                        <Textarea
                            placeholder="Descreva detalhadamente o que aconteceu..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="resize-none min-h-[120px]"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={isPending || !description.trim()}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Enviar Reporte
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

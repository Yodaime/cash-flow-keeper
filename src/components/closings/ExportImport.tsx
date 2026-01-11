import { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useStores } from '@/hooks/useStores';

interface ClosingRow {
  date: string;
  store_code: string;
  expected_value: number;
  counted_value: number;
  observations?: string;
}

interface ExportImportProps {
  closings: Array<{
    id: string;
    date: string;
    expected_value: number;
    counted_value: number;
    difference: number;
    status: string;
    observations: string | null;
    stores?: { name: string; code: string } | null;
  }>;
}

export function ExportImport({ closings }: ExportImportProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ClosingRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: stores } = useStores();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const exportToCSV = () => {
    if (!closings || closings.length === 0) {
      toast.error('Nenhum fechamento para exportar');
      return;
    }

    const headers = ['Data', 'Código Loja', 'Loja', 'Valor Esperado', 'Valor Contado', 'Diferença', 'Status', 'Observações'];
    
    const rows = closings.map(closing => [
      format(new Date(closing.date), 'yyyy-MM-dd'),
      closing.stores?.code || '',
      closing.stores?.name || '',
      closing.expected_value.toString().replace('.', ','),
      closing.counted_value.toString().replace('.', ','),
      closing.difference.toString().replace('.', ','),
      closing.status,
      closing.observations || ''
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fechamentos_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`;
    link.click();
    
    toast.success(`${closings.length} fechamentos exportados com sucesso!`);
  };

  const downloadTemplate = () => {
    const headers = ['Data', 'Código Loja', 'Valor Esperado', 'Valor Contado', 'Observações'];
    const exampleRow = ['29/12/2024', 'JC001', '5000,00', '4980,50', 'Exemplo de observação'];
    
    const csvContent = [
      headers.join(';'),
      exampleRow.map(cell => `"${cell}"`).join(';')
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_importacao_fechamentos.csv';
    link.click();
    
    toast.success('Modelo de planilha baixado!');
  };

  const parseCSV = (text: string): ClosingRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const rows: ClosingRow[] = [];
    const parseErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells = line.split(';').map(cell => cell.replace(/^"|"$/g, '').trim());
      
      if (cells.length < 4) {
        parseErrors.push(`Linha ${i + 1}: Número insuficiente de colunas`);
        continue;
      }

      const [dateStr, storeCode, expectedStr, countedStr, observations] = cells;

      // Validate and parse date (accepts DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD)
      let parsedDate: string | null = null;
      
      // Brazilian format: DD/MM/YYYY or DD-MM-YYYY
      const brDateMatch = dateStr.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
      // ISO format: YYYY-MM-DD
      const isoDateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      
      if (brDateMatch) {
        const [, day, month, year] = brDateMatch;
        parsedDate = `${year}-${month}-${day}`;
      } else if (isoDateMatch) {
        parsedDate = dateStr;
      }
      
      if (!parsedDate) {
        parseErrors.push(`Linha ${i + 1}: Data inválida "${dateStr}". Use formato DD/MM/YYYY`);
        continue;
      }

      // Validate store code
      const store = stores?.find(s => s.code === storeCode);
      if (!store) {
        parseErrors.push(`Linha ${i + 1}: Código de loja "${storeCode}" não encontrado`);
        continue;
      }

      // Parse values (handle Brazilian number format)
      const expectedValue = parseFloat(expectedStr.replace(/\./g, '').replace(',', '.'));
      const countedValue = parseFloat(countedStr.replace(/\./g, '').replace(',', '.'));

      if (isNaN(expectedValue) || isNaN(countedValue)) {
        parseErrors.push(`Linha ${i + 1}: Valores numéricos inválidos`);
        continue;
      }

      rows.push({
        date: parsedDate,
        store_code: storeCode,
        expected_value: expectedValue,
        counted_value: countedValue,
        observations: observations || undefined,
      });
    }

    setErrors(parseErrors);
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsedData = parseCSV(text);
      setPreviewData(parsedData);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('Nenhum dado válido para importar');
      return;
    }

    setIsImporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const TOLERANCE = 10;

      for (const row of previewData) {
        const store = stores?.find(s => s.code === row.store_code);
        if (!store) continue;

        const difference = row.counted_value - row.expected_value;
        let status: 'ok' | 'atencao' | 'pendente' = 'pendente';
        
        if (Math.abs(difference) <= TOLERANCE) {
          status = 'ok';
        } else if (difference < -TOLERANCE) {
          status = 'atencao';
        }

        const { error } = await supabase.from('cash_closings').insert({
          date: row.date,
          store_id: store.id,
          user_id: user.id,
          expected_value: row.expected_value,
          counted_value: row.counted_value,
          difference,
          status,
          observations: row.observations || null,
        });

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['closings'] });
      toast.success(`${previewData.length} fechamentos importados com sucesso!`);
      setIsImportDialogOpen(false);
      setPreviewData([]);
      setErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      toast.error(`Erro ao importar: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setPreviewData([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-2" onClick={exportToCSV}>
        <Download className="h-4 w-4" />
        Exportar
      </Button>

      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        setIsImportDialogOpen(open);
        if (!open) resetImport();
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Importar Fechamentos</DialogTitle>
            <DialogDescription>
              Importe fechamentos a partir de uma planilha CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-dashed bg-muted/30">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Arquivo CSV</p>
                  <p className="text-sm text-muted-foreground">
                    Colunas: Data, Código Loja, Valor Esperado, Valor Contado, Observações
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                Baixar Modelo
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />

            {errors.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="font-medium text-destructive text-sm mb-2">Erros encontrados:</p>
                <ul className="text-sm text-destructive space-y-1">
                  {errors.slice(0, 5).map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                  {errors.length > 5 && <li>... e mais {errors.length - 5} erros</li>}
                </ul>
              </div>
            )}

            {previewData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">
                    {previewData.length} registro(s) prontos para importar
                  </p>
                  <Button variant="ghost" size="sm" onClick={resetImport}>
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>
                <div className="max-h-48 overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Data</th>
                        <th className="px-3 py-2 text-left">Loja</th>
                        <th className="px-3 py-2 text-right">Esperado</th>
                        <th className="px-3 py-2 text-right">Contado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{row.date}</td>
                          <td className="px-3 py-2">{row.store_code}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatCurrency(row.expected_value)}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatCurrency(row.counted_value)}</td>
                        </tr>
                      ))}
                      {previewData.length > 10 && (
                        <tr className="border-t">
                          <td colSpan={4} className="px-3 py-2 text-center text-muted-foreground">
                            ... e mais {previewData.length - 10} registros
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="gold" 
                onClick={handleImport} 
                disabled={previewData.length === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar {previewData.length} registro(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PreviewDataTable, ColumnConfig, CellData } from '@/components/PreviewDataTable';
import { Download, X, ShieldAlert, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  onAnonymize: () => void;
  columns: ColumnConfig[];
  rows: Array<Record<string, CellData>>;
  onColumnToggle: (columnName: string) => void;
  isProcessing?: boolean;
  fileName?: string;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  onClose,
  onAnonymize,
  columns,
  rows,
  onColumnToggle,
  isProcessing = false,
  fileName = 'bestand',
}) => {
  const piiColumnCount = columns.filter((c) => c.isPII).length;
  const totalColumns = columns.length;
  
  // Calculate total PII detections
  const totalPIIDetections = columns.reduce((sum, col) => {
    if (col.stats) {
      return sum + Object.values(col.stats).reduce((colSum, count) => colSum + count, 0);
    }
    return sum;
  }, 0);

  // Get columns with most PII
  const columnsWithMostPII = [...columns]
    .filter((col) => col.stats && Object.keys(col.stats).length > 0)
    .sort((a, b) => {
      const aTotal = Object.values(a.stats || {}).reduce((sum, count) => sum + count, 0);
      const bTotal = Object.values(b.stats || {}).reduce((sum, count) => sum + count, 0);
      return bTotal - aTotal;
    })
    .slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            PII Analyse: {fileName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base mt-2">
            Hieronder zie je de eerste 10 rijen van je bestand met alle gedetecteerde PII gemarkeerd.
            Selecteer welke kolommen je wilt anonimiseren.
          </DialogDescription>
        </DialogHeader>

        {/* Statistics Panel */}
        <div className="px-6 py-4 bg-muted/20 border-b border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Totaal Kolommen</div>
              <div className="text-2xl font-bold text-foreground">{totalColumns}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Geselecteerd</div>
              <div className="text-2xl font-bold text-primary">{piiColumnCount}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">PII Gedetecteerd</div>
              <div className="text-2xl font-bold text-orange-600">{totalPIIDetections}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="flex items-center gap-2">
                {piiColumnCount > 0 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Klaar</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-600">Selecteer kolommen</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {columnsWithMostPII.length > 0 && (
            <Alert className="mt-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-900 dark:text-orange-100">
                <strong>Meeste PII gevonden in:</strong>{' '}
                {columnsWithMostPII.map((col, idx) => {
                  const total = Object.values(col.stats || {}).reduce((sum, count) => sum + count, 0);
                  return (
                    <span key={col.name}>
                      {idx > 0 && ', '}
                      <Badge variant="outline" className="ml-1">
                        {col.name} ({total})
                      </Badge>
                    </span>
                  );
                })}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          <PreviewDataTable
            columns={columns}
            rows={rows}
            onColumnToggle={onColumnToggle}
          />
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-white dark:bg-gray-950 flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {piiColumnCount > 0 ? (
              <span>
                <strong className="text-primary">{piiColumnCount}</strong> kolom(men) worden geanonimiseerd
              </span>
            ) : (
              <span className="text-yellow-600">⚠️ Selecteer minimaal 1 kolom om te anonimiseren</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              <X className="w-4 h-4 mr-2" />
              Annuleer
            </Button>
            <Button
              variant="cta"
              onClick={onAnonymize}
              disabled={isProcessing || piiColumnCount === 0}
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bezig met verwerken...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Anonimiseer en Download ({piiColumnCount} kolommen)
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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
import { PreviewDataTable, ColumnConfig } from '@/components/PreviewDataTable';
import { Download, X, ShieldAlert, Loader2 } from 'lucide-react';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  onAnonymize: () => void;
  columns: ColumnConfig[];
  rows: Record<string, string | number | null>[];
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

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-3xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Preview: {fileName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Controleer welke kolommen geanonimiseerd moeten worden. Klik op de toggles
            om kolommen aan of uit te zetten. Gemarkeerde kolommen worden automatisch
            gedetecteerd als mogelijk PII.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4 flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{rows.length}</strong> rijen weergegeven
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              <strong className="text-primary">{piiColumnCount}</strong> kolommen geselecteerd
              voor anonimisatie
            </span>
          </div>

          <PreviewDataTable
            columns={columns}
            rows={rows}
            onColumnToggle={onColumnToggle}
          />
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/30">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Annuleer
          </Button>
          <Button
            variant="cta"
            onClick={onAnonymize}
            disabled={isProcessing || piiColumnCount === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Bezig met verwerken...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Anonimiseer en Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

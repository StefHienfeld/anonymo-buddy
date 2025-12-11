import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface ColumnConfig {
  name: string;
  isPII: boolean;
  suggestedPII: boolean;
}

interface PreviewDataTableProps {
  columns: ColumnConfig[];
  rows: Record<string, string | number | null>[];
  onColumnToggle: (columnName: string) => void;
}

export const PreviewDataTable: React.FC<PreviewDataTableProps> = ({
  columns,
  rows,
  onColumnToggle,
}) => {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((col) => (
                <TableHead
                  key={col.name}
                  className={cn(
                    'whitespace-nowrap py-4 px-4 min-w-[180px]',
                    col.isPII && 'bg-primary/5'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{col.name}</span>
                      {col.suggestedPII && (
                        <Badge variant="outline" className="badge-pii text-xs">
                          Auto-detectie
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={col.isPII}
                        onCheckedChange={() => onColumnToggle(col.name)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {col.isPII ? (
                          <>
                            <ShieldAlert className="w-3 h-3 text-primary" />
                            Anonimiseren
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3 text-success" />
                            Behouden
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className="hover:bg-muted/30 transition-colors"
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.name}
                    className={cn(
                      'py-3 px-4 font-mono text-sm',
                      col.isPII && 'bg-primary/5 text-primary'
                    )}
                  >
                    {col.isPII ? (
                      <span className="opacity-60">[{getMaskLabel(col.name)}]</span>
                    ) : (
                      <span>{row[col.name] ?? '—'}</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

function getMaskLabel(columnName: string): string {
  const lower = columnName.toLowerCase();
  if (lower.includes('naam') || lower.includes('name')) return 'NAAM';
  if (lower.includes('mail')) return 'EMAIL';
  if (lower.includes('tel') || lower.includes('mobiel')) return 'TEL';
  if (lower.includes('iban') || lower.includes('rekening')) return 'IBAN';
  if (lower.includes('bsn') || lower.includes('sofi')) return 'BSN';
  if (lower.includes('adres') || lower.includes('postcode')) return 'ADRES';
  if (lower.includes('datum') || lower.includes('geboren')) return 'DATUM';
  if (lower.includes('premie') || lower.includes('salaris') || lower.includes('bedrag')) return 'BEDRAG';
  if (lower.includes('bedrijf') || lower.includes('organisatie')) return 'ORG';
  return 'PII';
}

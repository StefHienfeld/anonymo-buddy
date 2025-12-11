import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ColumnConfig {
  name: string;
  isPII: boolean;
  suggestedPII: boolean;
  stats?: Record<string, number>;
}

export interface CellData {
  original: string;
  entities: Array<{
    type: string;
    start: number;
    end: number;
    score: number;
    text: string;
  }>;
  preview: string;
  has_pii: boolean;
}

interface PreviewDataTableProps {
  columns: ColumnConfig[];
  rows: Array<Record<string, CellData>>;
  onColumnToggle: (columnName: string) => void;
  showAnonymized?: boolean;
}

export const PreviewDataTable: React.FC<PreviewDataTableProps> = ({
  columns,
  rows,
  onColumnToggle,
  showAnonymized = false,
}) => {
  const [previewMode, setPreviewMode] = useState(showAnonymized);

  const getEntityColor = (entityType: string): string => {
    const colorMap: Record<string, string> = {
      'PERSON': 'bg-yellow-100 text-yellow-900 border-yellow-300',
      'NL_BSN': 'bg-red-100 text-red-900 border-red-300',
      'EMAIL_ADDRESS': 'bg-blue-100 text-blue-900 border-blue-300',
      'NL_PHONE': 'bg-blue-100 text-blue-900 border-blue-300',
      'PHONE_NUMBER': 'bg-blue-100 text-blue-900 border-blue-300',
      'NL_IBAN': 'bg-purple-100 text-purple-900 border-purple-300',
      'IBAN_CODE': 'bg-purple-100 text-purple-900 border-purple-300',
      'NL_POSTCODE': 'bg-green-100 text-green-900 border-green-300',
      'LOCATION': 'bg-green-100 text-green-900 border-green-300',
      'ORGANIZATION': 'bg-orange-100 text-orange-900 border-orange-300',
      'NL_POLICY_NUMBER': 'bg-pink-100 text-pink-900 border-pink-300',
      'DATE_TIME': 'bg-cyan-100 text-cyan-900 border-cyan-300',
    };
    return colorMap[entityType] || 'bg-gray-100 text-gray-900 border-gray-300';
  };

  const getEntityLabel = (entityType: string): string => {
    const labelMap: Record<string, string> = {
      'PERSON': 'Naam',
      'NL_BSN': 'BSN',
      'EMAIL_ADDRESS': 'Email',
      'NL_PHONE': 'Telefoon',
      'PHONE_NUMBER': 'Telefoon',
      'NL_IBAN': 'IBAN',
      'IBAN_CODE': 'IBAN',
      'NL_POSTCODE': 'Postcode',
      'LOCATION': 'Locatie',
      'ORGANIZATION': 'Organisatie',
      'NL_POLICY_NUMBER': 'Polisnummer',
      'DATE_TIME': 'Datum',
    };
    return labelMap[entityType] || entityType;
  };

  const renderCellContent = (cellData: CellData, columnIsPII: boolean) => {
    if (!cellData || !cellData.original) {
      return <span className="text-muted-foreground">—</span>;
    }

    // Als preview mode en kolom is geselecteerd, toon geanonimiseerde versie
    if (previewMode && columnIsPII) {
      return (
        <span className="font-mono text-sm opacity-80">
          {cellData.preview || cellData.original}
        </span>
      );
    }

    // Toon originele data met highlighting
    if (cellData.entities && cellData.entities.length > 0) {
      const text = cellData.original;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;

      // Sorteer entities op start positie
      const sortedEntities = [...cellData.entities].sort((a, b) => a.start - b.start);

      sortedEntities.forEach((entity, idx) => {
        // Voeg text voor entity toe
        if (entity.start > lastIndex) {
          parts.push(
            <span key={`text-${idx}`}>
              {text.substring(lastIndex, entity.start)}
            </span>
          );
        }

        // Voeg gehighlight entity toe met tooltip
        const entityText = text.substring(entity.start, entity.end);
        parts.push(
          <TooltipProvider key={`entity-${idx}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'px-1 py-0.5 rounded border font-semibold cursor-help',
                    getEntityColor(entity.type)
                  )}
                >
                  {entityText}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-semibold">{getEntityLabel(entity.type)}</div>
                  <div className="text-muted-foreground">
                    Confidence: {(entity.score * 100).toFixed(0)}%
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

        lastIndex = entity.end;
      });

      // Voeg resterende text toe
      if (lastIndex < text.length) {
        parts.push(<span key="text-end">{text.substring(lastIndex)}</span>);
      }

      return <div className="font-mono text-sm leading-relaxed">{parts}</div>;
    }

    return <span className="font-mono text-sm">{cellData.original}</span>;
  };

  const getColumnStats = (col: ColumnConfig) => {
    if (!col.stats || Object.keys(col.stats).length === 0) return null;

    const totalDetections = Object.values(col.stats).reduce((sum, count) => sum + count, 0);
    const topEntities = Object.entries(col.stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    return (
      <div className="text-xs text-muted-foreground mt-1">
        {totalDetections} PII gedetecteerd:{' '}
        {topEntities.map(([type, count]) => `${count} ${getEntityLabel(type)}`).join(', ')}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Eerste 10 rijen • Scroll horizontaal voor alle kolommen
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewMode(!previewMode)}
          className="gap-2"
        >
          {previewMode ? (
            <>
              <Eye className="w-4 h-4" />
              Toon Origineel
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              Preview Anonimisatie
            </>
          )}
        </Button>
      </div>

      <div className="w-full overflow-x-auto border border-border/50 rounded-lg">
        <table className="w-full border-collapse bg-white dark:bg-gray-950">
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.name}
                  className={cn(
                    'border border-border/50 px-3 py-3 text-left min-w-[200px]',
                    col.isPII && 'bg-primary/5'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {col.name}
                      </span>
                      {col.suggestedPII && (
                        <Badge variant="destructive" className="text-xs">
                          PII Gevonden
                        </Badge>
                      )}
                    </div>
                    {getColumnStats(col)}
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
                            <ShieldCheck className="w-3 h-3 text-green-600" />
                            Behouden
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'hover:bg-muted/30 transition-colors',
                  rowIndex % 2 === 1 && 'bg-muted/20'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.name}
                    className={cn(
                      'border border-border/50 px-3 py-2',
                      col.isPII && previewMode && 'bg-primary/5'
                    )}
                  >
                    {renderCellContent(row[col.name], col.isPII)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-900 border border-yellow-300">
            Naam
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-red-100 text-red-900 border border-red-300">
            BSN
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-900 border border-blue-300">
            Email/Tel
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-green-100 text-green-900 border border-green-300">
            Adres
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-purple-100 text-purple-900 border border-purple-300">
            IBAN
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-pink-100 text-pink-900 border border-pink-300">
            Polis
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  acceptedFile?: File | null;
}

const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  isLoading = false,
  acceptedFile = null,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError('Helaas, in deze versie ondersteunen we alleen Excel en CSV bestanden.');
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('Het bestand mag maximaal 50MB zijn.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'drop-zone relative cursor-pointer',
          isDragging && 'drop-zone-active',
          acceptedFile && !error && 'drop-zone-success',
          error && 'border-destructive bg-destructive/5'
        )}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-4">
          {acceptedFile && !error ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{acceptedFile.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatFileSize(acceptedFile.size)}
                </p>
              </div>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center animate-shake">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-destructive">{error}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Probeer een .xlsx, .xls of .csv bestand
                </p>
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                'w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center transition-transform duration-300',
                isDragging && 'scale-110'
              )}>
                {isDragging ? (
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                ) : (
                  <Upload className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">
                  {isDragging ? 'Laat los om te uploaden' : 'Sleep hier je Excel of CSV bestand'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  of klik om een bestand te selecteren
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                {['.xlsx', '.xls', '.csv'].map((ext) => (
                  <span
                    key={ext}
                    className="px-3 py-1 text-xs font-medium bg-muted rounded-full text-muted-foreground"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

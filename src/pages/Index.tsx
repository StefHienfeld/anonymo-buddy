import React, { useState, useCallback } from 'react';
import { FileUploadZone } from '@/components/FileUploadZone';
import { PIIFilterCheckboxes, PIIFilter, DEFAULT_PII_FILTERS, AnonymizeOptions } from '@/components/PIIFilterCheckboxes';
import { PreviewModal } from '@/components/PreviewModal';
import { ColumnConfig, CellData } from '@/components/PreviewDataTable';
import { Button } from '@/components/ui/button';
import { deepAnalyzeFile, mockAnonymizeFile, DeepAnalyzeData } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Loader2, Upload, Eye, Lock, Zap, FileSpreadsheet, ArrowRight } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [filters, setFilters] = useState<PIIFilter[]>(DEFAULT_PII_FILTERS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [analyzeData, setAnalyzeData] = useState<DeepAnalyzeData | null>(null);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    toast({
      title: 'Bestand geselecteerd',
      description: selectedFile.name,
    });
  }, [toast]);

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // Get current filter options
      const options = filters.reduce<AnonymizeOptions>(
        (acc, f) => ({ ...acc, [f.id]: f.enabled }),
        {}
      );

      // Use deep analyze endpoint
      const response = await deepAnalyzeFile(file, options);
      setAnalyzeData(response);
      
      // Initialize column configs with stats from deep analyze
      const columnConfigs: ColumnConfig[] = response.columns.map(col => ({
        name: col,
        isPII: response.suggested_pii_columns.includes(col),
        suggestedPII: response.suggested_pii_columns.includes(col),
        stats: response.column_analysis[col] || {},
      }));
      setColumns(columnConfigs);
      setPreviewOpen(true);

      // Count total PII detections
      const totalPII = Object.values(response.column_analysis).reduce(
        (sum, stats) => sum + Object.values(stats).reduce((s, c) => s + c, 0),
        0
      );

      toast({
        title: 'Diepgaande analyse voltooid',
        description: `${totalPII} PII items gedetecteerd in ${response.suggested_pii_columns.length} kolommen`,
      });
    } catch (error) {
      console.error('Analyze error:', error);
      toast({
        variant: 'destructive',
        title: 'Fout bij analyse',
        description: 'Er is een fout opgetreden bij het analyseren van het bestand.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleColumnToggle = (columnName: string) => {
    setColumns(cols =>
      cols.map(c =>
        c.name === columnName ? { ...c, isPII: !c.isPII } : c
      )
    );
  };

  const handleAnonymize = async () => {
    if (!file || !analyzeData) return;

    setIsProcessing(true);
    try {
      const targetColumns = columns.filter(c => c.isPII).map(c => c.name);
      const options = filters.reduce<AnonymizeOptions>(
        (acc, f) => ({ ...acc, [f.id]: f.enabled }),
        {}
      );

      await mockAnonymizeFile(file, options, targetColumns);

      toast({
        title: '✅ Download gestart',
        description: `anon_${file.name} wordt gedownload met ${targetColumns.length} geanonimiseerde kolommen`,
      });

      // Reset state
      setPreviewOpen(false);
      setFile(null);
      setAnalyzeData(null);
      setColumns([]);
      setFilters(DEFAULT_PII_FILTERS); // Reset filters
    } catch (error) {
      console.error('Anonymize error:', error);
      toast({
        variant: 'destructive',
        title: 'Fout bij anonimisatie',
        description: 'Er is een fout opgetreden bij het anonimiseren van het bestand.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setAnalyzeData(null);
    setColumns([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Hidden Hienfeld</h1>
                <p className="text-xs text-muted-foreground">Data Anonimisatie Tool</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              <span>Verwerking in-memory • Geen data opslag</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Bescherm privacygevoelige data
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload je Excel of CSV bestand en laat onze AI automatisch persoonlijke 
              informatie detecteren en anonimiseren volgens AVG/GDPR-richtlijnen.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
            {[
              { icon: Eye, title: 'Preview eerst', desc: 'Controleer wat er geanonimiseerd wordt' },
              { icon: Zap, title: 'Smart detectie', desc: 'AI herkent automatisch PII data' },
              { icon: Lock, title: 'Server-side', desc: 'Veilige processing op server' },
            ].map((feature, i) => (
              <div key={i} className="floating-card text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Upload Card */}
          <div className="floating-card space-y-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Stap 1: Upload bestand</h3>
            </div>
            
            <FileUploadZone
              onFileSelect={handleFileSelect}
              isLoading={isAnalyzing}
              acceptedFile={file}
            />
          </div>

          {/* Filters Card */}
          <div className="floating-card space-y-6 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Stap 2: Selecteer PII categorieën</h3>
            </div>

            <PIIFilterCheckboxes
              filters={filters}
              onFilterChange={setFilters}
            />
          </div>

          {/* Action Button */}
          <div className="flex justify-center animate-fade-up" style={{ animationDelay: '400ms' }}>
            <Button
              variant="cta"
              size="xl"
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className="min-w-[280px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyseren...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload & Analyseer
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      {analyzeData && (
        <PreviewModal
          open={previewOpen}
          onClose={handleClosePreview}
          onAnonymize={handleAnonymize}
          columns={columns}
          rows={analyzeData.rows}
          onColumnToggle={handleColumnToggle}
          isProcessing={isProcessing}
          fileName={file?.name}
        />
      )}
    </div>
  );
};

export default Index;

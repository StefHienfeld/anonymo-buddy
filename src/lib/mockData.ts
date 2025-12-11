// Mock data for demonstration - in production this would come from the backend

export interface PreviewResponse {
  columns: string[];
  rows: Record<string, string | number | null>[];
  suggested_pii_columns: string[];
}

// Simulated PII keywords that the backend would use for detection
const PII_KEYWORDS = [
  'naam', 'name', 'klant', 'cliënt', 'mail', 'tel', 'mobiel',
  'iban', 'rekening', 'adres', 'postcode', 'woonplaats',
  'geboren', 'geboorte', 'bsn', 'sofi', 'premie', 'salaris', 'inkomen', 'polis'
];

// Sample data for demonstration
const SAMPLE_DATA: PreviewResponse = {
  columns: ['KlantNaam', 'Email', 'Telefoonnummer', 'IBAN', 'Postcode', 'GeboorteDatum', 'Polisnummer', 'MaandPremie', 'Opmerkingen'],
  rows: [
    {
      KlantNaam: 'J. de Vries',
      Email: 'j.devries@email.nl',
      Telefoonnummer: '06-12345678',
      IBAN: 'NL91ABNA0417164300',
      Postcode: '1234 AB',
      GeboorteDatum: '15-03-1985',
      Polisnummer: 'POL-2024-001',
      MaandPremie: 125.50,
      Opmerkingen: 'Gesproken met P. Jansen over de premie'
    },
    {
      KlantNaam: 'M. van den Berg',
      Email: 'mvdberg@gmail.com',
      Telefoonnummer: '+31 6 87654321',
      IBAN: 'NL20INGB0001234567',
      Postcode: '5678 CD',
      GeboorteDatum: '22-07-1990',
      Polisnummer: 'POL-2024-002',
      MaandPremie: 98.00,
      Opmerkingen: 'Aanvraag goedgekeurd door K. Bakker'
    },
    {
      KlantNaam: 'A. Janssen',
      Email: 'a.janssen@werk.nl',
      Telefoonnummer: '020-5551234',
      IBAN: 'NL44RABO0123456789',
      Postcode: '9012 EF',
      GeboorteDatum: '08-11-1978',
      Polisnummer: 'POL-2024-003',
      MaandPremie: 175.25,
      Opmerkingen: null
    },
    {
      KlantNaam: 'S. de Boer',
      Email: 's.deboer@hotmail.com',
      Telefoonnummer: '06-11223344',
      IBAN: 'NL69TRIO0786543210',
      Postcode: '3456 GH',
      GeboorteDatum: '30-01-1995',
      Polisnummer: 'POL-2024-004',
      MaandPremie: 89.99,
      Opmerkingen: 'Contact opnemen met familie Smit'
    },
    {
      KlantNaam: 'R. Visser',
      Email: 'r.visser@company.com',
      Telefoonnummer: '+31 20 1234567',
      IBAN: 'NL18ABNA0987654321',
      Postcode: '7890 IJ',
      GeboorteDatum: '14-06-1982',
      Polisnummer: 'POL-2024-005',
      MaandPremie: 210.00,
      Opmerkingen: 'Verwijzing van mevrouw de Groot'
    },
  ],
  suggested_pii_columns: ['KlantNaam', 'Email', 'Telefoonnummer', 'IBAN', 'Postcode', 'GeboorteDatum', 'MaandPremie']
};

// Detect PII columns based on column name
function detectPIIColumns(columns: string[]): string[] {
  return columns.filter(col => {
    const lower = col.toLowerCase();
    return PII_KEYWORDS.some(keyword => lower.includes(keyword));
  });
}

// Simulate backend preview endpoint
export async function mockPreviewFile(file: File): Promise<PreviewResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In a real implementation, this would parse the file
  // For demo, we return sample data
  return SAMPLE_DATA;
}

// Simulate backend anonymize endpoint
export async function mockAnonymizeFile(
  file: File,
  targetColumns: string[],
  options: Record<string, boolean>
): Promise<Blob> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // In a real implementation, this would process the file
  // For demo, we return a mock blob
  const mockContent = `Anonymized file with columns: ${targetColumns.join(', ')}`;
  return new Blob([mockContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

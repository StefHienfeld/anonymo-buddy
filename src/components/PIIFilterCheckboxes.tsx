import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  User,
  Calendar,
  Banknote,
  Building2,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Fingerprint,
  CheckSquare,
  Square,
} from 'lucide-react';

export interface PIIFilter {
  id: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
}

export interface AnonymizeOptions {
  namen?: boolean;
  dates?: boolean;
  financial?: boolean;
  bedrijf?: boolean;
  iban?: boolean;
  postcode?: boolean;
  email?: boolean;
  tel?: boolean;
  bsn?: boolean;
  [key: string]: boolean | undefined;
}

export const DEFAULT_PII_FILTERS: PIIFilter[] = [
  { id: 'namen', label: 'Namen (Personen)', icon: User, enabled: true },
  { id: 'dates', label: 'Datum / Tijd', icon: Calendar, enabled: true },
  { id: 'financial', label: 'Financieel (Bedragen, Premies)', icon: Banknote, enabled: true },
  { id: 'bedrijf', label: 'Organisaties (Bedrijfsnamen)', icon: Building2, enabled: true },
  { id: 'iban', label: 'IBAN / Bankrekening', icon: CreditCard, enabled: true },
  { id: 'postcode', label: 'Postcode / Adres', icon: MapPin, enabled: true },
  { id: 'email', label: 'E-mail', icon: Mail, enabled: true },
  { id: 'tel', label: 'Telefoonnummers', icon: Phone, enabled: true },
  { id: 'bsn', label: 'BSN (Burger Service Nummer)', icon: Fingerprint, enabled: true },
];

interface PIIFilterCheckboxesProps {
  filters: PIIFilter[];
  onFilterChange: (filters: PIIFilter[]) => void;
}

export const PIIFilterCheckboxes: React.FC<PIIFilterCheckboxesProps> = ({
  filters,
  onFilterChange,
}) => {
  const allSelected = filters.every((f) => f.enabled);
  const noneSelected = filters.every((f) => !f.enabled);

  const handleToggle = (id: string) => {
    onFilterChange(
      filters.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const handleSelectAll = () => {
    onFilterChange(filters.map((f) => ({ ...f, enabled: true })));
  };

  const handleDeselectAll = () => {
    onFilterChange(filters.map((f) => ({ ...f, enabled: false })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          PII Categorieën
        </h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={allSelected}
            className="text-xs"
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1" />
            Alles selecteren
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            disabled={noneSelected}
            className="text-xs"
          >
            <Square className="w-3.5 h-3.5 mr-1" />
            Alles deselecteren
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <label
              key={filter.id}
              className={`
                flex items-center gap-3 p-3 rounded-xl cursor-pointer
                transition-all duration-200 border
                ${
                  filter.enabled
                    ? 'bg-primary/5 border-primary/20 shadow-sm'
                    : 'bg-card border-transparent hover:bg-muted'
                }
              `}
            >
              <Checkbox
                id={filter.id}
                checked={filter.enabled}
                onCheckedChange={() => handleToggle(filter.id)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Icon
                className={`w-4 h-4 ${
                  filter.enabled ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <Label
                htmlFor={filter.id}
                className={`text-sm cursor-pointer ${
                  filter.enabled ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {filter.label}
              </Label>
            </label>
          );
        })}
      </div>
    </div>
  );
};

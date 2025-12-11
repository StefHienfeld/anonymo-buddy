import { AnonymizeOptions } from "@/components/PIIFilterCheckboxes";
import { CellData } from "@/components/PreviewDataTable";

export interface PreviewData {
  columns: string[];
  rows: Record<string, any>[];
  suggested_pii_columns: string[];
}

export interface DeepAnalyzeData {
  columns: string[];
  rows: Array<Record<string, CellData>>;
  column_analysis: Record<string, Record<string, number>>;
  suggested_pii_columns: string[];
}

const API_URL = "http://localhost:8000/api";

export const mockPreviewFile = async (file: File): Promise<PreviewData> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_URL}/preview`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Fout bij uploaden voor preview");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Preview error:", error);
    throw error;
  }
};

export const deepAnalyzeFile = async (
  file: File,
  options: AnonymizeOptions
): Promise<DeepAnalyzeData> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("options", JSON.stringify(options));

  try {
    const response = await fetch(`${API_URL}/deep-analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Fout bij deep analyze");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Deep analyze error:", error);
    throw error;
  }
};

export const mockAnonymizeFile = async (
  file: File,
  options: AnonymizeOptions,
  selectedColumns: string[]
): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("options", JSON.stringify(options));
  formData.append("target_columns", JSON.stringify(selectedColumns));

  try {
    const response = await fetch(`${API_URL}/anonymize`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Fout bij anonimiseren");
    }

    // Trigger de download direct in de browser
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anon_${file.name}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Anonymize error:", error);
    throw error;
  }
};

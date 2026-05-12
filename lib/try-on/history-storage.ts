import type { GarmentCategory } from "@/lib/try-on/types";

export type HistoryEntry = {
  id: string;
  createdAt: string;
  category: GarmentCategory;
  resultDataUrl: string;
};

const STORAGE_KEY = "starter-tryon-history-v1";
const MAX_ENTRIES = 40;

function safeParse(raw: string | null): HistoryEntry[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((row): row is HistoryEntry => {
      if (!row || typeof row !== "object") {
        return false;
      }

      const r = row as Record<string, unknown>;

      return (
        typeof r.id === "string"
        && typeof r.createdAt === "string"
        && typeof r.category === "string"
        && typeof r.resultDataUrl === "string"
      );
    });
  } catch {
    return [];
  }
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function appendHistory(entry: Omit<HistoryEntry, "id" | "createdAt">): HistoryEntry[] {
  const next: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  const merged = [next, ...loadHistory()].slice(0, MAX_ENTRIES);

  saveHistory(merged);

  return merged;
}

export function deleteHistoryEntry(id: string): HistoryEntry[] {
  const filtered = loadHistory().filter((row) => row.id !== id);

  saveHistory(filtered);

  return filtered;
}

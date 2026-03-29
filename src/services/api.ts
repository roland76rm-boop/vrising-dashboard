const BASE = (import.meta.env.VITE_API_URL as string | undefined) || '';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export interface ApiProgress {
  player_name:    string;
  gear_score:     number;
  hours_played:   number;
  blood_type:     string;
  blood_quality:  number;
  castle_level:   number;
  current_region: string;
  vbloods_killed: string[];
  castle_rooms:   Array<{ id: string; built: boolean }>;
  thralls:        string[];
  snapshot_time:  string | null;
}

export interface ApiLootItem {
  id:           number;
  item_name:    string;
  item_type:    string;
  rarity:       string;
  obtained_at:  string | null;
  obtained_from: string;
  notes:        string | null;
}

export interface ApiDashboard {
  progress:           ApiProgress;
  loot:               ApiLootItem[];
  gear_score_history: Array<{ date: string; value: number }>;
  last_updated:       string | null;
}

export const api = {
  /** Alle Dashboard-Daten holen */
  getDashboard: () => req<ApiDashboard>('/api/dashboard'),

  /** Fortschritt aktualisieren (Patch) */
  updateProgress: (data: Partial<ApiProgress>) =>
    req<ApiProgress>('/api/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Boss als besiegt markieren */
  killVBlood: (bossId: string) =>
    req<{ vbloods_killed: string[] }>(`/api/vblood/kill?boss_id=${encodeURIComponent(bossId)}`, {
      method: 'POST',
    }),

  /** Boss wieder als offen markieren */
  unkillVBlood: (bossId: string) =>
    req<{ vbloods_killed: string[] }>(`/api/vblood/kill?boss_id=${encodeURIComponent(bossId)}`, {
      method: 'DELETE',
    }),

  /** Item hinzufügen */
  addLoot: (item: {
    item_name: string;
    item_type: string;
    rarity: string;
    obtained_from?: string;
    notes?: string;
  }) =>
    req<ApiLootItem>('/api/loot', {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  /** Item löschen */
  deleteLoot: (id: number) =>
    req<{ ok: boolean }>(`/api/loot/${id}`, { method: 'DELETE' }),

  /** Health-Check */
  health: () => req<{ status: string }>('/api/health'),
};

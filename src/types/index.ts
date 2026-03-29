import type { Region } from '../data/vbloods';

export type BloodType =
  | 'Krieger'
  | 'Arbeiter'
  | 'Gelehrter'
  | 'Bestie'
  | 'Betrüger'
  | 'Bauer'
  | 'Brute'
  | 'Druid'
  | 'Dracula';

export interface LootItem {
  id: string;
  name: string;
  type: 'Waffe' | 'Rüstung' | 'Material' | 'Accessoire';
  rarity: 'Gewöhnlich' | 'Selten' | 'Episch' | 'Legendär';
  obtainedAt: string;       // ISO date string
  obtainedFrom: string;     // Boss-Name oder Zone
  notes?: string;
}

export interface CastleRoom {
  id: string;
  name: string;
  built: boolean;
}

export interface PlayerProgress {
  playerName: string;
  gearScore: number;
  gearScoreHistory: Array<{ date: string; value: number }>;
  vbloodsKilled: string[];        // IDs der besiegten VBloods
  hoursPlayed: number;
  currentBloodType: BloodType;
  bloodQuality: number;           // 0–100 %
  castleHeartLevel: number;       // 1–4
  castleRooms: CastleRoom[];
  thralls: string[];
  loot: LootItem[];
  currentRegion: Region;
  lastUpdated: string;            // ISO date string
}

export const DEFAULT_CASTLE_ROOMS: CastleRoom[] = [
  { id: 'sawmill',        name: 'Sägewerk',         built: false },
  { id: 'forge',          name: 'Schmiede',          built: false },
  { id: 'alchemy',        name: 'Alchemietisch',     built: false },
  { id: 'grinder',        name: 'Mahlwerk',          built: false },
  { id: 'loom',           name: 'Webstuhl',          built: false },
  { id: 'jewel',          name: 'Juwelentisch',      built: false },
  { id: 'research',       name: 'Forschungstisch',   built: false },
  { id: 'prison',         name: 'Kerker',            built: false },
  { id: 'throne',         name: 'Thron',             built: false },
  { id: 'trophy',         name: 'Trophäenraum',      built: false },
  { id: 'servant_coffin', name: 'Diener-Sarg',       built: false },
];

export const DEFAULT_PROGRESS: PlayerProgress = {
  playerName: 'Vampir',
  gearScore: 0,
  gearScoreHistory: [],
  vbloodsKilled: [],
  hoursPlayed: 0,
  currentBloodType: 'Krieger',
  bloodQuality: 0,
  castleHeartLevel: 1,
  castleRooms: DEFAULT_CASTLE_ROOMS,
  thralls: [],
  loot: [],
  currentRegion: 'Farbane Wälder',
  lastUpdated: new Date().toISOString(),
};

export type TabId = 'overview' | 'vbloods' | 'loot' | 'castle' | 'guide';

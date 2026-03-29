import { useState, useCallback, useEffect, useRef } from 'react';
import type { PlayerProgress, LootItem, CastleRoom } from '../types';
import { DEFAULT_PROGRESS, DEFAULT_CASTLE_ROOMS } from '../types';
import type { Region } from '../data/vbloods';
import { api } from '../services/api';
import type { ApiProgress, ApiDashboard } from '../services/api';

const STORAGE_KEY = 'vrising-progress';
const API_AVAILABLE = !!(import.meta.env.VITE_API_URL as string | undefined);

// ─── localStorage Fallback ────────────────────────────────────────────────────

function loadLocal(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PROGRESS;
}

function saveLocal(p: PlayerProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// ─── API → lokale Typen konvertieren ─────────────────────────────────────────

function fromApi(data: ApiDashboard): PlayerProgress {
  const p = data.progress;
  const rooms: CastleRoom[] = DEFAULT_CASTLE_ROOMS.map(def => {
    const saved = (p.castle_rooms || []).find((r: { id: string; built: boolean }) => r.id === def.id);
    return saved ? { ...def, built: saved.built } : def;
  });
  return {
    playerName:         p.player_name,
    gearScore:          p.gear_score,
    gearScoreHistory:   data.gear_score_history,
    vbloodsKilled:      p.vbloods_killed || [],
    hoursPlayed:        p.hours_played,
    currentBloodType:   p.blood_type as PlayerProgress['currentBloodType'],
    bloodQuality:       p.blood_quality,
    castleHeartLevel:   p.castle_level,
    castleRooms:        rooms,
    thralls:            p.thralls || [],
    loot:               data.loot.map(l => ({
      id:           String(l.id),
      name:         l.item_name,
      type:         l.item_type as LootItem['type'],
      rarity:       l.rarity as LootItem['rarity'],
      obtainedAt:   l.obtained_at || new Date().toISOString(),
      obtainedFrom: l.obtained_from,
      notes:        l.notes || undefined,
    })),
    currentRegion:  p.current_region as Region,
    lastUpdated:    p.snapshot_time || new Date().toISOString(),
  };
}

function toApiPatch(patch: Partial<PlayerProgress>): Partial<ApiProgress> {
  const out: Partial<ApiProgress> = {};
  if (patch.playerName    !== undefined) out.player_name    = patch.playerName;
  if (patch.gearScore     !== undefined) out.gear_score     = patch.gearScore;
  if (patch.hoursPlayed   !== undefined) out.hours_played   = patch.hoursPlayed;
  if (patch.currentBloodType !== undefined) out.blood_type  = patch.currentBloodType;
  if (patch.bloodQuality  !== undefined) out.blood_quality  = patch.bloodQuality;
  if (patch.castleHeartLevel !== undefined) out.castle_level = patch.castleHeartLevel;
  if (patch.currentRegion !== undefined) out.current_region = patch.currentRegion;
  if (patch.vbloodsKilled !== undefined) out.vbloods_killed = patch.vbloodsKilled;
  if (patch.thralls       !== undefined) out.thralls        = patch.thralls;
  if (patch.castleRooms   !== undefined) out.castle_rooms   = patch.castleRooms.map(r => ({ id: r.id, built: r.built }));
  return out;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'online' | 'offline';

export function useProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(loadLocal);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const initialized = useRef(false);

  // Beim Start: Daten vom Backend laden
  useEffect(() => {
    if (initialized.current || !API_AVAILABLE) return;
    initialized.current = true;

    setSyncStatus('syncing');
    api.getDashboard()
      .then(data => {
        const p = fromApi(data);
        setProgress(p);
        saveLocal(p);
        setSyncStatus('online');
      })
      .catch(() => setSyncStatus('offline'));
  }, []);

  // Lokaler Update + API sync
  const update = useCallback((patch: Partial<PlayerProgress>) => {
    setProgress(prev => {
      const next = { ...prev, ...patch, lastUpdated: new Date().toISOString() };
      saveLocal(next);
      if (API_AVAILABLE) {
        setSyncStatus('syncing');
        api.updateProgress(toApiPatch(patch))
          .then(() => setSyncStatus('online'))
          .catch(() => setSyncStatus('offline'));
      }
      return next;
    });
  }, []);

  const updateGearScore = useCallback((gs: number) => {
    setProgress(prev => {
      const history = [
        ...prev.gearScoreHistory,
        { date: new Date().toISOString(), value: gs },
      ].slice(-30);
      const next = { ...prev, gearScore: gs, gearScoreHistory: history, lastUpdated: new Date().toISOString() };
      saveLocal(next);
      if (API_AVAILABLE) {
        setSyncStatus('syncing');
        api.updateProgress({ gear_score: gs })
          .then(() => setSyncStatus('online'))
          .catch(() => setSyncStatus('offline'));
      }
      return next;
    });
  }, []);

  const toggleVBlood = useCallback((id: string) => {
    setProgress(prev => {
      const killed = prev.vbloodsKilled.includes(id)
        ? prev.vbloodsKilled.filter(v => v !== id)
        : [...prev.vbloodsKilled, id];
      const next = { ...prev, vbloodsKilled: killed, lastUpdated: new Date().toISOString() };
      saveLocal(next);
      if (API_AVAILABLE) {
        setSyncStatus('syncing');
        const call = killed.includes(id) ? api.killVBlood(id) : api.unkillVBlood(id);
        call.then(() => setSyncStatus('online')).catch(() => setSyncStatus('offline'));
      }
      return next;
    });
  }, []);

  const addLoot = useCallback((item: LootItem) => {
    setProgress(prev => {
      const next = { ...prev, loot: [...prev.loot, item], lastUpdated: new Date().toISOString() };
      saveLocal(next);
      if (API_AVAILABLE) {
        setSyncStatus('syncing');
        api.addLoot({
          item_name:     item.name,
          item_type:     item.type,
          rarity:        item.rarity,
          obtained_from: item.obtainedFrom,
          notes:         item.notes,
        }).then(() => setSyncStatus('online')).catch(() => setSyncStatus('offline'));
      }
      return next;
    });
  }, []);

  const removeLoot = useCallback((id: string) => {
    setProgress(prev => {
      const next = { ...prev, loot: prev.loot.filter(l => l.id !== id), lastUpdated: new Date().toISOString() };
      saveLocal(next);
      if (API_AVAILABLE) {
        const numericId = parseInt(id);
        if (!isNaN(numericId)) {
          setSyncStatus('syncing');
          api.deleteLoot(numericId)
            .then(() => setSyncStatus('online'))
            .catch(() => setSyncStatus('offline'));
        }
      }
      return next;
    });
  }, []);

  const toggleRoom = useCallback((roomId: string) => {
    setProgress(prev => {
      const rooms: CastleRoom[] = prev.castleRooms.map(r =>
        r.id === roomId ? { ...r, built: !r.built } : r
      );
      const next = { ...prev, castleRooms: rooms, lastUpdated: new Date().toISOString() };
      saveLocal(next);
      if (API_AVAILABLE) {
        setSyncStatus('syncing');
        api.updateProgress({ castle_rooms: rooms.map(r => ({ id: r.id, built: r.built })) })
          .then(() => setSyncStatus('online'))
          .catch(() => setSyncStatus('offline'));
      }
      return next;
    });
  }, []);

  const setRegion = useCallback((region: Region) => {
    update({ currentRegion: region });
  }, [update]);

  const reset = useCallback(() => {
    saveLocal(DEFAULT_PROGRESS);
    setProgress(DEFAULT_PROGRESS);
  }, []);

  return { progress, syncStatus, update, updateGearScore, toggleVBlood, addLoot, removeLoot, toggleRoom, setRegion, reset };
}

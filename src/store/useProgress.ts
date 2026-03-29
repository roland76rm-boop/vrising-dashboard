import { useState, useCallback } from 'react';
import type { PlayerProgress, LootItem, CastleRoom } from '../types';
import { DEFAULT_PROGRESS } from '../types';
import type { Region } from '../data/vbloods';

const STORAGE_KEY = 'vrising-progress';

function load(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_PROGRESS;
}

function save(p: PlayerProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function useProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(load);

  const update = useCallback((patch: Partial<PlayerProgress>) => {
    setProgress(prev => {
      const next = { ...prev, ...patch, lastUpdated: new Date().toISOString() };
      save(next);
      return next;
    });
  }, []);

  const updateGearScore = useCallback((gs: number) => {
    setProgress(prev => {
      const history = [
        ...prev.gearScoreHistory,
        { date: new Date().toISOString(), value: gs },
      ].slice(-30); // max 30 Einträge
      const next = { ...prev, gearScore: gs, gearScoreHistory: history, lastUpdated: new Date().toISOString() };
      save(next);
      return next;
    });
  }, []);

  const toggleVBlood = useCallback((id: string) => {
    setProgress(prev => {
      const killed = prev.vbloodsKilled.includes(id)
        ? prev.vbloodsKilled.filter(v => v !== id)
        : [...prev.vbloodsKilled, id];
      const next = { ...prev, vbloodsKilled: killed, lastUpdated: new Date().toISOString() };
      save(next);
      return next;
    });
  }, []);

  const addLoot = useCallback((item: LootItem) => {
    setProgress(prev => {
      const next = { ...prev, loot: [...prev.loot, item], lastUpdated: new Date().toISOString() };
      save(next);
      return next;
    });
  }, []);

  const removeLoot = useCallback((id: string) => {
    setProgress(prev => {
      const next = { ...prev, loot: prev.loot.filter(l => l.id !== id), lastUpdated: new Date().toISOString() };
      save(next);
      return next;
    });
  }, []);

  const toggleRoom = useCallback((roomId: string) => {
    setProgress(prev => {
      const rooms: CastleRoom[] = prev.castleRooms.map(r =>
        r.id === roomId ? { ...r, built: !r.built } : r
      );
      const next = { ...prev, castleRooms: rooms, lastUpdated: new Date().toISOString() };
      save(next);
      return next;
    });
  }, []);

  const setRegion = useCallback((region: Region) => {
    setProgress(prev => {
      const next = { ...prev, currentRegion: region, lastUpdated: new Date().toISOString() };
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    save(DEFAULT_PROGRESS);
    setProgress(DEFAULT_PROGRESS);
  }, []);

  return { progress, update, updateGearScore, toggleVBlood, addLoot, removeLoot, toggleRoom, setRegion, reset };
}

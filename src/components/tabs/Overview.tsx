import { useState } from 'react';
import { StatCard } from '../ui/StatCard';
import { ProgressBar } from '../ui/ProgressBar';
import type { PlayerProgress, BloodType } from '../../types';
import type { Region } from '../../data/vbloods';
import { VBLOODS, REGIONS } from '../../data/vbloods';

const BLOOD_TYPES: BloodType[] = ['Krieger', 'Arbeiter', 'Gelehrter', 'Bestie', 'Betrüger', 'Bauer', 'Brute', 'Druid', 'Dracula'];

interface OverviewProps {
  progress: PlayerProgress;
  onUpdate: (patch: Partial<PlayerProgress>) => void;
  onUpdateGearScore: (gs: number) => void;
}

export function Overview({ progress, onUpdate, onUpdateGearScore }: OverviewProps) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    playerName: progress.playerName,
    gearScore: String(progress.gearScore),
    hoursPlayed: String(progress.hoursPlayed),
    bloodType: progress.currentBloodType,
    bloodQuality: String(progress.bloodQuality),
    castleHeartLevel: String(progress.castleHeartLevel),
    region: progress.currentRegion,
  });

  const vbloodsKilledCount = progress.vbloodsKilled.length;
  const totalVBloods = VBLOODS.length;
  const vbloodsPct = (vbloodsKilledCount / totalVBloods) * 100;

  // Nächster empfohlener Boss
  const nextBoss = VBLOODS
    .filter(b => !progress.vbloodsKilled.includes(b.id))
    .filter(b => b.gearScore <= progress.gearScore + 15)
    .sort((a, b) => a.gearScore - b.gearScore)[0];

  function handleSave() {
    const gs = parseInt(form.gearScore) || 0;
    if (gs !== progress.gearScore) onUpdateGearScore(gs);
    onUpdate({
      playerName: form.playerName,
      hoursPlayed: parseFloat(form.hoursPlayed) || 0,
      currentBloodType: form.bloodType as BloodType,
      bloodQuality: Math.min(100, parseInt(form.bloodQuality) || 0),
      castleHeartLevel: Math.min(4, Math.max(1, parseInt(form.castleHeartLevel) || 1)),
      currentRegion: form.region as Region,
    });
    setEditMode(false);
  }

  const lastUpdated = new Date(progress.lastUpdated).toLocaleString('de-AT');

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Gear Score"      value={progress.gearScore}            icon="⚔️"  accent />
        <StatCard label="VBloods"         value={`${vbloodsKilledCount}/${totalVBloods}`} icon="🩸" />
        <StatCard label="Stunden gespielt" value={`${progress.hoursPlayed}h`}   icon="⏱️" />
        <StatCard label="Burgherz"        value={`Level ${progress.castleHeartLevel}`}    icon="🏰" />
        <StatCard label="Bluttyp"         value={progress.currentBloodType}              icon="💉"
          sub={`Qualität ${progress.bloodQuality}%`} />
        <StatCard label="Region"          value={progress.currentRegion}                 icon="🗺️" />
      </div>

      {/* VBlood Fortschritt */}
      <div className="bg-[#1a1a24] rounded-xl p-4 border border-[#2a1a2a]">
        <h2 className="text-sm font-semibold text-[#a89ab0] uppercase tracking-wider mb-3">Vampirblut-Fortschritt</h2>
        <ProgressBar value={vbloodsPct} label={`${vbloodsKilledCount} von ${totalVBloods} VBloods besiegt`} height="h-3" />
      </div>

      {/* Nächster Boss */}
      {nextBoss && (
        <div className="bg-red-950/20 rounded-xl p-4 border border-red-900/50">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">🎯 Nächster Empfohlener Boss</h2>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-[#e8d5e8]">{nextBoss.name}</p>
              <p className="text-sm text-[#a89ab0]">GS {nextBoss.gearScore} · {nextBoss.region}</p>
              <p className="text-sm text-[#a89ab0] mt-1">📍 {nextBoss.location}</p>
              <p className="text-sm text-green-400 mt-1">🔓 {nextBoss.unlocks}</p>
              {nextBoss.tip && <p className="text-xs text-[#6b5b6b] mt-2 italic">💡 {nextBoss.tip}</p>}
            </div>
            <div className="text-3xl font-black text-red-900/60 select-none">GS{nextBoss.gearScore}</div>
          </div>
        </div>
      )}

      {/* Manuelles Eingabe-Interface */}
      <div className="bg-[#1a1a24] rounded-xl p-4 border border-[#2a1a2a]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#a89ab0] uppercase tracking-wider">📤 Fortschritt aktualisieren</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="px-3 py-1.5 text-xs bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 rounded-lg transition-colors"
            >
              Bearbeiten
            </button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-[#6b5b6b] uppercase">Spielername</span>
                <input
                  type="text"
                  value={form.playerName}
                  onChange={e => setForm(f => ({ ...f, playerName: e.target.value }))}
                  className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
                />
              </label>
              <label className="block">
                <span className="text-xs text-[#6b5b6b] uppercase">Gear Score</span>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={form.gearScore}
                  onChange={e => setForm(f => ({ ...f, gearScore: e.target.value }))}
                  className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
                />
              </label>
              <label className="block">
                <span className="text-xs text-[#6b5b6b] uppercase">Gespielte Stunden</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.hoursPlayed}
                  onChange={e => setForm(f => ({ ...f, hoursPlayed: e.target.value }))}
                  className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
                />
              </label>
              <label className="block">
                <span className="text-xs text-[#6b5b6b] uppercase">Burgherz Level (1-4)</span>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={form.castleHeartLevel}
                  onChange={e => setForm(f => ({ ...f, castleHeartLevel: e.target.value }))}
                  className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
                />
              </label>
              <label className="block">
                <span className="text-xs text-[#6b5b6b] uppercase">Aktiver Bluttyp</span>
                <select
                  value={form.bloodType}
                  onChange={e => setForm(f => ({ ...f, bloodType: e.target.value as BloodType }))}
                  className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
                >
                  {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-[#6b5b6b] uppercase">Blutqualität (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.bloodQuality}
                  onChange={e => setForm(f => ({ ...f, bloodQuality: e.target.value }))}
                  className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs text-[#6b5b6b] uppercase">Aktuelle Region</span>
                <select
                  value={form.region}
                  onChange={e => setForm(f => ({ ...f, region: e.target.value as Region }))}
                  className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Speichern
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 bg-[#111118] hover:bg-[#1a1a24] text-[#a89ab0] border border-[#2a1a2a] rounded-lg text-sm transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6b5b6b]">
            Zuletzt aktualisiert: {lastUpdated}
          </p>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ProgressBar } from '../ui/ProgressBar';
import { VBLOODS, REGIONS, REGION_COLORS } from '../../data/vbloods';
import type { Region } from '../../data/vbloods';

interface VBloodsProps {
  killedIds: string[];
  onToggle: (id: string) => void;
}

export function VBloods({ killedIds, onToggle }: VBloodsProps) {
  const [filterRegion, setFilterRegion] = useState<Region | 'Alle'>('Alle');
  const [filterStatus, setFilterStatus] = useState<'Alle' | 'Besiegt' | 'Offen'>('Alle');
  const [search, setSearch] = useState('');

  const filtered = VBLOODS.filter(b => {
    if (filterRegion !== 'Alle' && b.region !== filterRegion) return false;
    if (filterStatus === 'Besiegt' && !killedIds.includes(b.id)) return false;
    if (filterStatus === 'Offen' && killedIds.includes(b.id)) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Region-Fortschritt */}
      <div className="bg-[#1a1a24] rounded-xl p-4 border border-[#2a1a2a]">
        <h2 className="text-sm font-semibold text-[#a89ab0] uppercase tracking-wider mb-4">Fortschritt pro Region</h2>
        <div className="space-y-3">
          {REGIONS.map(region => {
            const total = VBLOODS.filter(b => b.region === region).length;
            const killed = VBLOODS.filter(b => b.region === region && killedIds.includes(b.id)).length;
            const pct = total > 0 ? (killed / total) * 100 : 0;
            return (
              <div key={region}>
                <ProgressBar
                  value={pct}
                  label={`${region} (${killed}/${total})`}
                  color={REGION_COLORS[region]}
                  height="h-2"
                />
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-[#2a1a2a]">
          <ProgressBar
            value={(killedIds.length / VBLOODS.length) * 100}
            label={`Gesamt: ${killedIds.length}/${VBLOODS.length} VBloods`}
            height="h-3"
          />
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Boss suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-40 bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-1.5 text-sm text-[#e8d5e8] placeholder-[#6b5b6b] focus:outline-none focus:border-red-800"
        />
        <select
          value={filterRegion}
          onChange={e => setFilterRegion(e.target.value as Region | 'Alle')}
          className="bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-1.5 text-sm text-[#e8d5e8] focus:outline-none focus:border-red-800"
        >
          <option value="Alle">Alle Regionen</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="flex gap-1">
          {(['Alle', 'Besiegt', 'Offen'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                filterStatus === s
                  ? 'bg-red-900/60 border-red-700 text-red-300'
                  : 'bg-[#111118] border-[#2a1a2a] text-[#a89ab0] hover:border-red-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Boss-Liste */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-[#6b5b6b] py-8">Keine Bosse gefunden.</p>
        )}
        {filtered.map(boss => {
          const killed = killedIds.includes(boss.id);
          return (
            <div
              key={boss.id}
              onClick={() => onToggle(boss.id)}
              className={`
                flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                ${killed
                  ? 'bg-red-950/20 border-red-900/50 opacity-75'
                  : 'bg-[#1a1a24] border-[#2a1a2a] hover:border-red-900/50'}
              `}
            >
              {/* Checkbox */}
              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                killed ? 'bg-red-800 border-red-600' : 'border-[#4a3a4a]'
              }`}>
                {killed && <span className="text-xs text-white">✓</span>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${killed ? 'line-through text-[#6b5b6b]' : 'text-[#e8d5e8]'}`}>
                    {boss.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    backgroundColor: REGION_COLORS[boss.region] + '33',
                    color: REGION_COLORS[boss.region],
                    border: `1px solid ${REGION_COLORS[boss.region]}44`,
                  }}>
                    {boss.region}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#6b5b6b]">
                  <span>GS {boss.gearScore}</span>
                  <span>🔓 {boss.unlocks}</span>
                </div>
                {!killed && boss.tip && (
                  <p className="text-xs text-[#6b5b6b] mt-1 italic">💡 {boss.tip}</p>
                )}
              </div>

              {/* GS Badge */}
              <div className="text-right shrink-0">
                <span className="text-lg font-black text-[#2a1a2a]">{boss.gearScore}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

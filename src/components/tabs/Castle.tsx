import { useState } from 'react';
import type { PlayerProgress, CastleRoom } from '../../types';

interface CastleProps {
  progress: PlayerProgress;
  onToggleRoom: (id: string) => void;
  onUpdate: (patch: Partial<PlayerProgress>) => void;
}

const CASTLE_HEART_BONUSES: Record<number, string> = {
  1: 'Basis-Schloss, eingeschränkte Strukturen',
  2: 'Mehr Räume, bessere Verteidigung',
  3: 'Fortgeschrittene Strukturen, Thrall-Kammern',
  4: 'Maximale Größe, alle Strukturen verfügbar',
};

export function Castle({ progress, onToggleRoom, onUpdate }: CastleProps) {
  const builtRooms = progress.castleRooms.filter(r => r.built).length;
  const totalRooms = progress.castleRooms.length;

  return (
    <div className="space-y-6">
      {/* Burgherz */}
      <div className="bg-[#1a1a24] rounded-xl p-5 border border-[#2a1a2a]">
        <h2 className="text-sm font-semibold text-[#a89ab0] uppercase tracking-wider mb-4">🏰 Burgherz</h2>
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(level => (
            <button
              key={level}
              onClick={() => onUpdate({ castleHeartLevel: level })}
              className={`flex-1 py-3 rounded-xl border-2 text-center transition-all ${
                progress.castleHeartLevel === level
                  ? 'border-red-700 bg-red-950/40 text-red-300'
                  : 'border-[#2a1a2a] text-[#6b5b6b] hover:border-[#4a2a4a]'
              }`}
            >
              <div className="text-xl font-black">{level}</div>
              <div className="text-xs mt-0.5">Level</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-[#6b5b6b] mt-3 italic">
          {CASTLE_HEART_BONUSES[progress.castleHeartLevel]}
        </p>
      </div>

      {/* Strukturen */}
      <div className="bg-[#1a1a24] rounded-xl p-5 border border-[#2a1a2a]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#a89ab0] uppercase tracking-wider">🔨 Strukturen & Räume</h2>
          <span className="text-sm text-[#6b5b6b]">{builtRooms}/{totalRooms} gebaut</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {progress.castleRooms.map((room: CastleRoom) => (
            <button
              key={room.id}
              onClick={() => onToggleRoom(room.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                room.built
                  ? 'bg-red-950/20 border-red-900/50 text-red-300'
                  : 'bg-[#111118] border-[#2a1a2a] text-[#6b5b6b] hover:border-[#4a2a4a]'
              }`}
            >
              <span className="text-lg">{room.built ? '✅' : '🪨'}</span>
              <p className="text-xs font-medium mt-1 leading-tight">{room.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Thralls */}
      <div className="bg-[#1a1a24] rounded-xl p-5 border border-[#2a1a2a]">
        <h2 className="text-sm font-semibold text-[#a89ab0] uppercase tracking-wider mb-4">🧟 Diener (Thralls)</h2>
        <div className="space-y-2 mb-4">
          {progress.thralls.length === 0 ? (
            <p className="text-sm text-[#6b5b6b]">Noch keine Diener gefangen.</p>
          ) : (
            progress.thralls.map((t, i) => (
              <div key={i} className="flex items-center justify-between bg-[#111118] rounded-lg px-3 py-2 border border-[#2a1a2a]">
                <span className="text-sm text-[#e8d5e8]">🧟 {t}</span>
                <button
                  onClick={() => onUpdate({ thralls: progress.thralls.filter((_, j) => j !== i) })}
                  className="text-xs text-[#6b5b6b] hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        <ThrallInput
          onAdd={(name) => onUpdate({ thralls: [...progress.thralls, name] })}
        />
      </div>
    </div>
  );
}

function ThrallInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('');

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Diener-Name hinzufügen..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        className="flex-1 bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-sm text-[#e8d5e8] placeholder-[#6b5b6b] focus:outline-none focus:border-red-800"
      />
      <button
        onClick={handleAdd}
        className="px-3 py-2 bg-red-900/50 hover:bg-red-800/60 text-red-300 border border-red-800/50 rounded-lg text-sm transition-colors"
      >
        +
      </button>
    </div>
  );
}


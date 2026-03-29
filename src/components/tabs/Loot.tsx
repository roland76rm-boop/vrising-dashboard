import { useState } from 'react';
import type { LootItem } from '../../types';

const RARITY_COLORS: Record<LootItem['rarity'], string> = {
  Gewöhnlich: '#9ca3af',
  Selten:     '#3b82f6',
  Episch:     '#a855f7',
  Legendär:   '#f59e0b',
};

const TYPE_ICONS: Record<LootItem['type'], string> = {
  Waffe:      '⚔️',
  Rüstung:    '🛡️',
  Material:   '🪨',
  Accessoire: '💍',
};

interface LootProps {
  loot: LootItem[];
  onAdd: (item: LootItem) => void;
  onRemove: (id: string) => void;
}

const EMPTY_FORM = { name: '', type: 'Waffe', rarity: 'Selten', obtainedFrom: '', notes: '' };

export function Loot({ loot, onAdd, onRemove }: LootProps) {
  const [showForm, setShowForm] = useState(false);
  const [filterRarity, setFilterRarity] = useState<LootItem['rarity'] | 'Alle'>('Alle');
  const [filterType, setFilterType] = useState<LootItem['type'] | 'Alle'>('Alle');
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = loot.filter(item => {
    if (filterRarity !== 'Alle' && item.rarity !== filterRarity) return false;
    if (filterType !== 'Alle' && item.type !== filterType) return false;
    return true;
  }).sort((a, b) => {
    const order = { Legendär: 0, Episch: 1, Selten: 2, Gewöhnlich: 3 };
    return order[a.rarity] - order[b.rarity];
  });

  function handleAdd() {
    if (!form.name.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type as LootItem['type'],
      rarity: form.rarity as LootItem['rarity'],
      obtainedAt: new Date().toISOString(),
      obtainedFrom: form.obtainedFrom.trim() || 'Unbekannt',
      notes: form.notes.trim() || undefined,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      {/* Header + Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#e8d5e8]">Beutekammer</h2>
          <p className="text-sm text-[#6b5b6b]">{loot.length} Items gesammelt</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-red-900/50 hover:bg-red-800/60 text-red-300 border border-red-800/50 rounded-lg text-sm transition-colors"
        >
          {showForm ? '✕ Abbrechen' : '+ Item hinzufügen'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-[#1a1a24] rounded-xl p-4 border border-red-900/30">
          <h3 className="text-sm font-semibold text-red-400 mb-4">Neues Item</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <span className="text-xs text-[#6b5b6b] uppercase">Item-Name *</span>
              <input
                type="text"
                placeholder="z.B. Blutstahl-Schwert"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[#6b5b6b] uppercase">Typ</span>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
              >
                {(['Waffe', 'Rüstung', 'Material', 'Accessoire'] as const).map(t => (
                  <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-[#6b5b6b] uppercase">Seltenheit</span>
              <select
                value={form.rarity}
                onChange={e => setForm(f => ({ ...f, rarity: e.target.value }))}
                className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
              >
                {(['Gewöhnlich', 'Selten', 'Episch', 'Legendär'] as const).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-[#6b5b6b] uppercase">Von Boss/Zone erhalten</span>
              <input
                type="text"
                placeholder="z.B. Quincey der Banditenanführer"
                value={form.obtainedFrom}
                onChange={e => setForm(f => ({ ...f, obtainedFrom: e.target.value }))}
                className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-[#6b5b6b] uppercase">Notizen (optional)</span>
              <input
                type="text"
                placeholder="z.B. +15 Stärke, perfekte Stats"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="mt-1 w-full bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-[#e8d5e8] focus:outline-none focus:border-red-800"
              />
            </label>
          </div>
          <button
            onClick={handleAdd}
            disabled={!form.name.trim()}
            className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Item speichern
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {(['Alle', 'Gewöhnlich', 'Selten', 'Episch', 'Legendär'] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilterRarity(r)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                filterRarity === r
                  ? 'bg-red-900/60 border-red-700 text-red-300'
                  : 'bg-[#111118] border-[#2a1a2a] text-[#a89ab0] hover:border-red-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['Alle', 'Waffe', 'Rüstung', 'Material', 'Accessoire'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                filterType === t
                  ? 'bg-red-900/60 border-red-700 text-red-300'
                  : 'bg-[#111118] border-[#2a1a2a] text-[#a89ab0] hover:border-red-900'
              }`}
            >
              {t === 'Alle' ? t : `${TYPE_ICONS[t]} ${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Item Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#6b5b6b]">
          <div className="text-4xl mb-3">⚔️</div>
          <p>Noch keine Beute gesammelt.</p>
          <p className="text-xs mt-1">Besiege Bosse und füge gefundene Items hinzu!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-[#1a1a24] rounded-xl p-3 border border-[#2a1a2a] group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{TYPE_ICONS[item.type]}</span>
                  <div>
                    <p className="font-medium text-[#e8d5e8] text-sm leading-tight">{item.name}</p>
                    <p className="text-xs" style={{ color: RARITY_COLORS[item.rarity] }}>{item.rarity}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#6b5b6b] hover:text-red-400 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 text-xs text-[#6b5b6b] space-y-0.5">
                <p>Von: {item.obtainedFrom}</p>
                {item.notes && <p className="text-[#a89ab0] italic">{item.notes}</p>}
                <p>{new Date(item.obtainedAt).toLocaleDateString('de-AT')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

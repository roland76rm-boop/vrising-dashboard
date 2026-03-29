import type { TabId } from '../types';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Übersicht', icon: '🏰' },
  { id: 'vbloods',  label: 'VBloods',   icon: '🩸' },
  { id: 'loot',     label: 'Beute',     icon: '⚔️' },
  { id: 'castle',   label: 'Burg',      icon: '🗡️' },
  { id: 'guide',    label: 'KI-Guide',  icon: '🧛' },
];

interface LayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  playerName: string;
  children: React.ReactNode;
}

export function Layout({ activeTab, onTabChange, playerName, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8d5e8]">
      {/* Header */}
      <header className="border-b border-[#2a1a2a] bg-[#0d0d15]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-red-400 blood-glow-text tracking-wider">
              🧛 V Rising Dashboard
            </h1>
            <p className="text-xs text-[#6b5b6b] uppercase tracking-widest">Vampir-Tracker V1.0</p>
          </div>
          <div className="text-sm text-[#a89ab0]">
            <span className="text-[#6b5b6b]">Spieler: </span>
            <span className="text-red-300 font-medium">{playerName}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-red-600 text-red-400'
                  : 'border-transparent text-[#a89ab0] hover:text-[#e8d5e8] hover:border-[#5c0020]'}
              `}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Layout } from './components/Layout';
import { Overview } from './components/tabs/Overview';
import { VBloods } from './components/tabs/VBloods';
import { Loot } from './components/tabs/Loot';
import { Castle } from './components/tabs/Castle';
import { AIGuide } from './components/tabs/AIGuide';
import { useProgress } from './store/useProgress';
import type { TabId } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const {
    progress,
    syncStatus,
    update,
    updateGearScore,
    toggleVBlood,
    addLoot,
    removeLoot,
    toggleRoom,
  } = useProgress();

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      playerName={progress.playerName}
      syncStatus={syncStatus}
    >
      {activeTab === 'overview' && (
        <Overview
          progress={progress}
          onUpdate={update}
          onUpdateGearScore={updateGearScore}
        />
      )}
      {activeTab === 'vbloods' && (
        <VBloods
          killedIds={progress.vbloodsKilled}
          onToggle={toggleVBlood}
        />
      )}
      {activeTab === 'loot' && (
        <Loot
          loot={progress.loot}
          onAdd={addLoot}
          onRemove={removeLoot}
        />
      )}
      {activeTab === 'castle' && (
        <Castle
          progress={progress}
          onToggleRoom={toggleRoom}
          onUpdate={update}
        />
      )}
      {activeTab === 'guide' && (
        <AIGuide progress={progress} />
      )}
    </Layout>
  );
}

import { useState, useCallback } from 'react';
import type { PlayerProgress } from '../../types';
import { VBLOODS } from '../../data/vbloods';

interface AIGuideProps {
  progress: PlayerProgress;
}

interface GuideResult {
  text: string;
  generatedAt: string;
  gearScoreAtGeneration: number;
  vbloodsAtGeneration: number;
}

const GUIDE_CACHE_KEY = 'vrising-guide-cache';

function loadCache(): GuideResult | null {
  try {
    const raw = localStorage.getItem(GUIDE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCache(g: GuideResult) {
  localStorage.setItem(GUIDE_CACHE_KEY, JSON.stringify(g));
}

export function AIGuide({ progress }: AIGuideProps) {
  const [guide, setGuide] = useState<GuideResult | null>(loadCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() =>
    localStorage.getItem('vrising-api-key') ||
    (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined) ||
    ''
  );
  const [showKeyInput, setShowKeyInput] = useState(false);

  const needsRefresh = !guide ||
    guide.gearScoreAtGeneration !== progress.gearScore ||
    guide.vbloodsAtGeneration !== progress.vbloodsKilled.length;

  const killedBosses = VBLOODS.filter(b => progress.vbloodsKilled.includes(b.id));
  const openBosses = VBLOODS
    .filter(b => !progress.vbloodsKilled.includes(b.id))
    .filter(b => b.gearScore <= progress.gearScore + 15)
    .sort((a, b) => a.gearScore - b.gearScore)
    .slice(0, 6);

  const generateGuide = useCallback(async () => {
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }
    setLoading(true);
    setError(null);

    const killedNames = killedBosses.map(b => `${b.name} (GS ${b.gearScore})`).join(', ') || 'Noch keiner';
    const openNames = openBosses.map(b => `${b.name} (GS ${b.gearScore}, ${b.region}, entsperrt: ${b.unlocks})`).join('\n- ');

    const prompt = `Du bist ein erfahrener V Rising Experte und erstellst einen personalisierten Spielguide.

Aktueller Spieler-Status:
- Spielername: ${progress.playerName}
- Gear Score: ${progress.gearScore}
- Besiegte VBloods (${progress.vbloodsKilled.length}): ${killedNames}
- Gespielte Stunden: ${progress.hoursPlayed}h
- Aktuelle Region: ${progress.currentRegion}
- Bluttyp: ${progress.currentBloodType} (Qualität: ${progress.bloodQuality}%)
- Burgherz Level: ${progress.castleHeartLevel}

Erreichbare nächste Bosse (GS bis ${progress.gearScore + 15}):
- ${openNames || 'Keine – alle erreichbaren Bosse bereits besiegt!'}

Erstelle einen motivierenden, konkreten Next-Steps Guide auf Deutsch mit maximal 3 priorisierten Empfehlungen.
Format für jede Empfehlung:
1. **Boss-Name** (GS X) – *warum dieser Boss jetzt wichtig ist*
   - Ort: [genaue Location]
   - Freischaltet: [wichtige Fähigkeit/Rezept]
   - Kampf-Tipp: [konkreter Tipp]

Abschluss: Ein kurzer motivierender Satz passend zum Vampir-Thema.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-calls': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json() as { content: Array<{ type: string; text: string }> };
      const text = data.content[0]?.text ?? '';

      const result: GuideResult = {
        text,
        generatedAt: new Date().toISOString(),
        gearScoreAtGeneration: progress.gearScore,
        vbloodsAtGeneration: progress.vbloodsKilled.length,
      };
      setGuide(result);
      saveCache(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [apiKey, progress, killedBosses, openBosses]);

  function saveApiKey() {
    localStorage.setItem('vrising-api-key', apiKey);
    setShowKeyInput(false);
  }

  // Markdown-ähnliches Rendering (fett + kursiv)
  function renderText(text: string) {
    return text.split('\n').map((line, i) => {
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-red-300">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em class="text-[#a89ab0]">$1</em>');
      return (
        <p
          key={i}
          className={`${line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') ? 'mt-4 font-medium' : 'mt-1 ml-4'} text-sm leading-relaxed`}
          dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }}
        />
      );
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#e8d5e8]">🧛 KI-Vampir-Guide</h2>
          <p className="text-sm text-[#6b5b6b]">Personalisierter Next-Steps Guide basierend auf deinem Spielstand</p>
        </div>
        <button
          onClick={() => setShowKeyInput(v => !v)}
          className="text-xs text-[#6b5b6b] hover:text-[#a89ab0] transition-colors"
          title="API Key konfigurieren"
        >
          🔑 API Key
        </button>
      </div>

      {/* API Key Input */}
      {showKeyInput && (
        <div className="bg-[#1a1a24] rounded-xl p-4 border border-yellow-900/30">
          <p className="text-xs text-yellow-600 mb-2">Claude API Key (wird nur lokal im Browser gespeichert)</p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="flex-1 bg-[#111118] border border-[#2a1a2a] rounded-lg px-3 py-2 text-sm text-[#e8d5e8] focus:outline-none focus:border-yellow-800"
            />
            <button
              onClick={saveApiKey}
              className="px-4 py-2 bg-yellow-900/40 hover:bg-yellow-800/50 text-yellow-300 border border-yellow-800/50 rounded-lg text-sm transition-colors"
            >
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Status Snapshot */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {[
          { label: 'Gear Score', value: progress.gearScore },
          { label: 'VBloods', value: `${progress.vbloodsKilled.length}/46` },
          { label: 'Stunden', value: `${progress.hoursPlayed}h` },
          { label: 'Region', value: progress.currentRegion.split(' ')[0] },
          { label: 'Bluttyp', value: progress.currentBloodType },
        ].map(s => (
          <div key={s.label} className="bg-[#111118] rounded-lg p-2 border border-[#2a1a2a] text-center">
            <p className="text-xs text-[#6b5b6b]">{s.label}</p>
            <p className="text-sm font-bold text-[#e8d5e8] mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Generate Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={generateGuide}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            loading
              ? 'bg-red-900/20 text-red-800 cursor-not-allowed'
              : needsRefresh
                ? 'bg-red-800 hover:bg-red-700 text-white blood-glow'
                : 'bg-[#1a1a24] hover:bg-red-950/30 text-red-400 border border-red-900/50'
          }`}
        >
          {loading ? (
            <>
              <span className="animate-spin">⟳</span> Guide wird generiert...
            </>
          ) : needsRefresh ? (
            '🧛 Guide generieren'
          ) : (
            '🔄 Guide aktualisieren'
          )}
        </button>
        {needsRefresh && !loading && (
          <span className="text-xs text-[#6b5b6b]">Spielstand hat sich geändert</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4">
          <p className="text-sm text-red-400">Fehler: {error}</p>
          {error.includes('401') && (
            <p className="text-xs text-[#6b5b6b] mt-1">API Key überprüfen (🔑 oben rechts)</p>
          )}
        </div>
      )}

      {/* Guide Output */}
      {guide && (
        <div className="bg-[#1a1a24] rounded-xl p-5 border border-[#2a1a2a]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2a1a2a]">
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider">Dein Vampir-Guide</h3>
            <span className="text-xs text-[#6b5b6b]">
              GS {guide.gearScoreAtGeneration} · {new Date(guide.generatedAt).toLocaleString('de-AT')}
            </span>
          </div>
          <div className="text-[#e8d5e8]">
            {renderText(guide.text)}
          </div>
        </div>
      )}

      {/* No guide yet */}
      {!guide && !loading && (
        <div className="text-center py-12 text-[#6b5b6b]">
          <div className="text-5xl mb-4">🧛</div>
          <p className="text-lg font-medium text-[#a89ab0]">Dein persönlicher Vampir-Guide wartet</p>
          <p className="text-sm mt-2">Klicke auf "Guide generieren" um einen personalisierten<br />Next-Steps Guide zu erhalten.</p>
          {!apiKey && (
            <p className="text-xs text-yellow-600 mt-3">
              Benötigt: Claude API Key (🔑 oben rechts konfigurieren)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

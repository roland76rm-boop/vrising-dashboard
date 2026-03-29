# V Rising Dashboard – Claude Code Briefing
**Projekt:** V Rising Abenteuer-Tracker  
**Ziel:** Interaktives Dashboard das V Rising Spielfortschritt trackt – analog zum HdRO Dashboard  
**Stack:** React + TypeScript + Vite + Tailwind → GitHub → Vercel  
**Domain:** z.B. vrising.haus543.at (Caddy Reverse Proxy auf VPS 152.53.0.21)

---

## Architektur-Übersicht

```
V Rising (lokal) 
  └── BepInEx Plugin (VRisingStats) → HTTP API (Port 7070)
        └── FastAPI Backend (VPS) → polling + Datenspeicherung
              └── React Frontend (Vercel) → Dashboard
```

**Warum kein direktes Savegame-Parsing?**  
V Rising Saves sind `.save.gz` komprimierte Binärdateien (kein JSON/XML).  
Direktes Parsen ist ohne Reverse Engineering nicht möglich.  
Lösung: BepInEx Plugin das Daten als HTTP API bereitstellt.

---

## Phase 1 – BepInEx Plugin installieren (auf Keller-PC)

### 1.1 BepInEx installieren
```
URL: https://github.com/BepInEx/BepInEx/releases
Version: BepInEx 6.x (IL2CPP) für V Rising
Pfad: Steam\steamapps\common\VRising\
```
- ZIP entpacken direkt in V Rising Spielverzeichnis
- Spiel einmal starten → BepInEx initialisiert sich
- Verzeichnis `BepInEx/plugins/` wird erstellt

### 1.2 VRisingStats Plugin installieren
```
GitHub: https://github.com/topics/vrising (nach "stats" oder "api" Plugin suchen)
Empfehlung: Plugin das HTTP Endpunkte für VBlood-Kills und Gear Level bereitstellt
DLL → BepInEx/plugins/ kopieren
```

**Alternativ falls kein passendes Plugin:** FastAPI Backend liest `ServerGameSettings.json` 
und `SessionId.json` aus dem Save-Ordner für Basis-Metadaten, 
der Rest wird manuell über ein Upload-Interface eingepflegt (wie HdRO).

---

## Phase 2 – Datenquellen

### Option A: BepInEx HTTP API (bevorzugt)
```
GET http://localhost:7070/api/players
GET http://localhost:7070/api/vbloods  
GET http://localhost:7070/api/gear
```
Gibt JSON zurück mit: Spielername, Gear Score, besiegte VBloods, Stunden gespielt

### Option B: Savegame-Metadaten (Fallback)
```
Pfad: %APPDATA%\..\LocalLow\Stunlock Studios\VRising\Saves\v3\[SESSION_ID]\
Dateien:
  - SessionId.json          → Session-Infos, Spielname
  - ServerGameSettings.json → Servereinstellungen  
  - StartDate.json          → Startdatum der Welt
  - AutoSave_[N].save.gz    → Binär, nicht direkt parsebar
```

### Option C: Manuelles Upload-Interface (wie HdRO)
Spieler lädt nach jeder Session Screenshot oder kopiert Daten manuell ins Dashboard.
Einfachste Option, kein Plugin nötig.

**Empfehlung für Phase 1:** Mit Option C starten (sofort spielbar),
dann Option A nachrüsten wenn BepInEx läuft.

---

## Phase 3 – Backend (FastAPI auf VPS 152.53.0.21)

### Projektstruktur
```
/home/roland/projects/vrising-dashboard/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── requirements.txt
└── frontend/              ← React App
```

### Datenmodell (SQLite)
```python
# models.py
class VBloodKill(Base):
    boss_name: str
    boss_gear_score: int
    killed_at: datetime
    player_name: str
    gear_score_at_kill: int
    location: str

class PlayerProgress(Base):
    snapshot_time: datetime
    gear_score: int
    vbloods_killed: int
    hours_played: float
    current_blood_type: str
    castle_level: int

class LootItem(Base):
    item_name: str
    item_type: str  # Waffe, Rüstung, Material
    rarity: str     # Gewöhnlich, Selten, Episch
    obtained_at: datetime
    obtained_from: str  # Boss-Name oder Zone
```

### API Endpoints
```python
POST /api/session          → neue Spielsession starten
POST /api/vblood/kill      → Boss besiegt melden
POST /api/loot             → Item gefunden melden
POST /api/progress         → Fortschritt-Snapshot
GET  /api/dashboard        → alle Dashboard-Daten
GET  /api/vbloods          → Boss-Kill-Liste
GET  /api/player/stats     → Spieler-Statistiken
```

### Auto-Polling (wenn BepInEx Plugin aktiv)
```python
# Alle 60 Sekunden Daten vom lokalen Plugin holen
# Läuft als pm2 Prozess auf dem VPS über SSH-Tunnel
# ODER direkt auf Keller-PC als lokaler Service
```

---

## Phase 4 – Frontend (React + TypeScript + Vite)

### Tab-Struktur (analog zu HdRO Dashboard)
```
┌─────────────────────────────────────────────────────┐
│  🧛 V Rising Dashboard          Spieler: [Name]  📤 │
│  VAMPIR-TRACKER V1.0                                │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│ Übersicht│ VBloods  │  Beute   │  Burg    │   KI    │
└──────────┴──────────┴──────────┴──────────┴─────────┘
```

### Tab: Übersicht
- Gear Score (aktuell + Verlauf Chart)
- VBloods getötet (X von 87 gesamt)
- Gespielte Stunden
- Burgherz-Level
- Aktiver Bluttyp + Qualität
- Letzte Aktivität
- Nächster empfohlener Boss

### Tab: VBloods
- Liste aller 87 Bosse mit Status (besiegt / offen)
- Gear Score beim Kill
- Datum des Kills
- Freigeschalten: Fähigkeit/Rezept
- Filter: Region (Farbane / Dunley / Silverlight / Mortium / Oakveil)
- Fortschrittsbalken pro Region

### Tab: Beute
- Seltene und Epische Items
- Kategorien: Waffen, Rüstung, Materialien
- Von welchem Boss / welcher Zone
- Wert-Ranking

### Tab: Burg
- Castle Heart Level (1-4)
- Gebaute Räume/Strukturen
- Thralls (Diener)
- Burgausbau-Fortschritt

### Tab: KI-Guide (das besondere Feature!)
**Selbst-aktualisierender Guide basierend auf Spielstand:**
```
Claude API wird aufgerufen mit:
- Aktueller Gear Score
- Besiegte VBloods
- Vorhandene Items/Ressourcen
- Aktuelle Region

→ Claude generiert personalisierten Next-Steps Guide:
  "Du hast GS 42 und Clive ist besiegt. 
   Dein nächstes Ziel: Quincey der Banditenanführer (GS 37).
   Du findest ihn in der Banditen-Festung im Südwesten von Farbane.
   Empfohlenes Equipment: Kupferwaffe + Lederrüstung.
   Tipp: Erkundige zuerst die Umgebung tagsüber im Schatten..."
```

---

## Phase 5 – KI-Guide Implementierung

### Claude API Integration
```typescript
// frontend/src/services/aiGuide.ts
const generateGuide = async (playerData: PlayerProgress) => {
  const response = await fetch('/api/ai/guide', {
    method: 'POST',
    body: JSON.stringify({
      gear_score: playerData.gearScore,
      vbloods_killed: playerData.vbloodsKilled,
      region: playerData.currentRegion,
      hours_played: playerData.hoursPlayed
    })
  });
  return response.json();
};
```

```python
# backend/ai_guide.py
import anthropic

VBLOOD_DATA = {
    "Alpha-Wolf": {"gs": 3, "region": "Farbane", "unlocks": "Wolfsform"},
    "Errol der Steinbrecher": {"gs": 16, "region": "Farbane", "unlocks": "Steinveredlung"},
    "Clive der Feuerstarter": {"gs": 20, "region": "Farbane", "unlocks": "Schmiede"},
    "Quincey der Banditenanführer": {"gs": 37, "region": "Farbane", "unlocks": "Hochofen"},
    # ... alle 87 Bosse
}

def generate_guide(player_data: dict) -> str:
    client = anthropic.Anthropic()
    
    killed_bosses = player_data.get("vbloods_killed", [])
    open_bosses = [b for b in VBLOOD_DATA if b not in killed_bosses 
                   and VBLOOD_DATA[b]["gs"] <= player_data["gear_score"] + 10]
    
    prompt = f"""Du bist ein V Rising Experte und erstellst einen personalisierten Guide.
    
Spieler-Status:
- Gear Score: {player_data['gear_score']}
- Besiegte VBloods: {', '.join(killed_bosses)}
- Gespielte Stunden: {player_data['hours_played']}
- Aktuelle Region: {player_data.get('region', 'Farbane Wälder')}

Erreichbare nächste Bosse: {', '.join([f"{b} (GS {VBLOOD_DATA[b]['gs']})" for b in open_bosses[:5]])}

Erstelle einen konkreten, motivierenden Next-Steps Guide auf Deutsch (max 3 Empfehlungen).
Format: Boss-Name → warum wichtig → wo finden → Tipp für den Kampf."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text
```

---

## Phase 6 – Auto-Update Mechanismus

### Variante A: File Watcher (einfachste Option)
```python
# Watchdog Library überwacht Save-Ordner
# Bei neuer AutoSave_X.save.gz Datei → Trigger
# Liest SessionId.json + StartDate.json für Metadaten
# Rest über BepInEx API

import watchdog
SAVE_PATH = r"%APPDATA%\..\LocalLow\Stunlock Studios\VRising\Saves\v3"

class SaveFileHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.src_path.endswith('.save.gz'):
            # Neuer AutoSave → API abfragen → Dashboard aktualisieren
            fetch_bepinex_data()
            update_database()
```

### Variante B: Polling (robuster)
```python
# Alle 5 Minuten BepInEx API pollen
# Läuft als Windows-Service oder pm2 auf Keller-PC
import schedule

def poll_game_data():
    try:
        resp = requests.get("http://localhost:7070/api/players")
        if resp.ok:
            save_to_database(resp.json())
    except:
        pass  # Spiel nicht aktiv

schedule.every(5).minutes.do(poll_game_data)
```

### Variante C: Manueller Upload-Button (Phase 1)
```
Dashboard hat Upload-Button:
→ Spieler klickt nach Session
→ Öffnet Formular: 
   - Gear Score (Zahl eingeben)
   - Besiegte Bosse (Checkboxen)
   - Gefundene Items (Text + Seltenheit)
→ KI Guide aktualisiert sich automatisch
```

---

## Deployment

### VPS Setup (152.53.0.21)
```bash
# Neues Projekt anlegen
mkdir /home/roland/projects/vrising-dashboard
cd /home/roland/projects/vrising-dashboard

# Backend starten
pip install fastapi uvicorn sqlalchemy anthropic
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8090" --name vrising-backend

# Caddy Konfiguration
vrising.haus543.at {
    reverse_proxy localhost:8090
}
```

### Vercel (Frontend)
```
GitHub Repo: roland76rm-boop/vrising-dashboard
Vercel: Auto-Deploy bei Push auf main
Env Vars: VITE_API_URL=https://vrising.haus543.at
```

---

## Umsetzungs-Reihenfolge für Claude Code

### Sprint 1 (heute Abend / morgen)
1. React + Vite Projekt erstellen
2. Dashboard-Layout mit Tabs (dark theme wie HdRO)
3. Manuelles Eingabe-Interface (Variante C)
4. VBlood-Liste hardcoded (alle 87 Bosse mit GS)
5. KI-Guide Tab mit Claude API Integration
6. Auf Vercel deployen

### Sprint 2 (nach ersten Spielsessions)
1. FastAPI Backend aufsetzen
2. SQLite Datenbank mit Datenmodellen
3. REST API Endpoints
4. Frontend an Backend anbinden
5. File Watcher für Auto-Updates

### Sprint 3 (optional)
1. BepInEx Plugin recherchieren + installieren
2. Echtes Live-Tracking implementieren
3. Charts und Statistiken ausbauen

---

## CLAUDE.md für Session-Continuity

```markdown
# V Rising Dashboard

## Projekt
React/TypeScript/Vite Dashboard für V Rising Spielfortschritt.
Analog zum HdRO Dashboard auf dem Keller-PC.

## Stack
- Frontend: React + TypeScript + Vite + Tailwind
- Backend: FastAPI + SQLite (VPS 152.53.0.21)
- Deployment: GitHub → Vercel (Frontend), pm2 (Backend)
- KI: Claude API (claude-sonnet-4-20250514)

## Pfade
- Projekt: /home/roland/projects/vrising-dashboard/
- Backend Port: 8090
- Frontend: vrising.haus543.at oder vrising-dashboard.vercel.app

## V Rising Save Pfad (Keller-PC)
%APPDATA%\..\LocalLow\Stunlock Studios\VRising\Saves\v3\

## Status
- [ ] Sprint 1: Basis-Dashboard mit manuellem Input
- [ ] Sprint 2: Backend + Datenbank
- [ ] Sprint 3: Auto-Tracking

## VBlood Bosse (alle 87)
Farbane Wälder: Alpha-Wolf (3), Errol (16), Clive (20), 
                Lidia (26), Rufus (20), Grayson (26), 
                Quincey (37), Beatrice (37)...
[vollständige Liste in /src/data/vbloods.ts]
```

---

## Wichtige Hinweise für Claude Code

1. **Dark Theme** – wie HdRO Dashboard (schwarz/dunkelgrau mit roten Akzenten passend zum Vampir-Thema)
2. **Blut-Rot als Akzentfarbe** – #8B0000 / #DC143C für Highlights
3. **VBlood-Liste komplett** – alle 87 Bosse mit Gear Score, Region, freigeschalten Fähigkeit
4. **KI-Guide automatisch** – bei jeder Dashboard-Öffnung neu generieren wenn sich Daten geändert haben
5. **Mobile-friendly** – auch am Tablet nutzbar
6. **CONTEXT.md pflegen** – nach jeder Session aktuellen Stand dokumentieren

# V Rising Dashboard

## Projekt
React/TypeScript/Vite Dashboard für V Rising Spielfortschritt.
Analog zum HdRO Dashboard auf dem Keller-PC.

## Stack
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS v4
- Backend: FastAPI + SQLite (VPS 152.53.0.21) — noch nicht implementiert (Sprint 2)
- Deployment: GitHub → Vercel (Frontend), pm2 (Backend)
- KI: Claude API (claude-sonnet-4-20250514) — direkter Browser-Call

## Pfade
- Projekt: /home/roland/projects/v-rising/
- Frontend Dev-Port: 5173
- Backend Port (geplant): 8090
- Domain (geplant): vrising.haus543.at

## Deployment
- Frontend: Vercel (GitHub Repo: roland76rm-boop/vrising-dashboard oder ähnlich)
- Env Var Vercel: VITE_API_URL=https://vrising.haus543.at (Sprint 2)

## V Rising Save Pfad (Keller-PC Windows)
%APPDATA%\..\LocalLow\Stunlock Studios\VRising\Saves\v3\

## Projekt-Struktur
```
src/
  data/vbloods.ts         — Alle VBlood-Bosse mit GS, Region, Fähigkeiten
  types/index.ts          — TypeScript-Typen (PlayerProgress, LootItem, etc.)
  store/useProgress.ts    — localStorage-basierter State-Store
  components/
    Layout.tsx            — Header + Tab-Navigation
    tabs/
      Overview.tsx        — Übersicht + manuelles Eingabe-Interface
      VBloods.tsx         — Boss-Checkliste mit Fortschrittsbalken
      Loot.tsx            — Beutekammer
      Castle.tsx          — Burg, Räume, Thralls
      AIGuide.tsx         — KI-Guide via Claude API
    ui/
      StatCard.tsx
      ProgressBar.tsx
```

## Sprint-Status
- [x] Sprint 1: Basis-Dashboard mit manuellem Input — FERTIG
- [ ] Sprint 2: FastAPI Backend + SQLite + REST API
- [ ] Sprint 3: BepInEx Auto-Tracking

## Sprint 1 — Umgesetzte Features
- Dark Theme (Schwarz + Blut-Rot #DC143C)
- 5 Tabs: Übersicht, VBloods, Beute, Burg, KI-Guide
- VBlood-Checkliste mit ~47 Bossen (GS, Region, Fähigkeit, Tipp)
- Fortschrittsbalken pro Region
- Manuelles Eingabe-Interface (Gear Score, Stunden, Bluttyp, Region, etc.)
- Beutekammer mit Seltenheits-Filtern
- Burg-Tracker (Räume, Burgherz-Level, Thralls)
- KI-Guide: Claude API direkt vom Browser (API Key lokal gespeichert)
- localStorage-Persistenz (kein Backend nötig)
- Build: ✅ dist/ vorhanden

## Bekannte TODOs / Verbesserungen
- VBlood-Liste auf exakt 87 Bosse vervollständigen (V Rising 1.0)
- Gear Score Verlauf als Recharts-Chart anzeigen
- Backend (Sprint 2) für Multi-Device Sync
- Vercel Deployment einrichten

## Design
- Akzentfarbe: #DC143C (Blut-Rot), #8B0000 (Dunkel-Rot)
- Hintergrund: #0a0a0f
- Karten: #1a1a24
- Text: #e8d5e8 (Hell-Lila)

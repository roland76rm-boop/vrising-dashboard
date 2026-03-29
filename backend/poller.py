"""
V Rising BepInEx Poller — Sprint 3
====================================
Läuft auf dem Windows-PC (Keller-PC) als Python-Script.
Pollt alle 60 Sekunden die lokale BepInEx HTTP API und
schickt die Daten an das FastAPI Backend auf dem VPS.

Voraussetzungen:
  pip install requests schedule

Starten:
  python poller.py

Als Windows-Service (z.B. mit NSSM):
  nssm install VRisingPoller "python" "C:\path\to\poller.py"
  nssm start VRisingPoller
"""

import requests
import schedule
import time
import logging
from datetime import datetime

# ─── Konfiguration ───────────────────────────────────────────────────────────

BEPINEX_API   = "http://localhost:7070"   # Lokale BepInEx HTTP API
BACKEND_API   = "https://vrising.haus543.at"  # VPS Backend
POLL_INTERVAL = 60   # Sekunden

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("poller.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ─── VBlood-ID Mapping (BepInEx Guid → Dashboard ID) ────────────────────────
# Wird ergänzt sobald das konkrete Plugin bekannt ist.
# Format: {"BepInEx_Boss_Name": "dashboard-id"}
VBLOOD_MAPPING: dict[str, str] = {
    "Alpha Wolf":                  "alpha-wolf",
    "Errol the Stonebreaker":      "errol-stonebreaker",
    "Rufus the Foreman":           "rufus-foreman",
    "Keely the Frost Archer":      "keely-frost-archer",
    "Lidia the Chaos Archer":      "lidia-chaos-archer",
    "Grayson the Armourer":        "grayson-armourer",
    "Clive the Firestarter":       "clive-firestarter",
    "Polora the Feywalker":        "polora-feywalker",
    "Ferocious Bear":              "ferocious-bear",
    "Quincey the Bandit King":     "quincey-bandit-king",
    "Beatrice the Tailor":         "beatrice-tailor",
    "Vincent the Frostbringer":    "vincent-frostbringer",
    "Christina the Sun Priestess": "christina-sun-priestess",
    "Nicholaus the Fallen":        "nicholaus-fallen",
    "Leandra the Shadow Priestess":"leandra-shadow-priestess",
    "Terah the Geomancer":         "terah-geomancer",
    "Meredith the Bright Archer":  "meredith-bright-archer",
    "Octavian the Militia Captain":"octavian-militia-captain",
    "Raziel the Shepherd":         "raziel-shepherd",
    "Jade the Vampire Hunter":     "jade-vampire-hunter",
    "Willfred the Werewolf Chief": "willfred-werewolf-chief",
    "Solarus the Immaculate":      "solarus-immaculate",
    "Dracula the Immortal":        "summons-of-dracula",
}

# ─── Poller ──────────────────────────────────────────────────────────────────

def poll():
    log.info("Polling BepInEx API...")
    try:
        # Spieler-Daten
        players = requests.get(f"{BEPINEX_API}/api/players", timeout=5).json()
        # VBlood-Kill-Liste
        vbloods = requests.get(f"{BEPINEX_API}/api/vbloods", timeout=5).json()
    except Exception as e:
        log.warning(f"BepInEx API nicht erreichbar (Spiel läuft nicht?): {e}")
        return

    if not players:
        log.info("Keine Spieler aktiv.")
        return

    # Erster Spieler (Single Player)
    player = players[0]
    gear_score   = player.get("gearScore",    0)
    hours_played = player.get("hoursPlayed",  0.0)
    blood_type   = player.get("bloodType",    "Krieger")
    blood_quality = player.get("bloodQuality", 0)

    # VBlood IDs mappen
    killed_ids = []
    for vb in vbloods:
        name = vb.get("name", "")
        mapped = VBLOOD_MAPPING.get(name)
        if mapped:
            killed_ids.append(mapped)
        else:
            log.debug(f"Unbekannter Boss: {name}")

    # Ans Backend schicken
    try:
        resp = requests.post(f"{BACKEND_API}/api/progress", json={
            "gear_score":     gear_score,
            "hours_played":   hours_played,
            "blood_type":     blood_type,
            "blood_quality":  blood_quality,
            "vbloods_killed": killed_ids,
        }, timeout=10)
        if resp.ok:
            log.info(f"Update OK — GS {gear_score}, {len(killed_ids)} VBloods besiegt")
        else:
            log.error(f"Backend Fehler: {resp.status_code} {resp.text}")
    except Exception as e:
        log.error(f"Backend nicht erreichbar: {e}")


def main():
    log.info(f"V Rising Poller gestartet (Intervall: {POLL_INTERVAL}s)")
    log.info(f"BepInEx API: {BEPINEX_API}")
    log.info(f"Backend:     {BACKEND_API}")

    # Einmal sofort
    poll()

    # Dann im Intervall
    schedule.every(POLL_INTERVAL).seconds.do(poll)
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()

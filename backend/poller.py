"""
V Rising BepInEx Poller — Sprint 3
====================================
Laeuft auf dem Windows-PC waehrend V Rising aktiv ist.
Pollt alle 60 Sekunden die VRisingDiscordBotCompanion HTTP API
und schickt die Daten an das FastAPI Backend auf dem VPS.

Plugin: VRisingDiscordBotCompanion (DarkAtra)
  https://thunderstore.io/c/v-rising/p/DarkAtra/VRisingDiscordBotCompanion/

Starten:
  Doppelklick auf START_POLLER.bat
  oder: python poller.py

Voraussetzungen (automatisch durch setup_bepinex.ps1 installiert):
  pip install requests schedule
"""

import requests
import schedule
import time
import logging
from datetime import datetime

# ─── Konfiguration ───────────────────────────────────────────────────────────

PLUGIN_API   = "http://localhost:9876"            # VRisingDiscordBotCompanion
BACKEND_API  = "https://vrising.haus543.at"       # VPS FastAPI Backend
POLL_INTERVAL = 60                                # Sekunden

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("vrising_poller.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ─── Poller ──────────────────────────────────────────────────────────────────

def poll():
    log.info("Polling VRisingDiscordBotCompanion API...")

    # ── Characters (GearScore + VBloods) ──
    try:
        chars = requests.get(
            f"{PLUGIN_API}/v-rising-discord-bot/characters",
            timeout=5
        ).json()
    except Exception as e:
        log.warning(f"Plugin API nicht erreichbar (Spiel laeuft nicht?): {e}")
        return

    if not chars:
        log.info("Keine Charaktere aktiv.")
        return

    # Erster Spieler (Single Player)
    player = chars[0]

    gear_score     = player.get("gearLevel", 0)
    player_name    = player.get("name", "Vampir")
    blood_type     = player.get("bloodType", "Krieger")
    blood_quality  = int(player.get("bloodQuality", 0))

    # VBlood IDs aus der Characters-Antwort
    # Das Plugin liefert eine Liste der besiegten VBloods pro Charakter
    defeated_vbloods = player.get("killedVBloods", [])
    killed_ids = [_map_vblood(name) for name in defeated_vbloods]
    killed_ids = [v for v in killed_ids if v]  # None-Werte entfernen

    log.info(f"Spieler: {player_name} | GS: {gear_score} | VBloods: {len(killed_ids)}")

    # ── Ans Backend schicken ──
    try:
        resp = requests.post(f"{BACKEND_API}/api/progress", json={
            "player_name":     player_name,
            "gear_score":      gear_score,
            "blood_type":      blood_type,
            "blood_quality":   blood_quality,
            "vbloods_killed":  killed_ids,
        }, timeout=10)

        if resp.ok:
            log.info(f"Backend Update OK — GS {gear_score}, {len(killed_ids)} VBloods besiegt")
        else:
            log.error(f"Backend Fehler: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        log.error(f"Backend nicht erreichbar: {e}")


def _map_vblood(plugin_name: str) -> str | None:
    """
    Mappt den Plugin-internen VBlood-Namen auf die Dashboard-ID.
    Die genauen Namen des Plugins koennen beim ersten Spielstart
    aus dem Log abgelesen und hier ergaenzt werden.
    """
    mapping = {
        # Farbane Waelder
        "Alpha Wolf":                   "alpha-wolf",
        "Errol the Stonebreaker":       "errol-stonebreaker",
        "Rufus the Foreman":            "rufus-foreman",
        "Keely the Frost Archer":       "keely-frost-archer",
        "Lidia the Chaos Archer":       "lidia-chaos-archer",
        "Grayson the Armourer":         "grayson-armourer",
        "Clive the Firestarter":        "clive-firestarter",
        "Polora the Feywalker":         "polora-feywalker",
        "Ferocious Bear":               "ferocious-bear",
        "Quincey the Bandit King":      "quincey-bandit-king",
        "Beatrice the Tailor":          "beatrice-tailor",
        "Vincent the Frostbringer":     "vincent-frostbringer",
        "Bane the Shadowblade":         "bane-shadowblade",
        "Goreswine the Ravager":        "goreswine-ravager",
        "Putrid Rat":                   "putrid-rat",
        "Tristan the Vampire Hunter":   "tristan-vampire-hunter",
        # Dunley Farmland
        "Christina the Sun Priestess":  "christina-sun-priestess",
        "Nicholaus the Fallen":         "nicholaus-fallen",
        "Leandra the Shadow Priestess": "leandra-shadow-priestess",
        "Terah the Geomancer":          "terah-geomancer",
        "Meredith the Bright Archer":   "meredith-bright-archer",
        "Octavian the Militia Captain": "octavian-militia-captain",
        "Raziel the Shepherd":          "raziel-shepherd",
        "Jade the Vampire Hunter":      "jade-vampire-hunter",
        "Willfred the Werewolf Chief":  "willfred-werewolf-chief",
        # Silverlight Hills
        "Foulrot the Soultaker":        "foulrot-soultaker",
        "Ungora the Spider Queen":      "ungora-spider-queen",
        "Ziva the Engineer":            "ziva-engineer",
        "Mairwyn the Elementalist":     "mairwyn-elementalist",
        "Styx the Sunderer":            "styx-sunderer",
        "Cyril the Cursed Smith":       "cyril-cursed-smith",
        "Morian the Stormwing Matriarch": "morian-stormwing",
        "Sir Magnus the Overseer":      "sir-magnus",
        "Angram the Purifier":          "angram-purifier",
        "Henry Blackbrew the Doctor":   "henry-blackbrew",
        "Solarus the Immaculate":       "solarus-immaculate",
        # Mortium
        "Voltatia the Power Master":    "voltatia-power-master",
        "Florian and Cerise":           "florian-cerise",
        "Domina the Decimatrix":        "domina-decimatrix",
        "Nightmarshal Styx the Sunderer": "nightmarshal-styx",
        "Magnus the Behemoth":          "magnus-behemoth",
        "Prince Domiel":                "prince-domiel",
        # Oakveil Waelder
        "Liege Golem":                  "liege-golem",
        # Endgame
        "Dracula":                      "summons-of-dracula",
    }
    result = mapping.get(plugin_name)
    if not result:
        log.debug(f"Unbekannter VBlood-Name vom Plugin: '{plugin_name}' — bitte in poller.py ergaenzen")
    return result


def main():
    log.info("=" * 50)
    log.info("V Rising Poller gestartet")
    log.info(f"Plugin API:  {PLUGIN_API}")
    log.info(f"Backend:     {BACKEND_API}")
    log.info(f"Intervall:   {POLL_INTERVAL}s")
    log.info("=" * 50)

    # Einmal sofort
    poll()

    # Dann im Intervall
    schedule.every(POLL_INTERVAL).seconds.do(poll)
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()

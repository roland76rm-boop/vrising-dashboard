from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import json

from database import engine, get_db, Base
from models import PlayerProgress, LootItem, GearScoreHistory

Base.metadata.create_all(bind=engine)

app = FastAPI(title="V Rising Dashboard API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class ProgressIn(BaseModel):
    player_name:    Optional[str]   = None
    gear_score:     Optional[int]   = None
    hours_played:   Optional[float] = None
    blood_type:     Optional[str]   = None
    blood_quality:  Optional[int]   = None
    castle_level:   Optional[int]   = None
    current_region: Optional[str]   = None
    vbloods_killed: Optional[list]  = None
    castle_rooms:   Optional[list]  = None
    thralls:        Optional[list]  = None

class LootIn(BaseModel):
    item_name:     str
    item_type:     str
    rarity:        str
    obtained_from: Optional[str] = "Unbekannt"
    notes:         Optional[str] = None

# ─── Hilfsfunktion: aktuelle Progress-Zeile holen oder anlegen ───────────────

def get_current(db: Session) -> PlayerProgress:
    p = db.query(PlayerProgress).order_by(PlayerProgress.id.desc()).first()
    if not p:
        p = PlayerProgress()
        db.add(p)
        db.commit()
        db.refresh(p)
    return p

# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}

@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    """Alle Dashboard-Daten auf einmal."""
    p = get_current(db)
    loot = db.query(LootItem).filter(LootItem.deleted == False).all()
    history = (
        db.query(GearScoreHistory)
        .order_by(GearScoreHistory.recorded_at.asc())
        .limit(30)
        .all()
    )
    return {
        "progress": _progress_out(p),
        "loot": [_loot_out(l) for l in loot],
        "gear_score_history": [
            {"date": h.recorded_at.isoformat(), "value": h.gear_score}
            for h in history
        ],
        "last_updated": p.snapshot_time.isoformat() if p.snapshot_time else None,
    }

@app.get("/api/player/stats")
def get_stats(db: Session = Depends(get_db)):
    p = get_current(db)
    return _progress_out(p)

@app.post("/api/progress")
def update_progress(data: ProgressIn, db: Session = Depends(get_db)):
    """Fortschritt aktualisieren (Patch-Semantik — nur gesetzte Felder werden überschrieben)."""
    p = get_current(db)
    old_gs = p.gear_score

    if data.player_name    is not None: p.player_name    = data.player_name
    if data.gear_score     is not None: p.gear_score     = data.gear_score
    if data.hours_played   is not None: p.hours_played   = data.hours_played
    if data.blood_type     is not None: p.blood_type     = data.blood_type
    if data.blood_quality  is not None: p.blood_quality  = data.blood_quality
    if data.castle_level   is not None: p.castle_level   = data.castle_level
    if data.current_region is not None: p.current_region = data.current_region
    if data.vbloods_killed is not None: p.vbloods_killed = data.vbloods_killed
    if data.castle_rooms   is not None: p.castle_rooms   = data.castle_rooms
    if data.thralls        is not None: p.thralls        = data.thralls

    p.snapshot_time = datetime.now(timezone.utc)

    # Gear Score History Eintrag wenn GS gestiegen
    if data.gear_score is not None and data.gear_score != old_gs:
        db.add(GearScoreHistory(gear_score=data.gear_score))

    db.commit()
    db.refresh(p)
    return _progress_out(p)

@app.post("/api/vblood/kill")
def mark_vblood_killed(boss_id: str, db: Session = Depends(get_db)):
    """Einzelnen Boss als besiegt markieren."""
    p = get_current(db)
    killed = list(p.vbloods_killed or [])
    if boss_id not in killed:
        killed.append(boss_id)
        p.vbloods_killed = killed
        p.snapshot_time = datetime.now(timezone.utc)
        db.commit()
    return {"vbloods_killed": p.vbloods_killed}

@app.delete("/api/vblood/kill")
def unmark_vblood_killed(boss_id: str, db: Session = Depends(get_db)):
    """Boss wieder als offen markieren."""
    p = get_current(db)
    p.vbloods_killed = [b for b in (p.vbloods_killed or []) if b != boss_id]
    p.snapshot_time = datetime.now(timezone.utc)
    db.commit()
    return {"vbloods_killed": p.vbloods_killed}

@app.get("/api/loot")
def get_loot(db: Session = Depends(get_db)):
    items = db.query(LootItem).filter(LootItem.deleted == False).all()
    return [_loot_out(l) for l in items]

@app.post("/api/loot")
def add_loot(data: LootIn, db: Session = Depends(get_db)):
    item = LootItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _loot_out(item)

@app.delete("/api/loot/{item_id}")
def delete_loot(item_id: int, db: Session = Depends(get_db)):
    item = db.query(LootItem).filter(LootItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item nicht gefunden")
    item.deleted = True
    db.commit()
    return {"ok": True}

# ─── Serializer ──────────────────────────────────────────────────────────────

def _progress_out(p: PlayerProgress) -> dict:
    return {
        "player_name":    p.player_name,
        "gear_score":     p.gear_score,
        "hours_played":   p.hours_played,
        "blood_type":     p.blood_type,
        "blood_quality":  p.blood_quality,
        "castle_level":   p.castle_level,
        "current_region": p.current_region,
        "vbloods_killed": p.vbloods_killed or [],
        "castle_rooms":   p.castle_rooms or [],
        "thralls":        p.thralls or [],
        "snapshot_time":  p.snapshot_time.isoformat() if p.snapshot_time else None,
    }

def _loot_out(l: LootItem) -> dict:
    return {
        "id":           l.id,
        "item_name":    l.item_name,
        "item_type":    l.item_type,
        "rarity":       l.rarity,
        "obtained_at":  l.obtained_at.isoformat() if l.obtained_at else None,
        "obtained_from": l.obtained_from,
        "notes":        l.notes,
    }

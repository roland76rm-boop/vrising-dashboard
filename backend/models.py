from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from datetime import datetime, timezone
from database import Base

def now():
    return datetime.now(timezone.utc)

class PlayerProgress(Base):
    __tablename__ = "player_progress"

    id              = Column(Integer, primary_key=True, index=True)
    snapshot_time   = Column(DateTime, default=now)
    player_name     = Column(String, default="Vampir")
    gear_score      = Column(Integer, default=0)
    hours_played    = Column(Float, default=0.0)
    blood_type      = Column(String, default="Krieger")
    blood_quality   = Column(Integer, default=0)
    castle_level    = Column(Integer, default=1)
    current_region  = Column(String, default="Farbane Wälder")
    vbloods_killed  = Column(JSON, default=list)   # Liste von Boss-IDs
    castle_rooms    = Column(JSON, default=list)   # Liste von {id, built}
    thralls         = Column(JSON, default=list)   # Liste von Namen

class LootItem(Base):
    __tablename__ = "loot_items"

    id            = Column(Integer, primary_key=True, index=True)
    item_name     = Column(String, nullable=False)
    item_type     = Column(String, nullable=False)   # Waffe | Rüstung | Material | Accessoire
    rarity        = Column(String, nullable=False)   # Gewöhnlich | Selten | Episch | Legendär
    obtained_at   = Column(DateTime, default=now)
    obtained_from = Column(String, default="Unbekannt")
    notes         = Column(String, nullable=True)
    deleted       = Column(Boolean, default=False)

class GearScoreHistory(Base):
    __tablename__ = "gear_score_history"

    id          = Column(Integer, primary_key=True, index=True)
    recorded_at = Column(DateTime, default=now)
    gear_score  = Column(Integer, nullable=False)

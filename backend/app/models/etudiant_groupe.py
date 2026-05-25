from sqlalchemy import Table, Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

etudiants_groupes = Table(
    "etudiants_groupes",
    Base.metadata,
    Column("etudiant_id", Integer, ForeignKey("utilisateurs.id", ondelete="CASCADE"), primary_key=True),
    Column("groupe_id", Integer, ForeignKey("groupes.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now())
)

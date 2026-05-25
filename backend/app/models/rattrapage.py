from sqlalchemy import Column, Integer, ForeignKey, Date, Time, DateTime, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import StatutRattrapage

class Rattrapage(Base):
    __tablename__ = "rattrapages"

    id = Column(Integer, primary_key=True, index=True)
    absence_id = Column(Integer, ForeignKey("absences.id", ondelete="CASCADE"), nullable=False)
    salle_id = Column(Integer, ForeignKey("salles.id", ondelete="CASCADE"), nullable=False)
    date_proposee = Column(Date, nullable=False)
    heure_debut = Column(Time, nullable=False)
    heure_fin = Column(Time, nullable=False)
    statut = Column(SAEnum(StatutRattrapage), default=StatutRattrapage.PROPOSE, nullable=False)
    valide_par = Column(Integer, ForeignKey("utilisateurs.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    absence = relationship("Absence", back_populates="rattrapages")
    salle = relationship("Salle", back_populates="rattrapages")
    validateur = relationship("Utilisateur", back_populates="rattrapages_valides")
    emplois_du_temps = relationship("EmploiDuTemps", back_populates="rattrapage", cascade="all, delete-orphan")

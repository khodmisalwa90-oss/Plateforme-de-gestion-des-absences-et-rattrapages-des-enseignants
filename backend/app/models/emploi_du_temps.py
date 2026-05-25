from sqlalchemy import Column, Integer, Date, Time, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class EmploiDuTemps(Base):
    __tablename__ = "emplois_du_temps"

    id = Column(Integer, primary_key=True, index=True)
    groupe_id = Column(Integer, ForeignKey("groupes.id", ondelete="CASCADE"), nullable=False)
    matiere_id = Column(Integer, ForeignKey("matieres.id", ondelete="CASCADE"), nullable=False)
    salle_id = Column(Integer, ForeignKey("salles.id", ondelete="CASCADE"), nullable=False)
    jour_semaine = Column(Integer, nullable=False)
    heure_debut = Column(Time, nullable=False)
    heure_fin = Column(Time, nullable=False)
    rattrapage_id = Column(Integer, ForeignKey("rattrapages.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('groupe_id', 'jour_semaine', 'heure_debut', 'heure_fin', name='uq_groupe_horaire'),
        UniqueConstraint('salle_id', 'jour_semaine', 'heure_debut', 'heure_fin', name='uq_salle_horaire'),
    )

    # Relationships
    groupe = relationship("Groupe", back_populates="emplois_du_temps")
    matiere = relationship("Matiere", back_populates="emplois_du_temps")
    salle = relationship("Salle", back_populates="emplois_du_temps")
    rattrapage = relationship("Rattrapage", back_populates="emplois_du_temps")

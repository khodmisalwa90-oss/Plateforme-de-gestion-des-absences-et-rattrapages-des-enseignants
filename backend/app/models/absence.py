from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import StatutAbsence

class Absence(Base):
    __tablename__ = "absences"

    id = Column(Integer, primary_key=True, index=True)
    enseignant_id = Column(Integer, ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False)
    matiere_id = Column(Integer, ForeignKey("matieres.id", ondelete="CASCADE"), nullable=False)
    date_absence = Column(Date, nullable=False)
    motif = Column(Text, nullable=False)
    justificatif = Column(String(255), nullable=True)
    statut = Column(SAEnum(StatutAbsence), default=StatutAbsence.EN_ATTENTE, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    enseignant = relationship("Utilisateur", back_populates="absences")
    matiere = relationship("Matiere", back_populates="absences")
    rattrapages = relationship("Rattrapage", back_populates="absence", cascade="all, delete-orphan")

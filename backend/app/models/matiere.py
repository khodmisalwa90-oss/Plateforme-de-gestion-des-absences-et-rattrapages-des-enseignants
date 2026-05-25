from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Matiere(Base):
    __tablename__ = "matieres"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    departement_id = Column(Integer, ForeignKey("departements.id", ondelete="CASCADE"), nullable=False)
    enseignant_id = Column(Integer, ForeignKey("utilisateurs.id", ondelete="SET NULL"), nullable=True) # Assuming nullable if no teacher assigned yet
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    departement = relationship("Departement", back_populates="matieres")
    enseignant = relationship("Utilisateur", back_populates="matieres_enseignees")
    absences = relationship("Absence", back_populates="matiere", cascade="all, delete-orphan")
    emplois_du_temps = relationship("EmploiDuTemps", back_populates="matiere", cascade="all, delete-orphan")

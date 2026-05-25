from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Groupe(Base):
    __tablename__ = "groupes"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    departement_id = Column(Integer, ForeignKey("departements.id", ondelete="CASCADE"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    departement = relationship("Departement", back_populates="groupes")
    etudiants = relationship("Utilisateur", secondary="etudiants_groupes", back_populates="groupes")
    emplois_du_temps = relationship("EmploiDuTemps", back_populates="groupe", cascade="all, delete-orphan")

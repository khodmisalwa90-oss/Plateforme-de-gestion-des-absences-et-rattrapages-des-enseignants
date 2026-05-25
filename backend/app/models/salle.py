from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Salle(Base):
    __tablename__ = "salles"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), nullable=False)
    capacite = Column(Integer, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    rattrapages = relationship("Rattrapage", back_populates="salle", cascade="all, delete-orphan")
    emplois_du_temps = relationship("EmploiDuTemps", back_populates="salle", cascade="all, delete-orphan")

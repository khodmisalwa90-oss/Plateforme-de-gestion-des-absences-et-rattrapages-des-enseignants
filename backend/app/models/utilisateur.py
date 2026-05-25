from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import RoleUtilisateur

class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    mot_de_passe = Column(String(255), nullable=False)
    role = Column(SAEnum(RoleUtilisateur), nullable=False)
    actif = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    matieres_enseignees = relationship("Matiere", back_populates="enseignant")
    absences = relationship("Absence", back_populates="enseignant", cascade="all, delete-orphan")
    rattrapages_valides = relationship("Rattrapage", back_populates="validateur")
    groupes = relationship("Groupe", secondary="etudiants_groupes", back_populates="etudiants")
    notifications = relationship("Notification", back_populates="utilisateur", cascade="all, delete-orphan")

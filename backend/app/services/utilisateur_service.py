from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.utilisateur import Utilisateur
from app.schemas.utilisateur import UtilisateurCreate, UtilisateurUpdate
from app.core.security import get_password_hash
from app.services.notification_service import NotificationService

class UtilisateurService:
    @staticmethod
    def get_paginated(db: Session, page: int, per_page: int, role: Optional[str] = None, actif: Optional[bool] = None, search: Optional[str] = None):
        query = db.query(Utilisateur)
        if role:
            query = query.filter(Utilisateur.role == role)
        if actif is not None:
            query = query.filter(Utilisateur.actif == actif)
        
        if search:
            query = query.filter(
                or_(
                    Utilisateur.nom.ilike(f"%{search}%"),
                    Utilisateur.prenom.ilike(f"%{search}%"),
                    Utilisateur.email.ilike(f"%{search}%")
                )
            )
        
        total = query.count()
        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[Utilisateur]:
        return db.query(Utilisateur).filter(Utilisateur.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[Utilisateur]:
        return db.query(Utilisateur).filter(Utilisateur.email == email).first()

    @staticmethod
    def create(db: Session, user_data: UtilisateurCreate) -> Utilisateur:
        hashed_password = get_password_hash(user_data.mot_de_passe)
        db_user = Utilisateur(
            nom=user_data.nom,
            prenom=user_data.prenom,
            email=user_data.email,
            mot_de_passe=hashed_password,
            role=user_data.role,
            actif=user_data.actif
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Welcome notification for the new user
        try:
            NotificationService.create(
                db,
                db_user.id,
                "Bienvenue sur la plateforme",
                "Votre compte a été créé. Vous pouvez vous connecter avec votre email."
            )
        except Exception:
            pass

        return db_user

    @staticmethod
    def update(db: Session, user_id: int, user_data: UtilisateurUpdate) -> Optional[Utilisateur]:
        user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
        if not user:
            return None
        
        update_data = user_data.model_dump(exclude_unset=True)
        if 'mot_de_passe' in update_data and update_data['mot_de_passe']:
            update_data['mot_de_passe'] = get_password_hash(update_data['mot_de_passe'])
        
        for key, value in update_data.items():
            setattr(user, key, value)
            
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete(db: Session, user_id: int) -> bool:
        user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
        if not user:
            return False

        # Notify before deletion (while the user record still exists)
        try:
            NotificationService.create(
                db,
                user.id,
                "Compte supprimé",
                "Votre compte a été supprimé par l'administration."
            )
        except Exception:
            pass

        db.delete(user)
        db.commit()
        return True

    @staticmethod
    def activate(db: Session, user_id: int) -> Optional[Utilisateur]:
        user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
        if not user:
            return None
        user.actif = True
        db.commit()
        db.refresh(user)

        # Notify the user their account is active
        try:
            NotificationService.create(
                db,
                user.id,
                "Compte réactivé",
                "Votre compte a été réactivé. Vous pouvez maintenant vous connecter."
            )
        except Exception:
            pass

        return user

    @staticmethod
    def deactivate(db: Session, user_id: int) -> Optional[Utilisateur]:
        user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
        if not user:
            return None
        user.actif = False
        db.commit()
        db.refresh(user)

        # Notify the user their account was deactivated
        try:
            NotificationService.create(
                db,
                user.id,
                "Compte désactivé",
                "Votre compte a été désactivé par l'administration."
            )
        except Exception:
            pass

        return user

from sqlalchemy.orm import Session
from app.models.utilisateur import Utilisateur
from app.core.security import verify_password, create_access_token

class AuthService:
    @staticmethod
    def authenticate(db: Session, email: str, mot_de_passe: str) -> Utilisateur | None:
        user = db.query(Utilisateur).filter(Utilisateur.email == email).first()
        if not user:
            return None
        if not user.actif:
            return None
        if not verify_password(mot_de_passe, user.mot_de_passe):
            return None
        return user

    @staticmethod
    def create_token(user: Utilisateur) -> str:
        payload = {
            "sub": str(user.id),
            "role": user.role.value if hasattr(user.role, "value") else str(user.role)
        }
        return create_access_token(data=payload)

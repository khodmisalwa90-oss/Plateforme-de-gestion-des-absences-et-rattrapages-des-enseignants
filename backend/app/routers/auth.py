from app.models import utilisateur
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.utilisateur import Utilisateur
from app.schemas.auth import LoginRequest, LoginResponse, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.utilisateur import UtilisateurResponse, ProfileUpdate
from app.services.auth_service import AuthService
from app.services.utilisateur_service import UtilisateurService
from app.utils.email import send_email
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = AuthService.authenticate(db, login_data.email, login_data.mot_de_passe)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants invalides"
        )
    access_token = AuthService.create_token(user)
    return LoginResponse(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UtilisateurResponse)
async def get_me(current_user: Utilisateur = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UtilisateurResponse)
async def update_me(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # Check if email is being changed and if it's already taken
    if profile_data.email and profile_data.email != current_user.email:
        existing = UtilisateurService.get_by_email(db, profile_data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
            
    return UtilisateurService.update(db, current_user.id, profile_data)

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(Utilisateur).filter(Utilisateur.email == data.email).first()
    if not user:
        return {"message": "Si l'adresse email existe, un lien de réinitialisation a été envoyé."}
        
    if not user.actif:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce compte est désactivé."
        )

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    
    user.reset_token_hash = token_hash
    user.reset_token_expires = expires
    db.commit()

    frontend_url = "http://localhost:3000"
    reset_link = f"{frontend_url}/reset-password?token={raw_token}"
    
    subject = "Réinitialisation de votre mot de passe"
    body = f"""Bonjour {user.prenom} {user.nom},

Vous avez demandé la réinitialisation de votre mot de passe pour la plateforme Gestion des Absences.

Veuillez cliquer sur le lien ci-dessous pour définir un nouveau mot de passe (ce lien expire dans 1 heure) :

{reset_link}

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité."""

    send_email(to=user.email, subject=subject, body=body)

    return {"message": "Si l'adresse email existe, un lien de réinitialisation a été envoyé."}

@router.get("/verify-reset-token")
async def verify_reset_token(
    token: str,
    db: Session = Depends(get_db)
):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    user = db.query(Utilisateur).filter(
        Utilisateur.reset_token_hash == token_hash,
        Utilisateur.reset_token_expires > datetime.now(timezone.utc)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le jeton de réinitialisation est invalide ou a expiré."
        )
        
    return {"status": "valid", "email": user.email}

@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    token_hash = hashlib.sha256(data.token.encode()).hexdigest()
    user = db.query(Utilisateur).filter(
        Utilisateur.reset_token_hash == token_hash,
        Utilisateur.reset_token_expires > datetime.now(timezone.utc)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le jeton de réinitialisation est invalide ou a expiré."
        )
        
    user.mot_de_passe = get_password_hash(data.nouveau_mot_de_passe)
    user.reset_token_hash = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Votre mot de passe a été réinitialisé avec succès."}

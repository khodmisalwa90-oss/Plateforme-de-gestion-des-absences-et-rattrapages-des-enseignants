from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.utilisateur import Utilisateur
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.utilisateur import UtilisateurResponse, ProfileUpdate
from app.services.auth_service import AuthService
from app.services.utilisateur_service import UtilisateurService

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

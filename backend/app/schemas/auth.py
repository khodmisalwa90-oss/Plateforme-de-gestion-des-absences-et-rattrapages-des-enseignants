from pydantic import BaseModel, EmailStr, Field, field_validator

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Adresse email")
    mot_de_passe: str = Field(..., min_length=1, description="Mot de passe")
    
    @field_validator('mot_de_passe')
    @classmethod
    def validate_mot_de_passe(cls, v):
        if not v or len(v) < 1:
            raise ValueError('Le mot de passe ne peut pas être vide')
        return v

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Adresse email")

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1, description="Jeton de réinitialisation")
    nouveau_mot_de_passe: str = Field(..., min_length=6, max_length=255, description="Nouveau mot de passe")
    
    @field_validator('token')
    @classmethod
    def validate_token(cls, v):
        if not v or len(v) < 1:
            raise ValueError('Le jeton ne peut pas être vide')
        return v
    
    @field_validator('nouveau_mot_de_passe')
    @classmethod
    def validate_nouveau_mot_de_passe(cls, v):
        if len(v) < 6:
            raise ValueError('Le mot de passe doit avoir au moins 6 caractères')
        if len(v) > 255:
            raise ValueError('Le mot de passe ne peut pas dépasser 255 caractères')
        return v

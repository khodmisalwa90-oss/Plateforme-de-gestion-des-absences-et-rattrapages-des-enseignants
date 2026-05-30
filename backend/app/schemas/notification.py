from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional

class NotificationBase(BaseModel):
    titre: str = Field(..., min_length=1, description="Titre de la notification")
    message: str = Field(..., min_length=1, description="Message de la notification")
    
    @field_validator('titre', 'message')
    @classmethod
    def validate_fields(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Ce champ ne peut pas être vide')
        return v

class NotificationCreate(NotificationBase):
    utilisateur_id: int = Field(..., description="Identifiant de l'utilisateur")

class NotificationUpdate(BaseModel):
    titre: Optional[str] = Field(None, min_length=1, description="Titre de la notification")
    message: Optional[str] = Field(None, min_length=1, description="Message de la notification")
    est_lu: Optional[bool] = Field(None, description="Marquer comme lu")
    
    @field_validator('titre', 'message')
    @classmethod
    def validate_fields(cls, v):
        if v is not None and len(v.strip()) == 0:
            raise ValueError('Ce champ ne peut pas être vide')
        return v

class NotificationSimple(NotificationBase):
    id: int
    est_lu: bool

class NotificationResponse(NotificationBase):
    id: int
    est_lu: bool
    created_at: datetime

    class Config:
        from_attributes = True

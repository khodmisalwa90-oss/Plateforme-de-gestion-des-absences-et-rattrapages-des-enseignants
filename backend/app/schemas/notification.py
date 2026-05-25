from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class NotificationBase(BaseModel):
    titre: str
    message: str

class NotificationCreate(NotificationBase):
    utilisateur_id: int

class NotificationUpdate(BaseModel):
    titre: Optional[str] = None
    message: Optional[str] = None
    est_lu: Optional[bool] = None

class NotificationSimple(NotificationBase):
    id: int
    est_lu: bool

class NotificationResponse(NotificationBase):
    id: int
    est_lu: bool
    created_at: datetime

    class Config:
        from_attributes = True

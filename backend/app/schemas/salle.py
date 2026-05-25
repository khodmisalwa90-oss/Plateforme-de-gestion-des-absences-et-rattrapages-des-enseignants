from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class SalleBase(BaseModel):
    nom: str = Field(..., max_length=50)
    capacite: int = Field(..., gt=0)

class SalleCreate(SalleBase):
    pass

class SalleUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=50)
    capacite: Optional[int] = Field(None, gt=0)

class SalleSimple(SalleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class SalleResponse(SalleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

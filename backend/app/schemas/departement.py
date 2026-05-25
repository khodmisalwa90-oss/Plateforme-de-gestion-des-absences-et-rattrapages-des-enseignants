from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class DepartementBase(BaseModel):
    nom: str = Field(..., max_length=100)

class DepartementCreate(DepartementBase):
    pass

class DepartementUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)

class DepartementSimple(DepartementBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DepartementResponse(DepartementBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

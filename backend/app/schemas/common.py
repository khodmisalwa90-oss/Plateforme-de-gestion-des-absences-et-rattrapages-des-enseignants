from pydantic import BaseModel, Field, ConfigDict
from typing import Generic, TypeVar, List

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int = Field(..., description="Numéro de la page actuelle")
    per_page: int = Field(..., description="Nombre d'éléments par page")
    total_pages: int = Field(..., description="Nombre total de pages")

    model_config = ConfigDict(from_attributes=True)
